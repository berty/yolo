# web build
FROM            node:10 as web-build
WORKDIR         /app
COPY            ./web/package*.json ./web/yarn.* ./
RUN             npm install
COPY            ./web ./
RUN             npm run build

# go build
FROM            golang:1.14-alpine as go-build
RUN             apk add --update --no-cache git gcc musl-dev make perl-utils
RUN             GO111MODULE=off go get github.com/gobuffalo/packr/v2/packr2
WORKDIR         /go/src/berty.tech/yolo
ENV             GO111MODULE=on \
                GOPROXY=proxy.golang.org
COPY            go.* ./
RUN             go mod download
COPY            . ./
RUN             rm -rf web
COPY            --from=web-build /app/dist web
RUN		        make packr
RUN             make install

# minimalist runtime
FROM alpine:3.11
RUN             apk add --update --no-cache ca-certificates
COPY            --from=go-build /go/bin/yolo /bin/
ENTRYPOINT      ["yolo"]
EXPOSE          8000
