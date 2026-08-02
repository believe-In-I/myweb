/**
 * geometryWorker.js - Web Worker
 * 
 * 在独立线程中执行复杂的三维几何计算，避免阻塞主线程（UI 渲染 / 用户交互）
 * 
 * 通信方式：
 *   - 接收主线程消息 → self.onmessage
 *   - 发送结果给主线程 → self.postMessage
 * 
 * 限制：
 *   - 不能操作 DOM
 *   - 不能访问 window / document
 *   - 通过消息传递数据（支持 Transferable 零拷贝）
 */

// 监听主线程发来的消息
self.onmessage = function (e) {
  const { type, payload } = e.data;

  if (type === 'generateGalaxy') {
    // 执行计算密集型任务
    const result = generateGalaxy(payload);

    // 使用 Transferable 传递 ArrayBuffer，实现零拷贝（主线程无需重新复制）
    self.postMessage(
      { type: 'galaxyResult', payload: result },
      [result.positions.buffer, result.colors.buffer]
    );
  }
};

/**
 * 生成螺旋星系粒子系统（计算密集型任务）
 * 
 * 算法说明：
 *   1. 将粒子随机分布在圆形区域内
 *   2. 按粒子半径分配角度偏移（形成旋臂效果）
 *   3. 添加随机散射，使星系更自然
 *   4. 根据距离中心的远近计算渐变色（内暖外冷）
 *
 * @param {Object} params
 * @param {number} params.count  - 粒子数量（越多越耗性能）
 * @param {number} params.arms   - 旋臂数量
 * @param {number} params.radius - 星系半径
 * @returns {{ positions: Float32Array, colors: Float32Array, count: number }}
 */
function generateGalaxy({ count = 50000, arms = 3, radius = 5 }) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // 1. 极坐标：随机半径
    const r = Math.random() * radius;

    // 2. 随半径增加的旋转角度（使粒子沿旋臂分布）
    const spinAngle = r * 0.6;

    // 3. 分配到不同的旋臂
    const branchAngle = ((i % arms) / arms) * Math.PI * 2;

    // 4. 随机散射，产生厚度和自然感
    const scatterX = (Math.random() - 0.5) * 0.4;
    const scatterY = (Math.random() - 0.5) * 0.2;
    const scatterZ = (Math.random() - 0.5) * 0.4;

    // 5. 计算最终三维坐标
    const angle = branchAngle + spinAngle;
    positions[i3] = Math.cos(angle) * r + scatterX;
    positions[i3 + 1] = scatterY;
    positions[i3 + 2] = Math.sin(angle) * r + scatterZ;

    // 6. 根据距中心距离计算颜色（内部橙黄 → 外部蓝紫）
    const mixRatio = r / radius;
    // 新增：基于角度计算彩虹色（替换原 mixRatio 逻辑）
    const hue = (angle / (Math.PI * 2)) % 1.0; // 角度转 0-1 范围
    // 替换原颜色三行：
    colors[i3] = Math.sin(hue * Math.PI * 2) * 0.5 + 0.5;  // R
    colors[i3 + 1] = Math.sin((hue + 0.33) * Math.PI * 2) * 0.5 + 0.5; // G
    colors[i3 + 2] = Math.sin((hue + 0.66) * Math.PI * 2) * 0.5 + 0.5; // B
  }

  return { positions, colors, count };
}
