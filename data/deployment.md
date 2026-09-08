# 部署运维手册

本文档介绍项目的部署流程和环境配置。

## 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Python >= 3.8 (后端)
- MySQL >= 5.7
- Redis >= 6.0

## 前端部署

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 后端部署

### Docker 部署

```bash
# 构建镜像
docker build -t myapp-backend .

# 运行容器
docker run -d -p 3000:3000 \
  --env-file .env.production \
  myapp-backend
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
      - redis

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: myapp

  redis:
    image: redis:7-alpine
```

## 监控与日志

### PM2 进程管理

```bash
# 启动应用
pm2 start ecosystem.config.js

# 查看日志
pm2 logs

# 重启应用
pm2 restart all
```

## 故障排查

- [ ] 检查端口是否被占用
- [ ] 检查防火墙配置
- [ ] 查看日志文件定位问题
- [ ] 确认环境变量配置正确
