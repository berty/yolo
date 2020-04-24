DEV_RUN_OPTS ?=

.PHONY: test
test: generate
	go test -test.timeout=20s -cover -covermode=atomic -race -coverprofile=coverage.txt ./...

.PHONY: dev
dev: install
	yolo -v server --dev-mode --cors-allowed-origins="*" --max-builds=50 --db-path=/tmp/yolo-dev --basic-auth-password="uns3cur3" --auth-salt="uns3cur3" $(DEV_RUN_OPTS)

.PHONY: install
install: generate
	go install ./cmd/yolo

.PHONY: lint
lint: generate
	golangci-lint run

.PHONY: packr
packr:
	cd pkg/yolosvc && packr2 && ls -la *-packr.go packrd/packed-packr.go

##
## generate
##

PROTOS_SRC := $(wildcard ./api/*.proto)
GEN_DEPS := $(PROTOS_SRC) Makefile
.PHONY: generate
generate: gen.sum
gen.sum: $(GEN_DEPS)
	shasum $(GEN_DEPS) | sort > gen.sum.tmp
	@diff -q gen.sum gen.sum.tmp || ( \
	  set -xe; \
	  GO111MODULE=on go mod vendor; \
	  docker run \
	    --user=`id -u` \
	    --volume="$(PWD):/go/src/berty.tech/yolo" \
	    --workdir="/go/src/berty.tech/yolo" \
	    --entrypoint="sh" \
	    --rm \
	    bertytech/yolo-protoc:v1 \
	    -xec 'make generate_local'; \
	    make tidy \
	)

PROTOC_OPTS = -I ./api:./vendor:/protobuf
.PHONY: generate_local
generate_local:
	@set -e; for proto in $(PROTOS_SRC); do (set -xe; \
	  protoc $(PROTOC_OPTS) \
	  --gogofaster_out="plugins=grpc:$(GOPATH)/src" \
	  --grpc-gateway_out=logtostderr=true:"$(GOPATH)/src" \
	  "$$proto" \
	); done
	goimports -w ./pkg/yolopb/*.pb.go
	shasum $(GEN_DEPS) | sort > gen.sum.tmp
	mv gen.sum.tmp gen.sum

.PHONY: clean
clean:
	rm -f gen.sum $(wildcard pkg/*/*.pb.go) $(wildcard pkg/*/*.pb.gw.go) $(wildcard pkg/*/*-packr.go) $(wildcard packrd/*)

.PHONY: tidy
tidy:
	go mod tidy

.PHONY: docker.build
docker.build:
	docker build -t bertytech/yolo .
