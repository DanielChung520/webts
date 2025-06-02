import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Space, Button, Dropdown, Modal } from 'antd';
import { BellOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import ChemicalIndustry from './page/ChemicalIndustry';
import CQMap from './page/CQMap';
import Home from './Home';
import AiMain from './page/AiMain';
import AiModelConfig from './page/AiModelConfig';
import KnowledgeManagement from './page/KnowledgeManagement';
import LoginModal from './component/LoginModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';
import logo from './assets/Bio-EAI-W25p.png';

const { Header, Content } = Layout;

const AppContent: React.FC = () => {
  const [isAiConfigVisible, setIsAiConfigVisible] = useState(false);
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const { isAuthenticated, logout, userInfo } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoginVisible(true);
    }
  }, [isAuthenticated]);

  // 定义菜单项
  const menuItems = [
    {
      key: 'home',
      label: (
        <Link to="/" className="home-logo-link">
          <img 
            src={logo} 
            alt="Logo" 
            className="home-logo" 
            style={{ 
              height: '50px',
              width: '80px',
              marginRight: '2px'
            }}
          />
        </Link>
      )
    },
    {
      key: 'chemical',
      label: <Link to="/chemical-industry">股票管理</Link>
    },
    {
      key: 'knowledge',
      label: <Link to="/knowledge">知識庫管理</Link>
    },
    {
      key: 'map',
      label: <Link to="/map">管理地图</Link>
    }
  ];

  const handleSettingClick = (key: string) => {
    if (key === 'ai') {
      setIsAiConfigVisible(true);
    } else if (key === 'logout') {
      logout();
      setIsLoginVisible(true);
    }
  };

  const settingsItems: MenuProps['items'] = [
    {
      key: 'account',
      label: '账号',
    },
    {
      key: 'password',
      label: '修改密码',
    },
    {
      key: 'theme',
      label: '主题设置',
    },
    {
      key: 'ai',
      label: 'AI设置',
      onClick: () => handleSettingClick('ai'),
    },
    {
      key: 'logout',
      label: '登出',
      icon: <LogoutOutlined />,
      onClick: () => handleSettingClick('logout'),
    },
  ];

  if (!isAuthenticated) {
    return <LoginModal visible={isLoginVisible} onCancel={() => {}} />;
  }

  return (
    <Router>
      <Layout className="layout" style={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Header style={{ 
          display: 'flex', 
          alignItems: 'center',
          flexShrink: 0
        }}>
          <Menu 
            theme="dark" 
            mode="horizontal" 
            defaultSelectedKeys={['home']} 
            items={menuItems}
            style={{ flex: 1 }}
          />
          <Space size="middle" style={{ marginLeft: 'auto' }}>
            <Button 
              type="text" 
              icon={<BellOutlined />} 
              className="header-notification-btn"
            />
            <Dropdown menu={{ items: settingsItems }} placement="bottomRight">
              <Button 
                type="primary" 
                icon={<SettingOutlined />} 
                className="header-settings-btn"
              >
                设置
              </Button>
            </Dropdown>
            <Space>
            <Avatar 
              src="https://api.dicebear.com/7.x/miniavs/svg?seed=1" 
              className="header-avatar"
            />
              {isAuthenticated && userInfo && (
                <span style={{ 
                  color: '#fff',
                  marginLeft: '8px',
                  fontSize: '14px'
                }}>
                  {userInfo.nickname || userInfo.username}
                </span>
              )}
            </Space>
          </Space>
        </Header>
        <Content style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chemical-industry" element={<ChemicalIndustry />} />
            <Route path="/knowledge" element={<KnowledgeManagement />} />
            <Route path="/map" element={<CQMap />} />
            <Route path="/ai-main" element={<AiMain />} />
          </Routes>
        </Content>

        {/* AI 模型配置模态框 */}
        <Modal
          title="AI 模型配置"
          open={isAiConfigVisible}
          onCancel={() => setIsAiConfigVisible(false)}
          footer={null}
          width={800}
          className="ai-config-modal"
          style={{ 
            top: 20,
          }}
          styles={{
            body: { 
              maxHeight: 'calc(100vh - 200px)', 
              overflow: 'auto',
              padding: '20px',
              background: 'transparent'
            }
          }}
          modalRender={(modal) => (
            <div style={{
              background: 'rgba(54, 163, 247, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: '8px',
            }}>
              {modal}
            </div>
          )}
        >
          <style>
            {`
              .ai-config-modal .ant-modal-content {
                background: rgba(54, 164, 247, 0.33) !important;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
              }
              .ai-config-modal .ant-modal-header {
                background: transparent !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
              }
              .ai-config-modal .ant-modal-title {
                color: white !important;
              }
              .ai-config-modal .ant-modal-close {
                color: white !important;
              }
              .ai-config-modal .ant-modal-close:hover {
                background: rgba(255, 255, 255, 0.2) !important;
              }
            `}
          </style>
          <AiModelConfig />
        </Modal>
      </Layout>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
