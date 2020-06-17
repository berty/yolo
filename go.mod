module berty.tech/yolo/v2

go 1.13

require (
	github.com/bearer/go-agent v0.0.0-00010101000000-000000000000
	github.com/buildkite/go-buildkite v2.2.0+incompatible
	github.com/cenkalti/backoff v2.2.1+incompatible // indirect
	github.com/go-chi/chi v4.1.2+incompatible
	github.com/go-chi/jsonp v0.0.0-20170809160916-b971022286e2
	github.com/gobuffalo/packr/v2 v2.8.0
	github.com/gogo/gateway v1.1.0
	github.com/gogo/protobuf v1.3.1
	github.com/golang/protobuf v1.4.2
	github.com/google/go-github/v31 v31.0.0
	github.com/gregjones/httpcache v0.0.0-20190611155906-901d90724c79
	github.com/grpc-ecosystem/go-grpc-middleware v1.2.0
	github.com/grpc-ecosystem/grpc-gateway v1.14.6
	github.com/jinzhu/gorm v1.9.13
	github.com/jszwedko/go-circleci v0.3.0
	github.com/karrick/godirwalk v1.15.6 // indirect
	github.com/mattn/go-sqlite3 v2.0.3+incompatible // indirect
	github.com/mr-tron/base58 v1.2.0
	github.com/oklog/run v1.1.0
	github.com/patrickmn/go-cache v2.1.0+incompatible
	github.com/peterbourgon/diskv v2.0.1+incompatible
	github.com/peterbourgon/ff/v2 v2.0.0
	github.com/rs/cors v1.7.0
	github.com/sirupsen/logrus v1.6.0 // indirect
	github.com/stretchr/signature v0.0.0-20160104132143-168b2a1e1b56
	github.com/stretchr/stew v0.0.0-20130812190256-80ef0842b48b // indirect
	github.com/stretchr/testify v1.6.1
	github.com/stretchr/tracer v0.0.0-20140124184152-66d3696bba97 // indirect
	github.com/tevino/abool v0.0.0-20170917061928-9b9efcf221b5
	github.com/treastech/logger v0.0.0-20180705232552-e381e9ecf2e3
	go.uber.org/zap v1.15.0
	golang.org/x/crypto v0.0.0-20200604202706-70a84ac30bf9 // indirect
	golang.org/x/lint v0.0.0-20200302205851-738671d3881b // indirect
	golang.org/x/net v0.0.0-20200602114024-627f9648deb9 // indirect
	golang.org/x/oauth2 v0.0.0-20200107190931-bf48bf16ab8d
	golang.org/x/sync v0.0.0-20200317015054-43a5402ce75a // indirect
	golang.org/x/sys v0.0.0-20200615200032-f1bc736245b1 // indirect
	golang.org/x/text v0.3.3 // indirect
	golang.org/x/tools v0.0.0-20200423205358-59e73619c742 // indirect
	google.golang.org/appengine v1.6.6 // indirect
	google.golang.org/genproto v0.0.0-20200617032506-f1bdc9086088
	google.golang.org/grpc v1.29.1
	gopkg.in/check.v1 v1.0.0-20190902080502-41f04d3bba15 // indirect
	gopkg.in/yaml.v3 v3.0.0-20200615113413-eeeca48fe776 // indirect
	honnef.co/go/tools v0.0.1-2020.1.3 // indirect
	howett.net/plist v0.0.0-20200419221736-3b63eb3a43b5
	moul.io/godev v1.6.0
	moul.io/hcfilters v1.3.1
	moul.io/pkgman v1.2.2
	moul.io/zapgorm v1.0.0
)

replace github.com/bearer/go-agent => ../../code.osinet.fr/OSInet/bearer-go-agent
