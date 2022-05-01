FROM ubuntu:22.04
# Update repositories
RUN apt-get update
# Install dependencies
RUN apt-get install curl -y
# Install node v16
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs
# Define working directory
WORKDIR /app
# Copy everything from the current directory to the working directory (except the files in .dockerignore)
COPY . .
# Install yarn
RUN npm i -g yarn
# Install dependencies
RUN yarn
# Set NODE_ENV to production
ENV NODE_ENV=production
# Run the app
CMD ["yarn", "start"]