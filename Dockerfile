FROM golang:1.11.1-alpine

WORKDIR /go/src/github.com/berty/staff/tools/release
COPY . .

RUN apk add --update make
RUN make install

EXPOSE $PORT

ENTRYPOINT ["berty-release"]
