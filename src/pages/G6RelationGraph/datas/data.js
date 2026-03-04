// 计算节点深度的算法
export function calculateNodeDepths(nodes, links) {
  // 1. 使用更高效的查找结构
  const nodeMap = new Map();
  const depthMap = new Map();
  const inDegree = new Map();
  const adjacencyList = new Map();
  
  // 初始化数据结构
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node });
    depthMap.set(node.id, -1);
    inDegree.set(node.id, 0);
    adjacencyList.set(node.id, []);
  });
  
  // 构建邻接表和入度
  links.forEach(link => {
    if (nodeMap.has(link.source) && nodeMap.has(link.target)) {
      // 更新入度
      inDegree.set(link.target, inDegree.get(link.target) + 1);
      // 更新邻接表
      adjacencyList.get(link.source).push(link.target);
    }
  });
  
  // 2. 使用队列进行BFS拓扑排序
  const queue = [];
  
  // 找到所有入度为0的节点（起点）
  nodes.forEach(node => {
    if (inDegree.get(node.id) === 0) {
      queue.push(node.id);
      depthMap.set(node.id, 0);
    }
  });
  
  // 3. BFS遍历
  while (queue.length > 0) {
    const currentNodeId = queue.shift();
    const currentDepth = depthMap.get(currentNodeId);
    
    // 遍历当前节点的所有邻居
    const neighbors = adjacencyList.get(currentNodeId);
    neighbors.forEach(neighborId => {
      // 更新入度
      const newInDegree = inDegree.get(neighborId) - 1;
      inDegree.set(neighborId, newInDegree);
      
      // 更新深度：取最大值
      const existingDepth = depthMap.get(neighborId);
      if (currentDepth + 1 > existingDepth) {
        depthMap.set(neighborId, currentDepth + 1);
      }
      
      // 如果入度为0，加入队列
      if (newInDegree === 0) {
        queue.push(neighborId);
      }
    });
  }
  
  // 4. 处理环状结构或孤立节点
  const result = [];
  for (const [nodeId, depth] of depthMap) {
    const node = nodeMap.get(nodeId);
    result.push({
      ...node,
      depth: Math.max(depth, 0)  // 确保深度非负
    });
  }
  
  return result;
}

// 生成模拟真实数据的DAG图
const generateDAGData = () => {
  const nodes = [];
  const links = [];
  
  // 模拟真实项目开发的10个层级，包含更多任务
  const levels = [
    {
      name: '需求分析',
      color: '#FFD700',
      items: ['项目初始化', '需求调研', '功能规划', '技术选型', '团队组建', '项目评估', '风险分析', '成本预算', '时间规划', '利益相关方沟通']
    },
    {
      name: '系统设计',
      color: '#87CEFA',
      items: ['架构设计', '数据库设计', 'API设计', '界面设计', '模块划分', '数据流设计', '安全设计', '性能设计', '可扩展性设计', '技术文档编写']
    },
    {
      name: '核心开发',
      color: '#98FB98',
      items: ['用户管理模块', '权限系统', '核心功能1', '核心功能2', '核心功能3', '核心功能4', '核心功能5', '核心功能6', '数据处理模块', '第三方集成模块', '日志系统', '缓存系统']
    },
    {
      name: '模块开发1',
      color: '#90EE90',
      items: ['模块1开发', '模块2开发', '模块3开发', '模块4开发', '模块5开发', '模块6开发', '模块7开发', '模块8开发', '模块9开发', '模块10开发']
    },
    {
      name: '模块开发2',
      color: '#8FBC8F',
      items: ['模块11开发', '模块12开发', '模块13开发', '模块14开发', '模块15开发', '模块16开发', '模块17开发', '模块18开发', '模块19开发', '模块20开发']
    },
    {
      name: '集成测试',
      color: '#FFA07A',
      items: ['单元测试', '集成测试', '接口测试', '功能测试', '回归测试', '自动化测试', '性能测试', '安全测试', '兼容性测试', '压力测试']
    },
    {
      name: '测试优化',
      color: '#FA8072',
      items: ['Bug修复1', 'Bug修复2', 'Bug修复3', 'Bug修复4', 'Bug修复5', 'Bug修复6', '性能优化1', '性能优化2', '代码重构1', '代码重构2']
    },
    {
      name: '预发布准备',
      color: '#DDA0DD',
      items: ['环境搭建', '配置管理', '数据迁移', '文档完善', '用户培训', '上线计划', '回滚方案', '监控配置', '告警设置', '性能基线建立']
    },
    {
      name: '部署上线',
      color: '#DA70D6',
      items: ['灰度发布', '全量发布', '上线验证1', '上线验证2', '上线验证3', '上线验证4', '上线验证5', '问题处理1', '问题处理2', '问题处理3']
    },
    {
      name: '运维维护',
      color: '#BA55D3',
      items: ['日常监控', '日志分析', '性能监控', '安全审计', '版本更新', '功能迭代1', '功能迭代2', '功能迭代3', '系统优化', '维护总结']
    }
  ];

  
  
  let nodeIndex = 0;
  const nodeNameMap = new Map();
  
  // 创建节点（暂时使用0作为临时depth）
  levels.forEach((level, levelIndex) => {
    level.items.forEach((item, itemIndex) => {
      const nodeName = `${level.name}_${item}`;
      const node = {
        name: nodeName,
        id: nodeName,
        depth: 0 // 临时值，后续会被calculateNodeDepths覆盖
      };
      
      nodes.push(node);
      nodeNameMap.set(nodeName, node);
      nodeIndex++;
    });
  });
  
  // 创建边，确保只从上层节点指向下层节点
  nodes.forEach((node, index) => {
    const currentDepth = 0; // 暂时使用0
    
    // 为每个节点创建2-5条边，指向下层节点
    const edgeCount = Math.floor(Math.random() * 4) + 2; // 2-5条边
    
    // 使用Set确保不重复选择同一目标节点
    const selectedTargets = new Set();
    while (selectedTargets.size < edgeCount) {
      // 随机选择一个节点作为目标
      const targetNode = nodes[Math.floor(Math.random() * nodes.length)];
      // 避免自环
      if (targetNode.id !== node.id) {
        selectedTargets.add(targetNode.id);
      }
    }
    
    // 为每个选中的目标节点创建边
    selectedTargets.forEach(targetName => {
      links.push({
        source: node.id,
        target: targetName
      });
    });
  });
  
  console.log('生成的节点数量:', nodes.length);
  console.log('生成的边数量:', links.length);
  
  // 随机添加多个环，创建更真实的测试场景
  function addRandomCycles(links, nodes, count = 5) {
    const addedCycles = [];
    
    for (let i = 0; i < count; i++) {
      // 随机选择3-6个不同节点
      const cycleSize = Math.floor(Math.random() * 4) + 3;
      const randomNodes = [];
      
      while (randomNodes.length < cycleSize) {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        if (!randomNodes.includes(randomNode.id)) {
          randomNodes.push(randomNode.id);
        }
      }
      
      // 创建环：node1 → node2 → ... → nodeN → node1
      for (let j = 0; j < cycleSize; j++) {
        const source = randomNodes[j];
        const target = randomNodes[(j + 1) % cycleSize];
        
        links.push({
          source,
          target
        });
      }
      
      addedCycles.push(randomNodes);
    }
    
    console.log(`添加了 ${count} 个随机环`);
    return addedCycles;
  }
  
  // 添加5个随机环
  addRandomCycles(links, nodes, 5);
  
  console.log('添加环后，边数量:', links.length);
  
  // 使用calculateNodeDepths算法重新计算节点深度
  const nodesWithCalculatedDepth = calculateNodeDepths(nodes, links);
  
  console.log('计算后的最大深度:', Math.max(...nodesWithCalculatedDepth.map(node => node.depth)));
  
  return { 
    nodes: nodesWithCalculatedDepth, 
    links 
  };
};

const data = generateDAGData();

export default data;