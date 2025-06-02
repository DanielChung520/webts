import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Input, Select, Space, Typography, message, Popconfirm, Dropdown, Menu } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { TextArea } = Input;

interface Role {
  role_name: string;
  systemPrompt: {
    roleJob?: string;      // 定位
    skill?: string;        // 能力
    knowledge?: string;    // 知識儲備
    restrict?: string;     // 禁用與限制
  };
      }

const SystemPrompt: React.FC<{
  visible: boolean;
  onClose: () => void;
  mode: 'new' | 'edit';
  topicId?: number;
  roleName: string;
  setRoleName: (name: string) => void;
  onSaveSuccess?: (newRoleName: string) => void;
}> = ({ visible, onClose, mode, topicId, roleName, setRoleName, onSaveSuccess }) => {
  const [form] = Form.useForm();
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedData, setCopiedData] = useState<any>(null);

  // 獲取所有角色名稱
  const fetchRoleNames = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/roles');
      const data = await response.json();
      if (Array.isArray(data)) {
        setRoleNames(data.map((role: Role) => role.role_name));
      }
    } catch (error) {
      console.error('獲取角色列表失敗:', error);
      message.error('獲取角色列表失敗');
    } finally {
      setLoading(false);
    }
  };

  // 獲取角色詳情
  const fetchRoleDetails = async (roleName: string) => {
    console.log('fetchRoleDetails called with roleName:', roleName);
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/roles/${encodeURIComponent(roleName)}`);
      console.log('API response:', response);
      const data = await response.json();
      console.log('API data:', data);
      if (data) {
        form.setFieldsValue({
          role_name: data.role_name,
          positioning: data.systemPrompt?.roleJob || '',
          capabilities: data.systemPrompt?.skill || '',
          knowledge: data.systemPrompt?.knowledge || '',
          禁用與限制: data.systemPrompt?.restrict || ''
        });
      }
    } catch (error) {
      console.error('獲取角色詳情失敗:', error);
      message.error('獲取角色詳情失敗');
    } finally {
      setLoading(false);
    }
  };

  // 複製角色功能
  const handleCopyRole = (roleName: string) => {
    const role = roleNames.find(name => name === roleName);
    if (role) {
      fetch(`/api/ai/roles/${encodeURIComponent(roleName)}`)
        .then(res => res.json())
        .then((data: Role) => {
          form.setFieldsValue({
            positioning: data.systemPrompt.roleJob,
            capabilities: data.systemPrompt.skill,
            knowledge: data.systemPrompt.knowledge,
            禁用與限制: data.systemPrompt.restrict
          });
          message.success(`已複製 ${roleName} 的設定`);
        })
        .catch(error => {
          console.error('複製角色失敗:', error);
          message.error('複製角色失敗');
        });
    }
  };

  // 複製按鈕與選單
  const copyButton = mode === 'new' && (
    <Dropdown
      menu={{
        items: roleNames.map(name => ({
          key: name,
          label: name,
          onClick: () => handleCopyRole(name),
        })),
      }}
      trigger={['click']}
      placement="bottomRight"
    >
      <Button 
        type="text" 
        icon={<CopyOutlined />} 
        style={{ marginLeft: 8 }}
        title="複製現有角色設定"
      />
    </Dropdown>
  );

  // 在 Modal 標題旁加入複製按鈕
  const modalTitle = (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span>{mode === 'new' ? '新增 AI 角色' : '編輯 AI 角色'}</span>
      {copyButton}
    </div>
  );

  // 修改角色名稱輸入框的處理
  const renderRoleNameField = () => {
    if (mode === 'new') {
      return (
        <Form.Item 
          label="角色名稱" 
          name="role_name" 
          rules={[{ required: true, message: '請輸入角色名稱' }]}
          initialValue={roleName}
        >
          <Input 
            placeholder="輸入新角色名稱" 
            onChange={(e) => setRoleName(e.target.value)}
          />
        </Form.Item>
      );
    } else {
      return (
        <Form.Item 
          label="角色名稱" 
          name="role_name" 
          rules={[{ required: true }]}
          initialValue={roleName}
        >
          <Input disabled />
        </Form.Item>
      );
    }
  };

  // 提交角色更新
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const { role_name, positioning, capabilities, knowledge, 禁用與限制 } = values;
      
      const method = mode === 'new' ? 'POST' : 'PUT';
      const url = mode === 'new' 
        ? '/api/ai/roles'
        : `/api/ai/roles/${encodeURIComponent(role_name)}`;

      const requestData = {
        role_name,
        systemPrompt: {
          roleJob: positioning || '',
          skill: capabilities || '',
          knowledge: knowledge || '',
          restrict: 禁用與限制 || ''
        },
        avatar: "https://example.com/avatar.png"  // 如果前端沒有設置頭像，使用預設值
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '操作失敗');

      message.success(mode === 'new' ? '角色新增成功' : '角色更新成功');
      fetchRoleNames();
      if (onSaveSuccess) {
        onSaveSuccess(role_name);
      }
      onClose();
    } catch (error) {
      console.error('操作失敗:', error);
      message.error(error instanceof Error ? error.message : '操作失敗');
    }
  };

  // 初始化
  useEffect(() => {
    if (visible) {
      fetchRoleNames();
      if (mode === 'edit' && roleName) {
        fetchRoleDetails(roleName);
      } else if (mode === 'new') {
        form.setFieldsValue({
          role_name: roleName
        });
      }
    }
  }, [visible, mode, roleName]);

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      width={800}
      footer={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          gap: '8px'  // 按鈕之間的間距
        }}>
          <Button key="cancel" onClick={onClose}>取消</Button>
          <Button key="submit" type="primary" onClick={handleSubmit}>
            {mode === 'new' ? '新增角色' : '保存變更'}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        {renderRoleNameField()}

        <Form.Item label="定位" name="positioning" rules={[{ required: true }]}>
          <TextArea rows={2} placeholder="對應後端 roleJob" />
        </Form.Item>

        <Form.Item label="能力" name="capabilities" rules={[{ required: true }]}>
          <TextArea rows={4} placeholder="對應後端 skill" />
        </Form.Item>

        <Form.Item label="知識儲備" name="knowledge" rules={[{ required: true }]}>
          <TextArea rows={3} placeholder="對應後端 knowledge" />
        </Form.Item>

        <Form.Item label="禁用與限制" name="禁用與限制" rules={[{ required: true }]}>
          <TextArea rows={3} placeholder="對應後端 restrict" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SystemPrompt;