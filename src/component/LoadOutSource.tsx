import React, { useState } from 'react';
import { Modal, Button, Tabs, Input, Typography, Space } from 'antd';
import { CloudUploadOutlined, LinkOutlined, GoogleOutlined, CopyOutlined } from '@ant-design/icons';
import './LoadOutSource.css';

const { TabPane } = Tabs;
const { Text } = Typography;

interface LoadOutSourceProps {
  visible: boolean;
  onClose: () => void;
}

const LoadOutSource: React.FC<LoadOutSourceProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState('1');

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CloudUploadOutlined />
          <span>新增來源</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="load-out-source-modal"
    >
      <div style={{ padding: '20px 0' }}>
        <Text>來源是你最重視的資訊，AI咨詢平台 會據此提供回覆。</Text>
        <Text style={{ display: 'block', color: 'rgba(0, 0, 0, 0.45)', marginTop: '8px' }}>
          例如：行銷企劃書、課程閱讀資料、研究筆記、會議轉錄稿、銷售文件等。
        </Text>
      </div>

      <div className="upload-area" style={{
        border: '2px dashed #e0e0e0',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#fafafa',
        marginBottom: '20px'
      }}>
        <CloudUploadOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
        <div>上傳來源</div>
        <Text type="secondary">請將檔案拖到此處，或是選擇檔案上傳</Text>
        <div style={{ marginTop: '16px' }}>
          <Text type="secondary">支援的檔案類型：PDF, .txt, Markdown, 音訊 (例如 MP3)</Text>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <GoogleOutlined />
              Google 雲端硬碟
            </span>
          } 
          key="1"
        >
          <Space direction="horizontal" size={16}>
            <Button icon={<GoogleOutlined />}>Google 文件</Button>
            <Button icon={<GoogleOutlined />}>Google 簡報</Button>
          </Space>
        </TabPane>
        <TabPane 
          tab={
            <span>
              <LinkOutlined />
              連結
            </span>
          } 
          key="2"
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Button icon={<LinkOutlined />}>網站</Button>
            <Button icon={<LinkOutlined />}>YouTube</Button>
          </Space>
        </TabPane>
        <TabPane 
          tab={
            <span>
              <CopyOutlined />
              貼上文字
            </span>
          } 
          key="3"
        >
          <Button icon={<CopyOutlined />}>複製的文字</Button>
        </TabPane>
      </Tabs>

      <div style={{ 
        marginTop: '20px', 
        padding: '12px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Text type="secondary">來源限制</Text>
        <Text>0/50</Text>
      </div>
    </Modal>
  );
};

export default LoadOutSource;