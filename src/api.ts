// api.ts

// 定義允許的 HTTP 方法
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS';

// 獲取當前域名作為API基礎URL
const getCurrentDomain = () => {
  // 在開發環境和生產環境都使用相對路徑
  return '';
};

// 設置 API 基礎 URL
const API_BASE_URL = getCurrentDomain();

// 添加調試日誌
console.log('Current hostname:', window.location.hostname);
console.log('Current API_BASE_URL:', API_BASE_URL);

export interface ApiResponse<T = any> {
  status?: string;
  data?: T;
  detail?: string;
}

export const sendToBackend = async <T = any>(
  endpoint: string, 
  data: any = null, 
  method: HttpMethod = 'GET'
): Promise<T> => {
  // 確保 endpoint 以 /api 開頭
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const apiEndpoint = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
  const url = `${API_BASE_URL}${apiEndpoint}`;
  
  console.log('Sending request to:', url);
  
  // 設置通用請求頭
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': window.location.origin,
    'Access-Control-Request-Method': method,
    'Access-Control-Request-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
  });

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include',
    mode: 'cors',
    cache: 'no-cache',
    redirect: 'follow'
  };

  console.log('Request config:', config);

  if (method !== 'GET' && data) {
    config.body = JSON.stringify(data);
  }

  try {
    // 先發送 OPTIONS 預檢請求
    if (method !== 'GET' && method !== 'HEAD') {
      const preflightResponse = await fetch(url, {
        method: 'OPTIONS',
        headers,
        mode: 'cors',
        credentials: 'include'
      });
      
      if (!preflightResponse.ok) {
        throw new Error(`Preflight request failed: ${preflightResponse.status}`);
      }
    }

    // 發送實際請求
    const response = await fetch(url, config);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    // 添加響應類型檢查
    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
  
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    // 檢查是否為HTML響應
    if (responseText.trim().toLowerCase().startsWith('<!doctype')) {
      console.error('Received HTML instead of JSON:', responseText.substring(0, 100));
      throw new Error('Received HTML response instead of JSON. This usually means the request was redirected to the frontend.');
    }
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error('JSON parse error:', e);
      console.error('Failed to parse response:', responseText);
      throw e;
    }
  } catch (error) {
    console.error('API request failed:', {
      url,
      method,
      error,
      headers: Object.fromEntries(headers)
    });
    throw error;
  }
}; 