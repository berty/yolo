package yolosvc

import (
	"context"
	"crypto/subtle"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	"berty.tech/yolo/v2/go/pkg/yolopb"
	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/jsonp"
	packr "github.com/gobuffalo/packr/v2"
	"github.com/gogo/gateway"
	grpc_middleware "github.com/grpc-ecosystem/go-grpc-middleware"
	grpc_zap "github.com/grpc-ecosystem/go-grpc-middleware/logging/zap"
	grpc_recovery "github.com/grpc-ecosystem/go-grpc-middleware/recovery"
	"github.com/grpc-ecosystem/grpc-gateway/runtime"
	"github.com/oklog/run"
	cache "github.com/patrickmn/go-cache"
	"github.com/rs/cors"
	"github.com/stretchr/signature"
	"github.com/tevino/abool"
	chilogger "github.com/treastech/logger"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"moul.io/u"
)

type Server struct {
	workers          run.Group
	logger           *zap.Logger
	grpcServer       *grpc.Server
	grpcListenerAddr string
	httpListenerAddr string
	devMode          bool
	cache            *cache.Cache
	clearCache       *abool.AtomicBool
	withCache        bool
}

type ServerOpts struct {
	Logger             *zap.Logger
	HTTPBind           string
	GRPCBind           string
	CORSAllowedOrigins string
	RequestTimeout     time.Duration
	ShutdownTimeout    time.Duration
	BasicAuth          string
	Realm              string
	AuthSalt           string
	DevMode            bool
	ClearCache         *abool.AtomicBool
	WithCache          bool
}

func NewServer(ctx context.Context, svc Service, opts ServerOpts) (*Server, error) {
	opts.applyDefaults()

	// gRPC internal server
	srv := Server{
		logger:     opts.Logger,
		devMode:    opts.DevMode,
		clearCache: opts.ClearCache,
		withCache:  opts.WithCache,
	}

	// gRPC interceptors
	recoveryHandler := func(p interface{}) (err error) {
		return status.Errorf(codes.Unknown, "panic triggered: %v", p)
	}
	recoveryOpts := []grpc_recovery.Option{grpc_recovery.WithRecoveryHandler(recoveryHandler)}
	serverStreamOpts := []grpc.StreamServerInterceptor{}
	serverUnaryOpts := []grpc.UnaryServerInterceptor{}
	if !srv.devMode {
		serverStreamOpts = append(serverStreamOpts, grpc_recovery.StreamServerInterceptor(recoveryOpts...))
		serverUnaryOpts = append(serverUnaryOpts, grpc_recovery.UnaryServerInterceptor(recoveryOpts...))
	}
	serverStreamOpts = append(serverStreamOpts, grpc_zap.StreamServerInterceptor(srv.logger))
	serverUnaryOpts = append(serverUnaryOpts, grpc_zap.UnaryServerInterceptor(srv.logger))
	if !srv.devMode {
		serverStreamOpts = append(serverStreamOpts, grpc_recovery.StreamServerInterceptor(recoveryOpts...))
		serverUnaryOpts = append(serverUnaryOpts, grpc_recovery.UnaryServerInterceptor(recoveryOpts...))
	}

	// gRPC server
	srv.grpcServer = grpc.NewServer(
		grpc.StreamInterceptor(grpc_middleware.ChainStreamServer(serverStreamOpts...)),
		grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(serverUnaryOpts...)),
	)
	yolopb.RegisterYoloServiceServer(srv.grpcServer, svc)

	// gRPC exposed server
	grpcListener, err := net.Listen("tcp", opts.GRPCBind)
	if err != nil {
		return nil, fmt.Errorf("net.Listen: %w", err)
	}
	srv.grpcListenerAddr = grpcListener.Addr().String()
	srv.workers.Add(func() error {
		srv.logger.Info("starting gRPC server", zap.String("bind", srv.grpcListenerAddr))
		return srv.grpcServer.Serve(grpcListener)
	}, func(_ error) {
		if err := grpcListener.Close(); err != nil {
			srv.logger.Warn("close gRPC listener", zap.Error(err))
		}
	})

	// HTTP exposed server
	r := chi.NewRouter()
	if opts.CORSAllowedOrigins != "" {
		cors := cors.New(cors.Options{
			AllowedOrigins:   strings.Split(opts.CORSAllowedOrigins, ","),
			AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
			ExposedHeaders:   []string{"Link"},
			AllowCredentials: true,
			MaxAge:           300,
		})
		r.Use(cors.Handler)
	}
	r.Use(chilogger.Logger(srv.logger))
	r.Use(middleware.Timeout(opts.RequestTimeout))
	r.Use(middleware.Recoverer)

	gwmux := runtime.NewServeMux(
		runtime.WithMarshalerOption(runtime.MIMEWildcard, &gateway.JSONPb{EmitDefaults: false, Indent: "  ", OrigName: true}),
		runtime.WithProtoErrorHandler(runtime.DefaultHTTPProtoErrorHandler),
	)
	grpcDialOpts := []grpc.DialOption{grpc.WithInsecure()}
	if err := yolopb.RegisterYoloServiceHandlerFromEndpoint(ctx, gwmux, srv.grpcListenerAddr, grpcDialOpts); err != nil {
		return nil, err
	}

	var handler http.Handler = gwmux

	if srv.withCache {
		srv.cache = cache.New(1*time.Minute, 2*time.Minute)
		handler = cacheMiddleware(handler, srv.cache, srv.logger)
		srv.workers.Add(func() error {
			for {
				if srv.clearCache.IsSet() {
					srv.logger.Debug("flushing cache")
					srv.cache.Flush()
					srv.clearCache.UnSet()
				}
				time.Sleep(time.Second)
			}
		}, func(_ error) {})
	}

	r.Route("/api", func(r chi.Router) {
		r.Use(auth(opts.BasicAuth, opts.Realm, opts.AuthSalt))
		r.Use(jsonp.Handler)
		r.Mount("/", http.StripPrefix("/api", handler))
		r.Get("/plist-gen/{artifactID}.plist", svc.PlistGenerator)
		r.Get("/artifact-dl/{artifactID}", svc.ArtifactDownloader)
		r.Get("/artifact-icon/{name}", svc.ArtifactIcon)
		r.Get("/artifact-get-file/{artifactID}/*", svc.ArtifactGetFile)
	})

	box := packr.New("web", "../../../web/dist")

	// static files and 404 handler
	fs := http.StripPrefix("/", http.FileServer(box))
	r.Get("/*", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			_, err := box.FindString(r.URL.Path)
			if err != nil {
				r.URL.Path = "/" // 404 redirects to index.html
			}
		}
		fs.ServeHTTP(w, r)
	}))

	httpListener, err := net.Listen("tcp", opts.HTTPBind)
	if err != nil {
		return nil, err
	}
	srv.httpListenerAddr = httpListener.Addr().String()
	httpServer := http.Server{Handler: r}
	srv.workers.Add(func() error {
		srv.logger.Info("starting HTTP server", zap.String("bind", srv.httpListenerAddr))
		return httpServer.Serve(httpListener)
	}, func(_ error) {
		ctx, cancel := context.WithTimeout(ctx, opts.ShutdownTimeout)
		if err := httpServer.Shutdown(ctx); err != nil {
			srv.logger.Warn("shutdown HTTP server", zap.Error(err))
		}
		defer cancel()
		if err := httpListener.Close(); err != nil {
			srv.logger.Warn("close HTTP listener", zap.Error(err))
		}
	})

	return &srv, nil
}

func (srv *Server) Start() error {
	return srv.workers.Run()
}

func (srv *Server) Stop() {
	srv.grpcServer.GracefulStop()
}

func auth(basicAuth, realm, salt string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ret, _ := signature.ValidateSignature(r.Method, r.URL.String(), "", salt)
			if ret {
				next.ServeHTTP(w, r)
				return
			}
			if basicAuth != "" {
				_, password, ok := r.BasicAuth()
				if !ok || subtle.ConstantTimeCompare([]byte(password), []byte(basicAuth)) != 1 {
					if r.Header.Get("Referer") == "" { // if referer is unset, someone is calling the API directly (without ajax)
						w.Header().Add("WWW-Authenticate", fmt.Sprintf(`Basic realm="%s"`, realm))
					}
					w.WriteHeader(http.StatusUnauthorized)
					httpError(w, fmt.Errorf("invalid credentials"), codes.Unauthenticated)
					return
				}
				// FIXME: setup cookies
			}
			next.ServeHTTP(w, r)
		})
	}
}

func httpError(w http.ResponseWriter, err error, code codes.Code) {
	msg := struct {
		Code    codes.Code `json:"code"`
		Message string     `json:"message"`
		Details string     `json:"details"`
	}{
		Code:    code,
		Message: code.String(),
		Details: fmt.Sprintf("%v", err),
	}
	http.Error(w, u.PrettyJSON(msg), runtime.HTTPStatusFromCode(code))
}

func (o *ServerOpts) applyDefaults() {
	if o.Logger == nil {
		o.Logger = zap.NewNop()
	}
	if o.HTTPBind == "" {
		o.HTTPBind = ":0"
	}
	if o.GRPCBind == "" {
		o.GRPCBind = ":0"
	}
	if o.Realm == "" {
		o.Realm = "Yolo"
	}
	if o.RequestTimeout == 0 {
		o.RequestTimeout = 10 * time.Second
	}
	if o.ShutdownTimeout == 0 {
		o.ShutdownTimeout = 11 * time.Second
	}
	if o.ClearCache == nil {
		o.ClearCache = abool.New()
	}
}
