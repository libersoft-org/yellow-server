FROM oven/bun:latest


COPY src/package.json src/bun.lockb* /tmp/

WORKDIR /tmp/
RUN ls -thrlsa
RUN bun install

# live link yellow-server-common
RUN rm -rf /app/app/src/node_modules/yellow-server-common
RUN ln -s /app/lib/yellow-server-common /app/app/src/node_modules/yellow-server-common

WORKDIR /app/app/src/
CMD /app/app/src/start-hot.sh
