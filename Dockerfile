# zsign builder
FROM            alpine:3.11 as zsign-build
RUN             apk add --no-cache --virtual .build-deps git g++ openssl-dev libgcc libstdc++ zip unzip
RUN             git clone https://github.com/zhlynn/zsign
WORKDIR         zsign
RUN             g++ ./*.cpp common/*.cpp -lcrypto -O3 -o zsign

# web build
FROM            node:10 as web-build
WORKDIR         /app
COPY            ./web/package*.json ./web/yarn.* ./
RUN             yarn install
COPY            ./web ./
RUN             yarn build

# go build
FROM            golang:1.15-alpine as go-build
RUN             apk add --update --no-cache git gcc musl-dev make perl-utils
RUN             GO111MODULE=off go get github.com/gobuffalo/packr/v2/packr2
WORKDIR         /go/src/berty.tech/yolo
ENV             GO111MODULE=on \
                GOPROXY=proxy.golang.org
COPY            go.* ./
RUN             go mod download
COPY            go ./go/
RUN             rm -rf web web
COPY            --from=web-build /app/build web/dist
WORKDIR         /go/src/berty.tech/yolo/go
RUN		        make packr
RUN             make install

# minimalist runtime
FROM alpine:3.11
RUN             apk add --update --no-cache ca-certificates libstdc++ unzip zip
COPY            --from=go-build /go/bin/yolo /bin/
COPY            --from=zsign-build zsign/zsign /bin/
ENTRYPOINT      ["yolo"]
EXPOSE          8000
