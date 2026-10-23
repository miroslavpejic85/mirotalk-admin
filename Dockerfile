# Use Node.js 24 LTS as Base Image
FROM node:24-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV="production"

# Install build tools plus the Docker CLI and Compose plugin. The CLI is
# required for APP_MANAGE_MODE=docker, which shells out to `docker` /
# `docker-compose` against the host's Docker socket mounted into the
# container (see docker-compose.yml). Without it commands fail with
# "docker: not found".
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        make \
        g++ \
        bash \
        vim \
        ca-certificates \
        curl \
        gnupg && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" \
        > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        docker-ce-cli \
        docker-compose-plugin && \
    # Provide a `docker-compose` shim so the hyphenated command used by the
    # backend resolves to the bundled Compose v2 plugin.
    printf '#!/bin/sh\nexec docker compose "$@"\n' > /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose && \
    rm -rf /var/lib/apt/lists/*

# Copy all package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/tmp/* /usr/share/doc/*

# Copy source code
COPY frontend ./frontend
COPY backend ./backend

# Copy config files
COPY .env.template .env
COPY backend/config/index.template.js ./backend/config/index.js

# Start the app
CMD ["npm", "start"]