export function calculateNodeLevels(data) {
    const { nodes, edges } = data;
    
    // 1. 初始化数据结构
    const nodeLevelMap = new Map(); // 节点ID -> 层级
    const nodeOutEdges = new Map(); // 节点ID -> 出边列表
    const nodeInEdges = new Map(); // 节点ID -> 入边列表
    const nodesWithNoIncoming = new Set(); // 有出无进的节点
    const visitedNodes = new Set(); // 已处理节点
    
    // 初始化数据结构
    nodes.forEach(node => {
        nodeOutEdges.set(node.id, []);
        nodeInEdges.set(node.id, []);
    });
    
    // 构建边的关系
    edges.forEach(edge => {
        if (edge.source && edge.target) {
            nodeOutEdges.get(edge.source).push(edge);
            nodeInEdges.get(edge.target).push(edge);
        }
    });
    
    // 找到有出无进的节点（层级0）
    nodes.forEach(node => {
        const inEdges = nodeInEdges.get(node.id);
        const outEdges = nodeOutEdges.get(node.id);
        
        // 有出边但没有入边的节点
        if (outEdges.length > 0 && inEdges.length === 0) {
            nodesWithNoIncoming.add(node.id);
            nodeLevelMap.set(node.id, 0);
        }
    });
    
    // 2. 广度优先遍历分配初始层级
    const queue = Array.from(nodesWithNoIncoming);
    
    while (queue.length > 0) {
        const currentNodeId = queue.shift();
        if (visitedNodes.has(currentNodeId)) continue;
        
        visitedNodes.add(currentNodeId);
        const currentLevel = nodeLevelMap.get(currentNodeId);
        
        // 处理当前节点的所有出边
        const outEdges = nodeOutEdges.get(currentNodeId);
        for (const edge of outEdges) {
            const targetNodeId = edge.target;
            
            // 如果目标节点还未分配层级，或者需要调整层级
            if (!nodeLevelMap.has(targetNodeId)) {
                nodeLevelMap.set(targetNodeId, currentLevel + 1);
                queue.push(targetNodeId);
            } else {
                // 检查是否需要调整层级
                const targetLevel = nodeLevelMap.get(targetNodeId);
                
                // 情况2：同一层级内关联处理
                if (targetLevel === currentLevel) {
                    // 将目标节点层级提升1，并递归调整其子节点
                    adjustNodeAndChildren(targetNodeId, currentLevel + 1);
                }
                // 情况3：跨层级反向关联处理
                else if (targetLevel < currentLevel) {
                    // 将目标节点调整到当前节点层级+1
                    const newLevel = currentLevel + 1;
                    adjustNodeAndChildren(targetNodeId, newLevel);
                }
                // 正常情况：如果当前节点的层级+1比目标节点当前层级大，则更新
                else if (currentLevel + 1 > targetLevel) {
                    nodeLevelMap.set(targetNodeId, currentLevel + 1);
                }
            }
        }
        
        // 添加未访问的相邻节点到队列
        for (const edge of outEdges) {
            if (!visitedNodes.has(edge.target)) {
                queue.push(edge.target);
            }
        }
    }
    
    // 3. 处理情况4：调整根节点层级
    adjustRootNodesLevels();
    
    // 4. 确保层级从0开始，没有负数
    normalizeLevels();
    
    // 将结果添加到节点数据中
    nodes.forEach(node => {
        if (nodeLevelMap.has(node.id)) {
            node.level = nodeLevelMap.get(node.id);
        } else {
            // 对于没有分配层级的节点，设置为-1（表示异常）
            node.level = -1;
        }
    });
    
    return data;
    
    // 辅助函数：调整节点及其所有子节点的层级
    function adjustNodeAndChildren(nodeId, newLevel) {
        const stack = [{ nodeId, baseLevel: newLevel }];
        
        while (stack.length > 0) {
            const { nodeId, baseLevel } = stack.pop();
            const currentLevel = nodeLevelMap.get(nodeId);
            
            // 如果新层级比当前层级高，才进行调整
            if (baseLevel > currentLevel) {
                nodeLevelMap.set(nodeId, baseLevel);
                
                // 递归调整所有子节点
                const outEdges = nodeOutEdges.get(nodeId);
                for (const edge of outEdges) {
                    stack.push({ 
                        nodeId: edge.target, 
                        baseLevel: baseLevel + 1 
                    });
                }
            }
        }
    }
    
    // 辅助函数：调整根节点层级
    function adjustRootNodesLevels() {
        // 对于每个根节点（层级0）
        for (const rootId of nodesWithNoIncoming) {
            // 找到根节点的所有子节点
            const childLevels = [];
            const stack = [rootId];
            const visited = new Set();
            
            while (stack.length > 0) {
                const nodeId = stack.pop();
                if (visited.has(nodeId)) continue;
                visited.add(nodeId);
                
                const outEdges = nodeOutEdges.get(nodeId);
                for (const edge of outEdges) {
                    const targetId = edge.target;
                    childLevels.push(nodeLevelMap.get(targetId));
                    stack.push(targetId);
                }
            }
            
            // 如果子节点存在且最小层级大于1
            if (childLevels.length > 0) {
                const minChildLevel = Math.min(...childLevels.filter(l => l !== undefined));
                
                // 情况4：根节点的子节点最小层级大于1
                if (minChildLevel > 1) {
                    // 计算需要调整的偏移量
                    const offset = minChildLevel - 1;
                    
                    // 调整根节点层级
                    const currentRootLevel = nodeLevelMap.get(rootId);
                    nodeLevelMap.set(rootId, currentRootLevel + offset - 1);
                    
                    // 调整与根节点相关的所有节点
                    adjustRelatedNodes(rootId, offset);
                }
            }
        }
    }
    
    // 辅助函数：调整与指定节点相关的所有节点的层级
    function adjustRelatedNodes(startNodeId, offset) {
        const stack = [startNodeId];
        const visited = new Set();
        
        while (stack.length > 0) {
            const nodeId = stack.pop();
            if (visited.has(nodeId)) continue;
            visited.add(nodeId);
            
            // 调整当前节点
            if (nodeLevelMap.has(nodeId)) {
                const currentLevel = nodeLevelMap.get(nodeId);
                nodeLevelMap.set(nodeId, currentLevel + offset);
            }
            
            // 添加相邻节点
            const outEdges = nodeOutEdges.get(nodeId);
            for (const edge of outEdges) {
                stack.push(edge.target);
            }
            
            const inEdges = nodeInEdges.get(nodeId);
            for (const edge of inEdges) {
                stack.push(edge.source);
            }
        }
    }
    
    // 辅助函数：规范化层级，使最小层级为0
    function normalizeLevels() {
        // 找到最小层级
        let minLevel = Infinity;
        for (const level of nodeLevelMap.values()) {
            if (level < minLevel) {
                minLevel = level;
            }
        }
        
        // 如果最小层级不是0，调整所有层级
        if (minLevel > 0) {
            for (const [nodeId, level] of nodeLevelMap.entries()) {
                nodeLevelMap.set(nodeId, level - minLevel);
            }
        }
    }
}


