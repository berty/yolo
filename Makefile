IMAGE          ?= bertytech/yolo
HOST	       ?= ***REMOVED***
GITHUB_TOKEN   ?= ***REMOVED***
CIRCLE_TOKEN   ?= ***REMOVED***
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

.PHONY: prod-logs
prod-logs:
	ssh $(HOST) docker-compose logs -f yolo watchtower
