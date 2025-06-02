import React, { useState, useEffect } from 'react';
import {
  Card,
  Select,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  Button,
  message,
  Descriptions,
  Tag,
  Tooltip,
  Divider,
  Row,
  Col,
} from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  capabilities: {
    chat: boolean;
    completion: boolean;
    embedding: boolean;
  };
  context_length: number;
  cost_per_token: {
    input: number;
    output: number;
  };
}

interface ProviderInfo {
  name: string;
  description: string;
  status: string;
  is_server_managed: boolean;
  models: ModelInfo[];
}

interface ModelsData {
  [key: string]: ProviderInfo;
}

const AiModelConfig: React.FC = () => {
  const [form] = Form.useForm();
  const [providers, setProviders] = useState<ModelsData>({});
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 获取所有模型数据
  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5505/api/ai/llm/models');
      setProviders(response.data);
    } catch (error) {
      message.error('获取模型列表失败');
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // 处理提供商变更
  const handleProviderChange = (value: string) => {
    setSelectedProvider(value);
    setSelectedModel(''); // 清空已选模型
    form.resetFields(['model_id']); // 重置模型选择
  };

  // 处理模型变更
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    // 设置默认参数
    const model = providers[selectedProvider]?.models.find(m => m.id === value);
    if (model) {
      form.setFieldsValue({
        temperature: 0.7,
        max_tokens: Math.min(2048, model.context_length),
        top_p: 0.95,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
      });
    }
  };

  // 获取当前选中模型的信息
  const getCurrentModelInfo = (): ModelInfo | undefined => {
    if (!selectedProvider || !selectedModel) return undefined;
    return providers[selectedProvider]?.models.find(m => m.id === selectedModel);
  };

  const modelInfo = getCurrentModelInfo();

  return (
    <div style={{ padding: '24px',backgroundColor: 'rgba(54, 163, 247, 0.1)' }}>
      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 0.95,
            frequency_penalty: 0.1,
            presence_penalty: 0.1,
          }}
        >
          {/* 提供商选择 */}
          <Form.Item
            label="选择提供商"
            name="provider"
            rules={[{ required: true, message: '请选择提供商' }]}
          >
            <Select
              placeholder="请选择 AI 提供商"
              onChange={handleProviderChange}
              style={{ width: '100%' }}
            >
              {Object.entries(providers).map(([key, provider]) => (
                <Select.Option key={key} value={key}>
                  <Space>
                    {provider.name}
                    <Tag color={provider.status === 'active' ? 'green' : 'red'}>
                      {provider.status}
                    </Tag>
                    <Tag color={provider.is_server_managed ? 'blue' : 'orange'}>
                      {provider.is_server_managed ? '服务器管理' : '本地管理'}
                    </Tag>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* 模型选择 */}
          <Form.Item
            label="选择模型"
            name="model_id"
            rules={[{ required: true, message: '请选择模型' }]}
          >
            <Select
              placeholder="请选择模型"
              onChange={handleModelChange}
              disabled={!selectedProvider}
              style={{ width: '100%' }}
            >
              {providers[selectedProvider]?.models.map((model) => (
                <Select.Option key={model.id} value={model.id}>
                  <Space>
                    {model.name}
                    <Tooltip title={model.description}>
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />

          {/* 模型信息显示 */}
          {modelInfo && (
            <Descriptions title="模型信息" bordered size="small" column={2}>
              <Descriptions.Item label="上下文长度">
                {modelInfo.context_length.toLocaleString()} tokens
              </Descriptions.Item>
              <Descriptions.Item label="费用">
                输入: ${modelInfo.cost_per_token.input}/token<br />
                输出: ${modelInfo.cost_per_token.output}/token
              </Descriptions.Item>
              <Descriptions.Item label="功能" span={2}>
                {modelInfo.capabilities.chat && <Tag color="blue">对话</Tag>}
                {modelInfo.capabilities.completion && <Tag color="green">补全</Tag>}
                {modelInfo.capabilities.embedding && <Tag color="purple">向量</Tag>}
              </Descriptions.Item>
            </Descriptions>
          )}

          <Divider />

          {/* 模型参数设置 */}
          <div style={{ display: selectedModel ? 'block' : 'none' }}>
            <h3>模型参数设置</h3>
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Form.Item
                  label={
                    <Space>
                      温度系数 (Temperature)
                      <Tooltip title="控制输出的随机性，较高的值会使输出更加随机和创造性，较低的值会使输出更加确定和一致。
                        • 0.1-0.3：更确定、一致的回答
                        • 0.4-0.7：平衡的创造性和一致性
                        • 0.8-1.0：更有创意和多样化的回答">
                        <QuestionCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                  name="temperature"
                >
                  <InputNumber
                    min={0}
                    max={2}
                    step={0.1}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label={
                    <Space>
                      最大长度 (Maximum Length)
                      <Tooltip title="生成文本的最大长度（以 token 为单位）。
                        • 较短回答：500-1000 tokens
                        • 中等长度：1000-2000 tokens
                        • 长回答：2000+ tokens">
                        <QuestionCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                  name="max_tokens"
                >
                  <InputNumber
                    min={1}
                    max={modelInfo?.context_length || 4096}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label={
                    <Space>
                      采样阈值 (Top P)
                      <Tooltip title="控制输出的多样性，较低的值会使输出更加集中。
                        • 0.1-0.3：更保守、确定的选择
                        • 0.4-0.7：平衡的多样性
                        • 0.8-1.0：更多样化的输出">
                        <QuestionCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                  name="top_p"
                >
                  <InputNumber
                    min={0}
                    max={1}
                    step={0.05}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label={
                    <Space>
                      频率惩罚 (Frequency Penalty)
                      <Tooltip title="降低模型重复使用相同词语的倾向。
                        • 负值：允许更多重复
                        • 0：中性
                        • 正值：减少重复">
                        <QuestionCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                  name="frequency_penalty"
                >
                  <InputNumber
                    min={-2}
                    max={2}
                    step={0.1}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label={
                    <Space>
                      主题惩罚 (Presence Penalty)
                      <Tooltip title="增加模型谈论新主题的倾向。
                        • 负值：更倾向于重复已提到的主题
                        • 0：中性
                        • 正值：更倾向于探索新主题">
                        <QuestionCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                  name="presence_penalty"
                >
                  <InputNumber
                    min={-2}
                    max={2}
                    step={0.1}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>

              <Col span={12} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <Form.Item>
                  <Button type="primary" onClick={() => form.submit()}>
                    保存配置
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default AiModelConfig;
