# web2 build
FROM            node:12 as web2-build
WORKDIR         /app
COPY            ./web2/package*.json ./web2/yarn.* ./
RUN             npm install
COPY            ./web2 ./
RUN             npm run build
# checking successful build, until there is a better way
RUN             cat build/index.html

# go build
FROM            golang:1.14-alpine as go-build
RUN             apk add --update --no-cache git gcc musl-dev make perl-utils
RUN             GO111MODULE=off go get github.com/gobuffalo/packr/v2/packr2
WORKDIR         /go/src/berty.tech/yolo
ENV             GO111MODULE=on \
                GOPROXY=proxy.golang.org
COPY            go.* ./
RUN             go mod download
COPY            go ./go/
RUN             rm -rf web2
COPY            --from=web2-build /app/build web2/build
WORKDIR         /go/src/berty.tech/yolo/go
RUN		        make packr
RUN             make install

# minimalist runtime
FROM alpine:3.11
RUN             apk add --update --no-cache ca-certificates
COPY            --from=go-build /go/bin/yolo /bin/
ENTRYPOINT      ["yolo"]
EXPOSE          8000
