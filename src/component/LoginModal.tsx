import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  visible: boolean;
  onCancel: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      console.log('Submitting login form:', values); // 調試用
      
      await login(values.username, values.password);
      console.log('Login successful'); // 調試用
      
      message.success('登入成功，歡迎回來！');
      form.resetFields();
      onCancel();
    } catch (error) {
      console.error('Login form error:', error); // 調試用
      message.error(error instanceof Error ? error.message : '登入失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="用戶登入"
      open={visible}
      onCancel={onCancel}
      footer={null}
      maskClosable={false}
      style={{ 
        top: '30%',
      }}
      styles={{
        body: {
        padding: '24px',
        }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="username"
          label="用戶名"
          rules={[{ required: true, message: '請輸入用戶名' }]}
        >
          <Input 
            placeholder="請輸入用戶名"
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="密碼"
          rules={[{ required: true, message: '請輸入密碼' }]}
        >
          <Input.Password 
            placeholder="請輸入密碼"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            登入
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LoginModal; 