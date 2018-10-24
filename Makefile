.PHONY: install
install:
	GO111MODULE=on go install -v ./cmd/...

.PHONY: docker.build
docker.build:
	docker build -t bertychat/yolo .

.PHONY: docker.push
docker.push:
	docker push bertychat/yolo
