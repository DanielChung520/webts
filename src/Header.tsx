import React from 'react';
import { Space } from 'antd';
import logoImage from './assets/Bio-EAI50p.png';

interface HeaderProps {
  title: React.ReactNode;
  buttons?: React.ReactNode[];
}

const Header: React.FC<HeaderProps> = ({ title, buttons = [] }) => {
  return (
    <Space style={{ 
      justifyContent: 'space-between', 
      width: '100%',
      marginTop: '10px',
      padding: '0 0'
    }}>
      <Space>
        <img 
          src={logoImage}
          alt="logo" 
          style={{ 
            height: '60px', 
            marginRight: '26px',
            objectFit: 'contain',
            display: 'block'
          }} 
        />
        <div style={{ margin: 0 }}>{title}</div>
      </Space>
      <Space>
        {buttons}
      </Space>
    </Space>
  );
};

export default Header;
