FROM node:18-bullseye
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