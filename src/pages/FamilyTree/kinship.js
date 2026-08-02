// 称呼推断引擎
// 基于父系血缘树，计算"我"应该如何称呼"目标人物"。
// 支持：同辈（哥/弟/姐/妹、堂哥/堂姐...）、长辈（爸爸/大伯/叔叔/姑姑/爷爷/太爷爷...）、
//       晚辈（儿子/女儿/侄子/侄女/孙子...）、配偶（妈妈/婶婶/伯母/嫂子/弟妹...）。

// 默认称呼配置（可在页面中自定义覆盖）
export const defaultTitleConfig = {
  self: '自己（本人）',
  father: '爸爸',
  mother: '妈妈',
  // 同辈
  brotherElder: '哥哥',
  brotherYounger: '弟弟',
  sisterElder: '姐姐',
  sisterYounger: '妹妹',
  cousinBrotherElder: '堂哥',
  cousinBrotherYounger: '堂弟',
  cousinSisterElder: '堂姐',
  cousinSisterYounger: '堂妹',
  // 父辈（父亲的兄弟姐妹）
  uncleElder: '伯伯',
  uncleYounger: '叔叔',
  aunt: '姑姑',
  cousinUncleElder: '堂伯',
  cousinUncleYounger: '堂叔',
  cousinAunt: '堂姑',
  // 祖辈
  grandpa: '爷爷',
  grandma: '奶奶',
  grandUncle: '叔公',
  grandAunt: '姑婆',
  greatGrandpa: '太爷爷',
  greatGrandma: '太奶奶',
  // 晚辈
  son: '儿子',
  daughter: '女儿',
  nephew: '侄子',
  niece: '侄女',
  grandson: '孙子',
  granddaughter: '孙女',
  grandNephew: '侄孙',
  // 配偶衍生
  spouseHusband: '丈夫',
  spouseWife: '妻子',
};

function buildById(persons) {
  const byId = {};
  persons.forEach((p) => { byId[p.id] = p; });
  return byId;
}

// 从某人向上的父系路径：[自己, 父, 祖父, ...]
function ancestryPath(byId, id) {
  const path = [];
  let cur = id;
  const guard = new Set();
  while (cur && byId[cur] && !guard.has(cur)) {
    guard.add(cur);
    path.push(cur);
    cur = byId[cur].fatherId;
  }
  return path;
}

// 最近公共祖先
function findLCA(byId, a, b) {
  const pathA = ancestryPath(byId, a);
  const setA = new Set(pathA);
  const pathB = ancestryPath(byId, b);
  for (const x of pathB) {
    if (setA.has(x)) return x;
  }
  return null;
}

// 计算辈分（0 为最高的始迁祖代）
export function computeGenerations(persons) {
  const byId = buildById(persons);
  const gen = {};
  persons.forEach((p) => {
    gen[p.id] = ancestryPath(byId, p.id).length - 1;
  });
  // 嫁入/娶入配偶：辈分跟随伴侣
  persons.forEach((p) => {
    if (p.isMarriedIn && p.spouseId && byId[p.spouseId]) {
      gen[p.id] = gen[p.spouseId];
    }
  });
  return gen;
}

function birthTime(person) {
  if (!person || !person.birthDate) return Number.MAX_SAFE_INTEGER;
  const t = new Date(person.birthDate).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

// 核心：血缘成员之间的称呼（不含配偶转换）
// 返回 { key, label, pathIds } —— pathIds 用于图上高亮 我→目标 的路径
function coreKinship(byId, cfg, meId, targetId) {
  if (meId === targetId) {
    return { key: 'self', label: cfg.self, pathIds: [meId] };
  }
  const L = findLCA(byId, meId, targetId);
  if (!L) return { key: 'none', label: '（暂无血缘关系）', pathIds: [] };

  const pathMe = ancestryPath(byId, meId);
  const pathT = ancestryPath(byId, targetId);
  const dMe = pathMe.indexOf(L); // 我到 LCA 的向上步数
  const dT = pathT.indexOf(L);   // 目标到 LCA 的向上步数
  const genDiff = dMe - dT;      // >0：目标是长辈方向

  // 高亮路径：我 → LCA → 目标
  const upPart = pathMe.slice(0, dMe + 1);
  const downPart = pathT.slice(0, dT).reverse();
  const pathIds = [...upPart, ...downPart];

  const target = byId[targetId];
  const isMale = target.gender !== 'female';

  // —— 同辈 ——
  if (genDiff === 0) {
    const me = byId[meId];
    const targetOlder = birthTime(target) < birthTime(me);
    const isSibling = dMe === 1; // LCA 是共同父亲 → 亲兄弟姐妹
    if (isSibling) {
      const key = isMale
        ? (targetOlder ? 'brotherElder' : 'brotherYounger')
        : (targetOlder ? 'sisterElder' : 'sisterYounger');
      return { key, label: cfg[key], pathIds };
    }
    const key = isMale
      ? (targetOlder ? 'cousinBrotherElder' : 'cousinBrotherYounger')
      : (targetOlder ? 'cousinSisterElder' : 'cousinSisterYounger');
    return { key, label: cfg[key], pathIds };
  }

  // —— 长辈方向 ——
  if (genDiff === 1) {
    // 是否我的直系父亲
    if (pathMe[1] === targetId) {
      return { key: 'father', label: cfg.father, pathIds };
    }
    // 父辈：与我父亲比较年龄决定 伯/叔
    const myFather = byId[pathMe[1]];
    const isCousinLine = dMe > 2; // 非我祖父的直系子女 → 堂
    if (isMale) {
      const olderThanFather = birthTime(target) < birthTime(myFather);
      if (isCousinLine) {
        const key = olderThanFather ? 'cousinUncleElder' : 'cousinUncleYounger';
        return { key, label: cfg[key], pathIds };
      }
      const key = olderThanFather ? 'uncleElder' : 'uncleYounger';
      return { key, label: cfg[key], pathIds };
    }
    const key = isCousinLine ? 'cousinAunt' : 'aunt';
    return { key, label: cfg[key], pathIds };
  }

  if (genDiff === 2) {
    const isDirect = dMe === 2 && dT === 0; // 直系祖父母
    if (isDirect) {
      const key = isMale ? 'grandpa' : 'grandma';
      return { key, label: cfg[key], pathIds };
    }
    const key = isMale ? 'grandUncle' : 'grandAunt';
    return { key, label: cfg[key], pathIds };
  }

  if (genDiff === 3) {
    const key = isMale ? 'greatGrandpa' : 'greatGrandma';
    return { key, label: cfg[key], pathIds };
  }

  if (genDiff > 3) {
    return { key: 'ancestor', label: `上${genDiff}代先祖`, pathIds };
  }

  // —— 晚辈方向 ——
  if (genDiff === -1) {
    if (pathT[1] === meId) {
      const key = isMale ? 'son' : 'daughter';
      return { key, label: cfg[key], pathIds };
    }
    const key = isMale ? 'nephew' : 'niece';
    return { key, label: cfg[key], pathIds };
  }

  if (genDiff === -2) {
    const isDirect = dT === 2 && dMe === 0;
    if (isDirect) {
      const key = isMale ? 'grandson' : 'granddaughter';
      return { key, label: cfg[key], pathIds };
    }
    return { key: 'grandNephew', label: cfg.grandNephew, pathIds };
  }

  if (genDiff < -2) {
    return { key: 'descendant', label: `下${-genDiff}代后辈`, pathIds };
  }

  return { key: 'none', label: '（关系较远）', pathIds };
}

// 配偶称呼映射：已知伴侣的称呼 key，推导对其配偶的称呼
function spouseTitle(cfg, partnerKey, spouseGender) {
  const map = {
    father: cfg.mother,          // 父亲的配偶 → 妈妈
    uncleElder: '伯母',           // 伯伯之妻
    uncleYounger: '婶婶',         // 叔叔之妻
    cousinUncleElder: '堂伯母',
    cousinUncleYounger: '堂婶',
    aunt: '姑父',
    cousinAunt: '堂姑父',
    grandpa: cfg.grandma,        // 爷爷之妻 → 奶奶
    grandma: cfg.grandpa,
    grandUncle: '叔婆',
    greatGrandpa: cfg.greatGrandma,
    greatGrandma: cfg.greatGrandpa,
    brotherElder: '嫂子',
    brotherYounger: '弟妹',
    sisterElder: '姐夫',
    sisterYounger: '妹夫',
    cousinBrotherElder: '堂嫂',
    cousinBrotherYounger: '堂弟妹',
    cousinSisterElder: '堂姐夫',
    cousinSisterYounger: '堂妹夫',
    son: '儿媳',
    daughter: '女婿',
    nephew: '侄媳',
    niece: '侄女婿',
  };
  return map[partnerKey] || (spouseGender === 'female' ? '（女性亲属）' : '（男性亲属）');
}

// 对外主函数：计算"我"对"目标"的称呼
export function getKinship(persons, meId, targetId, titleConfig) {
  const cfg = { ...defaultTitleConfig, ...(titleConfig || {}) };
  const byId = buildById(persons);
  if (!byId[meId] || !byId[targetId]) {
    return { key: 'none', label: '（数据缺失）', pathIds: [] };
  }
  if (meId === targetId) {
    return { key: 'self', label: cfg.self, pathIds: [meId] };
  }

  const target = byId[targetId];

  // 目标是我的直接配偶
  const me = byId[meId];
  if (me.spouseId === targetId) {
    const key = target.gender === 'female' ? 'spouseWife' : 'spouseHusband';
    return { key, label: cfg[key], pathIds: [meId, targetId] };
  }

  // 目标是"嫁入/娶入"的配偶：借由其伴侣推导
  if (target.isMarriedIn && target.spouseId && byId[target.spouseId]) {
    const partnerId = target.spouseId;
    const partnerRel = coreKinship(byId, cfg, meId, partnerId);
    const label = spouseTitle(cfg, partnerRel.key, target.gender);
    return {
      key: `spouseOf_${partnerRel.key}`,
      label,
      pathIds: [...partnerRel.pathIds, targetId],
      viaPartner: byId[partnerId]?.name,
    };
  }

  return coreKinship(byId, cfg, meId, targetId);
}

// 供搜索：返回称呼 + 说明文本
export function describeKinship(persons, meId, targetId, titleConfig) {
  const byId = buildById(persons);
  const me = byId[meId];
  const target = byId[targetId];
  const res = getKinship(persons, meId, targetId, titleConfig);
  if (!me || !target) return { ...res, sentence: '' };
  let sentence = `你应该称呼「${target.name}」为：${res.label}`;
  if (res.viaPartner) {
    sentence += `（因其是「${res.viaPartner}」的配偶）`;
  }
  return { ...res, sentence };
}
