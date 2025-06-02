# 使用 Node.js 18 作為基礎鏡像
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 安裝開發依賴
RUN apk add --no-cache git

# 複製 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製源代碼
COPY . .

# 暴露端口
EXPOSE 3000

# 啟動開發服務器
CMD ["npm", "start"] 