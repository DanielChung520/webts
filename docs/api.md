# API 文檔

## 基礎信息
- 基礎URL: `https://enterprise.ai-daniel.org/api`
- API版本: v1
- 認證方式: Bearer Token

## API 端點列表

### 1. 用戶認證
#### 登錄
- 請求方式: POST
- 路徑: `/auth/login`
- 請求體:
```json
{
    "username": "string",
    "password": "string"
}
```
- 響應:
```json
{
    "token": "string",
    "user": {
        "id": "number",
        "username": "string"
    }
}
```

### 2. 數據接口
...（在這裡添加更多 API 端點的描述）

## 錯誤碼說明
| 錯誤碼 | 描述 |
|--------|------|
| 400    | 請求參數錯誤 |
| 401    | 未授權 |
| 403    | 禁止訪問 |
| 404    | 資源不存在 |
| 500    | 服務器錯誤 |

## 更新日誌
- 2024-03-xx: 初始版本 