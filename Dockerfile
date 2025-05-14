FROM ubuntu:24.04

ARG UID=1000
ARG GID=1000

RUN apt update && apt install -y curl tini unzip mariadb-client
ENTRYPOINT ["/usr/bin/tini", "--"]

# Install Node.js LTS (use setup script)
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt install -y nodejs

# Verify installations
RUN node -v

RUN mkdir /var/log/yellow
RUN chown $UID:$GID /var/log/yellow

ARG APP_DIR=/app/app/
RUN mkdir -p $APP_DIR
RUN chown $UID:$GID $APP_DIR
RUN mkdir /.bun
RUN chown $UID:$GID /.bun
USER $UID:$GID
WORKDIR $APP_DIR

RUN curl -fsSL https://bun.sh/install | bash

CMD ./start-docker-dev.sh
