import React, { Component } from 'react';
import ChartSankey from './ChartSankey';

/**
 * 关系图示例页面
 */
class G6RelationGraphPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      graphData: [],
      selectedNode: null,
      selectedEdge: null,
      detailData: {
        type: '服务单元',
        interfaceName: '-',
        upstreamInterfaces: ['OCCUP-service-01', 'OCCUP-service-02'],
        downstreamInterfaces: ['XYBID-service-01', 'ZYZC-service-01'],
      },
    };
  }

  componentDidMount() {
    this.loadData();
  }

  /**
   * 加载数据
   */
  loadData = () => {
    const  data=[
        {
          "targetServiceUnitCode": "APAAS-appcenter",
          "sourceServiceUnitCode": "SGC-mesh-console",
          "sourceModuleKey": "SGC",
          "targetModuleKey": "SGC",
          "targetInterfaceName": "syncSgMeshProviderModuleUnitRule,syncSgMeshModuleRule,syncSgMeshProviderServiceRule,syncSgMeshConsumerServiceRule,syncSgMeshConsumerModuleUnitRule,deleteMeshAppService"
        },
        {
          "targetServiceUnitCode": "SGC-mesh-console",
          "sourceServiceUnitCode": "SGC-SU-1",
          "sourceModuleKey": "SGC",
          "targetModuleKey": "SGC",
          "targetInterfaceName": "deleteMeshAppService,taskProcessFunction,scheduledOperatorFunction"
        },
        {
          "targetServiceUnitCode": "APAAS-appcenter",
          "sourceServiceUnitCode": "SGC-SU-1",
          "sourceModuleKey": "SGC",
          "targetModuleKey": "APAAS",
          "targetInterfaceName": "com.cmbc.apaas.appcenter.getActiveModuleInfo"
        },
        {
          "targetServiceUnitCode": "SGC-EXPLORE-CENTER",
          "sourceServiceUnitCode": "SGC-SU-1",
          "sourceModuleKey": "SGC",
          "targetModuleKey": "SGC",
          "targetInterfaceName": "allAppExploreTaskPushFunction,addExploreAlarmStrategyFunction,deleteExploreAlarmStrategyFunction,updateExploreAlarmStrategyFunction,selectExploreAlarmStrategyListFunction,selectExploreAlarmStrategyDetailFunction,addExploreAbnormalFunction,updateExploreAbnormalFunction,deleteExploreAbnormalFunction,queryExploreAbnormalFunction,addExploreAppFunction,updateExploreAppFunction,deleteExploreAppFunction,queryExploreAppFunction,addExecuteNodeFunction,updateExecuteNodeFunction,deleteExecuteNodeFunction,queryExecuteNodeFunction,importExploreInfoFunction,importExploreExecuteNodeFunction"
        },
        {
          "targetServiceUnitCode": "SGC-REGISTRY-MANAGE",
          "sourceServiceUnitCode": "SGC-SU-1",
          "sourceModuleKey": "SGC",
          "targetModuleKey": "SGC"
        },
        {
          "targetServiceUnitCode": "SGC-DATA-VIEW",
          "sourceServiceUnitCode": "SGC-SU-1",
          "sourceModuleKey": "SGC",
          "targetModuleKey": "SGC"
        },
        {
          "targetServiceUnitCode": "SGC-EXPLORE-CENTER",
          "sourceServiceUnitCode": "SGC-REGISTRY-MANAGE",
          "sourceModuleKey": "SGC",
          "targetModuleKey": "SGC",
          "targetInterfaceName": "exploreTaskPushByNodeFunction,deleteTaskPushByNodeFunction"
        },
        {
          "targetServiceUnitCode": "SGC-REGISTRY-MANAGE",
          "sourceServiceUnitCode": "SGC-DATA-VIEW",
          "sourceModuleKey": "SGC",
          "targetModuleKey": "SGC",
          "targetInterfaceName": "alarmPlatformSendInfo"
        },
        {
          "targetServiceUnitCode": "SGC-DATA-VIEW",
          "sourceServiceUnitCode": "SGC-ADMIN-APP",
          "sourceModuleKey": "SGC",
          "targetModuleKey": "SGC",
          "targetInterfaceName": "queryServiceProtocolInfoByServiceUnit"
        },
        {
          "targetServiceUnitCode": "SGC-ADMIN-APP",
          "sourceServiceUnitCode": "SGC-REGISTRY-MANAGE",
          "sourceModuleKey": "SGC",
          "targetModuleKey": "SGC",
          "targetInterfaceName": "queryServiceProtocolInfoByServiceUnit"
        }
      ]

    // 转换为 G6 需要的 nodes/links 格式
    const nodeMap = new Map();
    const links = data.map((item) => {
      if (!nodeMap.has(item.sourceServiceUnitCode)) {
        nodeMap.set(item.sourceServiceUnitCode, { name: item.sourceServiceUnitCode });
      }
      if (!nodeMap.has(item.targetServiceUnitCode)) {
        nodeMap.set(item.targetServiceUnitCode, { name: item.targetServiceUnitCode });
      }
      return {
        source: item.sourceServiceUnitCode,
        target: item.targetServiceUnitCode,
        name: item.targetInterfaceName,
      };
    });
    this.setState({
      graphData: { nodes: Array.from(nodeMap.values()), links },
    });
  };



  /**
   * 节点点击事件
   */
  handleNodeClick = (nodeData) => {
    console.log('点击的节点数据：', nodeData);
  };

  /**
   * 边点击事件
   */
  handleEdgeClick = (edgeData) => {
    console.log('点击的边数据：', edgeData);
  };

  render() {
    const { graphData } = this.state;

    return (
      <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 600 }}>
            服务关系图
          </h2>
          <p style={{ margin: 0, color: '#8c8c8c', fontSize: 14 }}>
            展示服务单元之间的调用关系，支持拖拽、缩放、点击查看详情等功能。
          </p>
        </div>

        <div>
          {/* 左侧图标 */}
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: 24,
              minHeight: 600,
            }}
          >
            <ChartSankey
              data={graphData}
              width={1200}
              height={600}
              onNodeClick={this.handleNodeClick}
              onEdgeClick={this.handleEdgeClick}
            />
          </div>

          {/* 右侧详情，渲染类型 接口名 上下游接口名 假数据就行 */}

        </div>
      </div>
    );
  }
}

export default G6RelationGraphPage;
