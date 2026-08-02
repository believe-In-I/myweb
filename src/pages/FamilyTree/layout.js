// 族谱树形布局算法
// 以父系血缘（fatherId）为树骨架，采用经典"整齐树"布局：
// 叶子从左到右依次占位，父节点居中于其子节点之上。
// 嫁入/娶入配偶依附在伴侣右侧，并为其预留一个横向槽位。

export const NODE_W = 116;
export const NODE_H = 132;
export const H_GAP = 34;
export const V_GAP = 96;
export const SLOT = NODE_W + H_GAP;
export const ROW = NODE_H + V_GAP;

function childrenOf(persons, id) {
  return persons
    .filter((p) => p.fatherId === id && !p.isMarriedIn)
    .sort((a, b) => {
      // 同辈按出生日期升序（大在左）
      const ta = a.birthDate ? new Date(a.birthDate).getTime() : 0;
      const tb = b.birthDate ? new Date(b.birthDate).getTime() : 0;
      return ta - tb;
    });
}

export function computeLayout(persons) {
  const byId = {};
  persons.forEach((p) => { byId[p.id] = p; });

  const roots = persons.filter((p) => !p.fatherId && !p.isMarriedIn);
  const pos = {};
  let cursor = 0;

  // 该节点是否有需要预留槽位的配偶
  const spouseOf = (node) => {
    if (!node.spouseId) return null;
    const s = byId[node.spouseId];
    if (s && s.isMarriedIn) return s;
    return null;
  };

  function assign(nodeId, depth) {
    const node = byId[nodeId];
    if (!node) return;
    const kids = childrenOf(persons, nodeId);
    const spouse = spouseOf(node);

    if (kids.length === 0) {
      // 叶子：占据当前列
      const x = cursor * SLOT;
      pos[nodeId] = { x, y: depth * ROW, depth };
      cursor += 1;
      if (spouse) {
        pos[spouse.id] = { x: cursor * SLOT, y: depth * ROW, depth, spouse: true };
        cursor += 1;
      }
    } else {
      kids.forEach((k) => assign(k.id, depth + 1));
      const first = pos[kids[0].id].x;
      const last = pos[kids[kids.length - 1].id].x;
      let centerX = (first + last) / 2;
      if (spouse) {
        // 夫妻居中排布于子代之上
        pos[nodeId] = { x: centerX - SLOT / 2, y: depth * ROW, depth };
        pos[spouse.id] = { x: centerX + SLOT / 2, y: depth * ROW, depth, spouse: true };
      } else {
        pos[nodeId] = { x: centerX, y: depth * ROW, depth };
      }
    }
  }

  roots.forEach((r) => {
    assign(r.id, 0);
    cursor += 1; // 根之间留一列间隔
  });

  // 计算画布尺寸
  let maxX = 0;
  let maxY = 0;
  Object.values(pos).forEach((p) => {
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  });

  return {
    pos,
    width: maxX + NODE_W + SLOT,
    height: maxY + NODE_H + V_GAP,
  };
}

// 生成父子连线（从父到子）
export function computeEdges(persons, pos) {
  const edges = [];
  persons.forEach((p) => {
    if (p.fatherId && pos[p.fatherId] && pos[p.id] && !p.isMarriedIn) {
      edges.push({
        id: `${p.fatherId}-${p.id}`,
        from: p.fatherId,
        to: p.id,
        type: 'parent',
      });
    }
  });
  return edges;
}

// 生成婚姻连线
export function computeMarriages(persons, pos) {
  const seen = new Set();
  const lines = [];
  persons.forEach((p) => {
    if (p.spouseId && pos[p.id] && pos[p.spouseId]) {
      const key = [p.id, p.spouseId].sort().join('|');
      if (seen.has(key)) return;
      seen.add(key);
      lines.push({ id: key, a: p.id, b: p.spouseId });
    }
  });
  return lines;
}
