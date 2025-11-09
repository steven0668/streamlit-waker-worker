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

# 关键：先安装依赖，再检查
RUN npm ci --only=production && \
    echo "npm ci 成功" || (echo "npm ci 失败，打印日志:" && cat /root/.npm/_logs/*.log && exit 1)

# 复制代码（确保 runner.js 在根目录）
COPY runner.js ./

# 入口
CMD ["node", "runner.js"]
