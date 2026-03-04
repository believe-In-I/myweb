import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Button, Upload, Table, message, Space } from 'antd';
import idbStorage from '../utils/indexedDB';

const { Option } = Select;
const { TextArea } = Input;

const IndexedDBTestPage = () => {
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
      // 重新加载数据
      loadData();
      // 清空输入
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
      // 重新加载数据
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



  // 表格列配置
  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (text) => (
        <TextArea 
          value={text} 
          readOnly 
          rows={3} 
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            danger 
            onClick={() => handleDelete(record.key)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Card title="IndexedDB 测试">
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Input 
                placeholder="请输入key" 
                value={key} 
                onChange={(e) => setKey(e.target.value)}
                style={{ width: '300px', marginRight: '10px' }}
              />
              <Button type="primary" onClick={handleStoreData}>
                存储
              </Button>
            </div>
            <Button 
              type="default" 
              onClick={() => setShowSearchForm(!showSearchForm)}
            >
              {showSearchForm ? '关闭搜索' : '打开搜索'}
            </Button>
          </div>
          
          <TextArea 
            placeholder="请输入文本内容" 
            value={textValue} 
            onChange={(e) => setTextValue(e.target.value)}
            rows={4} 
            style={{ width: '100%', marginTop: '10px' }}
          />
          
          {/* 搜索表单 */}
          {showSearchForm && (
            <Card title="搜索条件" style={{ marginTop: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px' }}>文件名关键词</label>
                  <Input 
                    placeholder="请输入关键词" 
                    value={searchConditions.nameKeyword}
                    onChange={(e) => handleSearchChange('nameKeyword', e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px' }}>精确匹配</label>
                  <Select 
                    value={searchConditions.exactMatch}
                    onChange={(value) => handleSearchChange('exactMatch', value)}
                    style={{ width: '100%' }}
                  >
                    <Option value={false}>模糊匹配</Option>
                    <Option value={true}>精确匹配</Option>
                  </Select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px' }}>最小大小 (字节)</label>
                  <Input 
                    type="number" 
                    placeholder="请输入最小大小" 
                    value={searchConditions.minSize || ''}
                    onChange={(e) => handleSearchChange('minSize', Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px' }}>最大大小 (字节)</label>
                  <Input 
                    type="number" 
                    placeholder="请输入最大大小" 
                    value={searchConditions.maxSize === Infinity ? '' : searchConditions.maxSize}
                    onChange={(e) => handleSearchChange('maxSize', Number(e.target.value) || Infinity)}
                  />
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <Button type="primary" onClick={handleSearch}>搜索</Button>
                <Button onClick={handleResetSearch}>重置</Button>
                <Button onClick={handleCloseSearchForm}>关闭</Button>
              </div>
            </Card>
          )}
        </div>

        <Card title={searchResults.length > 0 ? "搜索结果" : "IndexedDB 数据列表"}>
          <Table 
            columns={columns} 
            dataSource={(searchResults.length > 0 ? searchResults : dataList).map(item => ({ ...item, key: item.key }))}
            loading={loading}
            pagination={false}
          />
        </Card>
      </Card>
    </div>
  );
};

export default IndexedDBTestPage;