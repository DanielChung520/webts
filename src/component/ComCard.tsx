import React, { useState, useCallback, useMemo } from 'react';
import { Card, Avatar, Dropdown, Menu, Modal, Input, message } from 'antd';
import { MoreOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { CardProps } from 'antd/lib/card';

interface ComCardProps extends CardProps {
  avatarSrc?: string;
  avatarText?: string;
  onDelete?: () => void;
  onTitleChange?: (newTitle: string) => void;
  isEditing?: boolean;
}

const ComCard: React.FC<ComCardProps> = React.memo(({
  avatarSrc,
  avatarText,
  onDelete,
  onTitleChange,
  title,
  children,
  isEditing = false,
  ...restProps
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState(title as string);

  // 只在 title 变化时更新 newTitle
  React.useEffect(() => {
    setNewTitle(title as string);
  }, [title]);

  const handleMenuClick = useCallback((e: { key: string }) => {
    switch (e.key) {
      case 'delete':
        if (onDelete) {
          onDelete();
        }
        break;
      case 'edit':
        setIsModalVisible(true);
        break;
    }
  }, [onDelete]);

  const handleTitleChange = useCallback(() => {
    if (onTitleChange && newTitle !== title) {
      onTitleChange(newTitle);
    }
    setIsModalVisible(false);
  }, [onTitleChange, newTitle, title]);

  const handleCancel = useCallback(() => {
    setIsModalVisible(false);
    setNewTitle(title as string);
  }, [title]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  }, []);

  const menu = useMemo(() => (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="edit" icon={<EditOutlined />}>
        编辑卡片标题
      </Menu.Item>
      <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
        删除
      </Menu.Item>
    </Menu>
  ), [handleMenuClick]);

  const cardTitle = useMemo(() => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Avatar src={avatarSrc}>{avatarText}</Avatar>
      <Dropdown overlay={menu} trigger={['click']}>
        <MoreOutlined style={{ cursor: 'pointer', fontSize: '18px' }} />
      </Dropdown>
    </div>
  ), [avatarSrc, avatarText, menu]);

  return (
    <>
      <Card
        {...restProps}
        className="project-card"
        style={{ 
          height: '200px',
          backgroundColor: 'rgba(255, 255, 255, 0.51)'
        }}
        title={cardTitle}
      >
        <div style={{ 
          padding: '8px 0',
          fontSize: '16px',
          fontWeight: 500,
          lineHeight: '1.5'
        }}>
          {title}
        </div>
      </Card>

      <Modal
        title="编辑卡片标题"
        visible={isModalVisible}
        onOk={handleTitleChange}
        onCancel={handleCancel}
        destroyOnClose
      >
        <Input
          value={newTitle}
          onChange={handleInputChange}
          placeholder="请输入新的标题"
        />
      </Modal>
    </>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.avatarSrc === nextProps.avatarSrc &&
    prevProps.avatarText === nextProps.avatarText &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onTitleChange === nextProps.onTitleChange &&
    prevProps.children === nextProps.children &&
    prevProps.isEditing === nextProps.isEditing
  );
});

export default ComCard;
