# build
FROM golang:1.11.1-alpine as builder
RUN apk add --update make git gcc musl-dev g++
WORKDIR /go/src/github.com/berty/staff/tools/release

# install libs
COPY go.* ./
RUN GO111MODULE=on go get .

# build project
COPY . .
RUN make install


# runtime
FROM alpine
COPY --from=builder /go/bin/berty-release /bin/
EXPOSE $PORT
ENTRYPOINT ["berty-release"]