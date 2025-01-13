FROM oven/bun:latest

ARG UID=1000
ARG GID=1000

RUN apt update && apt install -y curl tini
ENTRYPOINT ["/usr/bin/tini", "--"]

RUN mkdir /var/log/yellow
RUN chown $UID:$GID /var/log/yellow

ARG APP_DIR=/app/app/src/
RUN mkdir -p $APP_DIR
RUN chown $UID:$GID $APP_DIR
USER $UID:$GID
WORKDIR $APP_DIR

CMD ./start-docker-dev.sh
