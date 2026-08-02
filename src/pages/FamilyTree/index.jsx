import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button, Segmented, Select, InputNumber, Radio, Input, Drawer, Modal,
  Tag, Avatar, Timeline, Badge, Tooltip, Empty, message, Space, Divider,
  Descriptions, Alert, Popconfirm, Card,
} from 'antd';
import {
  PlusOutlined, UserOutlined, SearchOutlined, AuditOutlined, HistoryOutlined,
  SettingOutlined, AimOutlined, ZoomInOutlined, ZoomOutOutlined, ManOutlined,
  WomanOutlined, TeamOutlined,
} from '@ant-design/icons';
import { initialPersons, CURRENT_USER_ID, getAvatarColor } from './mockData';
import {
  computeLayout, computeEdges, computeMarriages, NODE_W, NODE_H, V_GAP,
} from './layout';
import {
  getKinship, describeKinship, computeGenerations, defaultTitleConfig,
} from './kinship';
import {
  previewAddFather, previewAddSon, detectConflict, detectContradiction,
  applyChange, makeChangeRequest, makeAuditLog,
} from './ops';

const GEN_CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

// 头像
function PersonAvatar({ person, size = 44 }) {
  const color = getAvatarColor(person);
  if (person.photo) {
    return <Avatar size={size} src={person.photo} />;
  }
  return (
    <Avatar size={size} style={{ background: color, fontSize: size / 2.4 }}>
      {person.name?.[0] || '?'}
    </Avatar>
  );
}

export default function FamilyTreePage() {
  const [persons, setPersons] = useState(initialPersons);
  const [currentUserId] = useState(CURRENT_USER_ID);
  const [role, setRole] = useState('本人'); // 本人 | 审核人 | 访客
  const [selectedId, setSelectedId] = useState(null);
  const [titleConfig, setTitleConfig] = useState({ ...defaultTitleConfig });
  const [zoom, setZoom] = useState(1);
  const [highlightPath, setHighlightPath] = useState([]);
  const [searchTarget, setSearchTarget] = useState(null);
  const [searchResult, setSearchResult] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(true);

  // 编辑（加父/加子）弹窗
  const [addModal, setAddModal] = useState({ open: false, nodeId: null, direction: 'father' });
  const [addLevels, setAddLevels] = useState(1);
  const [addNames, setAddNames] = useState(['']);
  const [addMode, setAddMode] = useState('append'); // append | insert（子女已存在时）

  const [changeRequests, setChangeRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([
    makeAuditLog('系统初始化', '载入高寨村高氏族谱初始数据', '系统'),
  ]);

  const canvasRef = useRef(null);
  const nodeRefs = useRef({});

  const byId = useMemo(() => {
    const m = {};
    persons.forEach((p) => { m[p.id] = p; });
    return m;
  }, [persons]);

  const generations = useMemo(() => computeGenerations(persons), [persons]);
  const { pos, width, height } = useMemo(() => computeLayout(persons), [persons]);
  const edges = useMemo(() => computeEdges(persons, pos), [persons, pos]);
  const marriages = useMemo(() => computeMarriages(persons, pos), [persons, pos]);

  const isEditor = role === '本人' || role === '审核人';
  const isReviewer = role === '审核人';
  const isVisitor = role === '访客';

  const pendingCount = changeRequests.filter((c) => c.status === 'pending' || c.status === 'conflict').length;

  // 称呼缓存
  const kinshipOf = (targetId) => {
    if (targetId === currentUserId) return { label: '我', key: 'self' };
    return getKinship(persons, currentUserId, targetId, titleConfig);
  };

  // ============ 交互 ============
  const handleSelect = (id) => {
    setSelectedId(id);
    setDetailOpen(true);
    const k = kinshipOf(id);
    setHighlightPath(k.pathIds || [id]);
  };

  const locateMe = () => {
    setSelectedId(currentUserId);
    setHighlightPath([currentUserId]);
    const el = nodeRefs.current[currentUserId];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
    message.success('已定位到您的节点：高伟');
  };

  const handleSearchCall = (targetId) => {
    setSearchTarget(targetId);
    if (!targetId) { setSearchResult(null); setHighlightPath([]); return; }
    const res = describeKinship(persons, currentUserId, targetId, titleConfig);
    setSearchResult(res);
    setHighlightPath(res.pathIds || []);
    const el = nodeRefs.current[targetId];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  };

  // ============ 加父/加子 ============
  const openAdd = (nodeId, direction) => {
    setAddModal({ open: true, nodeId, direction });
    setAddLevels(1);
    setAddNames(['']);
    setAddMode('append');
  };

  useEffect(() => {
    setAddNames((prev) => {
      const next = [...prev];
      next.length = addLevels;
      for (let i = 0; i < addLevels; i++) if (!next[i]) next[i] = '';
      return next;
    });
  }, [addLevels]);

  const conflict = useMemo(() => {
    if (!addModal.open || !addModal.nodeId) return { hasConflict: false };
    return detectConflict(persons, addModal.nodeId, addModal.direction);
  }, [addModal, persons]);

  const preview = useMemo(() => {
    if (!addModal.open || !addModal.nodeId) return { newNodes: [], links: [] };
    return addModal.direction === 'father'
      ? previewAddFather(persons, addModal.nodeId, addLevels, addNames)
      : previewAddSon(persons, addModal.nodeId, addLevels, addNames);
  }, [addModal, addLevels, addNames, persons]);

  const submitAdd = () => {
    const node = byId[addModal.nodeId];
    if (!node) return;

    // 矛盾检测（成环）
    const contra = detectContradiction(persons, preview.links);
    const dirText = addModal.direction === 'father' ? '向上新增父辈' : '向下新增子辈';

    const change = makeChangeRequest({
      type: addModal.direction === 'father' ? 'ADD_FATHER' : 'ADD_SON',
      direction: addModal.direction,
      nodeId: node.id,
      nodeName: node.name,
      levels: addLevels,
      payload: { newNodes: preview.newNodes, links: preview.links, mode: addMode },
      submittedBy: byId[currentUserId]?.name || '未知',
      conflict: contra.contradiction ? contra.message : (conflict.hasConflict ? conflict.message : ''),
    });

    setChangeRequests((prev) => [change, ...prev]);
    setAuditLogs((prev) => [
      makeAuditLog(
        '提交变更申请',
        `对「${node.name}」${dirText} ${addLevels} 代，共新增 ${preview.newNodes.length} 人${change.status === 'conflict' ? '（标记为冲突待审）' : ''}`,
        byId[currentUserId]?.name,
      ),
      ...prev,
    ]);

    if (contra.contradiction) {
      message.error('检测到关系矛盾，已拦截并标记为冲突待审');
    } else if (conflict.hasConflict) {
      message.warning('已提交，因存在冲突需审核人重点确认');
    } else {
      message.success('已提交至审核队列，等待审核人确认');
    }
    setAddModal({ open: false, nodeId: null, direction: 'father' });
    setReviewOpen(true);
  };

  // ============ 审核 ============
  const approveChange = (change) => {
    setPersons((prev) => applyChange(prev, change));
    setChangeRequests((prev) => prev.map((c) => (c.id === change.id ? { ...c, status: 'approved' } : c)));
    setAuditLogs((prev) => [
      makeAuditLog('审核通过', `批准对「${change.nodeName}」的变更，新增 ${change.payload.newNodes.length} 人已录入族谱`, byId[currentUserId]?.name),
      ...prev,
    ]);
    message.success('已通过并录入族谱');
  };

  const rejectChange = (change) => {
    setChangeRequests((prev) => prev.map((c) => (c.id === change.id ? { ...c, status: 'rejected' } : c)));
    setAuditLogs((prev) => [
      makeAuditLog('审核驳回', `驳回对「${change.nodeName}」的变更申请`, byId[currentUserId]?.name),
      ...prev,
    ]);
    message.info('已驳回该申请');
  };

  // ============ 详情隐私控制 ============
  const canSeePrivate = (person) => {
    if (isVisitor) return false;
    if (person.id === currentUserId) return true;
    // 直系（父母、子女、配偶）可见
    const me = byId[currentUserId];
    if (person.id === me.fatherId || person.spouseId === currentUserId) return true;
    if (person.fatherId === currentUserId) return true;
    return role === '审核人'; // 审核人可见全部
  };

  const selected = selectedId ? byId[selectedId] : null;

  // ============ 渲染连线 ============
  const renderEdges = () => (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {edges.map((e) => {
        const f = pos[e.from];
        const t = pos[e.to];
        if (!f || !t) return null;
        const fcx = f.x + NODE_W / 2;
        const fby = f.y + NODE_H;
        const ccx = t.x + NODE_W / 2;
        const cty = t.y;
        const midY = fby + V_GAP / 2;
        const active = highlightPath.includes(e.from) && highlightPath.includes(e.to);
        return (
          <polyline
            key={e.id}
            points={`${fcx},${fby} ${fcx},${midY} ${ccx},${midY} ${ccx},${cty}`}
            fill="none"
            stroke={active ? '#fa8c16' : '#c8d1dc'}
            strokeWidth={active ? 3 : 1.5}
          />
        );
      })}
      {marriages.map((mline) => {
        const a = pos[mline.a];
        const b = pos[mline.b];
        if (!a || !b) return null;
        const left = a.x < b.x ? a : b;
        const right = a.x < b.x ? b : a;
        const y = left.y + NODE_H / 2;
        return (
          <line
            key={mline.id}
            x1={left.x + NODE_W}
            y1={y}
            x2={right.x}
            y2={y}
            stroke="#eb6f92"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
        );
      })}
    </svg>
  );

  // ============ 渲染节点 ============
  const renderNodes = () => persons.map((p) => {
    const pp = pos[p.id];
    if (!pp) return null;
    const isSelf = p.id === currentUserId;
    const isSelected = p.id === selectedId;
    const inPath = highlightPath.includes(p.id);
    const k = kinshipOf(p.id);

    let border = '1px solid #e3e8ef';
    let boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
    if (isSelf) { border = '2px solid #52c41a'; boxShadow = '0 0 0 3px rgba(82,196,26,0.18)'; }
    else if (isSelected) { border = '2px solid #1890ff'; boxShadow = '0 0 0 3px rgba(24,144,255,0.18)'; }
    else if (inPath) { border = '2px solid #fa8c16'; }

    return (
      <div
        key={p.id}
        ref={(el) => { nodeRefs.current[p.id] = el; }}
        onClick={() => handleSelect(p.id)}
        style={{
          position: 'absolute',
          left: pp.x,
          top: pp.y,
          width: NODE_W,
          height: NODE_H,
          background: p.deceased ? '#f2f3f5' : '#fff',
          border,
          boxShadow,
          borderRadius: 10,
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          opacity: p.deceased ? 0.72 : 1,
          transition: 'border .15s, box-shadow .15s',
          boxSizing: 'border-box',
        }}
      >
        {/* 辈分角标 */}
        <span style={{
          position: 'absolute', top: 4, left: 6, fontSize: 10, color: '#8c99ab',
        }}>
          第{GEN_CN[generations[p.id]] || (generations[p.id] + 1)}世
        </span>
        {/* 性别角标 */}
        <span style={{ position: 'absolute', top: 4, right: 6 }}>
          {p.gender === 'female'
            ? <WomanOutlined style={{ color: '#eb6f92', fontSize: 12 }} />
            : <ManOutlined style={{ color: '#4c7bd9', fontSize: 12 }} />}
        </span>

        <div style={{ marginTop: 12, filter: p.deceased ? 'grayscale(1)' : 'none' }}>
          <PersonAvatar person={p} size={40} />
        </div>
        <div style={{ marginTop: 4, fontWeight: 600, fontSize: 13, color: '#222', lineHeight: 1.2 }}>
          {p.name}
          {p.deceased && <span style={{ color: '#999', fontSize: 10, marginLeft: 2 }}>（故）</span>}
        </div>
        <div style={{ fontSize: 10, color: '#98a2b3' }}>
          {p.birthDate ? p.birthDate.slice(0, 4) : '—'}
          {p.deceased && p.deceasedDate ? ` - ${p.deceasedDate.slice(0, 4)}` : ''}
        </div>
        <div style={{ marginTop: 'auto' }}>
          {isSelf
            ? <Tag color="green" style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}>我</Tag>
            : <Tag color={inPath ? 'orange' : 'blue'} style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}>{k.label}</Tag>}
        </div>

        {/* + 编辑入口 */}
        {isEditor && !p.isMarriedIn && (
          <Tooltip title="增加父辈 / 子辈">
            <Button
              size="small"
              shape="circle"
              icon={<PlusOutlined />}
              onClick={(e) => { e.stopPropagation(); openAdd(p.id, 'father'); }}
              style={{
                position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)',
                width: 22, height: 22, minWidth: 22, fontSize: 11,
              }}
            />
          </Tooltip>
        )}
      </div>
    );
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部工具栏 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1f2d3d' }}>
            <TeamOutlined style={{ color: '#1890ff', marginRight: 6 }} />
            高寨村 · 高氏族谱
          </span>
          <Divider type="vertical" />
          <span style={{ color: '#8c99ab', fontSize: 13 }}>当前身份</span>
          <Segmented
            value={role}
            onChange={setRole}
            options={['本人', '审核人', '访客']}
          />
          <div style={{ flex: 1 }} />
          <Space wrap>
            <Select
              showSearch
              allowClear
              placeholder="我该怎么称呼他？"
              style={{ width: 220 }}
              value={searchTarget}
              onChange={handleSearchCall}
              suffixIcon={<SearchOutlined />}
              optionFilterProp="label"
              options={persons
                .filter((p) => p.id !== currentUserId)
                .map((p) => ({ value: p.id, label: `${p.name}（${p.birthDate?.slice(0, 4) || '—'}）` }))}
            />
            <Button icon={<AimOutlined />} onClick={locateMe}>定位我</Button>
            {isReviewer && (
              <Badge count={pendingCount} size="small">
                <Button icon={<AuditOutlined />} onClick={() => setReviewOpen(true)}>审核队列</Button>
              </Badge>
            )}
            <Button icon={<HistoryOutlined />} onClick={() => setAuditOpen(true)}>修改留痕</Button>
            <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>称呼设置</Button>
          </Space>
        </div>

        {searchResult && (
          <Alert
            style={{ marginTop: 10 }}
            type="success"
            showIcon
            closable
            onClose={() => { setSearchResult(null); setSearchTarget(null); setHighlightPath([]); }}
            message={searchResult.sentence}
            description="已在图中高亮你与对方之间的关系路径（橙色）。"
          />
        )}
      </div>

      {/* 图例 + 缩放 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#8c99ab' }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, background: '#fff', border: '2px solid #52c41a', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} />
          本人
        </span>
        <span style={{ fontSize: 12, color: '#8c99ab' }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, background: '#f2f3f5', border: '1px solid #ccc', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} />
          已故（灰）
        </span>
        <span style={{ fontSize: 12, color: '#8c99ab' }}>
          <span style={{ display: 'inline-block', width: 16, height: 0, borderTop: '2px dashed #eb6f92', marginRight: 4, verticalAlign: 'middle' }} />
          婚姻
        </span>
        <div style={{ flex: 1 }} />
        <Space>
          <Button size="small" icon={<ZoomOutOutlined />} onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)))} />
          <span style={{ fontSize: 12, width: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <Button size="small" icon={<ZoomInOutlined />} onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))} />
        </Space>
      </div>

      {/* 画布 */}
      <div
        ref={canvasRef}
        style={{
          flex: 1,
          overflow: 'auto',
          border: '1px solid #eef1f5',
          borderRadius: 10,
          background: 'linear-gradient(0deg,#fafbfc,#fafbfc), repeating-linear-gradient(90deg,#f4f6f9 0 1px,transparent 1px 40px)',
          position: 'relative',
        }}
      >
        <div style={{
          width: width * zoom,
          height: height * zoom,
          position: 'relative',
        }}>
          <div style={{
            width, height, position: 'absolute', top: 0, left: 0,
            transform: `scale(${zoom})`, transformOrigin: 'top left',
          }}>
            {renderEdges()}
            {renderNodes()}
          </div>
        </div>
      </div>

      {/* ============ 详情抽屉 ============ */}
      <Drawer
        title={selected ? `${selected.name} · 详情` : '详情'}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={380}
      >
        {selected && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ filter: selected.deceased ? 'grayscale(1)' : 'none' }}>
                <PersonAvatar person={selected} size={96} />
              </div>
              <div style={{ marginTop: 10, fontSize: 20, fontWeight: 700 }}>
                {selected.name}
                {selected.deceased && <Tag style={{ marginLeft: 8 }}>已故</Tag>}
              </div>
              <div style={{ marginTop: 4 }}>
                {selected.id === currentUserId
                  ? <Tag color="green">这是您本人</Tag>
                  : <Tag color="blue">您应称呼：{kinshipOf(selected.id).label}</Tag>}
              </div>
            </div>

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="性别">{selected.gender === 'female' ? '女' : '男'}</Descriptions.Item>
              <Descriptions.Item label="辈分">第{GEN_CN[generations[selected.id]] || (generations[selected.id] + 1)}世</Descriptions.Item>
              <Descriptions.Item label="出生">{selected.birthDate || '—'}</Descriptions.Item>
              {selected.deceased && (
                <Descriptions.Item label="离世">{selected.deceasedDate || '—'}</Descriptions.Item>
              )}
              <Descriptions.Item label="父亲">{byId[selected.fatherId]?.name || '—'}</Descriptions.Item>
              <Descriptions.Item label="配偶">{byId[selected.spouseId]?.name || '—'}</Descriptions.Item>
              <Descriptions.Item label="手机">
                {canSeePrivate(selected) ? (selected.phone || '未登记') : <span style={{ color: '#bbb' }}>*** 隐私（仅直系可见）</span>}
              </Descriptions.Item>
              <Descriptions.Item label="简介">
                {isVisitor ? <span style={{ color: '#bbb' }}>登录认证后可见</span> : (selected.bio || '暂无')}
              </Descriptions.Item>
            </Descriptions>

            {isEditor && !selected.isMarriedIn && (
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <Button block icon={<PlusOutlined />} onClick={() => { setDetailOpen(false); openAdd(selected.id, 'father'); }}>
                  增加父辈
                </Button>
                <Button block icon={<PlusOutlined />} onClick={() => { setDetailOpen(false); openAdd(selected.id, 'son'); }}>
                  增加子辈
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ============ 加父/加子 弹窗 ============ */}
      <Modal
        title={`编辑族谱结构 · ${byId[addModal.nodeId]?.name || ''}`}
        open={addModal.open}
        onCancel={() => setAddModal({ open: false, nodeId: null, direction: 'father' })}
        onOk={submitAdd}
        okText="提交审核"
        width={560}
      >
        <Radio.Group
          value={addModal.direction}
          onChange={(e) => setAddModal((m) => ({ ...m, direction: e.target.value }))}
          style={{ marginBottom: 16 }}
        >
          <Radio.Button value="father">向上 · 增加父辈</Radio.Button>
          <Radio.Button value="son">向下 · 增加子辈</Radio.Button>
        </Radio.Group>

        <div style={{ marginBottom: 12 }}>
          <span style={{ marginRight: 8 }}>插入层级</span>
          <InputNumber min={1} max={3} value={addLevels} onChange={(v) => setAddLevels(v || 1)} />
          <span style={{ color: '#8c99ab', marginLeft: 8, fontSize: 12 }}>（最多 3 代，防止一次插入过多）</span>
        </div>

        {/* 新节点命名 */}
        <div style={{ marginBottom: 12 }}>
          {addNames.map((nm, i) => (
            <Input
              key={i}
              style={{ marginBottom: 8 }}
              addonBefore={`第 ${i + 1} 代`}
              placeholder="姓名（可留空，后续补充）"
              value={nm}
              onChange={(e) => {
                const next = [...addNames];
                next[i] = e.target.value;
                setAddNames(next);
              }}
            />
          ))}
        </div>

        {conflict.hasConflict && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="冲突提示"
            description={
              <div>
                <div>{conflict.message}</div>
                {conflict.type === 'son_exists' && (
                  <Radio.Group value={addMode} onChange={(e) => setAddMode(e.target.value)} style={{ marginTop: 8 }}>
                    <Radio value="append">追加一个子女</Radio>
                    <Radio value="insert">在中间插入一代</Radio>
                  </Radio.Group>
                )}
              </div>
            }
          />
        )}

        {/* 预览 */}
        <Card size="small" title="预览：提交后将新增以下节点" style={{ background: '#fafbfc' }}>
          {preview.newNodes.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无" />
          ) : (
            <Timeline
              items={preview.newNodes.map((n, i) => ({
                color: 'blue',
                children: (
                  <span>
                    {addModal.direction === 'father' ? `↑ 第 ${i + 1} 代父辈` : `↓ 第 ${i + 1} 代子辈`}：
                    <b>{n.name}</b>
                  </span>
                ),
              }))}
            />
          )}
          <div style={{ fontSize: 12, color: '#8c99ab', marginTop: 4 }}>
            {addModal.direction === 'father'
              ? '说明：原有祖先关系将整体上移一层。'
              : '说明：将在该节点下方新建后代链。'}
          </div>
        </Card>
      </Modal>

      {/* ============ 审核队列抽屉 ============ */}
      <Drawer
        title={`审核队列（待处理 ${pendingCount}）`}
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        width={460}
      >
        {changeRequests.length === 0 ? (
          <Empty description="暂无变更申请" />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {changeRequests.map((c) => (
              <Card key={c.id} size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>{c.type === 'ADD_FATHER' ? '增加父辈' : '增加子辈'} · {c.nodeName}</b>
                  {c.status === 'pending' && <Tag color="processing">待审核</Tag>}
                  {c.status === 'conflict' && <Tag color="error">冲突待审</Tag>}
                  {c.status === 'approved' && <Tag color="success">已通过</Tag>}
                  {c.status === 'rejected' && <Tag>已驳回</Tag>}
                </div>
                <div style={{ fontSize: 12, color: '#8c99ab', marginTop: 6 }}>
                  申请人：{c.submittedBy} · {c.createdAt}
                </div>
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  新增 {c.payload.newNodes.length} 人（{c.levels} 代）：
                  {c.payload.newNodes.map((n) => n.name).join('、')}
                </div>
                {c.conflictMessage && (
                  <Alert type="error" showIcon style={{ marginTop: 8 }} message={c.conflictMessage} />
                )}
                {isReviewer && (c.status === 'pending' || c.status === 'conflict') && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <Popconfirm title="确认通过并录入族谱？" onConfirm={() => approveChange(c)} okText="通过" cancelText="取消">
                      <Button type="primary" size="small">通过</Button>
                    </Popconfirm>
                    <Button size="small" danger onClick={() => rejectChange(c)}>驳回</Button>
                  </div>
                )}
              </Card>
            ))}
          </Space>
        )}
      </Drawer>

      {/* ============ 修改留痕抽屉 ============ */}
      <Drawer
        title="修改留痕（审计日志）"
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        width={420}
      >
        <Timeline
          items={auditLogs.map((log) => ({
            children: (
              <div>
                <div style={{ fontWeight: 600 }}>{log.action}</div>
                <div style={{ fontSize: 13, color: '#555' }}>{log.detail}</div>
                <div style={{ fontSize: 12, color: '#8c99ab', marginTop: 2 }}>{log.user} · {log.time}</div>
              </div>
            ),
          }))}
        />
      </Drawer>

      {/* ============ 称呼设置抽屉 ============ */}
      <Drawer
        title="自定义称呼"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        width={360}
      >
        <Alert type="info" showIcon style={{ marginBottom: 12 }} message="可按家乡习惯自定义称呼，实时生效。" />
        <Space direction="vertical" style={{ width: '100%' }}>
          {[
            ['uncleElder', '父亲的哥哥'],
            ['uncleYounger', '父亲的弟弟'],
            ['aunt', '父亲的姐妹'],
            ['cousinBrotherElder', '同辈堂兄（年长）'],
            ['cousinBrotherYounger', '同辈堂弟（年幼）'],
            ['grandpa', '祖父'],
          ].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 130, color: '#555', fontSize: 13 }}>{label}</span>
              <Input
                value={titleConfig[key]}
                onChange={(e) => setTitleConfig((c) => ({ ...c, [key]: e.target.value }))}
              />
            </div>
          ))}
          <Button onClick={() => setTitleConfig({ ...defaultTitleConfig })}>恢复默认</Button>
        </Space>
      </Drawer>

      {/* ============ 新人引导 ============ */}
      <Modal
        title="欢迎回到高氏族谱"
        open={welcomeOpen && role === '本人'}
        onOk={() => { setWelcomeOpen(false); locateMe(); }}
        onCancel={() => setWelcomeOpen(false)}
        okText="确认，定位到我"
        cancelText="稍后"
      >
        <p>
          系统推测您是「<b>{byId[byId[currentUserId]?.fatherId]?.name}</b>」的儿子
          「<b>{byId[currentUserId]?.name}</b>」，辈分为
          <b> 第{GEN_CN[generations[currentUserId]] || generations[currentUserId] + 1}世</b>。
        </p>
        <p style={{ color: '#8c99ab' }}>如信息有误，可在图中点击对应节点，通过「增加父辈 / 子辈」提交修正，交由审核人确认。</p>
      </Modal>
    </div>
  );
}
