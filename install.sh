#!/bin/bash

set -e

echo "Initializing swarm on manager node..."
docker swarm init

SWARM_TOKEN=$(docker swarm join-token -q worker)
SWARM_MASTER_IP=$(docker info | grep -w 'Node Address' | awk '{print $3}')
DOCKER_VERSION=29.3.0-dind
NUM_WORKERS=2

echo "Starting ${NUM_WORKERS} dind worker containers..."
for i in $(seq "${NUM_WORKERS}"); do
  docker run -d --privileged --name worker-${i} --hostname=worker-${i} -p ${i}2375:2375 docker:${DOCKER_VERSION}
done

echo "Waiting for worker Docker daemons to start..."
for i in $(seq "${NUM_WORKERS}"); do
  until docker exec worker-${i} docker info >/dev/null 2>&1; do
    echo "Waiting for worker-${i}..."
    sleep 2
  done
done

echo "Joining workers to swarm..."
for i in $(seq "${NUM_WORKERS}"); do
  docker exec -it worker-${i} docker swarm join --token ${SWARM_TOKEN} ${SWARM_MASTER_IP}:2377
done

echo "Deploying stack..."
docker stack deploy -c docker-stack.yml e-shop