IMAGE          ?= bertychat/yolo
HOST           ?= root@167.99.223.55
HOSTNAME       ?= yolo.berty.io
GITHUB_TOKEN   ?= ***REMOVED***
CIRCLE_TOKEN   ?= ***REMOVED***
PASSWORD       ?= 'xor+=cool'
RUN_OPTS       ?= --no-slack --no-ga --no-auth


.PHONY: run
run: install
	yolo --circle-token=$(CIRCLE_TOKEN) --github-token=$(GITHUB_TOKEN) serve --debug $(RUN_OPTS)

.PHONY: install
install:
	GO111MODULE=on go install -v ./cmd/...

.PHONY: docker.build
docker.build:
	GO111MODULE=on go mod vendor
	docker build -t "$(IMAGE)" .

.PHONY: docker.push
docker.push: docker.build
	docker push "$(IMAGE)"

.PHONY: deploy
deploy:
	ssh $(HOST) "docker pull $(IMAGE) \
		&& (docker rm -f yolo || true) \
		&& mkdir -p /root/artifacts-cache \
		&& docker run \
		    --restart unless-stopped \
		    --name yolo \
		    -d -p 80:3670 \
		    -v "/root/artifacts-cache:/cache" \
		    $(IMAGE) \
		      --circle-token=$(CIRCLE_TOKEN) \
		      --github-token=$(GITHUB_TOKEN) \
		      serve \
		      --hostname $(HOSTNAME)" \
		      --cache-dir=/cache

.PHONY: prod-logs
prod-logs:
	ssh $(HOST) docker logs -f yolo

.PHONY: release
release: docker.build docker.push deploy
