# Use official Node.js 20 Alpine Linux image for lightweight and secure runtime
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package manifests first for optimal Docker layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies required for TypeScript build)
RUN npm install

# Copy application source code
COPY . .

# Build TypeScript to production JavaScript in dist/
RUN npm run build

# Hugging Face Spaces default port is 7860
EXPOSE 7860

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=7860

# Launch production server
CMD ["npm", "start"]

