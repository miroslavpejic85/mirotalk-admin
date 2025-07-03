# Use Node.js 22 LTS as Base Image
FROM node:22-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV="production"

# Install build tools (equivalent to 'Development Tools' group in yum)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        make \
        g++ \
        bash \
        vim \
    && rm -rf /var/lib/apt/lists/*

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