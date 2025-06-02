import React, { useState, useEffect } from 'react';
import { Table, Card, Space, Typography, Tag, Tooltip, Button, message, Alert, Tabs, Dropdown } from 'antd';
import { DownloadOutlined, ReloadOutlined, ExperimentOutlined, FileSearchOutlined, DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Key } from 'react';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { sendToBackend } from '../api';
import Header from '../Header';

const { Title } = Typography;

interface ProjectData {
  key: string;
  序号: number;
  "项目法人（单位名称）"?: string;
  "统一社会信用代码"?: string;
  "项目代码"?: string;
  "项目名称"?: string;
  "项目区县"?: string;
  "建设地址"?: string;
  "预计开工时间"?: string;
  "预计完工时间"?: string;
  "建设内容及规模"?: string;
  "项目总投资"?: string | number;
  "项目负责人"?: string;
  "手机号"?: string;
  "行业类别"?: string;
  "行业类别名称"?: string;
  "投资方式"?: string;
  "数据日期"?: string;
  [key: string]: any;
}

interface AnalysisData {
  key: string;
  project_code?: string;
  project_name?: string;
  raw_materials?: string[];
  project_capacity?: string;
  pollutants_gaseous?: string[];
  pollutants_liquid?: string[];
  pollutants_solid?: string[];
  air_impact?: string;
  water_impact?: string;
  soil_impact?: string;
}

interface AnalyzeResponse {
  status: string;
  processed?: number;
  message?: string;
}

interface QueryResponse {
  status: string;
  data: AnalysisData[];
  count?: number;
}

const ChemicalIndustry: React.FC = () => {
  const [data, setData] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [processing, setProcessing] = useState<boolean>(false);
  const [activeTabKey, setActiveTabKey] = useState<string>('1');
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [queryLoading, setQueryLoading] = useState<boolean>(false);

  // 加载 Excel 数据
  const loadExcelData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('开始加载 Excel 数据...');
      
      const response = await fetch('/data/原型数据.xlsx');
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const sheetNames = workbook.SheetNames;
      setAvailableSheets(sheetNames);
      console.log('Excel 文件中的所有工作表:', sheetNames);

      const targetSheetName = '企业的项目数据';
      if (!sheetNames.includes(targetSheetName)) {
        throw new Error(`未找到工作表 "${targetSheetName}"，可用的工作表: ${sheetNames.join(', ')}`);
      }

      const worksheet = workbook.Sheets[targetSheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        raw: true,
        defval: null
      });

      console.log('工作表数据示例:', jsonData[0]);

      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new Error('工作表中未找到有效数据');
      }

      const processedData: ProjectData[] = jsonData.map((item: Record<string, any>, index: number) => ({
        ...item,
        key: `${index + 1}`,
        序号: index + 1
      }));

      setData(processedData);
      message.success(`成功加载 ${processedData.length} 条数据`);
    } catch (err) {
      const error = err as Error;
      console.error('数据加载失败:', error);
      setError(error.message);
      message.error(error.message || '数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExcelData();
  }, []);

  const handleExport = () => {
    if (data.length === 0) {
      message.warning('没有可导出的数据');
      return;
    }

    try {
      const exportData = data.map(({ key, 序号, ...rest }) => rest);
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, '企业的项目数据');
      XLSX.writeFile(workbook, '原型数据.xlsx');
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  const handleRefresh = () => {
    loadExcelData();
  };

  // 加载分析结果
  const loadAnalysisResults = async () => {
    setQueryLoading(true);
    try {
      const response = await sendToBackend<QueryResponse>('/api/query-projects', null, 'GET');
      if (response.status === 'success' && response.data) {
        const dataWithKeys = response.data.map((item: AnalysisData, index: number) => ({
          ...item,
          key: `${item.project_code || ''}-${index}`
        }));
        setAnalysisData(dataWithKeys);
        setActiveTabKey('2');
        message.success(`已加载 ${response.count} 条分析结果`);
      } else {
        message.error('加载分析结果失败');
      }
    } catch (error) {
      console.error('加载分析结果失败:', error);
      message.error('加载分析结果失败');
    } finally {
      setQueryLoading(false);
    }
  };

  // 处理分析按钮点击
  const handleAnalyze = async (mode: 'reanalyze' | 'append') => {
    setProcessing(true);
    try {
      const analyzeResponse = await sendToBackend<AnalyzeResponse>('/api/analyze', {
        mode,
        data: data.map(item => ({
          序号: item.序号,
          项目代码: item.项目代码,
          '项目法人（单位名称）': item['项目法人（单位名称）'],
          '项目名称': item['项目名称'],
          '建设地址': item['建设地址'],
          '建设内容及规模': item['建设内容及规模'],
          '行业类别名称': item['行业类别名称']
        }))
      });
      
      if (analyzeResponse.status === 'success') {
        message.success(`${mode === 'reanalyze' ? '重新分析' : '新增分析'}完成，处理了 ${analyzeResponse.processed} 条数据`);
        await loadAnalysisResults();
      } else {
        message.error(analyzeResponse.message || '分析处理失败');
      }
    } catch (error) {
      message.error('分析处理失败');
    } finally {
      setProcessing(false);
    }
  };

  // 分析按钮的下拉菜单项
  const analyzeMenuItems: MenuProps['items'] = [
    {
      key: 'reanalyze',
      label: '重新分析',
      icon: <ExperimentOutlined />,
    },
    {
      key: 'append',
      label: '新增分析',
      icon: <ExperimentOutlined />,
    },
  ];

  // 格式化日期
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    return dayjs(dateStr).format('YYYY-MM-DD');
  };

  // 表格列配置
  const columns: ColumnsType<ProjectData> = [
    {
      title: '序号',
      dataIndex: '序号',
      key: '序号',
      width: 60,
      fixed: 'left' as const,
    },
    {
      title: '项目法人（单位名称）',
      dataIndex: '项目法人（单位名称）',
      key: '项目法人（单位名称）',
      width: 200,
      fixed: 'left' as const,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '统一社会信用代码',
      dataIndex: '统一社会信用代码',
      key: '统一社会信用代码',
      width: 180,
      render: (text) => text || '-',
    },
    {
      title: '项目代码',
      dataIndex: '项目代码',
      key: '项目代码',
      width: 200,
    },
    {
      title: '项目名称',
      dataIndex: '项目名称',
      key: '项目名称',
      width: 250,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '项目区县',
      dataIndex: '项目区县',
      key: '项目区县',
      width: 100,
      filters: Array.from(new Set(data.map(item => item["项目区县"]))).filter(Boolean)
        .map(area => ({ text: area, value: area as Key })),
      onFilter: (value: boolean | Key, record: ProjectData) => record["项目区县"] === value,
    },
    {
      title: '建设地址',
      dataIndex: '建设地址',
      key: '建设地址',
      width: 300,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '预计开工时间',
      dataIndex: '预计开工时间',
      key: '预计开工时间',
      width: 120,
      render: formatDate,
      sorter: (a, b) => {
        if (!a.预计开工时间 || !b.预计开工时间) return 0;
        return dayjs(a.预计开工时间).unix() - dayjs(b.预计开工时间).unix();
      },
    },
    {
      title: '预计完工时间',
      dataIndex: '预计完工时间',
      key: '预计完工时间',
      width: 120,
      render: formatDate,
      sorter: (a, b) => {
        if (!a.预计完工时间 || !b.预计完工时间) return 0;
        return dayjs(a.预计完工时间).unix() - dayjs(b.预计完工时间).unix();
      },
    },
    {
      title: '建设内容及规模',
      dataIndex: '建设内容及规模',
      key: '建设内容及规模',
      width: 300,
      render: (text) => (
        <Tooltip title={text}>
          <div style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxHeight: '3em', // 两行高度（1.5em每行）
            lineHeight: '1.5em',
            whiteSpace: 'normal'
          }}>
            {text || '-'}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '项目总投资',
      dataIndex: '项目总投资',
      key: '项目总投资',
      width: 120,
      sorter: (a, b) => {
        const valueA = parseFloat(String(a.项目总投资).replace(/,/g, '')) || 0;
        const valueB = parseFloat(String(b.项目总投资).replace(/,/g, '')) || 0;
        return valueA - valueB;
      },
      render: (value) => value ? `${value}万元` : '-',
    },
    {
      title: '项目负责人',
      dataIndex: '项目负责人',
      key: '项目负责人',
      width: 100,
    },
    {
      title: '手机号',
      dataIndex: '手机号',
      key: '手机号',
      width: 120,
    },
    {
      title: '行业类别',
      dataIndex: '行业类别',
      key: '行业类别',
      width: 100,
    },
    {
      title: '行业类别名称',
      dataIndex: '行业类别名称',
      key: '行业类别名称',
      width: 150,
      filters: Array.from(new Set(data.map(item => item["行业类别名称"]))).filter(Boolean)
        .map(type => ({ text: type, value: type as Key })),
      onFilter: (value: boolean | Key, record: ProjectData) => record["行业类别名称"] === value,
    },
    {
      title: '投资方式',
      dataIndex: '投资方式',
      key: '投资方式',
      width: 100,
    },
    {
      title: '数据日期',
      dataIndex: '数据日期',
      key: '数据日期',
      width: 160,
      render: formatDate,
    }
  ];

  // 新增污染物表格列配置
  const pollutionColumns: ColumnsType<AnalysisData> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      fixed: 'left' as const,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: '项目代码',
      dataIndex: 'project_code',
      key: 'project_code',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 200,
      fixed: 'left' as const,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '产品信息',
      children: [
        {
          title: '主要产品',
          dataIndex: 'raw_materials',
          key: 'raw_materials',
          width: 200,
          render: (items) => {
            if (!items || !Array.isArray(items)) return '-';
            return items.map((item, index) => (
              item ? <Tag key={index} color="green">{item}</Tag> : null
            )).filter(Boolean);
          },
        },
        {
          title: '产量规模',
          dataIndex: 'project_capacity',
          key: 'project_capacity',
          width: 120,
        },
      ],
    },
    {
      title: '污染物分析',
      children: [
        {
          title: '废气污染物',
          dataIndex: 'pollutants_gaseous',
          key: 'pollutants_gaseous',
          width: 200,
          render: (items, record) => {
            if (!items || !Array.isArray(items)) return '-';
            return (
              <div>
                {items.map((item, index) => (
                  item ? <Tag key={index} color="red">{item}</Tag> : null
                )).filter(Boolean)}
                {record.air_impact && (
                  <div style={{ marginTop: '4px' }}>
                    <Tag color="volcano">影响: {record.air_impact}</Tag>
                  </div>
                )}
              </div>
            );
          },
        },
        {
          title: '废水污染物',
          dataIndex: 'pollutants_liquid',
          key: 'pollutants_liquid',
          width: 200,
          render: (items, record) => {
            if (!items || !Array.isArray(items)) return '-';
            return (
              <div>
                {items.map((item, index) => (
                  item ? <Tag key={index} color="blue">{item}</Tag> : null
                )).filter(Boolean)}
                {record.water_impact && (
                  <div style={{ marginTop: '4px' }}>
                    <Tag color="volcano">影响: {record.water_impact}</Tag>
                  </div>
                )}
              </div>
            );
          },
        },
        {
          title: '固废污染物',
          dataIndex: 'pollutants_solid',
          key: 'pollutants_solid',
          width: 200,
          render: (items, record) => {
            if (!items || !Array.isArray(items)) return '-';
            return (
              <div>
                {items.map((item, index) => (
                  item ? <Tag key={index} color="orange">{item}</Tag> : null
                )).filter(Boolean)}
                {record.soil_impact && (
                  <div style={{ marginTop: '4px' }}>
                    <Tag color="volcano">影响: {record.soil_impact}</Tag>
                  </div>
                )}
              </div>
            );
          },
        },
      ],
    },
  ];

  const tabItems = [
    {
      key: '1',
      label: '企业项目资料',
      children: (
        <Card style={{ margin: '0 4px' }}>
          <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            scroll={{ x: 2800 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条数据`,
              showQuickJumper: true,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            size="middle"
            bordered
          />
        </Card>
      )
    },
    {
      key: '2',
      label: (
        <span>
          <ExperimentOutlined /> 项目有害物质
        </span>
      ),
      children: (
        <Card style={{ margin: '0 1px' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {analysisData.length === 0 && !analysisLoading && (
              <Alert
                message="暂无分析数据"
                description={'请点击"智能分析"按钮开始分析项目数据。'}
                type="info"
                showIcon
              />
            )}
            <Table
              columns={pollutionColumns}
              dataSource={analysisData}
              loading={analysisLoading}
              scroll={{ x: 1500 }}
              pagination={{
                pageSize:7,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条分析结果`,
                showQuickJumper: true,
              }}
              bordered
              size="middle"
              rowKey="key"
            />
          </Space>
        </Card>
      )
    },
    {
      key: '3',
      label: '项目地图分布',
      children: <div style={{ padding: '0 4px' }}>待开发内容</div>
    }
  ];

  const headerButtons = [
    <Button 
      key="refresh"
      type="primary" 
      icon={<ReloadOutlined />} 
      onClick={handleRefresh}
      loading={loading}
    >
      刷新数据
    </Button>,
    <Button 
      key="export"
      type="primary" 
      icon={<DownloadOutlined />} 
      onClick={handleExport}
      disabled={data.length === 0}
    >
      导出数据
    </Button>,
    <Dropdown
      key="analyze"
      menu={{
        items: analyzeMenuItems,
        onClick: ({ key }) => handleAnalyze(key as 'reanalyze' | 'append'),
      }}
      disabled={data.length === 0 || processing}
    >
      <Button type="primary" loading={processing}>
        <Space>
          智能分析
          <DownOutlined />
        </Space>
      </Button>
    </Dropdown>,
    <Button
      key="results"
      type="primary"
      icon={<FileSearchOutlined />}
      onClick={loadAnalysisResults}
      loading={queryLoading}
    >
      分析结果
    </Button>
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '20px' }}>
      <Header title="化工高能产业项目数据" buttons={headerButtons} />

      {error && (
        <Alert
          message="数据加载错误"
          description={error}
          type="error"
          showIcon
          closable
        />
      )}

      <Tabs
        activeKey={activeTabKey}
        items={tabItems}
        onChange={(key: string) => setActiveTabKey(key)}
      />
    </Space>
  );
};

export default ChemicalIndustry;

