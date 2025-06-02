/**
 * 通用后端请求函数
 */
export async function sendToBackend<T>(
  endpoint: string,
  data: any = null,
  method: 'GET' | 'POST' = 'POST'
): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method === 'POST' && data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
} 