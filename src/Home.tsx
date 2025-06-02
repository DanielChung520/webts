import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Radio, Select, Row, Col, message, Spin, Card, Avatar, Dropdown, Menu, Modal, Input, Popconfirm, MenuProps } from 'antd';
import { PlusOutlined, AppstoreOutlined, BarsOutlined, MoreOutlined, DeleteOutlined, EditOutlined, SettingOutlined, RestOutlined, DownOutlined } from '@ant-design/icons';
import Header from './Header';
import { SelectProps } from 'antd/lib/select';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from './assets/avatars/avatar-default.png';
import SystemPrompt from './page/SystemPrompt';
import { sendToBackend } from './api';
import type { ApiResponse } from './api';  // 如果你導出了這個類型

// 定義 MenuInfo 類型
type MenuInfo = Parameters<Required<MenuProps>['onClick']>[0];

const { Title } = Typography;

interface Topic {
  id: number;
  role_name: string;
  description: string;
  avatar?: string;
  systemPrompt?: {
    roleJob: string;
  };
  timeStamp?: string;
  activate: number;
}

const STORAGE_KEY = 'topics_cache';

// 生成隨機十六進制顏色
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const getColorFromName = (name: string) => {
  const colors = ['#3A7BFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getRandomLightColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 30) + 70; // 70-100% 飽和度
  const lightness = Math.floor(Math.random() * 20) + 80; // 80-100% 亮度
  return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`; // 添加透明度 0.8
};

const TopicCard = React.memo(({ 
  topic, 
  onDelete, 
  onTitleChange,
  className = '', // 默認值
}: { 
  topic: Topic; 
  onDelete: (id: number) => void; 
  onTitleChange: (id: number, newTitle: string) => void;
  className?: string; // 可選類名
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState(topic.role_name);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [cardColor] = useState(getRandomLightColor());

  React.useEffect(() => {
    setNewTitle(topic.role_name);
  }, [topic.role_name]);

  // 點擊卡片時導航到 AiMain
  const handleCardClick = useCallback(() => {
    if (!isDeleting) {  // 只有在不是刪除操作時才導航
      navigate('/ai-main', { 
        state: { 
          roleName: topic.role_name,
          topicId: topic.id,
          mode: 'edit'
        } 
      });
    }
  }, [topic.id, topic.role_name, navigate, isDeleting]);

  // 點擊設置圖標時顯示 SystemPrompt 視窗
  const handleSettingsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    setShowSystemPrompt(true);
  }, []);

  // 處理刪除確認
  const handleDeleteConfirm = useCallback(() => {
    setIsDeleting(true);  // 設置刪除狀態
    onDelete(topic.id);
    setIsDeleting(false);  // 重置刪除狀態
  }, [topic.id, onDelete]);

  const handleTitleChange = useCallback(() => {
    if (newTitle !== topic.role_name) {
      onTitleChange(topic.id, newTitle);
    }
    setIsModalVisible(false);
  }, [topic.id, topic.role_name, newTitle, onTitleChange]);

  const handleCancel = useCallback(() => {
    setIsModalVisible(false);
    setNewTitle(topic.role_name);
  }, [topic.role_name]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  }, []);

  return (
    <>
      <Card
        className={`project-card ${className}`}
        style={{
          backgroundColor: cardColor,
          position: 'relative',
          cursor: 'pointer',
          overflow: 'hidden'
        }}
        bodyStyle={{
          padding: className.includes('topic-card-list') ? '0' : '16px 16px 8px 16px',
          height: '100%'
        }}
        onClick={handleCardClick}
      >
        <div style={{ 
          display: 'flex', 
          height: '100%',
          flexDirection: className.includes('topic-card-list') ? 'row' : 'column',
          alignItems: className.includes('topic-card-list') ? 'center' : 'flex-start',
          gap: className.includes('topic-card-list') ? '24px' : '16px',
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative'
        }}>
          {/* 第一部分：頭像和標題區域 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '16px',
            flex: className.includes('topic-card-list') ? '0 0 25%' : 'none',
            minWidth: className.includes('topic-card-list') ? '280px' : 'auto',
            boxSizing: 'border-box',
            marginBottom: className.includes('topic-card-list') ? 0 : '8px'
          }}>
            <Avatar 
              src={topic.avatar || defaultAvatar} 
              style={{ 
                width: '40px',
                height: '40px',
                flexShrink: 0
              }}
            />
            <div style={{ 
              flex: 1, 
              overflow: 'hidden',
              minWidth: 0
            }}>
              <div style={{ 
                fontWeight: 'bold',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '18px'
              }}>{topic.role_name}</div>
              <div style={{ 
                color: '#666', 
                marginTop: '4px',
                fontSize: '12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {topic.systemPrompt?.roleJob || '未指定定位'}
              </div>
            </div>
          </div>

          {/* 第二部分：描述文字 */}
          <div 
            className="description" 
            style={{ 
              color: '#333',
              flex: className.includes('topic-card-list') ? '0 0 66.66%' : 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: className.includes('topic-card-list') ? 'nowrap' : 'pre-wrap',
              display: className.includes('topic-card-list') ? 'block' : '-webkit-box',
              WebkitLineClamp: className.includes('topic-card-list') ? 'none' : 3,
              WebkitBoxOrient: 'vertical',
              minWidth: className.includes('topic-card-list') ? '400px' : 'auto',
              boxSizing: 'border-box',
              padding: className.includes('topic-card-list') ? '0 16px' : '0',
              paddingBottom: className.includes('topic-card-list') ? 0 : '40px'
            }}
          >
            {topic.description}
          </div>

          {/* 第三部分：按鈕組 */}
          <div style={{ 
            display: 'flex', 
            gap: '5px',
            justifyContent: 'flex-end',
            alignItems: 'center',
            position: 'absolute',
            bottom: className.includes('topic-card-list') ? '8px' : '4px',
            right: className.includes('topic-card-list') ? '8px' : '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            padding: '4px'
          }}>
            <Button 
              icon={<SettingOutlined />}
              onClick={handleSettingsClick}
              style={{ color: '#1890ff',height: '32px' }}
            />
            <Popconfirm
              title="確定要刪除這個角色嗎？"
              onConfirm={handleDeleteConfirm}
              onCancel={() => setIsDeleting(false)}
            >
              <Button 
                icon={<DeleteOutlined />}
                style={{ color: '#ff4d4f',height: '32px'  }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setIsDeleting(true);
                }}
              />
            </Popconfirm>
          </div>
        </div>
      </Card>

      {/* 編輯標題的 Modal */}
      <Modal
        title="編輯卡片標題"
        open={isModalVisible}
        onOk={handleTitleChange}
        onCancel={handleCancel}
        destroyOnHidden
      >
        <Input
          value={newTitle}
          onChange={handleInputChange}
          placeholder="請輸入新的標題"
        />
      </Modal>

      {/* SystemPrompt 視窗 */}
      <SystemPrompt
        visible={showSystemPrompt}
        onClose={() => setShowSystemPrompt(false)}
        mode="edit"
        topicId={topic.id}
        roleName={topic.role_name}
        setRoleName={(name) => {
          // 如果需要更新角色名稱，可以在這裡處理
          console.log('更新角色名稱:', name);
        }}
      />
    </>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.topic.id === nextProps.topic.id &&
    prevProps.topic.role_name === nextProps.topic.role_name &&
    prevProps.topic.description === nextProps.topic.description &&
    prevProps.topic.avatar === nextProps.topic.avatar &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onTitleChange === nextProps.onTitleChange &&
    prevProps.className === nextProps.className
  );
});

const Home: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('讀取本地緩存失敗:', error);
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(() => {
    try {
      const cached = localStorage.getItem(`${STORAGE_KEY}_time`);
      return cached ? parseInt(cached) : 0;
    } catch (error) {
      console.error('讀取本地緩存時間失敗:', error);
      return 0;
    }
  });
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [currentRoleName, setCurrentRoleName] = useState('');
  const [currentTopicId, setCurrentTopicId] = useState<number | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isRecycleBinVisible, setIsRecycleBinVisible] = useState(false);
  const [deletedRoles, setDeletedRoles] = useState<Topic[]>([]);
  const navigate = useNavigate();

  console.log('初始狀態:', showSystemPrompt); // 應輸出 false

  const saveToLocalStorage = useCallback((data: Topic[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(`${STORAGE_KEY}_time`, Date.now().toString());
    } catch (error) {
      console.error('保存到本地緩存失敗:', error);
    }
  }, []);

  // 同步本地存儲和後端數據
  const syncLocalStorageWithBackend = useCallback(async () => {
    try {
      console.log('開始從後端獲取數據...');
      const backendData = await sendToBackend('/api/ai/roles', null, 'GET');
      console.log('後端返回的原始數據:', backendData);
      
      if (!Array.isArray(backendData)) {
        console.error('後端數據格式錯誤，期望數組但收到:', typeof backendData);
        throw new Error('後端數據格式錯誤');
      }

      console.log('後端數據數量:', backendData.length);

      // 2. 將後端數據轉換為前端格式
      const mappedBackendData = backendData.map((item, index) => ({
        id: index,
        role_name: item.role_name,
        description: item.description,
        avatar: item.avatar || undefined,
        systemPrompt: item.systemPrompt || undefined,
        timeStamp: item.timeStamp || '',
        activate: item.activate
      }));

      // 3. 獲取本地存儲數據
      const localStorageData = (() => {
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          return cached ? JSON.parse(cached) : [];
        } catch (error) {
          console.error('讀取本地緩存失敗:', error);
          return [];
        }
      })();

      // 4. 比較並同步數據
      const activeBackendData = mappedBackendData.filter(item => item.activate === 1);
      
      // 如果數據不一致，使用後端數據更新本地存儲
      if (JSON.stringify(activeBackendData) !== JSON.stringify(localStorageData)) {
        console.log('檢測到數據不一致，正在同步...');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeBackendData));
        localStorage.setItem(`${STORAGE_KEY}_time`, Date.now().toString());
        setTopics(activeBackendData);
        setLastSyncTime(Date.now());
      }

      return activeBackendData;
    } catch (error) {
      console.error('同步數據失敗:', error);
      message.error('同步數據失敗');
      return null;
    }
  }, []);

  // 初始化加載
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // 同步數據
        const syncedData = await syncLocalStorageWithBackend();
        if (syncedData) {
          setTopics(syncedData);
        }
      } catch (error) {
        console.error('初始化數據失敗:', error);
        message.error('初始化數據失敗');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [syncLocalStorageWithBackend]);

  // 定期同步檢查（每5分鐘）
  useEffect(() => {
    const syncInterval = setInterval(() => {
      syncLocalStorageWithBackend();
    }, 5 * 60 * 1000);

    return () => clearInterval(syncInterval);
  }, [syncLocalStorageWithBackend]);

  const fetchTopics = useCallback(async (force = false) => {
    const now = Date.now();
    const shouldSync = force || now - lastSyncTime > 5 * 60 * 1000; // 5分鐘同步一次

    if (!shouldSync && topics.length > 0) {
      return;
    }

    setLoading(true);
    try {
      const syncedData = await syncLocalStorageWithBackend();
      if (syncedData) {
        setTopics(syncedData);
      }
    } catch (error) {
      console.error('獲取角色數據失敗:', error);
      message.error('獲取角色列表失敗');
    } finally {
      setLoading(false);
    }
  }, [lastSyncTime, topics.length, syncLocalStorageWithBackend]);

  useEffect(() => {
    console.log('初始化加載或刷新'); // 調試日誌
    if (topics.length === 0) {
      fetchTopics(true);
    } else {
      fetchTopics();
    }
  }, []);

  const handleTitleChange = useCallback(async (id: number, newTitle: string) => {
    try {
      setTopics(prevTopics => {
        const newTopics = prevTopics.map(topic => 
          topic.id === id ? { ...topic, role_name: newTitle } : topic
        );
        saveToLocalStorage(newTopics);
        return newTopics;
      });

      const data = await sendToBackend<ApiResponse>(
        `/topics/${id}`, 
        { role_name: newTitle }, 
        'PUT'
      );
      
      if (data.status === 'success') {
        message.success('主題修改成功');
        setLastSyncTime(Date.now());
      } else {
        message.error(data.detail || '修改失敗');
      }
    } catch (error) {
      console.error('更新主題失敗:', error);
      message.error('修改失敗');
    }
  }, [saveToLocalStorage]);

  // 獲取已刪除的角色
  const fetchDeletedRoles = useCallback(async () => {
    try {
      const data = await sendToBackend('/ai/roles?include_inactive=true', null, 'GET');
      if (Array.isArray(data)) {
        const inactiveRoles = data.filter(role => role.activate === 0)
          .map((item, index) => ({
          id: index,
          role_name: item.role_name,
          description: item.description,
          avatar: item.avatar || undefined,
          systemPrompt: item.systemPrompt || undefined,
          timeStamp: item.timeStamp,
          activate: item.activate
        }));
        setDeletedRoles(inactiveRoles);
      }
    } catch (error) {
      console.error('獲取已刪除角色失敗:', error);
      message.error('獲取已刪除角色失敗');
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    try {
      const roleName = topics.find(t => t.id === id)?.role_name;
      if (!roleName) return;

      await sendToBackend(
        `/api/ai/ai_roles/${encodeURIComponent(roleName)}`, 
        null, 
        'DELETE'
      );

      // 2. 更新本地狀態（將該角色的 activate 設為 0）
      const updatedTopics = topics.map(topic => 
        topic.id === id 
          ? { ...topic, activate: 0 }
          : topic
      );
      
      // 3. 更新 UI（只顯示 activate = 1 的角色）
      const activeTopics = updatedTopics.filter(topic => topic.activate === 1);
      setTopics(activeTopics);
      
      // 4. 更新本地存儲
      saveToLocalStorage(activeTopics);
      
      message.success('刪除成功');
      
      // 5. 如果回收站是打開的，重新獲取已刪除的角色列表
      if (isRecycleBinVisible) {
        fetchDeletedRoles();
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      message.error('刪除失敗');
      fetchTopics(true);
    }
  }, [topics, saveToLocalStorage, fetchDeletedRoles, isRecycleBinVisible]);

  // 編輯項目（點擊卡片或編輯配置時觸發）
  const handleEdit = (topicId: number, roleName: string) => {
    setCurrentTopicId(topicId);
    setCurrentRoleName(roleName);
    setShowSystemPrompt(true);
  };

  // 新增項目
  const handleAddNew = () => {
    navigate('/ai-main', { state: { mode: 'new' } });
  };

  // 強制重新獲取數據
  const refreshTopics = useCallback(() => {
    console.log('強制刷新數據'); // 調試日誌
    fetchTopics(true);
  }, [fetchTopics]);

  // 修改 SystemPrompt 視窗的處理
  const handleSystemPromptClose = useCallback(() => {
    setShowSystemPrompt(false);
    refreshTopics(); // 關閉視窗時重新獲取數據
  }, [refreshTopics]);

  // 修改 SystemPrompt 保存成功的處理
  const handleSystemPromptSave = useCallback((newRoleName: string) => {
    refreshTopics(); // 保存成功時重新獲取數據
  }, [refreshTopics]);

  // 動態類名
  const getCardClassName = () => {
    return viewMode === 'list' ? 'topic-card-list' : '';
  };

  const renderContent = useMemo(() => {
    if (loading && topics.length === 0) {
      return <Spin tip="加載中..." style={{ padding: '50px', textAlign: 'center' }} />;
    }

    if (topics.length === 0) {
      return <div style={{ textAlign: 'center', padding: '20px' }}>暫無數據</div>;
    }

    return viewMode === 'grid' ? (
      <div 
        style={{ 
          marginTop: '50px',
          padding: '0 5px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 300px))',
          gap: '24px',
          justifyContent: 'center',
          width: '100%',
          height: 'calc(100vh - 200px)',  // 減去 header 和其他元素的高度
          overflowY: 'auto',              // 允許垂直滾動
          overflowX: 'hidden'             // 防止水平滾動
        }}
      >
        {topics.map(topic => (
          <TopicCard
            key={topic.id}
            topic={topic}
            onDelete={handleDelete}
            onTitleChange={handleTitleChange}
            className={getCardClassName()}
          />
        ))}
      </div>
    ) : (
      <div style={{ 
        marginTop: '50px',
        padding: '0 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
        height: 'calc(100vh - 200px)',  // 減去 header 和其他元素的高度
        overflowY: 'auto',              // 允許垂直滾動
        overflowX: 'hidden'             // 防止水平滾動
      }}>
        {topics.map(topic => (
          <TopicCard
            key={topic.id}
            topic={topic}
            onDelete={handleDelete}
            onTitleChange={handleTitleChange}
            className={getCardClassName()}
          />
        ))}
      </div>
    );
  }, [loading, topics, viewMode, handleDelete, handleTitleChange]);

  const sortOptions: SelectProps['options'] = [
    { value: 'timeStamp', label: '更新時間' },
    { value: 'role_name', label: '角色名稱' },
    { value: 'roleJob', label: '角色定位' },
  ];

  const sortTopics = useCallback((topics: Topic[], sortType: string) => {
    return [...topics].sort((a, b) => {
      switch (sortType) {
        case 'timeStamp':
          const timeA = a.timeStamp || '';
          const timeB = b.timeStamp || '';
          return timeB.localeCompare(timeA); // 降序排列，最新的在前面
        
        case 'role_name':
          return (a.role_name || '').localeCompare(b.role_name || '');
        
        case 'roleJob':
          const jobA = a.systemPrompt?.roleJob || '';
          const jobB = b.systemPrompt?.roleJob || '';
          return jobA.localeCompare(jobB);
        
        default:
          return 0;
      }
    });
  }, []);

  const [sortType, setSortType] = useState('timeStamp');

  useEffect(() => {
    setTopics(prevTopics => sortTopics(prevTopics, sortType));
  }, [sortType, sortTopics]);

  // 恢復已刪除的角色
  const handleRestore = async (roleName: string) => {
    try {
      await sendToBackend(
        `/ai/ai_roles/${encodeURIComponent(roleName)}`,
        { activate: 1 },
        'PUT'
      );

        message.success('角色恢復成功');
      fetchDeletedRoles();
      fetchTopics(true);
    } catch (error) {
      console.error('恢復角色失敗:', error);
      message.error('恢復角色失敗');
    }
  };

  // 回收站對話框內容
  const RecycleBinContent = () => (
    <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
      {deletedRoles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>回收站是空的</div>
      ) : (
        deletedRoles.map(role => (
          <Card 
            key={role.id}
            style={{ marginBottom: '10px' }}
            size="small"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Avatar src={role.avatar || defaultAvatar} size="small" />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{role.role_name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    刪除時間: {role.timeStamp}
                  </div>
                </div>
              </div>
              <div>
                <Button 
                  type="link" 
                  onClick={() => handleRestore(role.role_name)}
                >
                  恢復
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  const headerButtons = [
    <Button 
      key="add" 
      type="primary" 
      icon={<PlusOutlined />} 
      style={{ borderRadius: '20px', padding: '0 20px' ,height: '35px'}}
      onClick={handleAddNew}
    >
      新增項目
    </Button>,
    <Radio.Group 
      key="view" 
      value={viewMode}
      onChange={(e) => setViewMode(e.target.value)}
      buttonStyle="solid"
    >
      <Radio.Button value="grid">
        <AppstoreOutlined /> 網格
      </Radio.Button>
      <Radio.Button value="list">
        <BarsOutlined /> 列表
      </Radio.Button>
    </Radio.Group>,
    <Select
      key="sort"
      value={sortType}
      style={{ width: 120 }}
      options={sortOptions}
      onChange={(value) => {
        setSortType(value);
      }}
    />,
    <Button
      key="recycleBin"
      icon={<RestOutlined />}
      onClick={() => {
        fetchDeletedRoles();
        setIsRecycleBinVisible(true);
      }}
      style={{ marginLeft: '2px' ,height: '30px'}}
    />
  ];

  return (
    <div className="home-container">
      <div className="header">
        <Header 
          title={
            <Title level={1} style={{ 
              color: 'white', 
              fontWeight: 'bold',
              margin: 2
            }}>
              企業AI咨詢平台
            </Title>
          } 
          buttons={headerButtons} 
        />
      </div>

      {renderContent}

      {/* SystemPrompt 浮動視窗 */}
      <SystemPrompt 
        visible={showSystemPrompt}
        onClose={handleSystemPromptClose}
        mode="edit"
        topicId={currentTopicId}
        roleName={currentRoleName}
        setRoleName={setCurrentRoleName}
        onSaveSuccess={handleSystemPromptSave}
      />

      {/* 回收站對話框 */}
      <Modal
        title="回收站"
        open={isRecycleBinVisible}
        onCancel={() => setIsRecycleBinVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsRecycleBinVisible(false)}>
            關閉
          </Button>
        ]}
        width={600}
      >
        <RecycleBinContent />
      </Modal>
    </div>
  );
};

export default React.memo(Home);