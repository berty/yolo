# build
FROM golang:1.11.1-alpine as builder
RUN apk add --no-cache make git gcc musl-dev g++
WORKDIR /go/src/github.com/berty/staff/tools/release

# install libs
COPY go.* ./
RUN GOPROXY=http://goproxy.berty.io:3000/ GO111MODULE=on go get .

# build project
COPY . .
RUN make install

# runtime
FROM alpine
WORKDIR /tmp
RUN apk add --no-cache ca-certificates
COPY --from=builder /go/bin/berty-release /bin/
COPY --from=builder /go/src/github.com/berty/staff/tools/release/assets /tmp/assets
EXPOSE $PORT
ENTRYPOINT ["berty-release"]
