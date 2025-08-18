# Use official Node.js image
FROM node:18

WORKDIR /app

# Copy package files and database first
COPY package.json ./
COPY database.db ./

# Install dependencies for Linux
RUN npm install

# Copy the rest of your app
COPY . .

# Build Next.js app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]