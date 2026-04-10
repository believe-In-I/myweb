import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Button, Table, message, Space, Typography } from 'antd';
import idbStorage from '../utils/indexedDB';
import useResponsive from '@/hooks/useResponsive';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const IndexedDBTestPage = () => {
  // 响应式状态
  const { isMobile, isTablet } = useResponsive();
  
  const [key, setKey] = useState('');
  const [textValue, setTextValue] = useState('');
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchConditions, setSearchConditions] = useState({
    nameKeyword: '',
    exactMatch: false,
    types: [],
    minSize: 0,
    maxSize: Infinity,
    startDate: 0,
    endDate: Infinity
  });
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchForm, setShowSearchForm] = useState(false);

  // 加载IndexedDB数据
  const loadData = async () => {
    setLoading(true);
    try {
      const allData = await idbStorage.getAll();
      setDataList(allData);
    } catch (error) {
      message.error('加载数据失败');
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 处理存储数据
  const handleStoreData = async () => {
    if (!key) {
      message.error('请输入key');
      return;
    }

    if (!textValue) {
      message.error('请输入文本内容');
      return;
    }

    try {
      await idbStorage.setItem(key, textValue);
      message.success('存储成功');
      loadData();
      setKey('');
      setTextValue('');
    } catch (error) {
      message.error('存储失败');
      console.error('存储失败:', error);
    }
  };

  // 处理删除数据
  const handleDelete = async (key) => {
    try {
      await idbStorage.removeItem(key);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
      console.error('删除失败:', error);
    }
  };

  // 处理搜索条件变化
  const handleSearchChange = (field, value) => {
    setSearchConditions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 执行搜索
  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await idbStorage.query(searchConditions);
      setSearchResults(results);
      message.success(`找到 ${results.length} 条匹配数据`);
    } catch (error) {
      message.error('搜索失败');
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重置搜索
  const handleResetSearch = () => {
    setSearchConditions({
      nameKeyword: '',
      exactMatch: false,
      types: [],
      minSize: 0,
      maxSize: Infinity,
      startDate: 0,
      endDate: Infinity
    });
    setSearchResults([]);
  };

  // 关闭搜索表单
  const handleCloseSearchForm = () => {
    setShowSearchForm(false);
    setSearchResults([]);
  };

  // 响应式配置
  const paddingSize = isMobile ? 12 : 20;
  const inputWidth = isMobile ? '100%' : 300;
  const gridColumns = isMobile ? 1 : 2;
  const textareaRows = isMobile ? 3 : 4;

  // 表格列配置（响应式）
  const getColumns = () => [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: isMobile ? 100 : undefined,
      ellipsis: isMobile,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (text) => (
        <TextArea 
          value={text} 
          readOnly 
          rows={isMobile ? 2 : 3} 
          style={{ width: '100%', fontSize: isMobile ? 12 : 14 }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: isMobile ? 60 : 80,
      render: (_, record) => (
        <Button 
          danger 
          size={isMobile ? 'small' : 'middle'}
          onClick={() => handleDelete(record.key)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: paddingSize }}>
      <Card title={isMobile ? "IndexedDB测试" : "IndexedDB 测试"} size="small">
        <div style={{ marginBottom: isMobile ? 12 : 20 }}>
          {/* 输入区域 */}
          <div style={{ marginBottom: isMobile ? 8 : 10 }}>
            <Text strong style={{ fontSize: isMobile ? 12 : 14, display: 'block', marginBottom: 8 }}>存储数据</Text>
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row', 
              gap: isMobile ? 8 : 10,
              alignItems: isMobile ? 'stretch' : 'center'
            }}>
              <Input 
                placeholder="请输入key" 
                value={key} 
                onChange={(e) => setKey(e.target.value)}
                style={{ width: inputWidth }}
                size={isMobile ? 'middle' : 'middle'}
              />
              <Button type="primary" onClick={handleStoreData} size={isMobile ? 'middle' : 'middle'}>
                存储
              </Button>
            </div>
          </div>
          
          <TextArea 
            placeholder="请输入文本内容" 
            value={textValue} 
            onChange={(e) => setTextValue(e.target.value)}
            rows={textareaRows} 
            style={{ width: '100%', marginTop: isMobile ? 8 : 10 }}
          />

          {/* 搜索按钮 */}
          <div style={{ marginTop: isMobile ? 8 : 12 }}>
            <Button 
              type={showSearchForm ? 'primary' : 'default'}
              onClick={() => setShowSearchForm(!showSearchForm)}
              size={isMobile ? 'middle' : 'middle'}
            >
              {showSearchForm ? '关闭搜索' : '打开搜索'}
            </Button>
          </div>
          
          {/* 搜索表单 */}
          {showSearchForm && (
            <Card title="搜索条件" style={{ marginTop: isMobile ? 12 : 20 }} size="small">
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridColumns}, 1fr)`, gap: isMobile ? 12 : 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: isMobile ? 12 : 14 }}>文件名关键词</label>
                  <Input 
                    placeholder="请输入关键词" 
                    value={searchConditions.nameKeyword}
                    onChange={(e) => handleSearchChange('nameKeyword', e.target.value)}
                    size={isMobile ? 'middle' : 'middle'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: isMobile ? 12 : 14 }}>精确匹配</label>
                  <Select 
                    value={searchConditions.exactMatch}
                    onChange={(value) => handleSearchChange('exactMatch', value)}
                    style={{ width: '100%' }}
                    size={isMobile ? 'middle' : 'middle'}
                  >
                    <Option value={false}>模糊匹配</Option>
                    <Option value={true}>精确匹配</Option>
                  </Select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: isMobile ? 12 : 14 }}>最小大小 (字节)</label>
                  <Input 
                    type="number" 
                    placeholder="请输入最小大小" 
                    value={searchConditions.minSize || ''}
                    onChange={(e) => handleSearchChange('minSize', Number(e.target.value) || 0)}
                    size={isMobile ? 'middle' : 'middle'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: isMobile ? 12 : 14 }}>最大大小 (字节)</label>
                  <Input 
                    type="number" 
                    placeholder="请输入最大大小" 
                    value={searchConditions.maxSize === Infinity ? '' : searchConditions.maxSize}
                    onChange={(e) => handleSearchChange('maxSize', Number(e.target.value) || Infinity)}
                    size={isMobile ? 'middle' : 'middle'}
                  />
                </div>
              </div>
              <div style={{ marginTop: isMobile ? 12 : 16, display: 'flex', gap: isMobile ? 6 : 10, flexWrap: 'wrap' }}>
                <Button type="primary" onClick={handleSearch} size={isMobile ? 'middle' : 'middle'}>搜索</Button>
                <Button onClick={handleResetSearch} size={isMobile ? 'middle' : 'middle'}>重置</Button>
                <Button onClick={handleCloseSearchForm} size={isMobile ? 'middle' : 'middle'}>关闭</Button>
              </div>
            </Card>
          )}
        </div>

        {/* 数据列表 */}
        <Card 
          title={searchResults.length > 0 ? `搜索结果 (${searchResults.length})` : "数据列表"} 
          size="small"
          styles={{ header: { fontSize: isMobile ? 13 : 14 } }}
        >
          <Table 
            columns={getColumns()} 
            dataSource={(searchResults.length > 0 ? searchResults : dataList).map(item => ({ ...item, key: item.key }))}
            loading={loading}
            pagination={isMobile ? false : { pageSize: 10 }}
            size={isMobile ? 'small' : 'middle'}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </Card>
    </div>
  );
};

export default IndexedDBTestPage;