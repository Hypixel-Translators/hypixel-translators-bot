FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install curl -y
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs
WORKDIR /app
COPY . .
RUN npm i -g yarn
RUN yarn
CMD ["yarn", "start"]