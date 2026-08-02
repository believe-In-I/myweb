import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

/* ==================== 常量 ==================== */
const GRAVITY = -15;               // 重力加速度
const CHARGE_SPEED = 100;          // 蓄力速度（%/秒）
const MAX_CHARGE = 100;            // 最大蓄力值
const BASE_VELOCITY = 25;          // 基础初速度
const MAX_VELOCITY = 55;           // 最大初速度
const ARROW_LIFETIME = 5;          // 箭矢最大存活时间（秒）
const MOUSE_SENSITIVITY = 0.002;   // 鼠标灵敏度
const TARGET_RADIUS = 2.0;         // 靶子半径
const TARGET_RING_COUNT = 10;      // 10环

// 三个靶子在世界空间的位置
const TARGET_POSITIONS = [
  { x: -6,  y: 0, z: -25 },
  { x:  0,  y: 0, z: -35 },
  { x:  6,  y: 0, z: -25 },
];

// 环的颜色（从中心到外围）
const RING_COLORS = [
  0xffd700, // 10环 金
  0xffd700, // 9环  金
  0xff4444, // 8环  红
  0xff4444, // 7环  红
  0x4488ff, // 6环  蓝
  0x4488ff, // 5环  蓝
  0x333333, // 4环  黑
  0x333333, // 3环  黑
  0xffffff, // 2环  白
  0xffffff, // 1环  白
];

/* ==================== 工具函数 ==================== */
/** 根据距离靶心距离计算环数 (1-10) */
function calcRing(distanceFromCenter) {
  const normalized = distanceFromCenter / TARGET_RADIUS;
  const ring = 10 - Math.floor(normalized * 10);
  return Math.max(1, Math.min(10, ring));
}

/* ==================== 主组件 ==================== */
const ArcheryRange = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animFrameRef = useRef(null);

  // Three.js 对象引用
  const bowGroupRef = useRef(null);
  const arrowRef = useRef(null);
  const arrowMeshRef = useRef(null);       // 挂在弓上的箭（视觉）
  const targetsRef = useRef([]);           // { group, center, worldPos }
  const arrowsInFlightRef = useRef([]);    // { mesh, velocity, life }
  const hitMarkersRef = useRef([]);        // 命中标记（3D文字/环指示）

  // 输入状态
  const inputRef = useRef({
    isCharging: false,
    chargeStartTime: 0,
    charge: 0,
    yaw: 0,
    pitch: 0,
    isLocked: false,
  });

  // UI 状态
  const [charge, setCharge] = useState(0);
  const [scores, setScores] = useState([0, 0, 0]);      // 每个靶子的总分
  const [lastHit, setLastHit] = useState(null);          // { targetIndex, ring }
  const [isLocked, setIsLocked] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [arrowCount, setArrowCount] = useState(0);
  const [hintDismissed, setHintDismissed] = useState(false);

  /* ========== 场景初始化 ========== */
  useEffect(() => {
    if (!mountRef.current) return;

    // --- 渲染器 ---
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- 场景 ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // 天空蓝
    scene.fog = new THREE.Fog(0x87ceeb, 40, 100);
    sceneRef.current = scene;

    // --- 相机 ---
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 1.6, 0); // 眼睛高度
    cameraRef.current = camera;

    // --- 光照 ---
    const ambient = new THREE.AmbientLight(0x8899aa, 0.6);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffeedd, 1.0);
    sun.position.set(30, 40, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 150;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    scene.add(sun);

    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x3d6e3d, 0.4);
    scene.add(hemi);

    // --- 地面 ---
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x4a8c3f, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // 网格线辅助
    const gridHelper = new THREE.PolarGridHelper(50, 64, 32, 64, 0x3a7a2f, 0x3a7a2f);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // --- 创建三个靶子 ---
    const targets = [];
    TARGET_POSITIONS.forEach((pos, i) => {
      const targetGroup = createTarget(i);
      targetGroup.position.set(pos.x, pos.y, pos.z);
      targetGroup.castShadow = true;
      targetGroup.receiveShadow = true;
      scene.add(targetGroup);
      targets.push({ group: targetGroup, center: new THREE.Vector3(pos.x, pos.y, pos.z), worldPos: pos });
    });
    targetsRef.current = targets;

    // --- 创建弓 ---
    const bowGroup = new THREE.Group();
    bowGroup.position.set(0.3, -0.2, -0.6);
    createBow(bowGroup);
    scene.add(bowGroup);
    bowGroupRef.current = bowGroup;

    // --- 创建挂在弓上的箭 ---
    const arrowVisual = createArrowModel();
    arrowVisual.visible = true;
    arrowVisual.position.set(0, 0.05, 0);
    bowGroup.add(arrowVisual);
    arrowMeshRef.current = arrowVisual;

    // --- 窗口缩放 ---
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // --- 指针锁定 ---
    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === renderer.domElement;
      inputRef.current.isLocked = locked;
      setIsLocked(locked);
    };
    document.addEventListener('pointerlockchange', onPointerLockChange);

    renderer.domElement.addEventListener('click', () => {
      if (!inputRef.current.isLocked) {
        renderer.domElement.requestPointerLock();
      }
    });

    // --- 鼠标移动 ---
    const onMouseMove = (e) => {
      if (!inputRef.current.isLocked) return;
      inputRef.current.yaw -= e.movementX * MOUSE_SENSITIVITY;
      inputRef.current.pitch -= e.movementY * MOUSE_SENSITIVITY;
      inputRef.current.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, inputRef.current.pitch));
    };
    document.addEventListener('mousemove', onMouseMove);

    // --- 鼠标按下/松开（蓄力） ---
    const onMouseDown = (e) => {
      if (e.button !== 0 || !inputRef.current.isLocked) return;
      inputRef.current.isCharging = true;
      inputRef.current.chargeStartTime = performance.now();
    };
    const onMouseUp = (e) => {
      if (e.button !== 0 || !inputRef.current.isCharging) return;
      fireArrow();
      inputRef.current.isCharging = false;
      inputRef.current.charge = 0;
      setCharge(0);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    // --- 动画循环 ---
    let lastTime = performance.now();
    const animate = (now) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1); // cap delta
      lastTime = now;

      updateCamera(dt);
      updateCharge(dt);
      updateArrows(dt);
      updateHitMarkers(dt);

      renderer.render(scene, camera);
    };
    requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // 清理场景对象
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ========== 创建靶子 ========== */
  const createTarget = (index) => {
    const group = new THREE.Group();
    const ringWidth = TARGET_RADIUS / TARGET_RING_COUNT;

    // 靶面（各环）
    for (let i = 0; i < TARGET_RING_COUNT; i++) {
      const outerR = TARGET_RADIUS - i * ringWidth;
      const innerR = Math.max(0, outerR - ringWidth);
      const geo = new THREE.RingGeometry(innerR, outerR, 64);
      const mat = new THREE.MeshStandardMaterial({
        color: RING_COLORS[i],
        side: THREE.DoubleSide,
        roughness: 0.6,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.position.z = 0.01 * i; // 轻微偏移避免 z-fighting
      group.add(ring);
    }

    // 靶心圆点
    const centerGeo = new THREE.CircleGeometry(ringWidth * 0.5, 32);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xffd700, side: THREE.DoubleSide, roughness: 0.4 });
    const centerDot = new THREE.Mesh(centerGeo, centerMat);
    centerDot.position.z = 0.11;
    group.add(centerDot);

    // 靶子支架
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.12, 1.8, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = -1.9;
    pole.castShadow = true;
    group.add(pole);

    // 底座
    const baseGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.2, 16);
    const base = new THREE.Mesh(baseGeo, poleMat);
    base.position.y = -2.8;
    base.castShadow = true;
    group.add(base);

    // 分数显示标签（用 sprite 做 3D 文字太麻烦，改为在 UI 层显示）
    // 保存靶子引用
    group.userData = { targetIndex: index };

    return group;
  };

  /* ========== 创建弓模型 ========== */
  const createBow = (group) => {
    // 弓臂 - 用 torus 弧线表示
    const torusGeo = new THREE.TorusGeometry(0.5, 0.04, 8, 32, Math.PI);
    const bowMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.4, metalness: 0.3 });
    const bowBody = new THREE.Mesh(torusGeo, bowMat);
    bowBody.rotation.z = Math.PI / 2;
    bowBody.rotation.y = -Math.PI / 2;
    bowBody.position.set(0, 0, 0);
    group.add(bowBody);

    // 弓弦
    const stringPoints = [
      new THREE.Vector3(0, 0.48, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.48, 0),
    ];
    const stringGeo = new THREE.BufferGeometry().setFromPoints(stringPoints);
    const stringLine = new THREE.Line(stringGeo, new THREE.LineBasicMaterial({ color: 0xcccccc }));
    group.add(stringLine);

    // 握把
    const gripGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.25, 8);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, 0, 0);
    group.add(grip);
  };

  /* ========== 创建箭矢模型 ========== */
  const createArrowModel = () => {
    const group = new THREE.Group();

    // 箭杆
    const shaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(0, 0, 0.7);
    group.add(shaft);

    // 箭头
    const headGeo = new THREE.ConeGeometry(0.04, 0.15, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.2, metalness: 0.8 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.rotation.x = Math.PI / 2;
    head.position.set(0, 0, 1.45);
    group.add(head);

    // 尾羽
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const featherGeo = new THREE.BoxGeometry(0.01, 0.08, 0.12);
      const featherMat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.6 });
      const feather = new THREE.Mesh(featherGeo, featherMat);
      feather.position.set(
        Math.sin(angle) * 0.03,
        Math.cos(angle) * 0.03,
        -0.55
      );
      feather.rotation.z = angle;
      group.add(feather);
    }

    return group;
  };

  /* ========== 更新相机（第一人称视角） ========== */
  const updateCamera = (dt) => {
    const camera = cameraRef.current;
    const input = inputRef.current;
    const euler = new THREE.Euler(input.pitch, input.yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    // 弓跟随相机
    if (bowGroupRef.current) {
      const bow = bowGroupRef.current;
      // 弓的位置相对于相机：右侧、下方、前方
      const bowOffset = new THREE.Vector3(0.3, -0.2, -0.6);
      bowOffset.applyQuaternion(camera.quaternion);
      bow.position.copy(camera.position).add(bowOffset);
      bow.quaternion.copy(camera.quaternion);
    }
  };

  /* ========== 更新蓄力 ========== */
  const updateCharge = (dt) => {
    const input = inputRef.current;
    if (input.isCharging) {
      input.charge = Math.min(MAX_CHARGE, input.charge + CHARGE_SPEED * dt);
      setCharge(Math.round(input.charge));
    }
  };

  /* ========== 发射箭矢 ========== */
  const fireArrow = () => {
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    const input = inputRef.current;
    const chargePercent = input.charge / MAX_CHARGE;

    // 初速度 = 基础速度 + 蓄力加成
    const speed = BASE_VELOCITY + (MAX_VELOCITY - BASE_VELOCITY) * chargePercent;

    // 方向 = 相机前方
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);

    const velocity = direction.clone().multiplyScalar(speed);

    // 创建飞行箭矢
    const arrow = createArrowModel();
    arrow.position.copy(camera.position).add(
      direction.clone().multiplyScalar(0.8)
    );
    // 旋转箭矢指向飞行方向
    arrow.quaternion.copy(camera.quaternion);
    scene.add(arrow);

    arrowsInFlightRef.current.push({
      mesh: arrow,
      velocity,
      life: 0,
    });

    setArrowCount(prev => prev + 1);

    // 隐藏弓上的箭
    if (arrowMeshRef.current) {
      arrowMeshRef.current.visible = false;
    }
    // 0.3秒后重新显示
    setTimeout(() => {
      if (arrowMeshRef.current) {
        arrowMeshRef.current.visible = true;
      }
    }, 300);
  };

  /* ========== 更新飞行中的箭矢 ========== */
  const updateArrows = (dt) => {
    const arrows = arrowsInFlightRef.current;
    const targets = targetsRef.current;

    for (let i = arrows.length - 1; i >= 0; i--) {
      const arrow = arrows[i];
      arrow.life += dt;

      // 超时移除
      if (arrow.life > ARROW_LIFETIME) {
        sceneRef.current.remove(arrow.mesh);
        disposeArrow(arrow.mesh);
        arrows.splice(i, 1);
        continue;
      }

      // 重力
      arrow.velocity.y += GRAVITY * dt;

      // 更新位置
      const prevPos = arrow.mesh.position.clone();
      arrow.mesh.position.x += arrow.velocity.x * dt;
      arrow.mesh.position.y += arrow.velocity.y * dt;
      arrow.mesh.position.z += arrow.velocity.z * dt;

      // 旋转箭矢指向速度方向
      const velDir = arrow.velocity.clone().normalize();
      const quat = new THREE.Quaternion();
      quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), velDir);
      arrow.mesh.quaternion.copy(quat);

      // 碰撞检测 - 检查是否穿过靶面
      let hitTarget = false;
      for (let t = 0; t < targets.length; t++) {
        const target = targets[t];
        const tz = target.worldPos.z;
        const prevZ = prevPos.z;
        const curZ = arrow.mesh.position.z;

        // 箭矢在 z 方向穿过了靶面
        if ((prevZ > tz && curZ <= tz) || (prevZ < tz && curZ >= tz)) {
          // 计算在靶面上的交点
          const t_frac = (tz - prevZ) / (curZ - prevZ);
          const hitX = prevPos.x + (arrow.mesh.position.x - prevPos.x) * t_frac;
          const hitY = prevPos.y + (arrow.mesh.position.y - prevPos.y) * t_frac;
          const hitZ = tz;

          // 距离靶心
          const dx = hitX - target.worldPos.x;
          const dy = hitY - target.worldPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= TARGET_RADIUS + 0.1) {
            // 命中！
            const ring = calcRing(dist);
            onHitTarget(t, ring, new THREE.Vector3(hitX, hitY, hitZ));
            sceneRef.current.remove(arrow.mesh);
            disposeArrow(arrow.mesh);
            arrows.splice(i, 1);
            hitTarget = true;
            break;
          }
        }
      }

      if (hitTarget) continue;

      // 地面碰撞
      if (arrow.mesh.position.y < 0) {
        arrow.mesh.position.y = 0;
        // 箭矢留在地面上
        arrow.velocity.set(0, 0, 0);
        // 几秒后自动移除
        if (arrow.life > 3) {
          sceneRef.current.remove(arrow.mesh);
          disposeArrow(arrow.mesh);
          arrows.splice(i, 1);
        }
      }
    }
  };

  /* ========== 命中靶子 ========== */
  const onHitTarget = (targetIndex, ring, hitPos) => {
    // 更新分数
    setScores(prev => {
      const next = [...prev];
      next[targetIndex] += ring;
      return next;
    });
    setTotalScore(prev => prev + ring);
    setLastHit({ targetIndex, ring });

    // 创建命中标记
    createHitMarker(targetIndex, ring, hitPos);

    // 2秒后清除 lastHit
    setTimeout(() => setLastHit(null), 2000);
  };

  /* ========== 命中标记（3D 文字） ========== */
  const createHitMarker = (targetIndex, ring, position) => {
    const scene = sceneRef.current;

    // 创建 canvas 纹理
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = ring >= 8 ? '#ffd700' : ring >= 5 ? '#ff4444' : '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${ring}环`, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    // 标记在靶子前方
    const targetPos = TARGET_POSITIONS[targetIndex];
    sprite.position.set(targetPos.x, targetPos.y + TARGET_RADIUS + 0.5, targetPos.z + 0.3);
    sprite.scale.set(2, 1, 1);
    scene.add(sprite);

    hitMarkersRef.current.push({ sprite, life: 0, texture });
  };

  /* ========== 更新命中标记 ========== */
  const updateHitMarkers = (dt) => {
    const markers = hitMarkersRef.current;
    for (let i = markers.length - 1; i >= 0; i--) {
      markers[i].life += dt;
      // 淡出并上浮
      markers[i].sprite.position.y += dt * 0.5;
      markers[i].sprite.material.opacity = Math.max(0, 1 - markers[i].life / 2);
      if (markers[i].life > 2) {
        sceneRef.current.remove(markers[i].sprite);
        markers[i].texture.dispose();
        markers[i].sprite.material.dispose();
        markers.splice(i, 1);
      }
    }
  };

  /* ========== 清理箭矢 ========== */
  const disposeArrow = (arrow) => {
    arrow.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  };

  /* ========== 重置游戏 ========== */
  const handleReset = useCallback(() => {
    // 清理飞行箭矢
    const arrows = arrowsInFlightRef.current;
    arrows.forEach(a => {
      sceneRef.current.remove(a.mesh);
      disposeArrow(a.mesh);
    });
    arrows.length = 0;

    // 清理标记
    const markers = hitMarkersRef.current;
    markers.forEach(m => {
      sceneRef.current.remove(m.sprite);
      m.texture.dispose();
      m.sprite.material.dispose();
    });
    markers.length = 0;

    setScores([0, 0, 0]);
    setTotalScore(0);
    setArrowCount(0);
    setLastHit(null);
    setCharge(0);
    inputRef.current.isCharging = false;
    inputRef.current.charge = 0;
  }, []);

  /* ========== 渲染 ========== */
  const chargeBarWidth = `${charge}%`;
  const chargeColor = charge < 40 ? '#4caf50' : charge < 75 ? '#ff9800' : '#f44336';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#000' }}>
      {/* Three.js 画布 */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* --- 准星 --- */}
      {isLocked && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 24, height: 24, pointerEvents: 'none', zIndex: 10,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
            <line x1="12" y1="2" x2="12" y2="8" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
            <line x1="12" y1="16" x2="12" y2="22" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
            <line x1="2" y1="12" x2="8" y2="12" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
            <line x1="16" y1="12" x2="22" y2="12" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
            <circle cx="12" cy="12" r="1" fill="rgba(255,50,50,0.8)" />
          </svg>
        </div>
      )}

      {/* --- 蓄力条 --- */}
      {isLocked && (
        <div style={{
          position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          width: 280, zIndex: 10, pointerEvents: 'none',
        }}>
          <div style={{
            height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4,
            overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)',
          }}>
            <div style={{
              width: chargeBarWidth, height: '100%', background: chargeColor,
              borderRadius: 4, transition: 'width 0.05s linear',
            }} />
          </div>
          <div style={{ textAlign: 'center', color: '#fff', fontSize: 12, marginTop: 4, opacity: 0.8 }}>
            蓄力 {charge}%
          </div>
        </div>
      )}

      {/* --- 提示 --- */}
      {!isLocked && !hintDismissed && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '24px 32px',
          borderRadius: 12, textAlign: 'center', zIndex: 20, maxWidth: 360,
        }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>🏹 射箭训练场</h2>
          <p style={{ margin: '0 0 8px', fontSize: 14, opacity: 0.9 }}>点击屏幕锁定鼠标</p>
          <p style={{ margin: '0 0 8px', fontSize: 14, opacity: 0.9 }}>移动鼠标瞄准</p>
          <p style={{ margin: '0 0 8px', fontSize: 14, opacity: 0.9 }}>按住左键蓄力，松开射箭</p>
          <p style={{ margin: '0 0 16px', fontSize: 14, opacity: 0.9 }}>蓄力越久，箭速越快，下坠越小</p>
          <button
            onClick={() => {
              setHintDismissed(true);
              mountRef.current?.querySelector('canvas')?.requestPointerLock();
            }}
            style={{
              padding: '8px 24px', fontSize: 14, cursor: 'pointer',
              background: '#ff9800', color: '#fff', border: 'none', borderRadius: 6,
            }}
          >
            开始训练
          </button>
        </div>
      )}

      {/* --- 分数面板 --- */}
      {isLocked && (
        <div style={{
          position: 'absolute', top: 16, right: 16, zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {/* 总分 */}
          <div style={{
            background: 'rgba(0,0,0,0.65)', color: '#ffd700', padding: '8px 16px',
            borderRadius: 8, fontSize: 20, fontWeight: 'bold', textAlign: 'center',
          }}>
            总分: {totalScore}
          </div>
          {/* 各靶子分数 */}
          {scores.map((s, i) => (
            <div key={i} style={{
              background: lastHit?.targetIndex === i
                ? 'rgba(255,152,0,0.8)'
                : 'rgba(0,0,0,0.55)',
              color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 14,
              transition: 'background 0.2s',
            }}>
              靶子 {i + 1}: {s} 分
              {lastHit?.targetIndex === i && (
                <span style={{ marginLeft: 6, color: '#ffd700', fontWeight: 'bold' }}>
                  +{lastHit.ring}
                </span>
              )}
            </div>
          ))}
          {/* 箭数 */}
          <div style={{
            background: 'rgba(0,0,0,0.55)', color: '#ccc', padding: '6px 14px',
            borderRadius: 8, fontSize: 12, textAlign: 'center',
          }}>
            已射 {arrowCount} 箭
          </div>
          {/* 重置按钮 */}
          <button
            onClick={handleReset}
            style={{
              background: 'rgba(200,50,50,0.7)', color: '#fff', border: 'none',
              padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              marginTop: 4,
            }}
          >
            重置
          </button>
        </div>
      )}

      {/* --- 命中提示（屏幕中央） --- */}
      {lastHit && isLocked && (
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          color: '#ffd700', fontSize: 48, fontWeight: 'bold', zIndex: 10, pointerEvents: 'none',
          textShadow: '0 0 20px rgba(255,215,0,0.5)',
        }}>
          {lastHit.ring}环!
        </div>
      )}
    </div>
  );
};

export default ArcheryRange;