FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Default command (overridden in docker-compose for dev)
CMD ["npm", "run", "dev"]
