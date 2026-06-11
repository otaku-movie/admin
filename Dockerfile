# 使用 Node.js 作为基础镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /otaku-movie/admin

# 复制 package.json 和 package-lock.json 文件
COPY package.json package-lock.json ./

# 安装依赖
RUN npm ci --no-audit --no-fund

# 复制所有文件到工作目录
COPY . .

# 构建 Next.js 应用
RUN npm run build


# 暴露端口
EXPOSE 4000
# 启动 Next.js 应用
CMD ["sh", "-c", "PORT=4000 npm start"]