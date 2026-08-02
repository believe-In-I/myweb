// 族谱编辑操作：向上加父辈、向下加子辈、冲突检测、审核应用、留痕。

let seq = 1;
export function genId(prefix = 'p_new') {
  return `${prefix}_${Date.now().toString(36)}_${seq++}`;
}

// 创建一个占位新人（待补充信息）
function makePlaceholder(name, gender) {
  return {
    id: genId(),
    name: name || '待补充',
    gender: gender || 'male',
    birthDate: '',
    deceased: false,
    fatherId: null,
    spouseId: null,
    photo: '',
    bio: '',
    phone: '',
    relationType: 'birth',
  };
}

// 预览：向上插入 levels 代父辈后新增的节点（不改动原数据）
export function previewAddFather(persons, nodeId, levels, names = []) {
  const byId = {};
  persons.forEach((p) => { byId[p.id] = p; });
  const target = byId[nodeId];
  if (!target) return { newNodes: [], links: [] };

  const oldFatherId = target.fatherId;
  const newNodes = [];
  for (let i = 0; i < levels; i++) {
    const n = makePlaceholder(names[i] || `${target.name}的第${i + 1}代先辈`, 'male');
    newNodes.push(n);
  }
  // 链接：target.father = N1, N1.father = N2, ..., N_last.father = oldFather
  const links = [];
  links.push({ child: nodeId, father: newNodes[0].id });
  for (let i = 0; i < newNodes.length - 1; i++) {
    links.push({ child: newNodes[i].id, father: newNodes[i + 1].id });
  }
  links.push({ child: newNodes[newNodes.length - 1].id, father: oldFatherId });

  return { newNodes, links, oldFatherId };
}

// 预览：向下插入 levels 代子辈后新增的节点
export function previewAddSon(persons, nodeId, levels, names = []) {
  const byId = {};
  persons.forEach((p) => { byId[p.id] = p; });
  const target = byId[nodeId];
  if (!target) return { newNodes: [], links: [] };

  const newNodes = [];
  for (let i = 0; i < levels; i++) {
    const n = makePlaceholder(names[i] || `${target.name}的第${i + 1}代后辈`, 'male');
    newNodes.push(n);
  }
  // 链接：N1.father = node, N2.father = N1, ...
  const links = [];
  links.push({ child: newNodes[0].id, father: nodeId });
  for (let i = 1; i < newNodes.length; i++) {
    links.push({ child: newNodes[i].id, father: newNodes[i - 1].id });
  }
  return { newNodes, links };
}

// 冲突检测：返回 { hasConflict, type, message }
export function detectConflict(persons, nodeId, direction) {
  const byId = {};
  persons.forEach((p) => { byId[p.id] = p; });
  const node = byId[nodeId];
  if (!node) return { hasConflict: false };

  if (direction === 'father') {
    if (node.fatherId) {
      const f = byId[node.fatherId];
      return {
        hasConflict: true,
        type: 'father_exists',
        message: `「${node.name}」已存在父亲「${f ? f.name : node.fatherId}」。继续将在两者之间插入新的一代（原父亲上移为祖辈）。`,
      };
    }
  }
  if (direction === 'son') {
    const kids = persons.filter((p) => p.fatherId === nodeId && !p.isMarriedIn);
    if (kids.length > 0) {
      return {
        hasConflict: true,
        type: 'son_exists',
        message: `「${node.name}」已有 ${kids.length} 个子女。可选择"追加一个子女"或"在中间插入一代"。默认追加。`,
      };
    }
  }
  return { hasConflict: false };
}

// 检测提交是否与现有血缘矛盾（如把 A 同时设为 B 的父与子）
export function detectContradiction(persons, links) {
  const byId = {};
  persons.forEach((p) => { byId[p.id] = p; });

  // 构造应用后的父指针映射，检测是否成环
  const fatherMap = {};
  persons.forEach((p) => { fatherMap[p.id] = p.fatherId; });
  links.forEach((l) => { fatherMap[l.child] = l.father; });

  // 环检测
  for (const startId of Object.keys(fatherMap)) {
    let cur = startId;
    const visited = new Set();
    while (cur) {
      if (visited.has(cur)) {
        return { contradiction: true, message: `检测到父子关系成环，涉及节点「${byId[cur]?.name || cur}」，已拦截。` };
      }
      visited.add(cur);
      cur = fatherMap[cur];
    }
  }
  return { contradiction: false };
}

// 将一个已批准的变更请求应用到 persons，返回新的 persons 数组
export function applyChange(persons, change) {
  const { newNodes = [], links = [] } = change.payload || {};
  let next = persons.map((p) => ({ ...p }));

  // 先加入新节点
  newNodes.forEach((n) => {
    if (!next.find((p) => p.id === n.id)) next.push({ ...n });
  });

  // 再应用父子链接
  const byId = {};
  next.forEach((p) => { byId[p.id] = p; });
  links.forEach((l) => {
    if (byId[l.child]) byId[l.child].fatherId = l.father || null;
  });

  return next;
}

// 生成一条审核请求
export function makeChangeRequest({ type, direction, nodeId, nodeName, levels, payload, submittedBy, conflict }) {
  return {
    id: genId('chg'),
    type,
    direction,
    nodeId,
    nodeName,
    levels,
    payload,
    submittedBy,
    status: conflict ? 'conflict' : 'pending',
    conflictMessage: conflict || '',
    createdAt: new Date().toLocaleString('zh-CN'),
  };
}

// 生成一条审计日志
export function makeAuditLog(action, detail, user) {
  return {
    id: genId('log'),
    time: new Date().toLocaleString('zh-CN'),
    user: user || '系统',
    action,
    detail,
  };
}
