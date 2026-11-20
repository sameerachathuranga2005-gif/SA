# Use official Node.js 20 Alpine Linux image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install dependencies (including devDependencies required for TypeScript compilation)
RUN npm install

# Copy server source code
COPY server/ ./

# Build TypeScript to production JavaScript in dist/
RUN npm run build

# Hugging Face Spaces default port is 7860
EXPOSE 7860

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=7860

# Launch server
CMD ["npm", "start"]

