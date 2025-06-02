import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup } from 'react-leaflet';
import { Card, Space, Typography, Button, message, Alert } from 'antd';
import { ReloadOutlined, EnvironmentOutlined, GlobalOutlined, TableOutlined } from '@ant-design/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as XLSX from 'xlsx';
import Header from '../Header';

const { Title } = Typography;

// 自定義定位圖標
const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 30px;
    height: 30px;
    border-radius: 50% 50% 50% 0;
    background: #1890ff;
    position: relative;
    transform: rotate(-45deg);
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    cursor: pointer;
    margin: -15px 0 0 -15px;
  ">
    <div style="
      width: 8px;
      height: 8px;
      background: white;
      position: absolute;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      margin: -4px 0 0 -4px;
      transform: rotate(45deg);
    "></div>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// 創建一個Map控制組件用於存取地圖實例
const MapController = ({ center }) => {
  const map = useMap();
  
  // 導出重置視圖的方法
  React.useEffect(() => {
    map.setView(center, 8);
  }, [center]);
  
  return null;
};

// 地址轉換為經緯度
const getCoordinates = async (address) => {
  // 由於長壽區的地址都在重慶長壽區，我們可以使用固定的經緯度加上偏移
  // 長壽區的大致經緯度範圍：
  const CHANGSHOU_CENTER = {
    lat: 29.8520,  // 長壽區緯度
    lng: 107.0800  // 長壽區經度
  };

  // 根據不同的地址特徵返回略微不同的坐標，以區分不同位置
  if (address.includes('维江路36号')) {
    return [CHANGSHOU_CENTER.lat + 0.01, CHANGSHOU_CENTER.lng + 0.01];  // 維江路
  } else if (address.includes('八颗组团')) {
    return [CHANGSHOU_CENTER.lat - 0.01, CHANGSHOU_CENTER.lng + 0.02];  // 八顆組團
  } else if (address.includes('齐心大道')) {
    return [CHANGSHOU_CENTER.lat + 0.02, CHANGSHOU_CENTER.lng - 0.01];  // 齊心大道
  } else if (address.includes('川维化工')) {
    return [CHANGSHOU_CENTER.lat, CHANGSHOU_CENTER.lng + 0.015];  // 川維化工
  } else {
    // 其他地址，在中心點周圍隨機偏移
    const randomOffset = () => (Math.random() - 0.5) * 0.02;  // ±0.01度的隨機偏移
    return [
      CHANGSHOU_CENTER.lat + randomOffset(),
      CHANGSHOU_CENTER.lng + randomOffset()
    ];
  }
};

const CQMap = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [mapType, setMapType] = useState('admin'); // 默認顯示行政地圖
  const center = [30.1, 107.5]; // 重慶的經緯度中心點
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  
  // 加載 Excel 數據
  const loadExcelData = async () => {
    setLoading(true);
    try {
      console.log('開始加載 Excel 文件...');
      const response = await fetch('/data/原型数据.xlsx');
      console.log('Excel 文件加載響應狀態:', response.status);
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('Excel 文件大小:', arrayBuffer.byteLength, 'bytes');
      
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      console.log('Excel 工作表列表:', workbook.SheetNames);

      // 讀取"企业的项目数据"表
      const worksheet = workbook.Sheets['企业的项目数据'];
      if (!worksheet) {
        console.error('未找到工作表：企业的项目数据');
        throw new Error('未找到"企业的项目数据"表');
      }
      console.log('成功找到工作表：企业的项目数据');

      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      console.log('解析到的數據條數:', jsonData.length);
      console.log('數據示例:', jsonData.slice(0, 2));

      const newMarkers = [];

      // 處理每個地址
      for (const row of jsonData) {
        const address = row['建设地址'];
        console.log('正在處理地址:', address);
        
        if (address) {
          // 為了避免API限制，在每次請求之間添加延遲
          await new Promise(resolve => setTimeout(resolve, 1000));
          const coordinates = await getCoordinates(address);
          console.log('地址解析結果:', address, '→', coordinates);
          
          if (coordinates) {
            newMarkers.push({
              position: coordinates,
              address: address,
              name: row['项目名称'] || '未命名項目'
            });
            console.log('成功添加標記點:', row['项目名称'], coordinates);
          } else {
            console.warn('無法解析地址:', address);
          }
        } else {
          console.warn('行數據中沒有建設地址:', row);
        }
      }

      console.log('總共成功解析的標記點數量:', newMarkers.length);
      setMarkers(newMarkers);
      message.success(`成功解析 ${newMarkers.length} 個地址位置`);
    } catch (error) {
      console.error('處理Excel文件失敗:', error);
      console.error('錯誤詳情:', error.stack);
      message.error('處理Excel文件失敗: ' + error.message);
      setError('Excel數據加載失敗，請確保文件存在且格式正確');
    } finally {
      setLoading(false);
    }
  };

  // 地圖重置到中心點
  const centerMap = () => {
    if (mapRef.current) {
      // 設置縮放級別為8，相當於原來的10級縮小約80%
      mapRef.current.setView(center, 8);
      message.success('已將地圖重置到中心位置並縮小顯示');
    }
  };

  // 加載地圖數據
  const loadShapefile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/Chongqing/CQ.geojson');
      const geoJson = await response.json();
      setGeoJsonData(geoJson);
      message.success(mapType === 'admin' ? '行政地圖加載成功' : '基礎地圖加載成功');
    } catch (error) {
      console.error('加載地圖數據失敗:', error);
      setError('地圖數據加載失敗，請確保地圖文件存在且格式正確');
      message.error('地圖數據加載失敗');
    } finally {
      setLoading(false);
    }
  };

  // 切換地圖類型
  const toggleMapType = () => {
    setMapType(prev => prev === 'base' ? 'admin' : 'base');
  };

  // 初始加載
  React.useEffect(() => {
    loadShapefile();
  }, []);

  // 地圖樣式
  const getMapStyle = () => {
    if (mapType === 'admin') {
      return {
        fillColor: '#1890ff',
        weight: 2,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.3
      };
    } else {
      return {
        fillColor: '#52c41a',
        weight: 3,
        opacity: 1,
        color: '#096dd9',
        fillOpacity: 0.2,
        dashArray: '5, 5'
      };
    }
  };

  const headerButtons = [
    <Button 
      key="showProjects"
      type="primary"
      icon={<TableOutlined />}
      onClick={loadExcelData}
      loading={loading}
    >
      显示項目位置
    </Button>,
    <Button 
      key="toggleMap"
      type="primary" 
      icon={<GlobalOutlined />}
      onClick={toggleMapType}
    >
      {mapType === 'base' ? '重慶行政地圖' : '重慶基礎地圖'}
    </Button>,
    <Button 
      key="center"
      type="primary" 
      icon={<EnvironmentOutlined />}
      onClick={centerMap}
    >
      定位中心
    </Button>
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '20px', margin: '0px' }}>
      <Header title="重慶市地理信息展示" buttons={headerButtons} />

      {error && (
        <Alert
          message="數據加載錯誤"
          description={error}
          type="error"
          showIcon
          closable
        />
      )}

      <Card style={{ margin: '0 1px' }}>
        <MapContainer 
          center={center} 
          zoom={10} 
          style={{ 
            height: 'calc(100vh - 140px)', 
            width: '100%',
            borderRadius: '8px'
          }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapController center={center} />
          
          {geoJsonData && (
            <GeoJSON 
              key={mapType} // 強制在切換類型時重新渲染
              data={geoJsonData} 
              style={getMapStyle()}
              onEachFeature={(feature, layer) => {
                if (feature.properties) {
                  layer.bindPopup(
                    `<div>
                      <h4>${feature.properties.name || '未命名區域'}</h4>
                      <p>點擊查看詳情</p>
                    </div>`
                  );
                }
              }}
            />
          )}

          {markers.map((marker, index) => (
            <Marker 
              key={index} 
              position={marker.position}
              icon={customIcon}
            >
              <Popup>
                <div>
                  <h4>{marker.name}</h4>
                  <p>{marker.address}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Card>
    </Space>
  );
};

export default CQMap;
