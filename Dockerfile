# Dockerfile for the Node.js backend application

# 1. Use an official Node.js runtime as a parent image
FROM node:18-alpine

# 2. Set the working directory in the container
WORKDIR /usr/src/app

# 3. Copy package.json and package-lock.json
COPY package*.json ./

# 4. Install app dependencies
RUN npm install

# 5. Copy Prisma schema
COPY prisma ./prisma/

# 6. Generate Prisma Client
# This is a crucial step inside the Docker build process
RUN npx prisma generate

# 7. Copy the rest of your app's source code
COPY . .

# 8. Make port 3001 available to the world outside this container
EXPOSE 3001

# 9. Define the command to run your app
CMD [ "node", "server.js" ]

