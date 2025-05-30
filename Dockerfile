# Use official Node.js LTS image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install system utilities (only if you really need vim in production)
RUN apk add --no-cache bash vim

# Copy only package files first for better cache usage
COPY package.json ./

# Install dependencies
RUN npm install --production && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/tmp/* /usr/share/doc/*

# Copy backend and frontend source code
COPY backend ./backend
COPY frontend ./frontend

# Copy config and env templates
COPY .env.template .env
COPY backend/config/index.template.js ./backend/config/index.js

# Start the app
CMD ["npm", "start"]