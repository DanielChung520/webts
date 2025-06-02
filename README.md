# WebTS 開發環境

這是一個使用 Docker 配置的 React TypeScript 開發環境。

## 前置需求

- Git
- Docker
- Docker Compose

## 開發流程

### 首次設置

1. Fork 專案（如果您是團隊成員）
```bash
# 在 GitHub 上點擊 Fork 按鈕
```

2. 克隆專案
```bash
git clone https://github.com/[你的GitHub用戶名]/webts.git
cd webts
```

3. 設置上游倉庫（如果您是團隊成員）
```bash
git remote add upstream https://github.com/[原始倉庫]/webts.git
```

### 日常開發流程

1. 從主分支創建功能分支
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

2. 啟動開發環境
```bash
# 首次啟動或依賴變更時
docker-compose up --build

# 後續啟動
docker-compose up
```

3. 提交更改
```bash
git add .
git commit -m "feat: 添加新功能描述"
git push origin feature/your-feature-name
```

4. 創建 Pull Request
- 在 GitHub 上創建 Pull Request
- 等待代碼審查
- 根據反饋進行修改
- 合併到主分支

### 保持分支同步

1. 同步上游更改
```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

2. 更新功能分支
```bash
git checkout feature/your-feature-name
git merge main
```

## 開發說明

- 專案會在 http://localhost:3000 運行
- 源代碼修改會自動熱重載
- node_modules 在容器內管理，不會影響本地環境

## 常用命令

- 進入容器命令行：
```bash
docker exec -it webts-dev sh
```

- 查看容器日誌：
```bash
docker-compose logs -f web
```

- 重新構建（當 dependencies 改變時）：
```bash
docker-compose up --build
```

## Git 提交規範

提交信息格式：
```
<type>: <description>

[optional body]
[optional footer]
```

類型（type）：
- feat: 新功能
- fix: 修復錯誤
- docs: 文檔更改
- style: 代碼格式化
- refactor: 代碼重構
- test: 添加測試
- chore: 構建過程或輔助工具的變動

## 注意事項

1. 確保本地 3000 端口未被占用
2. 如果遇到權限問題，可能需要使用 sudo（Linux/Mac）
3. Windows 用戶建議使用 WSL2 運行 Docker
4. 始終在功能分支上開發，不要直接在 main 分支上工作
5. 定期同步上游倉庫的更改
6. 遵循提交信息規範 