# builder
FROM            golang:1.11.4-alpine as builder
RUN             apk add --no-cache make git gcc musl-dev g++
RUN             go get -u github.com/gobuffalo/packr/packr
WORKDIR         /go/src/github.com/berty/staff/tools/release
COPY            go.mod go.sum ./
RUN             GO111MODULE=on go mod download
COPY            . .
RUN             packr
RUN             make install

# runtime
FROM            alpine
WORKDIR         /tmp
RUN             apk add --no-cache ca-certificates
COPY            --from=builder /go/bin/yolo /bin/
COPY            --from=builder /go/src/github.com/berty/staff/tools/release/assets /tmp/assets
EXPOSE          $PORT
ENTRYPOINT      ["yolo"]
