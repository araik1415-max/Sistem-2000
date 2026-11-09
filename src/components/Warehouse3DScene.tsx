import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { X, RotateCcw, Eye, Layers } from 'lucide-react';
import { Language } from '../types';

interface Warehouse3DSceneProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  warehouseCount: number;
  productCount: number;
}

function createProceduralFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const Warehouse3DScene: React.FC<Warehouse3DSceneProps> = ({
  isOpen,
  onClose,
  lang,
  warehouseCount,
  productCount,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const autoRotateRef = useRef(true);
  const isHy = lang === 'hy';

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    const fogColor = new THREE.Color('#0f172a');
    scene.background = fogColor;
    scene.fog = new THREE.FogExp2('#0f172a', 0.022);

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      120
    );
    camera.position.set(12, 8, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const hemiLight = new THREE.HemisphereLight('#bae6fd', '#1e293b', 0.65);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight('#fef3c7', 2.2);
    dirLight.position.set(14, 22, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 2;
    dirLight.shadow.camera.far = 50;
    const d = 16;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    const floorTex = createProceduralFloorTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.75,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Composite 3D Warehouse Racking & Forklift Group
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const steelMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.75, roughness: 0.3 });
    const orangeMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.35, roughness: 0.4 });
    const crateMat = new THREE.MeshStandardMaterial({ color: '#b45309', metalness: 0.1, roughness: 0.8 });
    const emeraldMat = new THREE.MeshStandardMaterial({
      color: '#10b981',
      metalness: 0.4,
      roughness: 0.25,
      emissive: '#064e3b',
      emissiveIntensity: 0.4,
    });

    const postGeo = new THREE.BoxGeometry(0.18, 5.2, 0.18);
    const beamGeo = new THREE.BoxGeometry(4.2, 0.16, 1.4);
    const crateGeo = new THREE.BoxGeometry(1.1, 0.9, 1.1);

    for (let row = -1; row <= 1; row += 2) {
      for (let col = -1; col <= 1; col++) {
        const rack = new THREE.Group();
        rack.position.set(col * 5.2, 0, row * 4.2);

        // 4 vertical posts
        const offsets = [
          [-2, -0.6],
          [2, -0.6],
          [-2, 0.6],
          [2, 0.6],
        ];
        offsets.forEach(([ox, oz]) => {
          const post = new THREE.Mesh(postGeo, steelMat);
          post.position.set(ox, 2.6, oz);
          post.castShadow = true;
          rack.add(post);
        });

        // 3 shelf levels + crates
        [1.2, 2.8, 4.4].forEach((sy, levelIdx) => {
          const beam = new THREE.Mesh(beamGeo, orangeMat);
          beam.position.set(0, sy, 0);
          beam.castShadow = true;
          beam.receiveShadow = true;
          rack.add(beam);

          for (let c = -1; c <= 1; c++) {
            const box = new THREE.Mesh(crateGeo, levelIdx === 2 ? emeraldMat : crateMat);
            box.position.set(c * 1.3, sy + 0.53, 0);
            box.castShadow = true;
            rack.add(box);
          }
        });

        worldGroup.add(rack);
      }
    }

    // Composite 6-part Forklift in center aisle
    const forklift = new THREE.Group();
    forklift.position.set(0, 0, 0);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 2.2), orangeMat);
    body.position.y = 0.65;
    body.castShadow = true;
    forklift.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 1.2), steelMat);
    cabin.position.set(0, 1.6, -0.2);
    cabin.castShadow = true;
    forklift.add(cabin);

    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.6, 0.15), steelMat);
    mast.position.set(0, 1.4, 1.2);
    forklift.add(mast);

    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 1.1), steelMat);
    fork.position.set(0, 0.35, 1.75);
    forklift.add(fork);

    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    [
      [-0.85, 0.32, 0.7],
      [0.85, 0.32, 0.7],
      [-0.85, 0.32, -0.7],
      [0.85, 0.32, -0.7],
    ].forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(wheelGeo, steelMat);
      w.position.set(wx, wy, wz);
      forklift.add(w);
    });
    worldGroup.add(forklift);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 32;

    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (autoRotateRef.current) {
        worldGroup.rotation.y += dt * 0.18;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      floorTex.dispose();
      floorMat.dispose();
      steelMat.dispose();
      orangeMat.dispose();
      crateMat.dispose();
      emeraldMat.dispose();
      postGeo.dispose();
      beamGeo.dispose();
      crateGeo.dispose();
      wheelGeo.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full" />

      {/* Compact Floating Control Dock (<= 15% viewport, solid rgba surface) */}
      <div className="fixed top-4 left-4 z-10 bg-slate-900/95 border border-slate-700 rounded-xl p-3 shadow-2xl max-w-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">
              {isHy ? '3D Պահեստ և Վիտրինա' : '3D Склад и Витрина'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDockCollapsed(!dockCollapsed)}
            className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 cursor-pointer"
          >
            {dockCollapsed ? '+' : '−'}
          </button>
        </div>

        {!dockCollapsed && (
          <div className="mt-2.5 space-y-2 text-[11px] text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isHy ? 'Պահեստներ՝' : 'Складов:'}</span>
              <span className="font-mono font-bold text-emerald-400">{warehouseCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isHy ? 'Ապրանքներ՝' : 'Товаров:'}</span>
              <span className="font-mono font-bold text-amber-400">{productCount}</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoRotate(!autoRotate)}
              className={`w-full py-1.5 px-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                autoRotate ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{autoRotate ? (isHy ? 'Պտույտ՝ ԱԿՏԻՎ' : 'Вращение: ВКЛ') : (isHy ? 'Պտույտ՝ ԱՆՋԱՏ' : 'Вращение: ВЫКЛ')}</span>
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 right-4 z-10 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/95 hover:bg-rose-950 text-white border border-slate-700 text-xs font-bold shadow-xl cursor-pointer"
      >
        <X className="w-4 h-4" />
        <span>{isHy ? 'Փակել 3D-ն' : 'Закрыть 3D'}</span>
      </button>
    </div>
  );
};
