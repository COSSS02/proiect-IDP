docker build -t cosss02/e-shop-server:build --target dev -f ./server/Dockerfile .
docker build -t cosss02/e-shop-client:build --target dev -f ./client/Dockerfile .

docker push cosss02/e-shop-server:build
docker push cosss02/e-shop-client:build