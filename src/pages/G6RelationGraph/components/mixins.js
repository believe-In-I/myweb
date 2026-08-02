/**
 * 副作用函数，给nodes添加 x,y 坐标属性
 */
export function addNodeXY(nodesList, userConfig = {}) {
  const config = {
    xStepRatio: 0.2, // 水平步长占容器宽度的比例
    yStepRatio: 1, // 垂直步长占容器高度的比例
    paddingRatio: 0.01, // 边距比例
    containerHeight: 600,
    containerWidth: 800,
    dockey: '',
    maxHeight: 30,
    xStep: null, // 直接指定水平步长
    yStep: null, // 直接指定垂直步长
    ...userConfig,
  };

  const nodes = [...nodesList];

  // 水平每层节点的颜色
  const colorSequence = [
    '#9575CD',
    '#FFA726',
    '#29B6F6',
    '#EF5350',
    '#66B66A'
  ];

  // 计算实际坐标（基于比例）
  const padding = Math.min(config.containerWidth, config.containerHeight) * config.paddingRatio;

  // 计算可用空间：减去两边内边距后的实际可用区域
  const usableWidth = config.containerWidth - 2 * padding;
  const usableHeight = config.containerHeight - 2 * padding;

  // 在可用空间内按比例分配
  const xStep = config.xStep || usableWidth * config.xStepRatio;
  const yStep = config.yStep || usableHeight * config.yStepRatio; // 同一层节点间的垂直边距

  // 如果传节点名称了，那就让当前节点单独层级
  // if (config.dockey) {
  //   const dockeyDepth = nodes.find(doc => doc.name === config.dockey);
  //   if (dockeyDepth) {
  //     nodes.forEach(node => {
  //       if (node.depth >= dockeyDepth.depth && node.name !== dockeyDepth.name) {
  //         node.depth += 1;
  //       }
  //     });
  //   }
  // }

  // 按层级分组 key=层级 value=该层级的所有节点的数组
  const levelNodesMap = {};
  nodes.forEach(node => {
    // 拿到层级数
    const level = Math.round(Number(node.depth || 0));
    if (!levelNodesMap[level]) levelNodesMap[level] = [];
    // 将节点添加到对应的数组里
    levelNodesMap[level].push(node);
  });

  // 找出最小和最大层级，用于居中分布
  const levels = Object.keys(levelNodesMap).map(Number);
  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);
  const levelRange = maxLevel - minLevel; // 计算出最大和最小节点的跨距

  const maxLength = Math.max(...Object.values(levelNodesMap).map(item => item.length)); // 计算出垂直节点最多的数量

  // 计算单个节点最大高度
  let nodeHeight = Math.floor(config.containerHeight / maxLength);
  if (nodeHeight >= config.maxHeight) {
    nodeHeight = config.maxHeight;
  } else {
    nodeHeight = Math.floor(nodeHeight * 0.8);
  }

  // 处理每个层级
  Object.keys(levelNodesMap).forEach((levelStr, index) => {
    const level = Number(levelStr);
    const currentLevelNodes = levelNodesMap[levelStr];

    // 水平每层节点的颜色
    const itemStyle = {
      color: colorSequence[index] || colorSequence[Math.floor(Math.random() * colorSequence.length)]
    };

    // ---------- 计算该层级的水平位置（在可用宽度内均匀分布） ----------
    let levelX;
    if (levelRange === 0) {
      levelX = padding + usableWidth / 2;
    } else {
      // 动态计算步长以填满可用宽度
      const autoXStep = usableWidth / levelRange;
      levelX = padding + (level - minLevel) * autoXStep;
    }

    // ---------- 计算垂直位置（在可用高度均匀分布） ----------
    if (currentLevelNodes.length === 1) {
      // 单个节点，居中
      currentLevelNodes[0].x = levelX;
      currentLevelNodes[0].y = padding + usableHeight / 2;
      currentLevelNodes[0].itemStyle = { ...itemStyle };
      currentLevelNodes[0].height = nodeHeight;
    } else {
      // 多个节点垂直均匀分布
      const spacing = Math.min(yStep, usableHeight / (currentLevelNodes.length - 1));
      const totalHeight = (currentLevelNodes.length - 1) * spacing;
      const startY = padding + (usableHeight - totalHeight) / 2;

      currentLevelNodes.forEach((node, nodeIndex) => {
        node.x = levelX;
        node.y = startY + nodeIndex * spacing;
        node.itemStyle = { ...itemStyle };
        node.height = nodeHeight;
        node.style = {
          x:levelX,
          y:startY + nodeIndex * spacing
        }
      });
    }
  });

  return nodes;
}

export function getLinkColor(value) {
  if (!value || value === '-1') return '#4096ff';
  if (value >= 0.8) return '#2353f1';
  if (value >= 0.6) return '#454540';
  if (value >= 0.4) return '#610a80';
  return '#482650';
}

/**
 * 通过link数据，寻找桑基图的入口
 * @param {array} links
 * @returns {string[]}
 */
export function findSourceNodesByLinks(links) {
  const targetNodes = new Set();
  const sourceNodes = new Set();

  links.forEach(link => {
    targetNodes.add(link.target);
  });

  links.forEach(link => {
    if (!targetNodes.has(link.source)) {
      sourceNodes.add(link.source);
    }
  });

  return [...sourceNodes];
}

/**
 * 副作用函数，给nodes添加depth属性
 * @param {array} nodes
 * @param {array} links
 */
export function calculateNodeDepths(nodes, links) {
  const copyNodes = nodes.map(node => ({ ...node, name: node.name }));
  const copyLinks = links.map(link => ({ ...link }));

  // 修复：先给所有节点设置默认深度0，防止孤立节点导致死循环
  const nodeDepthMap = new Map();
  copyNodes.forEach(node => {
    nodeDepthMap.set(node.name, 0);
  });

  // 使用拓扑排序的思想，迭代计算深度
  let changed = true;
  let iterations = 0;
  const maxIterations = copyNodes.length * copyNodes.length; // 最大迭代次数保护

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    copyLinks.forEach(link => {
      const sourceNodeDepth = nodeDepthMap.get(link.source);
      const targetNodeDepth = nodeDepthMap.get(link.target);

      if (sourceNodeDepth !== undefined && targetNodeDepth !== undefined) {
        const newDepth = sourceNodeDepth + 1;
        if (newDepth > targetNodeDepth) {
          nodeDepthMap.set(link.target, newDepth);
          changed = true;
        }
      }
    });
  }

  if (iterations >= maxIterations) {
    console.warn('calculateNodeDepths: 达到最大迭代次数，可能存在环');
  }

  // 回写深度到原节点
  nodes.forEach(node => {
    node.depth = nodeDepthMap.get(node.name) || 0;
  });

  nodeDepthMap.clear();
  return nodes;
}

export function getChartDatas(nodes, links, containerRef, dockey) {
  // 第一步：递归计算节点层级depth
  const filterData = calculateNodeDepths(nodes, links);

  // 第二步：自动计算节点XY坐标、布局位置
  const nodesWithCoordinates = addNodeXY(filterData, {
    xStep: 500,
    yStep: 300,
    containerHeight: containerRef?.offsetHeight || 600,
    containerWidth: containerRef?.offsetWidth || 800,
    // dockey
  });

  // 构建出度、入度映射
  const degreeMap = new Map();
  nodes.forEach(node => {
    degreeMap.set(node.name, 0);
  });
  links.forEach(link => {
    degreeMap.set(link.source, (degreeMap.get(link.source) || 0) + 1);
    degreeMap.set(link.target, (degreeMap.get(link.target) || 0) + 1);
  });

  return {
    nodes: nodesWithCoordinates,
    links: links
  };
}


// 检测图中环的函数
function detectCyclesSafa(graph) {
    const cycleEdges = new Set();
    const visited = new Set();
    const recursionStack = new Set();

    function dfs(node, path) {
        if (recursionStack.has(node)) {
            // 发现环，记录路径上的边（需要闭合环）
            const cycleStartIndex = path.indexOf(node);
            const cycleLength = path.length - cycleStartIndex;
            // 遍历环上的所有边，包括从最后一个节点回到起始节点
            for (let i = 0; i < cycleLength; i++) {
                const fromNode = path[(cycleStartIndex + i) % path.length];
                const toNode = path[(cycleStartIndex + i + 1) % path.length];
                cycleEdges.add(`${fromNode}|${toNode}`);
            }
            return;
        }

        if (visited.has(node)) return;

        visited.add(node);
        recursionStack.add(node);

        const neighbors = graph[node] || [];
        for (const neighbor of neighbors) {
            dfs(neighbor, [...path, node]);
        }

        recursionStack.delete(node);
    }

    for (const node of Object.keys(graph)) {
        if (!visited.has(node)) {
            dfs(node, []);
        }
    }

    return cycleEdges;
}

// 智能选择需要翻转的边
function selectEdgesSmartly(cycleEdges, edgeMap) {
    // 对于每个环，选择度数最小的边优先翻转
    // 这里简化处理：直接返回所有检测到的环边
    return cycleEdges;
}


//简单的检测到环并翻转
// istanbul ignore file
export function simpleCycleRemoval(links) {
    const graph = {};
    const edgeMap = new Map();
    links.forEach(link => {
        const { source, target } = link;
        if (source !== target) {
            if (!graph[source]) graph[source] = [];
            graph[source].push(target);
            edgeMap.set(`${source}|${target}`, link);
        }
    });

    const cycleEdges = detectCyclesSafa(graph);
    console.log('检测到的环边:', Array.from(cycleEdges));
    
    if (cycleEdges.size === 0) {
        console.log('未检测到环');
        return links.map(link => ({ ...link }));
    }

    const edgesToFlip = selectEdgesSmartly(cycleEdges, edgeMap);

    const result = links.map(link => {
        if (link.source === link.target) return { ...link };

        const key = `${link.source}|${link.target}`;
        if (edgesToFlip.has(key)) {
            console.log(`翻转边: ${key}`);
            const { source, target, ...rest } = link;
            return {
                ...rest,
                source: target,
                target: source,
                reverse: true,
            };
        }
        return { ...link };
    });

    return result;
}

/**
 * 搜索指定节点上下 N 层级的关联节点
 * @param datas -- {nodes:[], links:[]}
 * @param searchKey -- string 搜索节点 name
 * @param SearchSeveralNumsRef -- number 过滤层级数
 * @returns { nodes: [{name, ...}], links: [...] }
 */
export const searchSeveral = (datas, searchKey, SearchSeveralNumsRef) => {
  // 输入校验
  if (!searchKey || SearchSeveralNumsRef <= 0 || !datas?.links?.length) {
    return { nodes: datas?.nodes ?? [], links: [] };
  }

  const nodeList = new Set([searchKey]); // 包含搜索节点本身
  const visitedLinks = new Set();
  const linkList = [];
  const queue = [[searchKey, 0]]; // [节点名, 当前深度]

  while (queue.length > 0) {
    const [currentNode, depth] = queue.shift();

    // 深度超过阈值，跳过（不遍历更深层级）
    if (depth >= SearchSeveralNumsRef) continue;

    datas.links.forEach(item => {
      // 唯一链路标识
      const linkId = `${item.source}-${item.target}`;
      if (visitedLinks.has(linkId)) return;

      // 精确匹配（而非模糊匹配）
      const isSourceMatch = item.source === currentNode;
      const isTargetMatch = item.target === currentNode;

      if (isSourceMatch || isTargetMatch) {
        // 标记链路已访问
        visitedLinks.add(linkId);
        linkList.push(item);

        // 将对端节点加入结果集
        const neighbor = isSourceMatch ? item.target : item.source;
        if (!nodeList.has(neighbor)) {
          nodeList.add(neighbor);
          // 对端节点深度 +1 入队
          queue.push([neighbor, depth + 1]);
        }
      }
    });
  }

  // 从原始节点中过滤出匹配的节点（保留完整属性）
  const filteredNodes = (datas.nodes ?? []).filter(node => nodeList.has(node.name));

  return {
    nodes: filteredNodes,
    links: linkList,
  };
};