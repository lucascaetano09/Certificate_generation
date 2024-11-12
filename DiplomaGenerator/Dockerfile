FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

RUN apt-get update && \
    apt-get install -y \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxshmfence1 \
    libx11-6 \
    libxext6 \
    libxfixes3 \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    lsb-release \
    xdg-utils \
    wget \
    && rm -rf /var/lib/apt/lists/*

COPY . .

CMD ["node", "processor.js"]
