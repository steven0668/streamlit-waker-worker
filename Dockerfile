# Dockerfile
FROM node:20-alpine

# 安装 Chromium 及依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# 复制包管理文件
COPY package*.json ./
RUN npm ci --only=production

# 复制代码
COPY scripts/ ./scripts/
COPY runner.js ./

# 入口：运行 runner.js
CMD ["node", "runner.js"]
