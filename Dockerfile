FROM node:18
RUN apt-get update
# Install the dependencies for canvas
RUN apt-get install build-essential libcairo2-dev libpango1.0-dev -y
# Define working directory (we will automatically cd into it)
WORKDIR /app
# Copy everything from the current directory to the working directory (except the files in .dockerignore)
COPY . .
# Install dependencies
RUN yarn
# Lint
RUN yarn lint:ci
# Remove deps from canvas
RUN apt-get remove build-essential libcairo2-dev libpango1.0-dev -y
# Set NODE_ENV to production
ENV NODE_ENV=production
# Run the app
CMD ["yarn", "start"]
