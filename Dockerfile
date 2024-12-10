# Use the official Node.js image with the specified version from the Docker Hub
FROM node:20.15.1-alpine

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the local code to the container image
COPY . .

# Expose the port the app runs on
EXPOSE 9000

# Run the web service on container startup
CMD ["node", "app.js"]

