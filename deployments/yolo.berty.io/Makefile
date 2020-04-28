all: up logs

up:
	@mkdir -p data
	docker-compose up -d

logs:
	@mkdir -p data
	docker-compose logs --tail=100 -f

down:
	docker-compose down
	rm -f data/yolo.sqlite || sudo rm -f data/yolo.sqlite
