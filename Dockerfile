# build
FROM            golang:1.13-alpine as build
RUN             apk add --update --no-cache git gcc musl-dev make
RUN             GO111MODULE=off go get github.com/gobuffalo/packr/v2/packr2
WORKDIR         /go/src/berty.tech/yolo
ENV             GO111MODULE=on
COPY            go.* ./
RUN             go mod download
COPY            . ./
RUN		packr2
RUN             make install

# minimalist runtime
FROM alpine:3.11
RUN             apk add --update --no-cache ca-certificates
COPY            --from=build /go/bin/yolo /bin/
ENTRYPOINT      ["yolo"]
