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

# 安装依赖
RUN npm ci --only=production && \
    echo "npm ci 成功" || (echo "npm ci 失败，打印日志:" && cat /root/.npm/_logs/*.log && exit 1)

# 复制两个 JS 文件
COPY runner.js ./
COPY runner-once.js ./

# 默认入口（runner.js）
CMD ["node", "runner.js"]
