import { useState, useCallback, useEffect } from 'react';
import { Card, message, Button, Space, Tag } from 'antd';
import CustomTableTransfer from './CustomTableTransfer';

const TOTAL_RECORDS = 100;

const generateData = (page: number, pageSize: number) => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const list = [];
  for (let i = start; i < end && i < TOTAL_RECORDS; i++) {
    list.push({
      projectId: i + 1,
      projectName: `项目${String(i + 1).padStart(3, '0')} - ${['数据分析平台', '用户行为系统', '实时监控大屏', '推荐引擎', '数据湖仓'][i % 5]}`,
    });
  }
  return list;
};

function TestPage() {
  const [targetKeys, setTargetKeys] = useState<any[]>([]);
  const [leftData, setLeftData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    setLeftData(generateData(page, pageSize));
  }, [page, pageSize, searchText]);

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    setPage(1);
  }, []);

  const handleSubmit = useCallback(() => {
    if (targetKeys.length === 0) {
      message.warning('请至少选择一个项目');
      return;
    }
    message.success(`已选择 ${targetKeys.length} 个项目`);
    console.log('选中的项目:', targetKeys);
  }, [targetKeys]);

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="自定义表格穿梭框"
        extra={
          <Space>
            <Tag color="blue">共 {TOTAL_RECORDS} 条</Tag>
            <Tag color="green">已选 {targetKeys.length} 条</Tag>
          </Space>
        }
      >
        <CustomTableTransfer
          dataSource={leftData}
          total={TOTAL_RECORDS}
          page={page}
          pageSize={pageSize}
          searchText={searchText}
          targetKeys={targetKeys}
          onPageChange={handlePageChange}
          onSearchChange={handleSearchChange}
          onChange={(val) => setTargetKeys(val)}
          rowKey="projectId"
          titles={['可选项目', '已选项目']}
          width="100%"
          height={400}
        />

        <div style={{ marginTop: 16 }}>
          <Space>
            <Button type="primary" onClick={handleSubmit}>
              提交
            </Button>
            <Button onClick={() => setTargetKeys([])}>
              清空
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}

export default TestPage;
