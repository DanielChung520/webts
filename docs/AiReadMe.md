# AI 聊天系統前端開發指南

## 系統架構

### 目錄結構
```
pysrc/ai/
├── api/                    # API 接口層
│   ├── v1/                # API 版本1
│   │   └── chat/         # 聊天相關API
│   │       ├── rooms.py   # 聊天室管理
│   │       ├── messages.py # 消息處理
│   │       └── completion.py # AI回覆生成
├── chat/                  # 聊天核心功能
│   └── chat_manager.py    # 聊天管理器
├── core/                  # 核心功能模組
│   ├── ai_roles.py       # AI角色管理
│   ├── ai_room.py        # 聊天室邏輯
│   └── ai_model.py       # AI模型管理
├── llm/                   # LLM模型集成
│   └── providers/        # 不同LLM提供商的實現
├── data/                  # 數據存儲
│   └── history/          # 聊天歷史記錄
└── config/               # 配置文件
```

### 核心功能模組

1. **聊天管理（chat_manager.py）**
   - 聊天歷史管理
   - 自動創建聊天室
   - 消息持久化存儲
   - 上下文管理（保留最近10條消息）

2. **AI模型管理（ai_model.py）**
   - 支持多個LLM提供商
   - 模型參數配置
   - 響應格式統一化
   - 錯誤處理和重試機制

3. **聊天室管理（ai_room.py）**
   - 聊天室生命週期管理
   - 用戶會話狀態維護
   - 多用戶並發處理
   - 聊天記錄清理

4. **角色管理（ai_roles.py）**
   - AI角色定義和配置
   - 角色切換機制
   - 系統提示詞管理
   - 角色權限控制

### API 接口概覽

1. **聊天功能**
   - 發送消息 (POST /api/ai/v1/chat/completion)
   - 獲取歷史 (GET /api/ai/v1/chat/history)
   - 刪除聊天室 (DELETE /api/ai/v1/chat/room)

2. **模型管理**
   - 獲取可用模型 (GET /api/ai/llm/models)
   - 模型配置獲取 (GET /api/ai/llm/models/{provider})

3. **WebSocket 支持**
   - 實時消息推送
   - 連接狀態管理
   - 自動重連機制
   - 心跳檢測

### 數據存儲

1. **聊天記錄**
   - 存儲位置：data/history/{user_id}.json
   - 記錄格式：JSON
   - 自動清理機制
   - 數據備份策略

2. **緩存策略**
   - localStorage 消息緩存
   - 會話狀態緩存
   - 模型配置緩存
   - 用戶設置緩存

## 快速開始

### 基本配置
```javascript
const API_BASE_URL = 'http://your-api-host/api/ai';
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
};
```

### 錯誤處理
所有 API 響應都遵循以下格式：

成功響應：
```typescript
interface SuccessResponse<T> {
  status: 'success';
  data: T;
}
```

錯誤響應：
```typescript
interface ErrorResponse {
  detail: string;  // 錯誤信息
}
```

## API 接口說明

### 1. 聊天功能

#### 1.1 發送聊天消息
```typescript
// 請求
POST /api/ai/v1/chat/completion

// 請求體類型
interface ChatRequest {
  room_id: string;      // 聊天室ID，如果不存在會自動創建
  user_id: string;      // 用戶ID
  user_role: string;    // 用戶角色
  message: string;      // 用戶消息
  provider_name?: string; // 可選，AI 提供商（deepseek, openai 等）
  model_id?: string;    // 可選，模型ID
  parameters?: {        // 可選，模型參數
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
}

// 響應類型
interface ChatResponse {
  status: 'success';
  data: {
    role: string;
    response: string;   // AI 回應內容
    model: string;      // 使用的模型
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
}

// 使用示例
async function sendMessage(chatRequest: ChatRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/chat/completion`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(chatRequest)
    });
    
    if (!response.ok) {
      throw await response.json();
    }
    
    return await response.json();
  } catch (error) {
    console.error('發送消息失敗:', error);
    throw error;
  }
}
```

#### 1.2 獲取聊天歷史
```typescript
// 請求
GET /api/ai/v1/chat/history?user_id={user_id}&room_id={room_id}&limit={limit}

// 查詢參數
interface HistoryParams {
  user_id: string;    // 必需，用戶ID
  room_id?: string;   // 可選，聊天室ID
  limit?: number;     // 可選，返回消息數量限制
}

// 響應類型
interface HistoryResponse {
  status: 'success';
  data: {
    room_id: string;
    user_role: string;
    created_at: string;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
  };
}

// 使用示例
async function getChatHistory(params: HistoryParams) {
  const queryString = new URLSearchParams(params as any).toString();
  try {
    const response = await fetch(`${API_BASE_URL}/v1/chat/history?${queryString}`, {
      headers: DEFAULT_HEADERS
    });
    
    if (!response.ok) {
      throw await response.json();
    }
    
    return await response.json();
  } catch (error) {
    console.error('獲取歷史記錄失敗:', error);
    throw error;
  }
}
```

#### 1.3 刪除聊天室
```typescript
// 請求
DELETE /api/ai/v1/chat/room/{user_id}/{room_id}

// 響應類型
interface DeleteResponse {
  status: 'success';
  message: string;
}

// 使用示例
async function deleteChatRoom(userId: string, roomId: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/v1/chat/room/${userId}/${roomId}`,
      {
        method: 'DELETE',
        headers: DEFAULT_HEADERS
      }
    );
    
    if (!response.ok) {
      throw await response.json();
    }
    
    return await response.json();
  } catch (error) {
    console.error('刪除聊天室失敗:', error);
    throw error;
  }
}
```

### 2. AI 模型管理

#### 2.1 獲取可用模型列表
```typescript
// 請求
GET /api/ai/llm/models

// 響應類型
interface ModelListResponse {
  [provider: string]: {
    name: string;
    description: string;
    status: 'active' | 'inactive';
    is_server_managed: boolean;
    models: Array<{
      id: string;
      name: string;
      description: string;
      capabilities: {
        chat: boolean;
        completion: boolean;
        embedding: boolean;
      };
      context_length: number;
      cost_per_token: {
        input: number;
        output: number;
      };
    }>;
  };
}

// 使用示例
async function getAvailableModels() {
  try {
    const response = await fetch(`${API_BASE_URL}/llm/models`, {
      headers: DEFAULT_HEADERS
    });
    
    if (!response.ok) {
      throw await response.json();
    }
    
    return await response.json();
  } catch (error) {
    console.error('獲取模型列表失敗:', error);
    throw error;
  }
}
```

## 前端開發建議

### 1. 聊天室管理
```typescript
// 聊天室狀態管理
interface ChatState {
  currentRoom: string | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

// 消息類型
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// React Hook 示例
function useChatRoom(userId: string, roomId: string) {
  const [state, setState] = useState<ChatState>({
    currentRoom: null,
    messages: [],
    isLoading: false,
    error: null
  });

  // 加載歷史消息
  useEffect(() => {
    loadHistory();
  }, [roomId]);

  // 發送消息
  const sendMessage = async (content: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await sendChatMessage({
        room_id: roomId,
        user_id: userId,
        message: content
      });
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          role: 'user',
          content,
          timestamp: new Date().toISOString()
        }, {
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date().toISOString()
        }],
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: '發送消息失敗',
        isLoading: false
      }));
    }
  };

  return {
    ...state,
    sendMessage
  };
}
```

### 2. 錯誤處理最佳實踐
```typescript
// API 錯誤處理
class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

// 統一的錯誤處理
async function handleAPIError(error: any) {
  if (error instanceof APIError) {
    switch (error.status) {
      case 401:
        // 處理未授權
        redirectToLogin();
        break;
      case 404:
        // 處理資源不存在
        showNotFound();
        break;
      case 429:
        // 處理請求過多
        showRateLimitError();
        break;
      default:
        // 處理其他錯誤
        showErrorMessage(error.message);
    }
  } else {
    // 處理網絡錯誤等
    showNetworkError();
  }
}
```

### 3. 性能優化建議

1. 消息緩存：
```typescript
// 使用 localStorage 緩存最近的消息
const CACHE_KEY = 'chat_messages';
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24小時

function cacheMessages(roomId: string, messages: Message[]) {
  const cache = {
    timestamp: Date.now(),
    messages
  };
  localStorage.setItem(`${CACHE_KEY}_${roomId}`, JSON.stringify(cache));
}

function getCachedMessages(roomId: string): Message[] | null {
  const cached = localStorage.getItem(`${CACHE_KEY}_${roomId}`);
  if (!cached) return null;

  const { timestamp, messages } = JSON.parse(cached);
  if (Date.now() - timestamp > MAX_CACHE_AGE) {
    localStorage.removeItem(`${CACHE_KEY}_${roomId}`);
    return null;
  }

  return messages;
}
```

2. 消息分頁：
```typescript
function useMessagePagination(roomId: string, pageSize = 20) {
  const [page, setPage] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    const response = await getChatHistory({
      room_id: roomId,
      limit: pageSize,
      offset: (page - 1) * pageSize
    });

    setMessages(prev => [...prev, ...response.data.messages]);
    setHasMore(response.data.messages.length === pageSize);
    setPage(prev => prev + 1);
  };

  return { messages, hasMore, loadMore };
}
```

3. 消息防抖：
```typescript
function useDebouncedMessage(delay = 500) {
  const [message, setMessage] = useState('');
  const debouncedMessage = useDebounce(message, delay);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  return { message, debouncedMessage, handleChange };
}
```

### 4. WebSocket 集成示例

```typescript
class ChatWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private url: string, private options: {
    onMessage: (data: any) => void;
    onError: (error: any) => void;
    onClose: () => void;
  }) {}

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.options.onMessage(data);
    };

    this.ws.onerror = (error) => {
      this.options.onError(error);
    };

    this.ws.onclose = () => {
      this.options.onClose();
      this.reconnect();
    };
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, 1000 * Math.pow(2, this.reconnectAttempts));
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// 使用示例
const chatWS = new ChatWebSocket('ws://your-api-host/ws/chat', {
  onMessage: (data) => {
    console.log('收到消息:', data);
  },
  onError: (error) => {
    console.error('WebSocket錯誤:', error);
  },
  onClose: () => {
    console.log('WebSocket連接關閉');
  }
});
```

## 注意事項

1. 安全性：
   - 所有請求都應該包含適當的認證信息
   - 敏感數據（如 API 密鑰）不要存儲在前端
   - 實現請求頻率限制的處理機制

2. 用戶體驗：
   - 實現打字中狀態顯示
   - 添加消息發送狀態指示
   - 支持消息重發機制
   - 實現優雅的錯誤提示

3. 性能：
   - 實現消息的本地緩存
   - 使用虛擬滾動處理長消息列表
   - 實現圖片和文件的延遲加載
   - 添加適當的加載狀態指示器

4. 可訪問性：
   - 支持鍵盤導航
   - 添加適當的 ARIA 標籤
   - 確保足夠的顏色對比度
   - 支持屏幕閱讀器

### RAG 功能架構

1. **知識庫管理**
```typescript
interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  document_count: number;
  embedding_model: string;
  status: 'active' | 'processing' | 'error';
}

interface Document {
  id: string;
  knowledge_base_id: string;
  title: string;
  content: string;
  metadata: {
    source: string;
    author?: string;
    created_at: string;
    tags?: string[];
    [key: string]: any;
  };
  embedding?: number[];
}
```

2. **文檔處理流程**
   - 文檔上傳和解析
   - 文本分塊
   - 向量化處理
   - 索引構建
   - 實時更新

3. **檢索增強API**
```typescript
// 知識庫管理
interface KnowledgeBaseAPI {
  // 創建知識庫
  createKnowledgeBase: (params: {
    name: string;
    description?: string;
    embedding_model?: string;
  }) => Promise<KnowledgeBase>;

  // 上傳文檔
  uploadDocuments: (params: {
    knowledge_base_id: string;
    files: File[];
    metadata?: Record<string, any>;
  }) => Promise<{
    success: boolean;
    failed: string[];
    processing_id?: string;
  }>;

  // 查詢上傳狀態
  getUploadStatus: (processing_id: string) => Promise<{
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
  }>;
}

// RAG 聊天
interface RAGChatRequest extends ChatRequest {
  knowledge_base_ids?: string[];  // 指定要使用的知識庫
  search_params?: {
    max_results?: number;     // 最大檢索結果數
    similarity_threshold?: number;  // 相似度閾值
    rerank_top_k?: number;    // 重排序top k
  };
}

interface RAGChatResponse extends ChatResponse {
  citations: Array<{
    document_id: string;
    title: string;
    content_snippet: string;
    similarity_score: number;
  }>;
}
```

4. **前端組件**
```typescript
// RAG聊天室Hook
function useRAGChatRoom(params: {
  userId: string;
  roomId: string;
  knowledgeBaseIds: string[];
}) {
  const [state, setState] = useState<ChatState & {
    citations: Citation[];
    searchParams: SearchParams;
  }>({
    // ... 基本聊天狀態 ...
    citations: [],
    searchParams: {
      maxResults: 3,
      similarityThreshold: 0.7,
      rerankTopK: 10
    }
  });

  // 發送RAG消息
  const sendRAGMessage = async (content: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await sendChatMessage({
        ...basicChatParams,
        knowledge_base_ids: params.knowledgeBaseIds,
        search_params: state.searchParams,
        message: content
      });
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          role: 'user',
          content,
          timestamp: new Date().toISOString()
        }, {
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date().toISOString()
        }],
        citations: response.data.citations,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: '發送消息失敗',
        isLoading: false
      }));
    }
  };

  return {
    ...state,
    sendRAGMessage,
    updateSearchParams: (newParams: Partial<SearchParams>) => {
      setState(prev => ({
        ...prev,
        searchParams: { ...prev.searchParams, ...newParams }
      }));
    }
  };
}

// 知識庫管理組件
function KnowledgeBaseManager() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [uploadStatus, setUploadStatus] = useState<Record<string, {
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
  }>>({});

  // 上傳文檔
  const handleFileUpload = async (files: File[], metadata?: Record<string, any>) => {
    try {
      const result = await uploadDocuments({
        knowledge_base_id: selectedKnowledgeBase.id,
        files,
        metadata
      });

      if (result.processing_id) {
        // 開始輪詢上傳狀態
        pollUploadStatus(result.processing_id);
      }
    } catch (error) {
      console.error('文檔上傳失敗:', error);
    }
  };

  // 輪詢上傳狀態
  const pollUploadStatus = async (processingId: string) => {
    const checkStatus = async () => {
      const status = await getUploadStatus(processingId);
      setUploadStatus(prev => ({
        ...prev,
        [processingId]: status
      }));

      if (status.status === 'processing') {
        setTimeout(checkStatus, 2000);
      }
    };

    checkStatus();
  };

  return (
    <div>
      {/* 知識庫列表 */}
      <KnowledgeBaseList
        knowledgeBases={knowledgeBases}
        onSelect={handleKnowledgeBaseSelect}
      />

      {/* 文檔上傳 */}
      <FileUploader
        onUpload={handleFileUpload}
        acceptedTypes={['.pdf', '.doc', '.docx', '.txt']}
      />

      {/* 上傳狀態顯示 */}
      <UploadStatusList
        statusMap={uploadStatus}
        onRetry={handleRetryUpload}
      />
    </div>
  );
}
```

5. **使用者界面**
   - 知識庫選擇器
   - 文檔上傳介面
   - 引用來源顯示
   - 相關度調整控制項
   - 處理進度指示器

6. **性能優化**
   - 向量緩存
   - 批量處理
   - 異步加載
   - 分頁顯示

## 向量存儲最佳實踐（ChromaDB）

### 1. 集合（Collections）設計

```python
# 建議的 ChromaDB 集合結構
collections = {
    "market_data": {  # 核心數據層
        "description": "量化數據和模型結果",
        "metadata_schema": {
            "data_type": ["OHLCV", "technical_indicator", "XGB_prediction", "FinRL_strategy"],
            "symbol": "股票代碼",
            "timestamp": "數據時間戳",
            "update_frequency": "更新頻率"
        }
    },
    "market_info": {  # 外部信息層
        "description": "市場資訊和新聞",
        "metadata_schema": {
            "info_type": ["news", "expert_opinion", "market_analysis", "policy"],
            "source": "信息來源",
            "publish_time": "發布時間",
            "relevance_score": "相關性分數"
        }
    },
    "interaction_knowledge": {  # 互動知識層
        "description": "交互積累的知識",
        "metadata_schema": {
            "knowledge_type": ["strategy_discussion", "risk_management", "market_insight"],
            "confidence_score": "可信度分數",
            "verification_status": "驗證狀態",
            "last_review_time": "最後審核時間"
        }
    }
}
```

### 2. 統一向量存儲策略

1. **單一 ChromaDB 實例**
   - 使用集合（Collections）區分不同類型數據
   - 通過元數據（Metadata）進行細分
   - 維護統一的檢索接口

2. **元數據設計**
   ```python
   metadata_structure = {
       "common_fields": {
           "created_at": "創建時間",
           "updated_at": "更新時間",
           "source_type": "數據來源類型",
           "confidence_score": "可信度分數"
       },
       "specific_fields": {
           "market_data": {
               "symbol": "股票代碼",
               "timeframe": "時間週期",
               "model_version": "模型版本"
           },
           "market_info": {
               "news_source": "新聞來源",
               "author": "作者",
               "publish_time": "發布時間"
           },
           "interaction_knowledge": {
               "interaction_type": "交互類型",
               "validation_status": "驗證狀態",
               "user_feedback": "用戶反饋"
           }
       }
   }
   ```

3. **檢索策略**
   ```python
   search_strategy = {
       "multi_collection_search": {
           "description": "跨集合並行檢索",
           "weights": {
               "market_data": 0.4,
               "market_info": 0.3,
               "interaction_knowledge": 0.3
           },
           "filters": {
               "time_relevance": "時間相關性過濾",
               "confidence_threshold": "可信度閾值",
               "source_priority": "來源優先級"
           }
       }
   }
   ```

### 3. 數據更新流程

1. **增量更新機制**
   ```
   新數據 -> 預處理 -> 查重檢查 -> 向量化 -> 更新集合
   ```

2. **批量更新策略**
   ```
   定時任務 -> 數據收集 -> 批量處理 -> 批量更新 -> 更新日誌
   ```

3. **實時更新處理**
   ```
   實時數據 -> 緩衝隊列 -> 異步處理 -> 定期提交 -> 結果驗證
   ```

### 4. 性能優化建議

1. **索引優化**
   - 使用適當的向量維度
   - 實現高效的相似度計算
   - 維護合適的分片大小

2. **查詢優化**
   - 實現查詢緩存
   - 使用批量查詢
   - 優化過濾條件

3. **存儲優化**
   - 定期壓縮數據
   - 清理過期數據
   - 優化存儲結構

### 5. 實現建議

1. **向量管理器設計**
```python
class VectorStoreManager:
    def __init__(self):
        self.db = ChromaClient()
        self.collections = self._init_collections()
        self.embedding_functions = self._init_embedding_functions()

    def _init_collections(self):
        """初始化所有必要的集合"""
        collections = {}
        for name, schema in COLLECTION_SCHEMAS.items():
            collections[name] = self.db.get_or_create_collection(
                name=name,
                metadata=schema
            )
        return collections

    async def search_across_collections(
        self,
        query: str,
        collection_weights: Dict[str, float] = None,
        filters: Dict = None
    ):
        """跨集合搜索實現"""
        results = []
        for name, collection in self.collections.items():
            weight = collection_weights.get(name, 1.0)
            collection_results = await self._search_single_collection(
                collection=collection,
                query=query,
                weight=weight,
                filters=filters
            )
            results.extend(collection_results)
        
        return self._merge_and_rank_results(results)
```

2. **數據處理流水線**
```python
class DataPipeline:
    def __init__(self):
        self.preprocessors = self._init_preprocessors()
        self.vector_store = VectorStoreManager()

    async def process_market_data(self, data: Dict):
        """處理市場數據"""
        processed_data = self.preprocessors['market_data'].process(data)
        await self.vector_store.add_to_collection(
            'market_data',
            processed_data
        )

    async def process_market_info(self, info: Dict):
        """處理市場信息"""
        processed_info = self.preprocessors['market_info'].process(info)
        await self.vector_store.add_to_collection(
            'market_info',
            processed_info
        )

    async def process_interaction(self, interaction: Dict):
        """處理交互知識"""
        processed_interaction = self.preprocessors['interaction'].process(interaction)
        await self.vector_store.add_to_collection(
            'interaction_knowledge',
            processed_interaction
        )
```

這種設計方案的優勢：

1. **統一管理**
   - 所有數據在同一個 ChromaDB 實例中
   - 通過集合進行邏輯分離
   - 便於統一維護和優化

2. **靈活擴展**
   - 易於添加新的數據類型
   - 支持動態調整檢索策略
   - 方便進行性能優化

3. **效率提升**
   - 減少系統複雜度
   - 優化資源使用
   - 提高檢索效率

4. **維護簡化**
   - 集中式的數據管理
   - 統一的更新機制
   - 一致的監控方案

## 特定領域 RAG 系統架構（股票投資）

### 1. 知識庫分層設計

1. **核心數據層**
   - 股票基本面數據（OHLCV）
   - 技術指標數據
   - XGB 模型預測結果
   - FinRL 強化學習模型
   - 交易策略庫

2. **外部信息層**
   - 財經新聞
   - 專家觀點
   - 市場分析報告
   - 監管政策信息
   - 宏觀經濟數據

3. **互動知識層**
   - 用戶交互記錄
   - 策略討論總結
   - 成功案例分析
   - 風險管理經驗
   - 市場洞察積累

### 2. 知識整合框架

1. **數據源管理**
   ```
   核心數據層：
   ├── 量化數據處理器
   │   ├── OHLCV 數據標準化
   │   ├── 技術指標計算
   │   └── 模型預測結果整合
   ├── 模型結果處理器
   │   ├── XGB 模型輸出
   │   ├── FinRL 策略結果
   │   └── 回測數據分析
   └── 策略庫管理器
       ├── 交易策略文檔
       ├── 參數優化記錄
       └── 性能評估報告

   外部信息層：
   ├── 新聞聚合器
   │   ├── 新聞源管理
   │   ├── 內容提取器
   │   └── 重要性評分
   ├── 專家觀點收集器
   │   ├── 觀點摘要
   │   ├── 可信度評估
   │   └── 時效性標記
   └── 市場分析整合器
       ├── 報告解析
       ├── 數據提取
       └── 觀點匯總

   互動知識層：
   ├── 對話記錄處理器
   │   ├── 重要信息提取
   │   ├── 經驗總結生成
   │   └── 知識點標記
   ├── 案例庫管理器
   │   ├── 成功案例收集
   │   ├── 失敗教訓總結
   │   └── 最佳實踐提取
   └── 市場洞察管理器
       ├── 趨勢分析
       ├── 風險預警
       └── 機會識別
   ```

2. **向量化策略**
   - 不同層級使用不同的向量化模型
   - 核心數據層：專注數值特徵向量化
   - 外部信息層：文本語義向量化
   - 互動知識層：混合特徵向量化

3. **檢索優化策略**
   - 多層級並行檢索
   - 層級間權重動態調整
   - 上下文相關性增強
   - 時效性加權排序

### 3. 交互流程設計

1. **查詢解析**
   - 意圖識別
   - 關鍵信息提取
   - 查詢重寫優化
   - 多維度拆解

2. **知識檢索**
   - 分層檢索策略
   - 實時數據更新
   - 相關性排序
   - 結果組合優化

3. **回應生成**
   - 多源信息整合
   - 專業術語解釋
   - 數據可視化建議
   - 操作建議生成

### 4. 知識更新機制

1. **自動更新**
   - 定時數據同步
   - 新聞實時抓取
   - 模型結果更新
   - 市場數據刷新

2. **交互式更新**
   - 對話要點提取
   - 經驗自動總結
   - 知識點驗證
   - 反饋整合

3. **人工審核**
   - 知識質量評估
   - 準確性驗證
   - 時效性檢查
   - 價值判斷

### 5. 特色功能設計

1. **市場分析增強**
   - 多維度數據整合
   - 跨市場關聯分析
   - 風險預警機制
   - 機會識別系統

2. **策略優化支持**
   - 回測數據分析
   - 參數優化建議
   - 風險評估
   - 收益預測

3. **知識積累系統**
   - 經驗自動提取
   - 案例庫建設
   - 最佳實踐總結
   - 持續學習優化

### 6. 系統監控與優化

1. **性能監控**
   - 響應時間追踪
   - 資源使用監控
   - 檢索質量評估
   - 用戶滿意度分析

2. **知識質量管理**
   - 準確性評估
   - 時效性監控
   - 完整性檢查
   - 價值評估

3. **持續優化**
   - 檢索策略調整
   - 向量化模型更新
   - 知識結構優化
   - 用戶體驗提升

### 7. 安全與合規

1. **數據安全**
   - 敏感信息保護
   - 訪問權限控制
   - 數據加密存儲
   - 操作日誌記錄

2. **合規管理**
   - 法規遵從
   - 免責聲明
   - 風險提示
   - 隱私保護

# RAG 系統架構設計

## 1. 目錄結構
```
pysrc/rag/
├── __init__.py
├── knowledge/              # 知識庫管理
│   ├── __init__.py
│   ├── base.py            # 基礎知識管理
│   ├── investment.py      # 投資領域知識
│   └── enterprise.py      # 企業管理知識
│
├── experience/            # 經驗沉澱
│   ├── __init__.py
│   ├── interaction.py     # 互動經驗
│   └── learning.py        # 學習總結
│
├── outsource/            # 外部資訊整合
│   ├── __init__.py
│   ├── news.py           # 新聞資訊
│   ├── research.py       # 研究報告
│   └── social.py         # 社交媒體
│
├── handlers/             # 處理器
│   ├── __init__.py
│   ├── query_handler.py  # 查詢處理
│   ├── embed_handler.py  # 向量化處理
│   └── store_handler.py  # 存儲處理
│
├── schemas/             # 資料結構定義
│   ├── __init__.py
│   ├── knowledge_schema.py
│   ├── experience_schema.py
│   └── source_schema.py
│
├── models/             # 資料模型
│   ├── __init__.py
│   ├── vector_store.py    # 向量存儲模型
│   └── embedding.py       # 嵌入模型
│
├── routes/             # API路由
│   ├── __init__.py
│   ├── knowledge_routes.py
│   ├── experience_routes.py
│   └── source_routes.py
│
└── services/           # 業務邏輯
    ├── __init__.py
    ├── knowledge_service.py
    ├── experience_service.py
    └── source_service.py
```

## 2. 知識庫分層設計

### 2.1 核心數據層
- 股票基本面數據（OHLCV）
- 技術指標數據
- XGB 模型預測結果
- FinRL 強化學習模型
- 交易策略庫

### 2.2 外部信息層
- 財經新聞
- 專家觀點
- 市場分析報告
- 監管政策信息
- 宏觀經濟數據

### 2.3 互動知識層
- 用戶交互記錄
- 策略討論總結
- 成功案例分析
- 風險管理經驗
- 市場洞察積累

## 3. 向量存儲策略（ChromaDB）

### 3.1 集合（Collections）設計
```python
collections = {
    "market_data": {  # 核心數據層
        "description": "量化數據和模型結果",
        "metadata_schema": {
            "data_type": ["OHLCV", "technical_indicator", "XGB_prediction", "FinRL_strategy"],
            "symbol": "股票代碼",
            "timestamp": "數據時間戳",
            "update_frequency": "更新頻率"
        }
    },
    "market_info": {  # 外部信息層
        "description": "市場資訊和新聞",
        "metadata_schema": {
            "info_type": ["news", "expert_opinion", "market_analysis", "policy"],
            "source": "信息來源",
            "publish_time": "發布時間",
            "relevance_score": "相關性分數"
        }
    },
    "interaction_knowledge": {  # 互動知識層
        "description": "交互積累的知識",
        "metadata_schema": {
            "knowledge_type": ["strategy_discussion", "risk_management", "market_insight"],
            "confidence_score": "可信度分數",
            "verification_status": "驗證狀態",
            "last_review_time": "最後審核時間"
        }
    }
}
```

### 3.2 元數據結構
```python
metadata_structure = {
    "common_fields": {
        "created_at": "創建時間",
        "updated_at": "更新時間",
        "source_type": "數據來源類型",
        "confidence_score": "可信度分數"
    },
    "specific_fields": {
        "market_data": {
            "symbol": "股票代碼",
            "timeframe": "時間週期",
            "model_version": "模型版本"
        },
        "market_info": {
            "news_source": "新聞來源",
            "author": "作者",
            "publish_time": "發布時間"
        },
        "interaction_knowledge": {
            "interaction_type": "交互類型",
            "validation_status": "驗證狀態",
            "user_feedback": "用戶反饋"
        }
    }
}
```

## 4. 知識更新機制

### 4.1 自動更新
- 定時數據同步
- 新聞實時抓取
- 模型結果更新
- 市場數據刷新

### 4.2 交互式更新
- 對話要點提取
- 經驗自動總結
- 知識點驗證
- 反饋整合

### 4.3 人工審核
- 知識質量評估
- 準確性驗證
- 時效性檢查
- 價值判斷

## 5. 檢索策略

### 5.1 多層檢索
```python
search_strategy = {
    "multi_collection_search": {
        "description": "跨集合並行檢索",
        "weights": {
            "market_data": 0.4,
            "market_info": 0.3,
            "interaction_knowledge": 0.3
        },
        "filters": {
            "time_relevance": "時間相關性過濾",
            "confidence_threshold": "可信度閾值",
            "source_priority": "來源優先級"
        }
    }
}
```

### 5.2 檢索優化
- 多層級並行檢索
- 層級間權重動態調整
- 上下文相關性增強
- 時效性加權排序

## 6. 系統監控與優化

### 6.1 性能監控
- 響應時間追踪
- 資源使用監控
- 檢索質量評估
- 用戶滿意度分析

### 6.2 知識質量管理
- 準確性評估
- 時效性監控
- 完整性檢查
- 價值評估

### 6.3 持續優化
- 檢索策略調整
- 向量化模型更新
- 知識結構優化
- 用戶體驗提升

## 7. 安全與合規

### 7.1 數據安全
- 敏感信息保護
- 訪問權限控制
- 數據加密存儲
- 操作日誌記錄

### 7.2 合規管理
- 法規遵從
- 免責聲明
- 風險提示
- 隱私保護

## 8. 開發建議

### 8.1 優先順序
1. 實現基礎的 handlers（查詢、嵌入、存儲）
2. 建立與 vector 模組的連接
3. 實現知識庫的基本功能
4. 開發 API 路由

### 8.2 注意事項
1. 確保代碼的可擴展性和可維護性
2. 實現完整的錯誤處理機制
3. 添加詳細的日誌記錄
4. 編寫完整的單元測試
5. 保持與現有系統的兼容性

### 8.3 開發流程
1. 先實現核心功能
2. 逐步添加高級特性
3. 持續進行測試和優化
4. 定期進行代碼審查
5. 及時更新文檔
