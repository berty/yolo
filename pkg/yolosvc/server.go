package yolosvc

import (
	"context"
	"crypto/subtle"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	"berty.tech/yolo/v2/pkg/yolopb"
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
	"github.com/rs/cors"
	chilogger "github.com/treastech/logger"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"moul.io/depviz/v3/pkg/chiutil"
)

type Server struct {
	workers          run.Group
	logger           *zap.Logger
	grpcServer       *grpc.Server
	grpcListenerAddr string
	httpListenerAddr string
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
}

func NewServer(ctx context.Context, svc Service, opts ServerOpts) (*Server, error) {
	if opts.Logger == nil {
		opts.Logger = zap.NewNop()
	}
	if opts.HTTPBind == "" {
		opts.HTTPBind = ":0"
	}
	if opts.GRPCBind == "" {
		opts.GRPCBind = ":0"
	}
	if opts.Realm == "" {
		opts.Realm = "Yolo"
	}

	// gRPC internal server
	srv := Server{logger: opts.Logger}

	recoveryHandler := func(p interface{}) (err error) {
		return status.Errorf(codes.Unknown, "panic triggered: %v", p)
	}
	recoveryOpts := []grpc_recovery.Option{grpc_recovery.WithRecoveryHandler(recoveryHandler)}
	serverStreamOpts := []grpc.StreamServerInterceptor{
		grpc_recovery.StreamServerInterceptor(recoveryOpts...),
		grpc_zap.StreamServerInterceptor(srv.logger),
		grpc_recovery.StreamServerInterceptor(recoveryOpts...),
	}
	serverUnaryOpts := []grpc.UnaryServerInterceptor{
		grpc_recovery.UnaryServerInterceptor(recoveryOpts...),
		grpc_zap.UnaryServerInterceptor(srv.logger),
		grpc_recovery.UnaryServerInterceptor(recoveryOpts...),
	}
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

	if opts.BasicAuth != "" {
		r.Use(basicAuth(opts.BasicAuth, opts.Realm))
	}

	gwmux := runtime.NewServeMux(
		runtime.WithMarshalerOption(runtime.MIMEWildcard, &gateway.JSONPb{EmitDefaults: false, Indent: "  ", OrigName: true}),
		runtime.WithProtoErrorHandler(runtime.DefaultHTTPProtoErrorHandler),
	)
	grpcDialOpts := []grpc.DialOption{grpc.WithInsecure()}
	if err := yolopb.RegisterYoloServiceHandlerFromEndpoint(ctx, gwmux, srv.grpcListenerAddr, grpcDialOpts); err != nil {
		return nil, err
	}

	var handler http.Handler = gwmux
	r.Route("/api", func(r chi.Router) {
		r.Use(jsonp.Handler)
		r.Mount("/", http.StripPrefix("/api", handler))
		r.Get("/plist-gen/{artifactID}.plist", svc.PlistGenerator)
		r.Get("/artifact-dl", svc.ArtifactDownloader)
	})

	box := packr.New("web", "../../web")
	chiutil.FileServer(r, "/", box)

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

func basicAuth(basicAuth string, realm string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, password, ok := r.BasicAuth()
			if !ok || subtle.ConstantTimeCompare([]byte(password), []byte(basicAuth)) != 1 {
				w.Header().Add("WWW-Authenticate", fmt.Sprintf(`Basic realm="%s"`, realm))
				w.WriteHeader(http.StatusUnauthorized)
				fmt.Fprintf(w, "invalid credentials\n")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
