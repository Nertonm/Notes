# !!! Don't try to build this Dockerfile directly, run it through bin/build-docker.sh script !!!
FROM node:18.18.2-alpine

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

COPY server-package.json package.json

# Install app dependencies
RUN set -x \
    && apk add --no-cache --virtual .build-dependencies \
        autoconf \
        automake \
        g++ \
        gcc \
        libtool \
        make \
        nasm \
        libpng-dev \
        python3 \
    && npm install \
    && apk del .build-dependencies \
    && npm run webpack \
    && npm prune --omit=dev \
    && mkdir -p build/src/public/app-dist \
    && cp src/public/app/share.js build/src/public/app-dist/. \
    && cp -r src/public/app/doc_notes build/src/public/app-dist/. \
    && rm -rf src/public/app \
    && rm -rf src \
    && mv build/* .

# Some setup tools need to be kept
RUN apk add --no-cache su-exec shadow

# Add application user and setup proper volume permissions
RUN adduser -s /bin/false node; exit 0

# Start the application
EXPOSE 8080
CMD [ "./start-docker.sh" ]

HEALTHCHECK --start-period=10s CMD exec su-exec node node docker_healthcheck.js
