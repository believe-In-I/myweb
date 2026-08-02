import { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Input, Space, Tag, message, Tooltip, Popconfirm } from 'antd';
import type { TableColumnType } from 'antd';
import {
  RightOutlined,
  LeftOutlined,
  DoubleRightOutlined,
  DoubleLeftOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  VerticalAlignTopOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';

interface DataItem {
  [key: string]: any;
}

interface CustomTableTransferProps {
  dataSource: DataItem[];            // 左侧可选数据列表
  total: number;                     // 左侧数据总数（用于分页）
  page: number;                      // 左侧当前页码
  pageSize: number;                  // 左侧每页条数
  searchText?: string;                // 左侧搜索关键词（受控）
  targetKeys: DataItem[];            // 右侧已选数据列表
  onPageChange: (page: number, pageSize: number) => void;  // 左侧分页变化回调
  onSearchChange?: (text: string) => void;   // 左侧搜索变化回调
  onChange: (targetKeys: DataItem[]) => void;  // 右侧已选数据变化回调
  rowKey?: string;                    // 数据唯一标识字段名
  leftColumns?: TableColumnType<DataItem>[];  // 左侧表格列配置
  rightColumns?: TableColumnType<DataItem>[];  // 右侧表格列配置
  pageSizeOptions?: number[];         // 左侧分页条数选项
  showSearch?: boolean;               // 是否显示左侧搜索框
  titles?: [React.ReactNode, React.ReactNode];  // 左右面板标题 [左侧标题, 右侧标题]
  width?: number | string;            // 组件总宽度
  height?: number | string;           // 组件高度（暂未使用）
}

const defaultLeftColumns: TableColumnType<DataItem>[] = [
  { title: '项目名称', dataIndex: 'projectName', key: 'projectName', width: 200 },
];

const defaultRightColumns: TableColumnType<DataItem>[] = [
  { title: '项目名称', dataIndex: 'projectName', key: 'projectName', width: 200 },
];

const CustomTableTransfer: React.FC<CustomTableTransferProps> = (props) => {
  const {
    dataSource = [],
    total = 0,
    page = 1,
    pageSize = 10,
    searchText = '',
    targetKeys = [],
    onPageChange,
    onSearchChange,
    onChange,
    rowKey = 'projectId',
    leftColumns = defaultLeftColumns,
    rightColumns = defaultRightColumns,
    pageSizeOptions = [10, 20, 50, 100],
    showSearch = true,
    titles,
    width = 800,
    height = 400,
  } = props;

  const [leftSelectedRowKeys, setLeftSelectedRowKeys] = useState<React.Key[]>([]);
  const [leftSearch, setLeftSearch] = useState(searchText);
  const [rightSelectedRowKeys, setRightSelectedRowKeys] = useState<React.Key[]>([]);
  const [rightPage, setRightPage] = useState(1);
  const [rightPageSize, setRightPageSize] = useState(10);

  useEffect(() => { setLeftSelectedRowKeys([]); }, [dataSource, page]);
  useEffect(() => { setRightSelectedRowKeys([]); }, [targetKeys]);
  useEffect(() => { setLeftSearch(searchText); }, [searchText]);
  useEffect(() => { setRightPage(1); }, [targetKeys]);

  // 已选中的 ID 集合，用于禁用左侧行
  const selectedIds = useMemo(
    () => new Set(targetKeys.map(item => item[rowKey])),
    [targetKeys, rowKey]
  );

  // 左侧实际展示的数据（已选的显示但禁用）
  const leftData = useMemo(() => {
    return dataSource.map(item => ({
      ...item,
      _disabled: selectedIds.has(item[rowKey]),
    }));
  }, [dataSource, selectedIds, rowKey]);

  // ========== 左侧操作 ==========
  const handleLeftSelectChange = useCallback((keys: React.Key[]) => {
    setLeftSelectedRowKeys(keys);
  }, []);

  const handleMoveToRight = useCallback(() => {
    if (leftSelectedRowKeys.length === 0) {
      message.warning('请先选择要添加的项目');
      return;
    }
    const selectedItems = dataSource.filter(item =>
      leftSelectedRowKeys.includes(item[rowKey])
    );
    const merged = [...targetKeys];
    const existingIds = new Set(merged.map(item => item[rowKey]));
    selectedItems.forEach(item => {
      if (!existingIds.has(item[rowKey])) {
        merged.push(item);
      }
    });
    onChange(merged);
    setLeftSelectedRowKeys([]);
  }, [leftSelectedRowKeys, dataSource, targetKeys, rowKey, onChange]);

  const handleMoveAllToRight = useCallback(() => {
    const filtered = dataSource.filter(
      item => !targetKeys.some(t => t[rowKey] === item[rowKey])
    );
    if (filtered.length === 0) {
      message.warning('当前页没有可添加的项目');
      return;
    }
    onChange([...targetKeys, ...filtered]);
  }, [dataSource, targetKeys, rowKey, onChange]);

  const handleLeftSearch = useCallback((value: string) => {
    setLeftSearch(value);
    onSearchChange?.(value);
  }, [onSearchChange]);

  // ========== 右侧操作 ==========
  const handleRightSelectChange = useCallback((keys: React.Key[]) => {
    setRightSelectedRowKeys(keys);
  }, []);

  const handleMoveToLeft = useCallback(() => {
    if (rightSelectedRowKeys.length === 0) {
      message.warning('请先选择要移除的项目');
      return;
    }
    onChange(targetKeys.filter(item => !rightSelectedRowKeys.includes(item[rowKey])));
    setRightSelectedRowKeys([]);
  }, [rightSelectedRowKeys, targetKeys, rowKey, onChange]);

  const handleMoveAllToLeft = useCallback(() => {
    onChange([]);
    setRightSelectedRowKeys([]);
  }, [onChange]);

  const handleRemoveItem = useCallback((record: DataItem) => {
    onChange(targetKeys.filter(item => item[rowKey] !== record[rowKey]));
  }, [targetKeys, rowKey, onChange]);

  const handleMoveItem = useCallback((
    record: DataItem,
    direction: 'top' | 'up' | 'down'
  ) => {
    const id = record[rowKey];
    const idx = targetKeys.findIndex(item => item[rowKey] === id);
    if (idx === -1) return;

    const clone = [...targetKeys];
    clone.splice(idx, 1);

    if (direction === 'top') {
      clone.unshift(record);
    } else if (direction === 'up') {
      clone.splice(Math.max(idx - 1, 0), 0, record);
    } else if (direction === 'down') {
      clone.splice(Math.min(idx + 1, clone.length), 0, record);
    }
    onChange(clone);
  }, [targetKeys, rowKey, onChange]);

  // ========== 列配置 ==========
  const leftTableColumns = useMemo(() => {
    const cols = [...leftColumns];
    if (!cols.find(c => c.key === 'status')) {
      cols.push({
        title: '状态',
        key: 'status',
        width: 80,
        render: (_: any, record: DataItem) =>
          record._disabled
            ? <Tag color="gray">已选</Tag>
            : <Tag color="blue">可选</Tag>,
      });
    }
    return cols;
  }, [leftColumns]);

  const rightTableColumns = useMemo(() => {
    const cols = [...rightColumns];
    if (!cols.find(c => c.key === 'actions')) {
      cols.push({
        title: '排序',
        key: 'actions',
        width: 160,
        render: (_: any, record: DataItem) => (
          <Space size={0} style={{ flexWrap: 'nowrap' }}>
            <Tooltip title="置顶">
              <Button type="link" size="small" icon={<VerticalAlignTopOutlined />}
                onClick={(e) => { e.stopPropagation(); handleMoveItem(record, 'top'); }} />
            </Tooltip>
            <Tooltip title="上移">
              <Button type="link" size="small" icon={<ArrowUpOutlined />}
                onClick={(e) => { e.stopPropagation(); handleMoveItem(record, 'up'); }} />
            </Tooltip>
            <Tooltip title="下移">
              <Button type="link" size="small" icon={<ArrowDownOutlined />}
                onClick={(e) => { e.stopPropagation(); handleMoveItem(record, 'down'); }} />
            </Tooltip>
            <Tooltip title="移除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />}
                onClick={(e) => { e.stopPropagation(); handleRemoveItem(record); }} />
            </Tooltip>
          </Space>
        ),
      });
    }
    return cols;
  }, [rightColumns, handleMoveItem, handleRemoveItem]);

  // ========== 分页 ==========
  const leftPagination = useMemo(() => ({
    current: page,
    pageSize,
    total,
    pageSizeOptions,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (t: number) => `共 ${t} 条`,
    onChange: onPageChange,
  }), [page, pageSize, total, pageSizeOptions, onPageChange]);

  const handleRightPageChange = useCallback((p: number, ps: number) => {
    setRightPage(p);
    setRightPageSize(ps);
  }, []);

  const rightPagination = useMemo(() => ({
    current: rightPage,
    pageSize: rightPageSize,
    total: targetKeys.length,
    pageSizeOptions: [10, 20, 50, 100],
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (t: number) => `已选 ${t} 条`,
    onChange: handleRightPageChange,
  }), [rightPage, rightPageSize, targetKeys.length, handleRightPageChange]);

  // ========== 样式 ==========
  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: 'auto',
    display: 'flex',
    border: '1px solid #d9d9d9',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  };

  const panelStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  };

  const headerStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid #d9d9d9',
    background: '#fafafa',
    fontWeight: 500,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const centerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 8px',
    borderLeft: '1px solid #d9d9d9',
    borderRight: '1px solid #d9d9d9',
    background: '#fafafa',
    gap: 8,
    minWidth: 60,
  };

  return (
    <div style={containerStyle}>
      {/* 左侧面板 */}
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span>
            {titles?.[0] || '可选列表'}
            <Tag style={{ marginLeft: 8 }}>共 {total} 条</Tag>
          </span>
        </div>
        {showSearch && (
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
            <Input
              placeholder="搜索项目名称"
              prefix={<SearchOutlined />}
              value={leftSearch}
              onChange={e => handleLeftSearch(e.target.value)}
              allowClear
            />
          </div>
        )}
        <Table
          rowKey={rowKey}
          dataSource={leftData}
          columns={leftTableColumns}
          size="small"
          pagination={leftPagination}
          rowSelection={{
            selectedRowKeys: leftSelectedRowKeys,
            onChange: handleLeftSelectChange,
            getCheckboxProps: (record: DataItem) => ({
              disabled: record._disabled,
            }),
          }}
          scroll={{ y: 300 }}
          style={{ flex: 1 }}
        />
      </div>

      {/* 中间操作区 */}
      <div style={centerStyle}>
        <Button
          type="primary"
          icon={<RightOutlined />}
          size="small"
          onClick={handleMoveToRight}
          disabled={leftSelectedRowKeys.length === 0}
          title="添加选中"
        />
        <Button
          icon={<DoubleRightOutlined />}
          size="small"
          onClick={handleMoveAllToRight}
          title="添加全部"
        />
        <Popconfirm
          title="确定要清空全部已选吗？"
          okText="确定"
          cancelText="取消"
          onConfirm={handleMoveAllToLeft}
          disabled={targetKeys.length === 0}
        >
          <Button
            icon={<DoubleLeftOutlined />}
            size="small"
            disabled={targetKeys.length === 0}
            title="清空已选"
          />
        </Popconfirm>
        <Button
          icon={<LeftOutlined />}
          size="small"
          onClick={handleMoveToLeft}
          disabled={rightSelectedRowKeys.length === 0}
          title="移除选中"
        />
      </div>

      {/* 右侧面板 */}
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span>
            {titles?.[1] || '已选列表'}
            <Tag color="green" style={{ marginLeft: 8 }}>{targetKeys.length} 条</Tag>
          </span>
        </div>
        <Table
          rowKey={rowKey}
          dataSource={targetKeys}
          columns={rightTableColumns}
          size="small"
          pagination={targetKeys.length > 10 ? rightPagination : false}
          rowSelection={{
            selectedRowKeys: rightSelectedRowKeys,
            onChange: handleRightSelectChange,
          }}
          scroll={{ y: 300 }}
          style={{ flex: 1 }}
        />
        <div style={{ padding: '8px 12px', borderTop: '1px solid #d9d9d9', background: '#fafafa', textAlign: 'right' }}>
          <Button
            danger
            size="small"
            onClick={handleMoveToLeft}
            disabled={rightSelectedRowKeys.length === 0}
          >
            移除选中 ({rightSelectedRowKeys.length})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomTableTransfer;
