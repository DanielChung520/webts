import React, { useState, useEffect } from 'react';
import { Layout, Button, Space, Dropdown, Input, List, Typography, Checkbox, Tooltip, Modal, Form } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, PlusOutlined, UserOutlined, MenuOutlined, HistoryOutlined, DownOutlined, SendOutlined, FileTextOutlined, VerticalAlignTopOutlined } from '@ant-design/icons';
import SystemPrompt from './SystemPrompt';
import LoadOutSource from '../component/LoadOutSource';
import './AiMain.css';
import { useLocation } from 'react-router-dom';

const { Sider, Content } = Layout;

interface LocationState {
  roleName?: string;
  topicId?: number;
  mode?: 'new' | 'edit';
}

// 添加類型定義
interface CollectionInfo {
  name_zh: string;
  name_en: string;
  description: string;
  count: number;
}

interface CollectionsResponse {
  status: string;
  collections: {
    [key: string]: CollectionInfo;
  };
  total_collections: number;
}

const AiMain: React.FC = () => {
  const { state } = useLocation() as { state: LocationState };
  const { roleName: initialRoleName, topicId: initialTopicId } = state || {};
  const [collapsed, setCollapsed] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [currentRoleName, setCurrentRoleName] = useState(initialRoleName || '');
  const [currentTopicId, setTopicId] = useState<number | undefined>(initialTopicId);
  const [showInternalData, setShowInternalData] = useState(false);
  const [isInternalDataCollapsed, setIsInternalDataCollapsed] = useState(true);
  const [showLoadOutSource, setShowLoadOutSource] = useState(false);
  const [collections, setCollections] = useState<CollectionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  // 初始化時解析路由狀態
  useEffect(() => {
    if (state) {
      if (state.mode) setMode(state.mode);
      if (state.mode === 'edit') {
        if (state.topicId) setTopicId(state.topicId);
        setCurrentRoleName(state.roleName || '');
      }
    }
  }, [state]);

  // 添加獲取集合資料的函數
  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vector/collections_metadata');
      const data = await response.json();
      setCollections(data);
    } catch (error) {
      console.error('獲取集合資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 在組件掛載時獲取資料
  useEffect(() => {
    fetchCollections();
  }, []);

  // 處理保存成功後的回調
  const handleSaveSuccess = (newRoleName: string) => {
    setMode('edit');  // 切換到編輯模式
    setCurrentRoleName(newRoleName);  // 更新當前角色名稱
  };

  // 根據模式顯示不同標題
  const title = currentRoleName || (mode === 'new' ? '新增 AI 角色' : '編輯 AI 角色');

  console.log('AiMain state:', { roleName: currentRoleName, topicId: currentTopicId, mode }); // 確認 state 是否包含 mode

  // 添加 Checkbox 變更處理函數
  const handleCollectionSelect = (collectionKey: string, checked: boolean) => {
    setSelectedCollections(prev => {
      if (checked) {
        return [...prev, collectionKey];
      } else {
        return prev.filter(key => key !== collectionKey);
      }
    });
  };

  // 修改列表渲染函數
  const renderCollectionsList = () => {
    if (!collections || !collections.collections) {
      return <div>無可用資料</div>;
    }

    return (
      <List
        loading={loading}
        itemLayout="horizontal"
        dataSource={Object.entries(collections.collections)}
        renderItem={([key, info]) => (
          <List.Item
            style={{
              padding: '12px 16px',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              borderRadius: '6px',
              marginBottom: '4px',
            }}
            className="collection-list-item" // 添加自定義類名
            actions={[
              <Checkbox
                checked={selectedCollections.includes(key)}
                onChange={(e) => handleCollectionSelect(key, e.target.checked)}
              />
            ]}
          >
            <List.Item.Meta
              title={
                <Typography.Text strong style={{ fontSize: '15px' }}>
                  {info.name_zh} ({info.name_en})
                </Typography.Text>
              }
              description={
                <Space direction="vertical" size={2}>
                  <Typography.Text type="secondary" style={{ fontSize: '13px' }}>
                    {info.description}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                    資料數量: {info.count}
                  </Typography.Text>
                </Space>
              }
            />
          </List.Item>
        )}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '8px'
        }}
      />
    );
  };

  // 添加 CSS 樣式
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .collection-list-item:hover {
      background-color: rgba(0, 0, 0, 0.08); // 從0.02加深到0.08
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }
    
    .collection-list-item {
      transition: all 0.2s ease;
    }
    
    .collection-list-item .ant-list-item-action {
      margin-left: 16px;
    }
    
    .collection-list-item .ant-checkbox-wrapper {
      margin-right: 0;
    }
  `;
  document.head.appendChild(styleSheet);

  return (
    <div className="ai-main-container" style={{ height: '100vh' }}>
      <Layout style={{ 
        height: '100%', 
        background: 'transparent', 
        gap: '5px', 
        padding: '4px',
        margin: 0
      }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width="30%"
          collapsedWidth={60}
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            borderRight: '1px solid rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minWidth: '300px',  // 設置最小寬度
            maxWidth: '500px'   // 設置最大寬度
          }}
          className="custom-sider"
        >
          {/* 控制栏 */}
          <div className="header-bar">
            {!collapsed && (
              <>
                <span className="title">
                  {title}
                </span>
                <Space style={{ marginLeft: 'auto' }}>
                  <Tooltip title="新增外部記錄">
                    <Button 
                      type="text" 
                      icon={<PlusOutlined />} 
                      onClick={() => { setShowLoadOutSource(true); }} 
                      className="icon-button"
                    />
                  </Tooltip>
                  <Tooltip title="角色設置">
                    <Button
                      type="text"
                      icon={<UserOutlined />}
                      onClick={() => {
                        setShowSystemPrompt(true);
                        setCurrentRoleName(initialRoleName || '');
                        if (mode === 'edit' && initialTopicId) {
                          setTopicId(initialTopicId);
                        }
                      }}
                      className="icon-button"
                    />
                  </Tooltip>
                </Space>
              </>
            )}
            <Tooltip title={collapsed ? "展開" : "收合"}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="icon-button"
              />
            </Tooltip>
          </div>
          
          {/* 左侧内容区域 */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative'
          }}>
            {!collapsed && (
              <>
                {/* 上方區域 */}
                <div style={{ 
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '8px',
                  padding: '16px',
                  overflow: 'auto',
                  marginBottom: '60px' // 固定留出底部空間
                }}>
                  {/* 上方區域內容 */}
                  <div>請新增外部資料...</div>
                </div>

                {/* 下方可收合區域 */}
                <div style={{
                  background: 'rgba(151, 148, 148, 0.36)', // 調整透明度為0.9
                  borderRadius: '8px',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1,
                  transition: 'all 0.3s ease-in-out',
                  height: isInternalDataCollapsed ? '50px' : '50%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* 標題欄 */}
                  <div 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0 16px',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                      cursor: 'pointer',
                      height: '50px',
                      boxSizing: 'border-box',
                      flexShrink: 0,
                      backgroundColor: '#001529',
                      borderTopLeftRadius: '8px',
                      borderTopRightRadius: '8px'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsInternalDataCollapsed(!isInternalDataCollapsed);
                    }}
                  >
                    <span style={{ 
                      fontWeight: 500,
                      lineHeight: '50px',
                      color: '#ffffff'
                    }}>角色內部資料</span>
                    <Button 
                      type="text"
                      size="small"
                      className={`toggle-button ${isInternalDataCollapsed ? 'collapsed' : 'expanded'}`}
                      icon={<DownOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsInternalDataCollapsed(!isInternalDataCollapsed);
                      }}
                    />
                  </div>
                  
                  {/* 內容區域 */}
                  <div style={{
                    flex: 1,
                    overflow: 'hidden',
                    opacity: isInternalDataCollapsed ? 0 : 1,
                    visibility: isInternalDataCollapsed ? 'hidden' : 'visible',
                    transition: 'opacity 0.3s ease-in-out',
                    padding: '4px',
                    height: isInternalDataCollapsed ? 0 : 'calc(100% - 50px)'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      overflow: 'auto',
                      padding: '0 2px'
                    }}>
                      {renderCollectionsList()}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Sider>
        <Content style={{ 
          padding: '0', 
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          height: '100%',
          margin: 0
        }}>
          {/* 聊天展示區域 */}
          <div style={{ 
            flex: 1,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0 // 確保 flex 子元素不會溢出
          }}>
            {/* 聊天室標題 */}
            <div className="header-bar">
              <span className="title">聊天室</span>
              <Space>
                <Tooltip title="新增聊天室">
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    className="chat-header-btn"
                  />
                </Tooltip>
                <Tooltip title="歷史主題">
                  <Button
                    type="text"
                    icon={<HistoryOutlined />}
                    className="chat-header-btn"
                  />
                </Tooltip>
                <Tooltip title="輸出報告">
                  <Button
                    type="text"
                    icon={<FileTextOutlined />}
                    className="chat-header-btn"
                  />
                </Tooltip>
              </Space>
            </div>
            
            {/* 消息展示區域 */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* 這裡後續會添加消息列表 */}
            </div>
          </div>

          {/* 輸入區域 */}
          <div className="chat-input-container">
            <div className="chat-input-wrapper">
              <div 
                className="resize-handle"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const wrapper = e.currentTarget.parentElement;
                  const container = wrapper?.parentElement;
                  const textarea = wrapper?.querySelector('.chat-input') as HTMLTextAreaElement;
                  if (!textarea || !container) return;

                  const startY = e.clientY;
                  const startHeight = textarea.offsetHeight;

                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    moveEvent.preventDefault();
                    const deltaY = startY - moveEvent.clientY;
                    const newHeight = Math.min(
                      Math.max(startHeight + deltaY, 80),
                      window.innerHeight * 0.5
                    );
                    
                    textarea.style.height = `${newHeight}px`;
                    wrapper.style.height = `${newHeight}px`;
                    container.style.height = `${newHeight + 16}px`; // 加上padding
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };

                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                <VerticalAlignTopOutlined />
              </div>
              <Input.TextArea 
                placeholder="請輸入訊息..."
                className="chat-input"
                autoSize={false}
                style={{ height: '80px' }}
              />
              <Button 
                type="link"
                icon={<SendOutlined style={{ 
                  transform: 'rotate(-90deg)', 
                  fontSize: '20px',
                  color: '#1890ff'
                }} />}
                className="chat-send-button"
              />
            </div>
          </div>
        </Content>
      </Layout>
      <SystemPrompt 
        visible={showSystemPrompt} 
        onClose={() => setShowSystemPrompt(false)} 
        mode={mode}
        topicId={currentTopicId}
        roleName={currentRoleName}
        setRoleName={setCurrentRoleName}
        onSaveSuccess={handleSaveSuccess}
      />
      <LoadOutSource 
        visible={showLoadOutSource}
        onClose={() => setShowLoadOutSource(false)}
      />
    </div>
  );
};

export default AiMain;