import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import useResponsive from '@/hooks/useResponsive';

/**
 * Three.js 入门级 Demo
 * 功能：创建一个旋转的立方体，带有光源和轨道控制器
 * 学习要点：
 * - Three.js 核心概念（场景、相机、渲染器）
 * - 3D 对象创建与材质应用
 * - 光源设置
 * - 动画循环
 * - 轨道控制器使用
 */
const ThreeJsDemo = () => {
  // 引用 DOM 元素
  const containerRef = useRef(null);
  
  // 响应式状态
  const { isMobile, isTablet } = useResponsive();
  
  // 存储 Three.js 相关对象
  let scene, camera, renderer, cube, controls, light;
  
  // 响应式配置
  const containerHeight = isMobile ? 350 : isTablet ? 450 : 600;
  const paddingSize = isMobile ? 12 : 20;
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // 初始化 Three.js 场景
    initScene();
    
    // 启动动画循环
    animate();
    
    // 清理函数
    return () => {
      if (controls) controls.dispose();
      if (renderer) renderer.dispose();
    };
  }, []);
  
  /**
   * 初始化 Three.js 场景
   */
  const initScene = () => {
    // 1. 创建场景
    scene = new THREE.Scene();
    // 设置场景背景颜色
    scene.background = new THREE.Color(0xf0f0f0);
    
    // 2. 创建相机
    // 透视相机：参数分别为视野角度、宽高比、近裁剪面、远裁剪面
    camera = new THREE.PerspectiveCamera(
      75, // 视野角度
      containerRef.current.clientWidth / containerRef.current.clientHeight, // 宽高比
      0.1, // 近裁剪面
      1000 // 远裁剪面
    );
    // 设置相机位置
    camera.position.z = 5;
    
    // 3. 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    // 设置渲染器尺寸
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    // 将渲染器的 DOM 元素添加到容器中
    containerRef.current.appendChild(renderer.domElement);
    
    // 4. 创建几何体和材质
    // 立方体几何体：参数分别为宽、高、深
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    // 材质：MeshPhongMaterial 支持光照反射
    const material = new THREE.MeshPhongMaterial({
      color: 0x0077ff, // 颜色
      shininess: 100, // 光泽度
      specular: 0x444444 // 高光颜色
    });
    
    // 5. 创建网格对象（几何体 + 材质）
    cube = new THREE.Mesh(geometry, material);
    // 将立方体添加到场景中
    scene.add(cube);
    
    // 6. 添加光源
    // 环境光：提供基础照明
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // 平行光：模拟太阳光，产生阴影
    light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(5, 5, 5);
    scene.add(light);
    
    // 7. 添加轨道控制器
    // 允许用户通过鼠标交互旋转、平移和缩放场景
    controls = new OrbitControls(camera, renderer.domElement);
    // 启用阻尼效果，使交互更平滑
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // 8. 响应窗口大小变化
    const handleResize = () => {
      if (!containerRef.current) return;
      
      // 更新相机宽高比
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      
      // 更新渲染器尺寸
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };
    
    window.addEventListener('resize', handleResize);
    
    // 清理函数：移除事件监听器
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };
  
  /**
   * 动画循环
   */
  const animate = () => {
    // 请求下一帧动画
    requestAnimationFrame(animate);
    
    // 更新立方体旋转
    cube.rotation.x += 0.005;
    cube.rotation.y += 0.01;
    
    // 更新轨道控制器
    if (controls) controls.update();
    
    // 渲染场景
    renderer.render(scene, camera);
  };
  
  return (
    <div style={{ padding: paddingSize }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: isMobile ? 12 : 20,
        fontSize: isMobile ? 18 : undefined
      }}>
        {isMobile ? 'Three.js Demo' : 'Three.js 入门 Demo'}
      </h1>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: containerHeight,
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden'
        }} 
      />
      <div style={{ 
        marginTop: isMobile ? 12 : 20, 
        padding: isMobile ? 12 : 15, 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        fontSize: isMobile ? 12 : 14
      }}>
        <h3 style={{ fontSize: isMobile ? 14 : 16, marginBottom: isMobile ? 8 : 12 }}>学习要点</h3>
        <ul style={{ paddingLeft: isMobile ? 16 : 20, margin: 0 }}>
          <li><strong>场景 (Scene)</strong>：Three.js 的容器，用于放置所有 3D 对象</li>
          <li><strong>相机 (Camera)</strong>：定义观察视角，决定我们看到的内容</li>
          <li><strong>渲染器 (Renderer)</strong>：将 3D 场景渲染到 2D 屏幕上</li>
          <li><strong>几何体 + 材质</strong>：定义 3D 对象的形状和外观</li>
          <li><strong>光源 (Light)</strong>：为场景提供照明</li>
          <li><strong>轨道控制器</strong>：允许用户交互控制相机视角</li>
        </ul>
        <p style={{ marginTop: isMobile ? 8 : 10, fontSize: isMobile ? 12 : 14, color: '#666' }}>
          尝试使用鼠标操作：拖动旋转视角，滚轮缩放，Shift+拖动平移
        </p>
      </div>
    </div>
  );
};

export default ThreeJsDemo;