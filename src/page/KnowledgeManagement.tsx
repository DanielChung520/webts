import React, { useState, useRef, useEffect } from 'react';
import { Layout, Typography, Table, Button, Space, Tag, Input, message, Modal, Form, Upload, Tabs, Select, Row, Col } from 'antd';
import { SearchOutlined, PlusOutlined, UploadOutlined, InboxOutlined, CloudUploadOutlined, SaveOutlined, EyeOutlined, EditOutlined, DeleteOutlined, ClusterOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';
import { dbManager } from '../utils/indexedDBManager';
import type { CacheDocument } from '../utils/indexedDBManager';
import { useAuth } from '../contexts/AuthContext';
import styled from '@emotion/styled';
import './KnowledgeManagement.css';

const { Content } = Layout;
const { Title } = Typography;
const { TabPane } = Tabs;

// 添加自定義樣式的表格組件
const StyledTable = styled(Table)<{ record?: any }>`
  .ant-table-row {
    transition: all 0.3s ease;
    cursor: pointer;
  }
  .ant-table-row:hover {
    transform: scale(1.02);
    background-color: #f0f7ff !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 1;
    position: relative;
  }
`;

interface RoleOption {
  label: string;
  value: string;
  description?: string;
}

interface DocumentFormData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  role?: string;
}

const KnowledgeManagement: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});
  const [cachedFiles, setCachedFiles] = useState<CacheDocument[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedCatalog, setSelectedCatalog] = useState<string>('');
  const [activeKey, setActiveKey] = useState('1');
  const [editingDocument, setEditingDocument] = useState<CacheDocument | null>(null);
  const { userInfo } = useAuth();
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加載角色列表
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        console.log('正在獲取角色列表...');
        const response = await axios.get('/api/ai/roles');
        console.log('角色列表響應:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          const roles = response.data.map((role: any) => ({
            label: role.role_name,  // 使用 role_name 作為顯示名稱
            value: role.role_name,
            description: role.description || ''
          }));
          console.log('處理後的角色列表:', roles);
          // 添加默認角色
          roles.push({ label: '默認', value: 'default', description: '默認角色' });
          setRoleOptions(roles);
          setSelectedRole(userInfo?.role || 'default');
        } else {
          throw new Error('角色數據格式不正確');
        }
      } catch (error) {
        console.error('獲取角色列表失敗:', error);
        message.error('獲取角色列表失敗');
        // 設置默認角色
        setRoleOptions([{ label: '默認', value: 'default', description: '默認角色' }]);
        setSelectedRole('default');
      }
    };

    fetchRoles();
  }, [userInfo]);

  // 加載暫存文件列表
  const loadCachedFiles = async () => {
    try {
      const files = await dbManager.getAllDocuments();
      setCachedFiles(files);
    } catch (error) {
      message.error('加載暫存文件失敗');
    }
  };

  useEffect(() => {
    loadCachedFiles();
  }, []);

  // 從 localStorage 加載表單數據
  useEffect(() => {
    const savedFormData = localStorage.getItem('knowledgeFormData');
    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData);
      if (isModalVisible) {  // 只在模態框顯示時設置表單值
        form.setFieldsValue(parsedData);
      }
    }
  }, [form, isModalVisible]);  // 添加 isModalVisible 作為依賴

  // 監聽表單變化並保存到 localStorage
  const handleFormChange = () => {
    if (isModalVisible) {  // 只在模態框顯示時保存表單數據
      const formData = form.getFieldsValue();
      localStorage.setItem('knowledgeFormData', JSON.stringify(formData));
    }
  };

  // 清除本地暫存
  const clearLocalStorage = () => {
    localStorage.removeItem('knowledgeFormData');
    form.resetFields();
  };

  // 處理角色變更
  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    if (isModalVisible) {  // 只在模態框顯示時設置表單值
      form.setFieldValue('role', value);
    }
  };

  // 處理類別變更
  const handleCatalogChange = (value: string) => {
    setSelectedCatalog(value);
    if (isModalVisible) {  // 只在模態框顯示時設置表單值
      form.setFieldValue('catalog', value);
    }
  };

  // 處理文件選擇
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFile(file);
    
    // 自動填充文件名到標題
    form.setFieldsValue({
      title: file.name.replace(/\.[^/.]+$/, ''),
      role: selectedRole,
      catalog: selectedCatalog,
      category: '',  // 清空分類
      tags: '',      // 清空標籤
      description: '' // 清空描述
    });
    
    // 顯示模態框
    setIsModalVisible(true);
  };

  // 添加標籤處理函數
  const processTags = (tagString: string): string[] => {
    if (!tagString) return [];
    // 將所有支持的分隔符號替換為統一的分隔符號（逗號）
    const normalizedString = tagString
      .replace(/[，、；]/g, ',')  // 替換中文分隔符號
      .replace(/\s*,\s*/g, ',');  // 移除分隔符號周圍的空白

    // 分割並過濾空標籤
    return normalizedString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  };

  // 添加編輯處理函數
  const handleEdit = (record: CacheDocument) => {
    setEditingDocument(record);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      category: record.category,
      catalog: record.catalog,
      tags: record.tags.join('，'),
    });
    setSelectedFile(record.file);
    setIsModalVisible(true);
  };

  // 修改表單提交處理
  const handleFormSubmit = async () => {
    if (!selectedFile) {
      message.error('請先選擇文件');
      return;
    }

    try {
      const formData = await form.validateFields();
      console.log('表單數據:', formData);
      
      // 驗證必要字段
      if (!formData.title || !formData.description) {
        message.error('標題和描述為必填項');
        return;
      }

      // 驗證文件類型
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !['pdf', 'doc', 'docx', 'txt'].includes(fileExtension)) {
        message.error('不支持的文件類型，僅支持 PDF、DOC、DOCX、TXT 格式');
        return;
      }
      
      // 處理標籤
      const processedTags = processTags(formData.tags);
      
      const documentData = {
        title: formData.title,
        description: formData.description,
        category: formData.category || '',
        catalog: formData.catalog || '',
        tags: processedTags,
        file: selectedFile,
        fileName: selectedFile.name,
        role: selectedRole
      };

      if (editingDocument?.id) {
        // 更新現有文檔
        await dbManager.updateDocument(editingDocument.id, documentData);
        message.success('文件已更新');
      } else {
        // 添加新文檔
        await dbManager.addDocument(documentData);
        message.success('文件已保存到暫存區');
      }

      console.log('文件已保存到暫存區');
      await loadCachedFiles();
      setIsModalVisible(false);
      form.resetFields();
      setSelectedFile(null);
      setEditingDocument(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // 切換到暫存文件標籤
      setActiveKey('2');
    } catch (error) {
      console.error('保存到暫存區失敗:', error);
      if (error instanceof Error) {
        message.error('保存失敗: ' + error.message);
      } else {
        message.error('保存到暫存區失敗');
      }
    }
  };

  // 修改模態框取消處理
  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedFile(null);
    setEditingDocument(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    clearLocalStorage();
    form.resetFields();
  };

  // 上傳到服務器
  const handleUploadToServer = async (cachedDoc: CacheDocument) => {
    try {
      // 檢查知識庫類別
      if (!cachedDoc.catalog || cachedDoc.catalog.trim() === '') {
        message.error('請先選擇知識庫類別');
        return;
      }

      setUploadingFiles(prev => ({ ...prev, [cachedDoc.id!]: true }));
      console.log('準備上傳文件:', cachedDoc);
      
      // 驗證必要字段
      if (!cachedDoc.title || !cachedDoc.description) {
        throw new Error('標題和描述為必填項');
      }

      // 驗證文件對象
      if (!cachedDoc.file || !(cachedDoc.file instanceof File)) {
        throw new Error('無效的文件對象');
      }

      const formData = new FormData();
      formData.append('file', cachedDoc.file);
      formData.append('title', cachedDoc.title);
      formData.append('description', cachedDoc.description);
      formData.append('category', cachedDoc.category || '');
      formData.append('catalog', cachedDoc.catalog || '');  // 使用 cachedDoc 中的 catalog
      formData.append('tags', JSON.stringify(cachedDoc.tags || []));
      formData.append('role', cachedDoc.role || userInfo?.role || 'default');
      formData.append('user_id', userInfo?.id || '1');

      console.log('FormData 內容:');
      Array.from(formData.entries()).forEach(([key, value]) => {
        console.log(`${key}:`, value instanceof File ? value.name : value);
      });

      try {
        const response = await axios.post('/api/rag/knowledge/add', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        console.log('上傳響應:', response.data);

        if (response.data.status === 'success') {
          message.success('文件上傳成功');
          if (cachedDoc.id) {
            await dbManager.deleteDocument(cachedDoc.id);
            await loadCachedFiles();
            // 刷新已上傳文件列表
            await loadDocuments();
          }
        } else {
          throw new Error(response.data.error || '上傳失敗');
        }
      } catch (error: any) {
        console.error('上傳請求失敗:', error);
        if (error.response) {
          console.error('錯誤響應數據:', error.response.data);
          console.error('錯誤狀態:', error.response.status);
          throw new Error(error.response.data.error || `上傳失敗 (${error.response.status})`);
        } else if (error.request) {
          console.error('請求未收到響應');
          throw new Error('服務器未響應');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('上傳處理失敗:', error);
      message.error('文件上傳失敗: ' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setUploadingFiles(prev => ({ ...prev, [cachedDoc.id!]: false }));
    }
  };

  // 加載文檔列表
  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/rag/knowledge/search', {
        params: {
          role: selectedRole
        }
      });
      
      if (response.data.status === 'success') {
        setDocuments(response.data.documents);
        // 如果返回了目錄，更新目錄
        if (response.data.catalog) {
          setSelectedCatalog(response.data.catalog);
        }
      } else {
        message.error('加載文檔列表失敗');
      }
    } catch (error) {
      console.error('加載文檔列表失敗:', error);
      message.error('加載文檔列表失敗');
    } finally {
      setLoading(false);
    }
  };

  // 當角色改變時重新加載文檔列表
  useEffect(() => {
    if (selectedRole) {
      loadDocuments();
    }
  }, [selectedRole]);

  // 定義已上傳文件的表格列
  const uploadedColumns = [
    {
      title: '標題',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '分類',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '標籤',
      key: 'tags',
      render: (record: any) => (
        <>
          {record.tags.map((tag: string) => (
            <Tag color="blue" key={tag}>
              {tag}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '狀態',
      key: 'status',
      render: (record: any) => (
        <Tag color={record.status === 'processing' ? 'processing' : 'success'}>
          {record.status === 'processing' ? '處理中' : '完成'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (record: any) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            title="查看"
            onClick={() => message.info('查看功能開發中')}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            title="編輯"
            onClick={() => message.info('編輯功能開發中')}
          />
          <Button
            type="text"
            icon={<ClusterOutlined />}
            title="向量化"
            onClick={() => {
              // 檢查文檔狀態
              if (record.status === 'processing') {
                message.warning('文檔正在處理中');
                return;
              }
              // 觸發向量化處理
              handleProcessDocument(record.id);
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            title="刪除"
            onClick={() => message.info('刪除功能開發中')}
          />
        </Space>
      ),
    },
  ];

  // 添加處理文檔的函數
  const handleProcessDocument = async (docId: string) => {
    try {
      const response = await axios.post(`/api/rag/knowledge/process/${docId}`, null, {
        params: { role: selectedRole }
      });
      console.log('處理文檔響應:', response);
      if (response.data.status === 'success') {
        message.success('文檔處理已啟動');
        // 重新加載文檔列表
        loadDocuments();
      } else {
        message.error(response.data.error || '處理失敗');
      }
    } catch (error: any) {
      message.error('處理請求失敗: ' + (error.response?.data?.error || error.message));
    }
  };

  // 暫存文件表格列定義
  const cachedColumns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
    },
    {
      title: '標題',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '分類',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '知識庫類別',
      dataIndex: 'catalog',
      key: 'catalog',
      render: (catalog: string) => (
        <Tag color="green">{catalog || '默認'}</Tag>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleOption = roleOptions.find(opt => opt.value === role);
        return <Tag color="blue">{roleOption?.label || role}</Tag>;
      },
    },
    {
      title: '標籤',
      key: 'tags',
      render: (record: CacheDocument) => (
        <>
          {record.tags.map(tag => (
            <Tag color="blue" key={tag}>
              {tag}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (record: CacheDocument) => (
        <Space>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={() => handleUploadToServer(record)}
            loading={uploadingFiles[record.id!]}
          >
            上傳
          </Button>
          <Button
            danger
            onClick={() => record.id && dbManager.deleteDocument(record.id).then(loadCachedFiles)}
          >
            刪除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: '24px', background: '#fff' }}>
      <Content>
        <div style={{ marginBottom: 24 }}>
          {/* <Title level={2}>知識庫管理</Title> */}
          
          <div style={{ marginBottom: 16, background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={22}>
                <Input
                  placeholder="搜索文檔"
                  prefix={<SearchOutlined />}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={2}>
                <Button type="primary" block>搜索</Button>
              </Col>
            </Row>
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Form.Item label="文檔角色" style={{ marginBottom: 0 }}>
                  <Select
                    value={selectedRole}
                    onChange={handleRoleChange}
                    options={roleOptions}
                    style={{ width: '100%' }}
                    placeholder="請選擇文檔角色"
                  />
                </Form.Item>
              </Col>
              <Col span={16} style={{ textAlign: 'right' }}>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    if (!selectedRole) {
                      message.warning('請先選擇文檔角色');
                      return;
                    }
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                >
                  選擇文件
                </Button>
              </Col>
            </Row>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt"
              title="選擇要上傳的文件"
              aria-label="選擇文件"
            />
          </div>
        </div>

        <Tabs 
          activeKey={activeKey} 
          onChange={setActiveKey} 
          items={[
            {
              key: '1',
              label: '已上傳文件',
              children: (
                <Table
                  className="hover-table"
                  columns={uploadedColumns}
                  dataSource={documents}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    total: documents.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                  }}
                />
              )
            },
            {
              key: '2',
              label: '暫存文件',
              children: (
                <Table
                  className="hover-table"
                  columns={cachedColumns}
                  dataSource={cachedFiles}
                  rowKey="id"
                  pagination={false}
                  onRow={(record: CacheDocument) => ({
                    onDoubleClick: () => handleEdit(record),
                  })}
                />
              )
            }
          ]} 
        />

        <Modal
          title={editingDocument ? "編輯文檔" : "新增文檔"}
          open={isModalVisible}
          onCancel={handleModalCancel}
          footer={
            <Row justify="end">
              <Space>
                <Button key="cancel" onClick={handleModalCancel}>
                  取消
                </Button>
                <Button key="submit" type="primary" onClick={handleFormSubmit}>
                  {editingDocument ? "更新" : "保存到暫存區"}
                </Button>
              </Space>
            </Row>
          }
          width={600}
          maskClosable={false}
        >
          {selectedFile && (
            <div style={{ marginBottom: 16 }}>
              <Tag color="blue" icon={<UploadOutlined />}>
                已選擇文件：{selectedFile.name}
              </Tag>
            </div>
          )}
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleFormChange}
            initialValues={{
              role: selectedRole,
              catalog: ''
            }}
          >
            <Form.Item
              name="title"
              label="文檔標題"
              rules={[{ required: true, message: '請輸入文檔標題' }]}
            >
              <Input placeholder="請輸入文檔標題" />
            </Form.Item>

            <Form.Item
              name="description"
              label="文檔描述"
              rules={[{ required: true, message: '請輸入文檔描述' }]}
            >
              <Input.TextArea rows={4} placeholder="請輸入文檔描述" />
            </Form.Item>

            <Form.Item
              name="catalog"
              label="知識庫類別"
              rules={[{ required: true, message: '請輸入知識庫類別' }]}
            >
              <Input placeholder="請輸入知識庫類別" />
            </Form.Item>

            <Form.Item
              name="category"
              label="文檔分類"
              rules={[{ required: true, message: '請選擇文檔分類' }]}
            >
              <Input placeholder="請輸入文檔分類" />
            </Form.Item>

            <Form.Item
              name="tags"
              label="標籤（支持使用「，」、「、」、「,」、「；」等符號分隔）"
              rules={[{ required: true, message: '請輸入標籤' }]}
            >
              <Input placeholder="請輸入標籤，可使用多種符號分隔" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default KnowledgeManagement; 