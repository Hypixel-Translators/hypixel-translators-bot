FROM node:18-bullseye
# Install the dependencies for canvas
RUN apt-get update
RUN apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
# Define working directory (we will automatically cd into it)
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