import React, { Component } from 'react';
import { bind, clear } from 'size-sensor';
import { Layout, Empty, message as AntMessage, Spin, InputNumber } from 'antd';
import { getChartDatas, simpleCycleRemoval, searchSeveral } from './components/mixins';
import { Graph } from '@antv/g6';
import EdgeSelect from './components/EdgeSelect';
// import RankSelect from './components/rankerSelect';
import RankdirSelect from './components/RankdirSelect';
// import TitleView from './components/TitleView';

class ChartSankey extends Component {
  constructor(props) {
    super(props);

    /** G6 容器引用 */
    this.containerRef = React.createRef();
    /** G6 实例引用 */
    this.graphRef = React.createRef(null);
    /** 防止重复渲染的标志 */
    this.isRenderingRef = React.createRef(false);
    /** 挂载标志，用于防止卸载后继续执行 */
    this.isMountedRef = React.createRef(true);

    this.state = {
      // 防止父组件loading接收问题
      // parentLoadingRef: props.parentLoading,

      // 布局算法
      ranker: 'network-simplex', // 默认使用network-simplex算法
      rankdir: 'LR', // 布局方向
      showRankdir: true, // 是否显示布局方向
      edgeType: 'polyline', // 边类型

      /** 筛选备用数据 */
      ChartData: props.data ?? {
        nodes: [],
        links: [],
      },

      SearchParams: {}, // 存储搜索的node数据
      showLoading: true, // 是否显示加载

      searchLevel: 2, // 默认过滤上下游2层级
      selectedNode: null, // 当前选中的节点
    };

    // 折线样式配置
    this.polylineStyle = {
      w: 100,
      h: 50,
      s: 20,
    };

    // 边类型映射
    this.lineType = {
      polyline: {
        // 折线图
        value: 'polyline',
        layout: 'antv-dagre',
        ...this.polylineStyle,
      },
      OrthPolyline: {
        // 直角折线图
        value: 'polyline',
        layout: 'antv-dagre',
        isOrth: true,
        ...this.polylineStyle,
      },
      'cubic-horizontal': {
        // 贝塞尔曲线图
        value: 'cubic-horizontal',
        layout: 'container',
        isWh: true,
      },
      line: {
        // 直线图
        value: 'line',
        layout: 'container',
        isWh: true,
      },
      cubic: {
        // 曲线图
        value: 'cubic',
        layout: 'container',
        isWh: true,
      },
    };
  }

  // 根据 lineageConfirm 返回边颜色
  getLineColor = (lineageConfirm, reverse) => {
    if (reverse) return 'red';
    switch (lineageConfirm) {
      case 0:
        return '#1677ff';
      case 1:
        return '#52c41a';
      case 2:
        return '#faad14';
      default:
        return '#4096ff';
    }
  };

  // 二次处理links数据，添加颜色
  setLinkColor = (links) => {
    return links.map((i) => {
      const lineColor = this.getLineColor(i.lineageConfirm, i?.reverse);
      return {
        ...i,
        lineStyle: {
          color: lineColor,
        },
      };
    });
  };

  // 处理nodes和links数据
  transformData = (originalData) => {
    const graphData = getChartDatas(
      originalData.nodes,
      originalData.links,
      this.containerRef.current,
      this.state.SearchParams?.name
    );

    console.log('getChartDatas result:', graphData);
    console.log('selectedNode:', this.state.selectedNode);
    console.log('searchLevel:', this.state.searchLevel);

    // 如果有选中节点且有层级过滤配置，使用 searchSeveral 过滤
    let filteredData = {
      nodes: graphData?.nodes ?? [],
      links: graphData?.links ?? [],
    };
    if (this.state.selectedNode && this.state.searchLevel > 0) {
      filteredData = searchSeveral(
        { nodes: originalData.nodes ?? [], links: originalData.links ?? [] },
        this.state.selectedNode,
        this.state.searchLevel
      );
    }

    console.log('filteredData after searchSeveral:', filteredData);

    const finalNodes = filteredData?.nodes ?? [];
    const finalLinks = filteredData?.links ?? [];

    return {
      nodes: finalNodes.map((node) => ({
        id: node.name,
        ...node,
      })),
      edges: simpleCycleRemoval(this.setLinkColor(
        finalLinks.map((link) => ({
          id: `${link.source}-${link.target}`,
          name: link.name,
          ...link,
        }))
      )),
    };
  };

  // 实例化&渲染图表
  renderGraph = () => {
    // 防止重复渲染
    if (this.isRenderingRef.current || !this.isMountedRef.current) {
      return;
    }

    if (
      !this.containerRef.current ||
      !this.state.ChartData?.nodes?.length
    ) {
      return;
    }

    // 标记正在渲染，防止重复调用
    this.isRenderingRef.current = true;
    this.setState({ showLoading: true });

    const graphData = this.transformData(this.state.ChartData);
    console.log('G6数据：', graphData);

    // 确保数据合法
    if (!graphData?.nodes?.length) {
      console.error('没有节点数据');
      this.isRenderingRef.current = false;
      this.setState({ showLoading: false });
      return;
    }

    // ========== 【核心修复：彻底销毁+清空DOM 杜绝多canvas】 ==========
    // 1. 销毁旧实例
    if (this.graphRef.current) {
      this.graphRef.current.destroy();
      this.graphRef.current = null;
    }
    // 2. 暴力清空容器残留DOM
    this.containerRef.current.innerHTML = '';

    try {
      // 创建全新G6实例
      this.graphRef.current = new Graph({
        container: this.containerRef.current,
        autoFit: 'view',
        animation: false,
        data: graphData,

        layout: {
          type: this.lineType[this.state.edgeType].layout,
          rankdir: this.state.rankdir,
          nodesep: 50,
          ranksep: 250,
          preventOverlap: true,
          controlPoints: true,
          edgeLabelSpace: true,
          nodeMinSize: 30,
          ranker: this.state.ranker,
          rank: (node) => node.depth || 0,
        },
        // 节点样式配置

        node: {
          type: 'rect',
          style: {
            fill: (e) => e?.itemStyle?.color || '#ff5757ff',
            stroke: (e) => e?.itemStyle?.color || '#ff5757ff',
            lineWidth: 2,
            radius: 10,

            labelText: (d) => d.name,
            labelFill: '#000',
            labelFontSize: (e) => {
              if (this.lineType[this.state.edgeType].isWh) {
                return this.lineType[this.state.edgeType].w;
              }
              return this.lineType[this.state.edgeType].s;
            },
          },

          labelFontWeight: 500,
        },
        // 边样式配置
        edge: {
          type: this.lineType[this.state.edgeType].value,
          style: {
            stroke: (e) => e?.lineStyle?.color || '#4096ff',
            lineWidth: 1,
            radius: 50,
            endArrow: true,
            endArrowSize: 13,
            ...(this.lineType[this.state.edgeType].isOrth && {
              router: {
                type: 'orth'
              }
            })
          },
        },

        // 全局状态样式
        state: {
          highlight: {
            fill: '#0040ff',
            halo: true,
            lineWidth: 0,
          },
          dim: {
            fill: 'rgba(0,0,0,0.1)',
            stroke: 'rgba(0,0,0,0.1)',
            lineWidth: 1,
          },

          selected: {
            fill: 'red',
            haloColor: 'red',
            stroke: 'red',
          },
          active: {
            stroke: '#ff0000',
            lineWidth: 3,
            endArrow: true,
          },
        },
        // 交互行为
        behaviors: [
          'drag-element',
          'drag-canvas',
          'zoom-canvas',
          {
            type: 'hover-activate',
            enable: (e) => e.targetType === 'node' || e.targetType === 'edge',
            degree: 1,
            activeState: 'highlight',
            inactiveState: 'dim',
          },
          {
            type: 'click-select',
            key: 'click-select-1',
            state: 'selected',
            onClick: (e) => {
              if (e.targetType === 'node') {
                console.log('click节点', e.target.id);
                // 点击节点时，设置为选中节点（再次点击则取消选中）
                const clickedNodeId = e.target.id;
                this.setState((prevState) => ({
                  selectedNode: prevState.selectedNode === clickedNodeId ? null : clickedNodeId,
                }), () => {
                  this.renderGraph();
                });
              } else if (e.targetType === 'edge') {
                console.log('click边', e.target.id);
              }
            }
          },
        ],
        plugins: [
          {
            type: 'tooltip',
            getContent: (e, items) => {
              const item = items[0];
              console.log('hover', e.target.id, item);
              /**
               * code = item.id
               * name = item.name
               */
              return `
                <div style="background: #fff; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                  <p style="font-size: 14px; font-weight: 600;">链路信息</p>
                  <p>code: ${item.id}</p>
                  <p>name: ${item.name}</p>
                </div>
              `;
            }
          },
          {
            type: 'fullscreen',
            key: 'fullscreen',
          },
          // () => {
          //   const that = this;
          //   return {
          //     type: 'toolbar',
          //     key: 'toolbar',
          //     position: 'top-left',
          //     // 使用箭头函数，保留外层的 this
          //     onClick: (item) => {
          //       const fullscreenPlugin = that.graphRef.current?.getPluginInstance('fullscreen');
          //       if (fullscreenPlugin) {
          //         if (item === 'request-fullscreen') {
          //           fullscreenPlugin.request();
          //         } else if (item === 'exit-fullscreen') {
          //           fullscreenPlugin.exit();
          //         }
          //       }
          //     },
          //     getItems: () => [
          //       { id: 'request-fullscreen', value: 'request-fullscreen' },
          //       { id: 'exit-fullscreen', value: 'exit-fullscreen' },
          //     ],
          //   }
          // }
        ],
      });

      // 渲染图表
      console.time('render');
      this.graphRef.current.render();
      console.timeEnd('render');

      // 渲染完成后重置标志
      this.isRenderingRef.current = false;
      if (this.isMountedRef.current) {
        this.setState({ showLoading: false });
      }

      // 窗口自适应
      const handleResize = () => {
        console.log(this.containerRef, 'this.containerRef');

        if (this.graphRef.current && this.containerRef.current) {
          console.log(this.graphRef.current.fitView, 'this.graphRef');

          this.graphRef.current.fitView();
        }
      };
      window.resizeHandler = handleResize;
      window.addEventListener('resize', window.resizeHandler);

    } catch (error) {
      console.error('创建G6图实例失败：', error);
      console.error('错误详情：', JSON.stringify(error, null, 2));
      this.isRenderingRef.current = false;
      if (this.isMountedRef.current) {
        this.setState({ showLoading: false });
      }
    }
  };

  // 容器尺寸监听
  bindContainerSizeListener = () => {
    if (this.containerRef.current) {
      bind(this.containerRef.current, () => {
        if (!this.containerRef.current.offsetWidth || !this.containerRef.current.offsetHeight) {
          return;
        }
        // 已有图实例 → 仅调整视口大小，避免全屏时重建导致退出全屏
        if (this.graphRef.current) {
          this.graphRef.current.fitView();
        } else {
          this.renderGraph();
        }
      });
    }
  };

  unbindContainerSizeListener = () => {
    if (this.containerRef.current) {
      clear(this.containerRef.current);
    }
  };

  componentDidMount() {
    this.isMountedRef.current = true;
    this.bindContainerSizeListener();
    this.renderGraph();
  }

  componentDidUpdate(prevProps, prevState) {
    // 仅父组件原始数据变更时，同步本地状态+重渲染
    if (prevProps.data !== this.props.data) {
      this.setState({
        ChartData: this.props.data ?? { nodes: [], links: [] }
      }, () => {
        this.renderGraph();
      });
      return;
    }

    // 仅内部配置变更时，刷新图表（禁止setState，杜绝死循环）
    if (
      prevState.ranker !== this.state.ranker ||
      prevState.edgeType !== this.state.edgeType ||
      prevState.rankdir !== this.state.rankdir ||
      prevState.searchLevel !== this.state.searchLevel ||
      prevState.selectedNode !== this.state.selectedNode
    ) {
      this.renderGraph();
    }
  }

  componentWillUnmount() {
    this.isMountedRef.current = false;
    // 销毁监听
    this.unbindContainerSizeListener();
    // 销毁图表实例
    if (this.graphRef.current) {
      this.graphRef.current.destroy();
      this.graphRef.current = null;
    }
    // 移除resize监听
    if (window.resizeHandler) {
      window.removeEventListener('resize', window.resizeHandler);
    }
  }

  render() {
    const { ChartTitle } = this.props;
    const { containerRect, ChartData, showLoading, ranker, edgeType, rankdir, showRankdir, searchLevel, selectedNode } = this.state;

    return (
      <Layout style={{ height: '50vh', background: '#fff', position: 'relative' }}>
        <Layout.Content>
          <div
            style={{
              flex: 'auto',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexDirection: 'column',
                gap: '10px',
                background: '#f2f2f2',
                marginBottom: '5px',
              }}
            >
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingRight: '10px',
                }}
              >
                {/* <TitleView Co={18} title={ChartTitle} /> */}
                {/* <RankSelect
                  Co={18}
                  value={ranker}
                  onChange={(value) => this.setState({ ranker: value })}
                /> */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, color: '#595959' }}>上下游层级：</span>
                  <InputNumber
                    min={0}
                    max={10}
                    value={this.state.searchLevel}
                    onChange={(value) => {
                      this.setState({ searchLevel: value ?? 0 }, () => {
                        this.renderGraph();
                      });
                    }}
                    style={{ width: 70 }}
                  />
                  {this.state.selectedNode && (
                    <span style={{ fontSize: 13, color: '#1677ff' }}>
                      当前选中：{this.state.selectedNode}
                      <span
                        style={{ marginLeft: 8, cursor: 'pointer', color: '#ff4d4f' }}
                        onClick={() => {
                          this.setState({ selectedNode: null }, () => {
                            this.renderGraph();
                          });
                        }}
                      >
                        清除
                      </span>
                    </span>
                  )}
                </div>
                <EdgeSelect
                  Co={18}
                  value={edgeType}
                  onChange={(value) => this.setState({ edgeType: value })}
                />
                <RankdirSelect
                  Co={18}
                  show={showRankdir}
                  value={rankdir}
                  onChange={(value) => this.setState({ rankdir: value })}
                />
              </div>
            </div>

            <div
              style={{
                position: 'relative',
                flex: 1,
                width: '100%',
                overflow: 'auto',
                background: '#f2f2f2',
              }}
            >
              {
                showLoading &&
                <Spin size="large" tip="加载中..." style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              }

              {
                ChartData?.nodes?.length === 0 && !showLoading &&
                <Empty description="暂无数据" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              }

              {/* 图表容器，始终存在，但在loading和无数据时被覆盖 */}
              <div
                ref={this.containerRef}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: showLoading || (ChartData?.nodes?.length === 0) ? 0 : 1
                }}
              />
            </div>
          </div>
        </Layout.Content>
      </Layout>
    );
  }
}

export default ChartSankey;
