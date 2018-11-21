.PHONY: install
install:
	GOPROXY=http://goproxy.berty.io:3000/ GO111MODULE=on go install -v ./cmd/...

.PHONY: docker.build
docker.build:
	docker build -t bertychat/yolo .

.PHONY: docker.push
docker.push: docker.build
	docker push bertychat/yolo
