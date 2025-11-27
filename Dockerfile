# Stage 1: Build the React/Vite application
FROM node:latest AS build-stage
WORKDIR /app
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy source code and perform the build
COPY . .
RUN npm run build

# ---

# Stage 2: Create the final, small httpd container
FROM httpd:latest
# Copy the built files from the previous stage's /app/dist 
# to the web server's document root
COPY --from=build-stage /app/dist/ /usr/local/apache2/htdocs/

# NEW LINE: Copy the .htaccess file from the host (project root) 
# into the Apache document root
COPY .htaccess /usr/local/apache2/htdocs/

EXPOSE 80