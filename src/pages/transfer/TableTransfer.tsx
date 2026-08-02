import React from 'react';
import { Table, TableColumnType, Transfer, TransferProps } from 'antd';
import { TableRowSelection } from 'antd/es/table/interface';

interface TableTransferProps extends TransferProps {
  dataSource: any[];
  leftColumns: TableColumnType<any>[];
  rightColumns: TableColumnType<any>[];
  onChangeLeftTable?: (page: number, pageSize: number) => void;
  projectPage: any;
}

/**
 * 表格穿梭框
 * 核心：dataSource 包含所有数据（左侧当前页 + 右侧已选中），
 * Transfer 会根据 targetKeys 自动区分左右两侧
 */
const TableTransfer: React.FC<TableTransferProps> = (props) => {
  const {
    leftColumns,
    rightColumns,
    onChangeLeftTable,
    projectPage,
    ...restProps
  } = props;

  return (
    <Transfer
      style={{ width: '100%', height: '100%' }}
      {...restProps}
    >
      {({
        direction,
        filteredItems,
        onItemSelect,
        onItemSelectAll,
        selectedKeys: listSelectedKeys,
        disabled: listDisabled,
      }) => {
        const columns = direction === 'left' ? leftColumns : rightColumns;

        const rowSelection: TableRowSelection<any> = {
          getCheckboxProps: () => ({ disabled: listDisabled }),
          onChange(selectedRowKeys) {
            onItemSelectAll(selectedRowKeys, 'replace');
          },
          selectedRowKeys: listSelectedKeys,
        };

        // 直接使用 filteredItems，Transfer 会自动过滤
        return (
          <Table
            rowKey="projectId"
            dataSource={filteredItems}
            columns={columns}
            size="small"
            pagination={{
              ...projectPage,
              pageSizeOptions: ['10', '20', '50', '100'],
              showSizeChanger: true,
              onChange: (page, pageSize) => {
                if (direction === 'left' && onChangeLeftTable) {
                  onChangeLeftTable(page, pageSize);
                }
              },
            }}
            rowSelection={rowSelection}
            onRow={(record) => ({
              onClick: () => {
                if (listDisabled) return;
                const checked = !listSelectedKeys.includes(record.projectId);
                onItemSelect(record.projectId, checked);
              },
            })}
          />
        );
      }}
    </Transfer>
  );
};

export default TableTransfer;
