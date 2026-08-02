import React, {
    useEffect,
    useImperativeHandle,
    useState,
    useMemo,
    forwardRef,
  } from 'react';
  import { Button, Form, FormInstance, Input, Select, TableColumnType, message } from 'antd';
  import { Transfer } from 'antd';
  import { ArrowUpOutlined } from '@ant-design/icons';
  import { TransferDirection, TransferItem } from 'antd/es/transfer';
//   import { any, IListProjectResPage } from '@/pages/main/services';
  import TableTransfer from './TableTransfer';
  
  export interface CreateHandle {
    getForm: () => FormInstance<CreateFormFields>;
  }
  
  interface CreateProps {
    dataSource: any;
    projectPage: any;
    onChangeLeftTable?: (e: any, event: string) => void;
    onPageChange?: (page: number, pageSize: number) => void;
  }
  
  // istanbul ignore file
  export default forwardRef((props: CreateProps, ref) => {
    const [form] = Form.useForm<CreateFormFields>();
  
    const [targetKeys, setTargetKeys] = useState<React.Key[]>([]);
    // 缓存右侧已选中的数据，用于合并到 dataSource
    const [rightSelectedCache, setRightSelectedCache] = useState<any[]>([]);
  
    const { dataSource = [], projectPage, onChangeLeftTable, onPageChange } = props;
  
    const [projectSetToolTip, setProjectSetToolTip] = useState('');
  
    useImperativeHandle(ref, () => ({
      getValue() {
        return targetKeys;
      },
      getForm() {
        return form;
      },
    }));

    // 核心：合并后的数据源，包含左侧当前页数据 + 右侧已选中的所有数据
    const transferDataSource = useMemo(() => {
      // 找出当前 dataSource 中不在 targetKeys 中的项目（左侧项目）
      const leftItems = dataSource.filter(item => !targetKeys.includes(item.projectId));
      
      // 使用 Map 去重，保留右侧缓存中的数据
      const dataMap = new Map<number, any>();
      
      // 先添加右侧缓存数据
      rightSelectedCache.forEach(item => {
        dataMap.set(item.projectId, item);
      });
      // 再添加左侧当前页数据（如果右侧缓存中没有，就添加）
      leftItems.forEach(item => {
        if (!dataMap.has(item.projectId)) {
          dataMap.set(item.projectId, item);
        }
      });
      
      return Array.from(dataMap.values());
    }, [dataSource, targetKeys, rightSelectedCache]);

    // 监听 targetKeys 变化，更新右侧缓存
    useEffect(() => {
      // 找出新增到右侧的项目
      const newRightItems = dataSource.filter(
        item => targetKeys.includes(item.projectId) && !rightSelectedCache.some(r => r.projectId === item.projectId)
      );
      
      if (newRightItems.length > 0) {
        setRightSelectedCache(prev => {
          const prevIds = new Set(prev.map(p => p.projectId));
          const merged = [...prev];
          newRightItems.forEach(item => {
            if (!prevIds.has(item.projectId)) {
              merged.push(item);
            }
          });
          return merged;
        });
      }
    }, [targetKeys, dataSource]);
  
    const validateTransfer = (_: any, value: number[]) => {
      if (!value || value.length === 0) {
        return Promise.reject(new Error('请选择至少两个项目'));
      }
      if (value.length < 2) {
        return Promise.reject(new Error('至少需要选择两个项目'));
      }
      return Promise.resolve();
    };
  
    const onChange: (
      nextTargetKeys: React.Key[],
      direction: TransferDirection,
      moveKeys: React.Key[]
    ) => void = (nextTargetKeys) => {
      setTargetKeys(nextTargetKeys);
    };

    // 模拟分页请求新数据
    const mockFetchNewData = () => {
      message.loading('正在加载新数据...', 1);
      const page = Math.floor(Math.random() * 5) + 1;
      if (onPageChange) {
        onPageChange(page, 10);
      }
    };

    const move = (key: any, direction: string) => {
      const idx = targetKeys.indexOf(key);
      if (idx === -1) return;
      const clone = [...targetKeys];
      clone.splice(idx, 1);
      if (direction === 'up') {
        clone.splice(Math.max(idx - 1, 0), 0, key);
      } else if (direction === 'down') {
        clone.splice(idx + 1, 0, key);
      } else {
        clone.unshift(key);
      }
      setTargetKeys(clone);
      form.setFieldValue('projectIds', clone);
    };
  
    const handleValueChange = (changeValues: CreateFormFields) => {
      if (changeValues.projectSetAnalysisType) {
        if (changeValues.projectSetAnalysisType === '1') {
          setProjectSetToolTip('');
        } else {
          setProjectSetToolTip('(按项目时间从新到旧排序)');
        }
      }
    };
  
    const leftColumns: TableColumnType<any>[] = [
      {
        key: 'projectName',
        title: '项目名称',
      },
    ];
  
    const rightColumns: TableColumnType<any>[] = [
      {
        key: 'projectName',
        title: '项目名称',
      },
      {
        key: 'btn',
        title: '操作',
        render: (aa: any, tags: any) => {
          return (
            <div style={{ display: 'flex' }}>
              <Button
                type="link"
                size="small"
                style={{ fontSize: '12px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  move(tags.projectId, 'top');
                }}
              >
                置顶
              </Button>
              <Button
                type="link"
                size="small"
                icon={<ArrowUpOutlined />}
                style={{ fontSize: '12px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  move(tags.projectId, 'up');
                }}
              >
                上移
              </Button>
              <Button
                type="link"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  move(tags.projectId, 'down');
                }}
              >
                下移
              </Button>
            </div>
          );
        },
      },
    ];
  
    const filterOption = (input: string, item: any) => {
      return item.projectName?.includes(input);
    };
  
    return (
      <Form
        form={form}
        initialValues={{ projectSetAnalysisType: '1' }}
        onValuesChange={handleValueChange}
        layout="vertical"
      >
        <Form.Item
          label="项目集名称"
          name="projectSetName"
          rules={[{ required: true, message: '请输入项目集名称!' }]}
        >
          <Input placeholder="请输入项目集名称" />
        </Form.Item>
  
        <Form.Item
          name="projectSetAnalysisType"
          label="项目血缘分析模式"
          tooltip={
            <div>
              混合模式: 分析每个项目与其它所有项目的血缘关系
              <div />
              顺序模式: 按照项目时间排序后，分析每个项目与其相邻项目的血缘关系
              <div />
              {projectSetToolTip}
            </div>
          }
          rules={[{ required: true, message: '请选择项目血缘分析方式' }]}
        >
          <Select
            options={[
              { label: '混合模式', value: '1' },
              { label: '顺序模式', value: '2' },
            ]}
          />
        </Form.Item>
  
        <Form.Item
          name="projectIds"
          label="项目列表"
          rules={[{ validator: validateTransfer }]}
          validateTrigger={false}
        >
          <TableTransfer
            dataSource={transferDataSource}
            leftColumns={leftColumns}
            rightColumns={rightColumns}
            targetKeys={targetKeys}
            rowKey="projectId"
            showSearch={false}
            onChange={onChange}
            filterOption={filterOption}
            projectPage={projectPage}
            onChangeLeftTable={onChangeLeftTable}
          />
        </Form.Item>
      </Form>
    );
  });
  
  export interface CreateFormFields {
    /** 项目集名称 */
    projectSetName: string;
    /** 项目id 列表 */
    projectIds: number[];
    /** 项目集分析方式 */
    projectSetAnalysisType: string;
  }