module berty.tech/yolo/v2

go 1.13

require (
	github.com/Bearer/bearer-go v1.2.1
	github.com/buildkite/go-buildkite v2.2.0+incompatible
	github.com/cayleygraph/cayley v0.7.7
	github.com/cayleygraph/quad v1.2.1
	github.com/cenkalti/backoff v2.2.1+incompatible // indirect
	github.com/go-chi/chi v4.0.3+incompatible
	github.com/go-chi/jsonp v0.0.0-20170809160916-b971022286e2
	github.com/gobuffalo/packr/v2 v2.7.1
	github.com/gogo/gateway v1.1.0
	github.com/gogo/protobuf v1.3.1
	github.com/golang/protobuf v1.3.4
	github.com/grpc-ecosystem/go-grpc-middleware v1.2.0
	github.com/grpc-ecosystem/grpc-gateway v1.13.0
	github.com/jszwedko/go-circleci v0.3.0
	github.com/oklog/run v1.1.0
	github.com/peterbourgon/ff/v2 v2.0.0
	github.com/rs/cors v1.7.0
	github.com/stretchr/signature v0.0.0-20160104132143-168b2a1e1b56
	github.com/stretchr/stew v0.0.0-20130812190256-80ef0842b48b // indirect
	github.com/stretchr/tracer v0.0.0-20140124184152-66d3696bba97 // indirect
	github.com/treastech/logger v0.0.0-20180705232552-e381e9ecf2e3
	go.uber.org/multierr v1.5.0 // indirect
	go.uber.org/zap v1.14.0
	golang.org/x/net v0.0.0-20200226121028-0de0cce0169b // indirect
	golang.org/x/tools v0.0.0-20200226224502-204d844ad48d // indirect
	google.golang.org/genproto v0.0.0-20200226201735-46b91f19d98c
	google.golang.org/grpc v1.27.1
	howett.net/plist v0.0.0-20200225050739-77e249a2e2ba
	moul.io/depviz/v3 v3.10.0
)

replace github.com/cayleygraph/cayley v0.7.7 => github.com/cayleygraph/cayley v0.7.7-0.20200130230943-9fb4d58e0e07
