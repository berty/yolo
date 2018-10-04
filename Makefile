
.PHONY: install
install:
	go install -v ./cmd/...

.PHONY: docker.build
docker.build:
	docker build -t bertychat/yolo .

.PHONY: docker.push
docker.push:
	docker push bertychat/yolo
