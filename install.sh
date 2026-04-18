docker swarm init

docker build -t e-shop-server:build --target dev -f ./server/Dockerfile .

docker build -t e-shop-client:build --target dev -f ./client/Dockerfile .

export $(cat .env) > /dev/null 2>&1; docker stack deploy -c docker-stack.yml e-shop
