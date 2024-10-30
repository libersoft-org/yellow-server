FROM oven/bun:latest

RUN apt update && apt install -y curl tini
ENTRYPOINT ["/usr/bin/tini", "--"]

USER 1000:1000

WORKDIR /app/app/src/
CMD ./start-docker-dev.sh
