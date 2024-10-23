FROM oven/bun:latest

#RUN apt update && apt install -y mariadb-client


USER 1000:1000

WORKDIR /app/app/src/
CMD ./start-docker-dev.sh
