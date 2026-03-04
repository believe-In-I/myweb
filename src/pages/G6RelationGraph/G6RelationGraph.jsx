import React, { useEffect, useRef, useState } from 'react';
import { Graph } from '@antv/g6';
import data from './datas/data';
// 直接导入findFeedbackArcs函数
import { Button, Space ,Select } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { calculateNodeLevels } from './datas/cengji';
import g6data from './datas/g6data';

// // 转换数据格式以适应G6 v5
const transformData = (originalData, maxDepth = Infinity) => {
  // 创建节点映射，使用sourceReqId作为唯一标识
  const nodeMap = new Map();
  const filteredNodes = new Set();

  // 过滤并转换节点，只保留小于等于maxDepth的节点
  const nodes = originalData.nodes
    .filter(node => node.depth <= maxDepth)
    .map((node, index) => {
      const nodeId = node.sourceReqId || `node_${index}`;
      nodeMap.set(node.name, nodeId);
      filteredNodes.add(node.name);

      // 简化节点标签，只保留最后一个下划线后的内容
      let label = node.name;
      const underscoreIndex = node.name.lastIndexOf('_');
      if (underscoreIndex !== -1) {
        label = node.name.substring(underscoreIndex + 1);
      }

      // 构建节点配置
      const nodeConfig = {
        id: nodeId,
        label: label,
        name: node.name,
        depth: node.depth, // 保存原始深度信息
        // G6 v5节点配置
        size: [120, 40],
        style: {
          fill: node.itemStyle?.color || '#ceccbc',
          stroke: '#666',
          lineWidth: 2,
          radius: 6,
        },
        labelCfg: {
          style: {
            fontSize: 12,
            fill: '#333',
            textWrap: 'wrap',
            maxLineWidth: 100
          }
        }
      };

      // 如果节点数据中包含x/y属性，则使用自定义位置
      // if (node.x !== undefined && node.y !== undefined) {
      //   nodeConfig.x = node.x;
      //   nodeConfig.y = node.y;
      // }

      return nodeConfig;
    });

  // 转换边，过滤掉无效的边，只保留两端节点都在过滤后的节点集中的边
  const validLinks = originalData.links.filter(link => {
    // 确保source和target都存在于过滤后的节点集中
    return filteredNodes.has(link.source) && filteredNodes.has(link.target);
  });

  // 准备用于调用findFeedbackArcs的数据
  const fasNodes = originalData.nodes
    .filter(node => node.depth <= maxDepth)
    .map(node => ({
      ...node,
      name: node.name
    }));

  const fasLinks = validLinks.map(link => ({
    ...link,
    source: link.source,
    target: link.target,
    weight: link.value || 1
  }));


  // 过滤掉需要移除的边，得到无环边
  const edges = validLinks.map((link, index) => {
    return {
      id: `edge_${index}`,
      source: nodeMap.get(link.source),
      target: nodeMap.get(link.target),
      // G6 v5边配置
      type: 'polyline',
      style: {
        stroke: link.lineStyle?.color || '#ccc',
        lineWidth: 2
      },
      labelCfg: {
        autoRotate: true,
        style: {
          fontSize: 10,
          fill: '#666'
        }
      }
    };
  });

  console.log('原始边数量:', validLinks.length);
  console.log('去环后边数量:', edges.length);

  // G6 v5要求返回的格式
  return {
    nodes,
    edges
  };
};

const G6RelationGraph = ({ width = '100%', height = '800px' }) => {
  const graphRef = useRef(null);
  const containerRef = useRef(null);
  // 添加状态管理，控制显示的最大层级
  const [maxDepth, setMaxDepth] = useState(4); // 默认显示所有5层级（0-4）
  const [levels, setLevels] = useState([]);
  // 添加状态管理，控制是否移除环
  const [removeCycles, setRemoveCycles] = useState(true); // 默认移除环
  // 添加状态管理，控制ranker算法
  const [ranker, setRanker] = useState('network-simplex'); // 默认使用network-simplex算法
  // 添加状态管理，控制边类型
  const [edgeType, setEdgeType] = useState('polyline'); // 默认使用polyline边
  // 初始化层级名称映射
  let graphData = calculateNodeLevels(g6data);
  useEffect(() => {
    // 从data中提取层级信息
    const levelMap = new Map();
    data.nodes.forEach(node => {
      levelMap.set(node.depth, node.name.split('_')[0]);
    });

    // 转换为数组并排序
    const levelArray = Array.from(levelMap.entries()).sort((a, b) => a[0] - b[0]);
    setLevels(levelArray);
  }, []); 

  useEffect(() => { 
    if (!containerRef.current) return;

    // 转换数据，传入当前最大层级和是否移除环的标志
    // const graphData = transformData(data, maxDepth);

    console.log('G6数据:', graphData);

    // 获取容器尺寸，确保有默认值
    const containerWidth = containerRef.current.offsetWidth || 1000;
    const containerHeight = parseInt(height) || 600;

    console.log('容器尺寸:', containerWidth, containerHeight);
    console.log('节点数量:', graphData.nodes.length);
    console.log('边数量:', graphData.edges.length);

    // 确保数据有节点和边
    if (graphData.nodes.length === 0) {
      console.error('没有节点数据');
      return;
    }

    // 销毁旧的图实例
    if (graphRef.current) {
      graphRef.current.destroy();
      graphRef.current = null;
    }

    let nodeColor = {
      0: '#FF0000',
      1: '#00FF00',
      2: '#0000FF',
      3: '#FFFF00',
      4: '#FF00FF',
      5: '#00FFFF',
      6: '#800080',
      7: '#808000',
      8: '#008080',
    }

    try {
      // 根据G6 v5文档示例，使用正确的配置
      const graph = new Graph({
        container: containerRef.current,
        autoFit: 'view', // 自动适配容器大小
        data: graphData
        ,
        // 强制正交边（水平和垂直）
        edgeRouter: 'orthogonal',

        // 或者使用曼哈顿路由
        edgeType: 'manhattan',

        // 控制点对齐到网格
        gridSize: 10,  // 10px网格对齐
        layout: {
          type: 'antv-dagre', // 使用正确的布局类型
          rankdir: 'LR', // 改为从左到右的布局
          nodesep: 30, // 调整节点间距，适应从左到右布局
          ranksep: 100, // 增加层级间距，适应从左到右布局
          controlPoints: true,
          edgeLabelSpace: true,  // 为边标签预留空间
          nodeMinSize: 30,       // 节点最小尺寸
        },
        // G6 v5使用node而不是defaultNode
        node: {
          type: 'rect',
          style: {
            fill: (d) => {
              if(d.level){
                return nodeColor[d.level];
              }
              return  '#ceccbc';
            },
            stroke: '#666',
            lineWidth: 2,
            labelText: (d) => d.name,
            radius: 6
          },
          // 简化label配置，避免textWrap导致的错误
          labelCfg: {
            style: {
              fontSize: 12,
              fill: '#333'
            }
          },
          state: {
            highlight: {
              fill: '#D580FF',
              halo: true,
              lineWidth: 0,
            },
            dim: {
              fill: 'transparent',
              lineWidth: 0,
            },
            selected: {
              fill: '#FFD700',
              lineWidth: 3,
              stroke: '#FF6B35',
              // size: [200, 100], // 放大节点尺寸
              // labelFontSize: 50, // 直接在style中设置标签字体大小
              labelFontWeight: 'bold', // 直接在style中设置标签字体粗细
              halo: true,
              haloColor: '#FFD700',
              haloBlur: 10
            },
          },
        },
        // G6 v5使用edge而不是defaultEdge
        edge: {
          type: edgeType === 'OrthPolyline' ? 'polyline' : edgeType,

          style: {
            stroke: '#ccc',
            lineWidth: 2,
            radius: 50,
            endArrow: {
              type: 'triangle',
              fill: '#ccc',
              stroke: '#ccc',
              size: 6
            },
            // 为polyline添加router配置
            ...(edgeType === 'OrthPolyline' && {
              router: {
                type: 'orth',
              },
            })
          },
          state: {
            highlight: {
              stroke: '#D580FF',
            },
            dim: {
              stroke: 'transparent',
            },
          },
        },
        // G6 v5使用behaviors而不是modes
        behaviors: ['drag-element', 'drag-canvas', 'zoom-canvas', {
          type: 'hover-activate',
          enable: (event) => event.targetType === 'node' || event.targetType === 'edge',
          degree: 1, // 👈🏻 Activate relations.
          state: 'highlight',
          inactiveState: 'dim',
          onHover: (event) => {
            event.view.setCursor('pointer');
          },
          onHoverEnd: (event) => {
            event.view.setCursor('default');
          },
        }, {
          type: 'click-select',
          enable: (event) => event.targetType === 'node',
          state: 'selected',
          unselectedState: '',
          shouldUpdate: (event, graph) => {
            // 点击空白处取消选择
            if (event.targetType === 'canvas') {
              graph.getNodes().forEach(node => {
                graph.clearItemStates(node, ['selected']);
              });
              return false;
            }
            return true;
          },
        }],
      });

      // G6 v5需要显式调用render方法
      graph.render();

      console.log('G6图实例创建成功');

      // 保存图实例到ref
      graphRef.current = graph;

    } catch (error) {
      console.error('创建G6图实例失败:', error);
      console.error('错误详情:', JSON.stringify(error, null, 2));
    }

    // 响应窗口大小变化
    const handleResize = () => {
      if (graphRef.current && containerRef.current) {
        // G6 v5使用fitView方法来适应容器大小变化
        graphRef.current.fitView();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (graphRef.current) {
        graphRef.current.destroy();
        graphRef.current = null;
      }
    };
  }, [width, height, maxDepth, ranker, edgeType]); // 添加maxDepth、ranker和edgeType作为依赖

  // 增加层级
  const increaseDepth = () => {
    // 确保不超过最大深度
    const maxPossibleDepth = Math.max(...data.nodes.map(node => node.depth));
    setMaxDepth(prev => Math.min(prev + 1, maxPossibleDepth));
  };

  // 减少层级
  const decreaseDepth = () => {
    // 确保不小于0
    setMaxDepth(prev => Math.max(prev - 1, 0));
  };

  return (
    <div>
      {/* 添加层级控制按钮 */}
      <div style={{
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        border: '1px solid #eee'
      }}>
        <Space>
          <Button
            type="primary"
            icon={<MinusOutlined />}
            onClick={decreaseDepth}
            disabled={maxDepth === 0}
          >
            减少层级
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={increaseDepth}
            disabled={maxDepth === Math.max(...data.nodes.map(node => node.depth))}
          >
            增加层级
          </Button>
          <Select
            value={edgeType}
            onChange={setEdgeType}
            style={{ width: 200 }}
            options={[
              { value: 'line', label: '直线边' },
              { value: 'polyline', label: '折线边' },
              { value: 'OrthPolyline', label: '直角边' },
              { value: 'cubic-vertical', label: '贝塞尔曲线' },
              { value: 'quadratic', label: '二次贝塞尔曲线' },
            ]}
          />
          {/* <Button 
            type={removeCycles ? "primary" : "default"} 
            onClick={() => setRemoveCycles(!removeCycles)}
          >
            {removeCycles ? '显示环（不移除）' : '移除环'}
          </Button> */}
        </Space>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>
          当前显示层级: {maxDepth + 1} / {levels.length} ({levels[maxDepth]?.[1] || '无'})
        </div>
        <div style={{ fontSize: '12px', color: '#999' }}>
          环处理: {removeCycles ? '已移除环' : '显示原始环'}
        </div>
        <div style={{ fontSize: '12px', color: '#999' }}>
          显示层级: {levels.slice(0, maxDepth + 1).map(level => level[1]).join(' → ')}
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          width,
          height,
          border: '1px solid #eee',
          borderRadius: '4px',
          backgroundColor: '#fff'
        }}
      />
    </div>
  );
};

export default G6RelationGraph;