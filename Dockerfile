# Use official Node.js image
FROM node:18

WORKDIR /app

# Copy package files first
COPY package.json ./

# Configure persistent data directory and DB path
ENV DATABASE_PATH=/data/database.db
RUN mkdir -p /data
VOLUME ["/data"]

# Install dependencies for Linux
RUN npm install

# Copy the rest of your app
COPY . .

# Build Next.js app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]