FROM node:18
RUN apt-get update
# Install the dependencies for canvas
RUN apt-get install build-essential libgif-dev -y
# Install the dependencies for puppeteer
RUN apt-get install -y fonts-liberation gconf-service libayatana-appindicator-dev libasound2 libatk1.0-0 libcairo2 libcups2 libfontconfig1 libgbm-dev libgdk-pixbuf2.0-0 libgtk-3-0 libicu-dev libjpeg-dev libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libpng-dev libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 xdg-utils
# Define working directory (we will automatically cd into it)
WORKDIR /app
# Copy everything from the current directory to the working directory (except the files in .dockerignore)
COPY . .
# Install dependencies
RUN yarn
# Run the app
CMD ["yarn", "start"]
