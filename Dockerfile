# builder
FROM            golang:1.11.4-alpine as builder
RUN             apk add --no-cache make git gcc musl-dev g++
RUN             go get -u github.com/gobuffalo/packr/packr
WORKDIR         /go/src/github.com/berty/staff/tools/release
COPY            . .
RUN             packr
RUN             GO111MODULE=on go install -mod=vendor -v ./cmd/...

# runtime
FROM            alpine
WORKDIR         /tmp
RUN             apk add --no-cache ca-certificates
COPY            --from=builder /go/bin/yolo /bin/
COPY            --from=builder /go/src/github.com/berty/staff/tools/release/assets /tmp/assets
EXPOSE          $PORT
ENTRYPOINT      ["yolo"]
