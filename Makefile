IMAGE          ?= bertychat/yolo
HOST           ?= root@167.99.223.55
HOSTNAME       ?= yolo.berty.io
CIRCLE_TOKEN   ?= ***REMOVED***
PASSWORD       ?= 'xor+=cool'


.PHONY: run
run: install
	yolo -t $(CIRCLE_TOKEN) serve --debug

.PHONY: install
install:
	GO111MODULE=on go install -v ./cmd/...

.PHONY: docker.build
docker.build:
	go mod vendor
	docker build -t "$(IMAGE)" .

.PHONY: docker.push
docker.push: docker.build
	docker push "$(IMAGE)"

.PHONY: deploy
deploy:
	ssh $(HOST) "docker pull $(IMAGE) \
		&& (docker rm -f yolo || true) \
		&& docker run \
		    --restart unless-stopped \
		    --name yolo -d -p 80:3670 \
		    $(IMAGE) \
		      -t $(CIRCLE_TOKEN) serve \
		      --hostname $(HOSTNAME) -p $(PASSWORD)"

.PHONY: prod-logs
prod-logs:
	ssh $(HOST) docker logs -f yolo

.PHONY: release
release: docker.build docker.push deploy
