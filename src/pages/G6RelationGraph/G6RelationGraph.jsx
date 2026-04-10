import React, { useEffect, useRef, useState } from 'react';
import { Graph } from '@antv/g6';
import data from './datas/data';
import { Button, Space, Select, Typography } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { calculateNodeLevels } from './datas/cengji';
import g6data from './datas/g6data';
import useResponsive from '@/hooks/useResponsive';

const { Text } = Typography;

const G6RelationGraph = ({ width = '100%', height = '800px' }) => {
  // 响应式状态
  const { isMobile, isTablet } = useResponsive();
  
  const graphRef = useRef(null);
  const containerRef = useRef(null);
  
  // 控制显示的最大层级
  const [maxDepth, setMaxDepth] = useState(4);
  const [levels, setLevels] = useState([]);
  
  // 控制是否移除环
  const [removeCycles, setRemoveCycles] = useState(true);
  
  // 控制ranker算法
  const [ranker, setRanker] = useState('network-simplex');
  
  // 控制边类型
  const [edgeType, setEdgeType] = useState('polyline');
  
  // 响应式配置
  const containerHeight = isMobile ? '400px' : isTablet ? '500px' : height;
  const controlPadding = isMobile ? 8 : 10;
  const controlGap = isMobile ? 8 : 16;
  
  let graphData = calculateNodeLevels(g6data);
  
  useEffect(() => {
    const levelMap = new Map();
    data.nodes.forEach(node => {
      levelMap.set(node.depth, node.name.split('_')[0]);
    });
    const levelArray = Array.from(levelMap.entries()).sort((a, b) => a[0] - b[0]);
    setLevels(levelArray);
  }, []);

  useEffect(() => { 
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth || (isMobile ? 350 : 1000);
    const containerHeight = parseInt(containerHeight) || 600;

    console.log('容器尺寸:', containerWidth, containerHeight);
    console.log('节点数量:', graphData.nodes.length);
    console.log('边数量:', graphData.edges.length);

    if (graphData.nodes.length === 0) {
      console.error('没有节点数据');
      return;
    }

    if (graphRef.current) {
      graphRef.current.destroy();
      graphRef.current = null;
    }

    const nodeColor = {
      0: '#FF0000',
      1: '#00FF00',
      2: '#0000FF',
      3: '#FFFF00',
      4: '#FF00FF',
      5: '#00FFFF',
      6: '#800080',
      7: '#808000',
      8: '#008080',
    };

    try {
      const graph = new Graph({
        container: containerRef.current,
        autoFit: 'view',
        data: graphData,
        edgeRouter: 'orthogonal',
        edgeType: 'manhattan',
        gridSize: isMobile ? 8 : 10,
        layout: {
          type: 'antv-dagre',
          rankdir: 'LR',
          nodesep: isMobile ? 20 : 30,
          ranksep: isMobile ? 60 : 100,
          controlPoints: true,
          edgeLabelSpace: true,
          nodeMinSize: 30,
        },
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
            labelFontSize: isMobile ? 10 : 12,
            radius: 6
          },
          labelCfg: {
            style: {
              fontSize: isMobile ? 10 : 12,
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
              labelFontWeight: 'bold',
              halo: true,
              haloColor: '#FFD700',
              haloBlur: 10
            },
          },
        },
        edge: {
          type: edgeType === 'OrthPolyline' ? 'polyline' : edgeType,
          style: {
            stroke: '#ccc',
            lineWidth: isMobile ? 1.5 : 2,
            radius: isMobile ? 30 : 50,
            endArrow: {
              type: 'triangle',
              fill: '#ccc',
              stroke: '#ccc',
              size: isMobile ? 4 : 6
            },
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
        behaviors: ['drag-element', 'drag-canvas', 'zoom-canvas', {
          type: 'hover-activate',
          enable: (event) => event.targetType === 'node' || event.targetType === 'edge',
          degree: 1,
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

      graph.render();
      graphRef.current = graph;

    } catch (error) {
      console.error('创建G6图实例失败:', error);
    }

    const handleResize = () => {
      if (graphRef.current && containerRef.current) {
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
  }, [width, containerHeight, maxDepth, ranker, edgeType, isMobile]);

  const increaseDepth = () => {
    const maxPossibleDepth = Math.max(...data.nodes.map(node => node.depth));
    setMaxDepth(prev => Math.min(prev + 1, maxPossibleDepth));
  };

  const decreaseDepth = () => {
    setMaxDepth(prev => Math.max(prev - 1, 0));
  };

  const edgeTypeOptions = [
    { value: 'line', label: '直线' },
    { value: 'polyline', label: '折线' },
    { value: 'OrthPolyline', label: '直角' },
    { value: 'cubic-vertical', label: '贝塞尔' },
    { value: 'quadratic', label: '二次曲线' },
  ];

  return (
    <div>
      {/* 控制栏 */}
      <div style={{
        marginBottom: isMobile ? 8 : 16,
        padding: controlPadding,
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
        border: '1px solid #eee',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: controlGap,
        flexWrap: 'wrap'
      }}>
        {/* 按钮组 */}
        <Space wrap size={isMobile ? "small" : "middle"} style={{ flex: isMobile ? 'auto' : undefined }}>
          <Button
            type="primary"
            icon={<MinusOutlined />}
            onClick={decreaseDepth}
            disabled={maxDepth === 0}
            size={isMobile ? 'middle' : 'middle'}
          >
            {!isMobile && '减少层级'}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={increaseDepth}
            disabled={maxDepth === Math.max(...data.nodes.map(node => node.depth))}
            size={isMobile ? 'middle' : 'middle'}
          >
            {!isMobile && '增加层级'}
          </Button>
          <Select
            value={edgeType}
            onChange={setEdgeType}
            style={{ width: isMobile ? 100 : 150 }}
            size={isMobile ? 'middle' : 'middle'}
            options={edgeTypeOptions}
          />
        </Space>

        {/* 状态信息 */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 4 : 12,
          fontSize: isMobile ? 11 : 14,
          color: '#666'
        }}>
          <Text strong style={{ fontSize: isMobile ? 11 : 14, color: '#666' }}>
            层级: {maxDepth + 1}/{levels.length}
          </Text>
          {!isMobile && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {levels[maxDepth]?.[1] || '无'}
            </Text>
          )}
        </div>

        {/* 层级路径 */}
        <div style={{ 
          fontSize: isMobile ? 10 : 12, 
          color: '#999',
          maxWidth: isMobile ? '100%' : 300,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: isMobile ? 'normal' : 'nowrap'
        }}>
          {levels.slice(0, maxDepth + 1).map(level => level[1]).join(' → ')}
        </div>
      </div>

      {/* 图表容器 */}
      <div
        ref={containerRef}
        style={{
          width,
          height: containerHeight,
          border: '1px solid #eee',
          borderRadius: 4,
          backgroundColor: '#fff',
          minHeight: isMobile ? 300 : 400
        }}
      />
    </div>
  );
};

export default G6RelationGraph;