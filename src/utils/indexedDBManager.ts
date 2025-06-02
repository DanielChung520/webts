import { message } from 'antd';

export interface CacheDocument {
  id?: string;
  title: string;
  description: string;
  category?: string;
  catalog?: string;
  tags: string[];
  file: File;
  fileName: string;
  role?: string;
}

export class IndexedDBManager {
  private dbName = 'knowledgeDB';
  private storeName = 'documents';
  private version = 1;

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async addDocument(document: Omit<CacheDocument, 'id'>): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.add(document);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error('添加文檔失敗:', error);
      throw error;
    }
  }

  async getDocument(id: string): Promise<CacheDocument | undefined> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject('獲取暫存文件失敗');
      };
    });
  }

  async getAllDocuments(): Promise<CacheDocument[]> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('獲取所有文檔失敗:', error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error('刪除文檔失敗:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
        message.success('所有暫存文件已清除');
      };

      request.onerror = () => {
        reject('清除暫存文件失敗');
      };
    });
  }

  async updateDocument(id: string, document: Omit<CacheDocument, 'id'>): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.put({ ...document, id });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error('更新文檔失敗:', error);
      throw error;
    }
  }
}

export const dbManager = new IndexedDBManager(); 