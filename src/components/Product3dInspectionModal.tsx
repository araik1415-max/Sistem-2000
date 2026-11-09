import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  X,
  RotateCcw,
  Sparkles,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Volume2,
  VolumeX,
  ShieldCheck,
} from 'lucide-react';
import { ProductItem, Language } from '../types';
import { formatDram } from '../utils/finance';
import {
  buildCalmArmenianInspectionText,
  speakCalmArmenian,
  stopCalmArmenianSpeech,
} from '../utils/armenianVoice';

interface Product3dInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  product: ProductItem | null;
  onAddToCart: (product: ProductItem, quantity?: number) => void;
}

const detailedTextureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a cached 512x512 Canvas Texture with the catalog product image
 * for the detailed 3D inspection view
 */
function createDetailedProductTexture(
  product: ProductItem,
  lang: Language,
  onTextureReady?: () => void
): THREE.CanvasTexture {
  const cacheKey = `${product.id}-${lang}-${product.priceDram}`;
  const cached = detailedTextureCache.get(cacheKey);
  if (cached) {
    if (onTextureReady) onTextureReady();
    return cached;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const isHy = lang === 'hy';
  const name = isHy ? product.nameHy : product.nameRu;
  const isGroceries = product.department === 'groceries';

  // Rich metallic gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  if (isGroceries) {
    grad.addColorStop(0, '#042f2e');
    grad.addColorStop(0.5, '#022c22');
    grad.addColorStop(1, '#0f172a');
  } else {
    grad.addColorStop(0, '#172554');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#020617');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Outer Glowing Border
  ctx.strokeStyle = isGroceries ? '#10b981' : '#38bdf8';
  ctx.lineWidth = 12;
  ctx.strokeRect(8, 8, 496, 496);

  // Header Banner
  ctx.fillStyle = isGroceries ? '#059669' : '#0284c7';
  ctx.fillRect(16, 16, 480, 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isHy ? 'ՀԱՄԱԿԱՐԳ 2000 • 3D ԶՆՆՈՒՄ' : 'СИСТЕМА 2000 • 3D ОСМОТР', 256, 49);

  // Studio placeholder box before photo finishes loading
  ctx.fillStyle = isGroceries ? '#065f46' : '#1e40af';
  ctx.beginPath();
  ctx.roundRect(40, 80, 432, 255, 14);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 80, 432, 255);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText(isGroceries ? '🍏' : '🛠️', 256, 195);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(product.sku || `#${product.id}`, 256, 255);

  const renderText = () => {
    // Product Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 27px sans-serif';

    const words = name.split(' ');
    let line1 = '';
    let line2 = '';
    words.forEach((w) => {
      if ((line1 + ' ' + w).length < 22) {
        line1 += (line1 ? ' ' : '') + w;
      } else {
        line2 += (line2 ? ' ' : '') + w;
      }
    });

    ctx.fillText(line1, 256, 360);
    if (line2) {
      ctx.fillText(line2, 256, 392);
    }

    // Price Badge
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(40, 415, 432, 60, 12);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 32px monospace';
    ctx.fillText(formatDram(product.priceDram), 256, 457);
  };

  renderText();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = 8;
  detailedTextureCache.set(cacheKey, texture);

  if (product.imageUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(40, 80, 432, 255, 14);
      ctx.clip();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(40, 80, 432, 255);
      const nw = img.naturalWidth || img.width || 432;
      const nh = img.naturalHeight || img.height || 255;
      const imgRatio = nw / nh;
      const boxRatio = 432 / 255;
      let sx = 0, sy = 0, sw = nw, sh = nh;
      if (imgRatio > boxRatio) {
        sw = nh * boxRatio;
        sx = (nw - sw) * 0.5;
      } else {
        sh = nw / boxRatio;
        sy = (nh - sh) * 0.5;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 40, 80, 432, 255);
      ctx.restore();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 80, 432, 255);

      renderText();
      texture.needsUpdate = true;
      if (onTextureReady) onTextureReady();
    };
    img.src = product.imageUrl;
  }

  return texture;
}

/**
 * Generates procedural 3D model geometry for the 360-degree inspection modal
 * with flat, unstretched front/back high-definition display cards.
 */
function createDetailedProduct3dMesh(
  product: ProductItem,
  lang: Language,
  materialMode: 'standard' | 'hologram' | 'wireframe',
  onTextureReady?: () => void
): THREE.Group {
  const group = new THREE.Group();
  const cat = (product.categoryRu || product.categoryHy || '').toLowerCase();
  const name = (product.nameRu || product.nameHy || '').toLowerCase();

  const texture = createDetailedProductTexture(product, lang, onTextureReady);

  let mainMaterial: THREE.Material;
  let bodyMaterial: THREE.Material;

  if (materialMode === 'hologram') {
    mainMaterial = new THREE.MeshStandardMaterial({
      color: product.department === 'groceries' ? '#10b981' : '#38bdf8',
      wireframe: false,
      transparent: true,
      opacity: 0.82,
      emissive: product.department === 'groceries' ? '#047857' : '#0284c7',
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
    });
    bodyMaterial = mainMaterial;
  } else if (materialMode === 'wireframe') {
    mainMaterial = new THREE.MeshBasicMaterial({
      color: '#f59e0b',
      wireframe: true,
    });
    bodyMaterial = mainMaterial;
  } else {
    mainMaterial = new THREE.MeshBasicMaterial({
      map: texture,
    });
    bodyMaterial = new THREE.MeshStandardMaterial({
      color: product.department === 'groceries' ? '#065f46' : '#1e3a8a',
      roughness: 0.3,
      metalness: 0.25,
    });
  }

  const chromeMat = new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    metalness: 0.8,
    roughness: 0.15,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: '#f59e0b',
    metalness: 0.6,
    roughness: 0.2,
  });

  const capMat = new THREE.MeshStandardMaterial({
    color: '#ef4444',
    metalness: 0.3,
    roughness: 0.3,
  });

  const addInspectionCards = (yPos: number, zOffset: number) => {
    const cardGeo = new THREE.PlaneGeometry(1.55, 2.05);
    const front = new THREE.Mesh(cardGeo, mainMaterial);
    front.position.set(0, yPos, zOffset);
    const back = new THREE.Mesh(cardGeo, mainMaterial);
    back.position.set(0, yPos, -zOffset);
    back.rotation.y = Math.PI;
    group.add(front, back);
  };

  // MILK & DAIRY
  if (cat.includes('молок') || cat.includes('կաթ') || name.includes('молок') || name.includes('կաթ')) {
    const bottleGeo = new THREE.CylinderGeometry(0.75, 0.9, 2.8, 24);
    const bottleMesh = new THREE.Mesh(bottleGeo, bodyMaterial);
    bottleMesh.position.y = 1.4;
    group.add(bottleMesh);

    const capGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.22, 16);
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = 2.91;
    group.add(capMesh);

    addInspectionCards(1.4, 0.92);
    return group;
  }

  // BEVERAGES / DRINKS / JUICE
  if (
    cat.includes('напиток') ||
    cat.includes('ըմպելիք') ||
    cat.includes('сок') ||
    cat.includes('кофе') ||
    cat.includes('սուրճ')
  ) {
    const canGeo = new THREE.CylinderGeometry(0.82, 0.82, 2.7, 24);
    const canMesh = new THREE.Mesh(canGeo, bodyMaterial);
    canMesh.position.y = 1.35;
    group.add(canMesh);

    const rimGeo = new THREE.TorusGeometry(0.82, 0.06, 12, 24);
    rimGeo.rotateX(Math.PI / 2);
    const rimTop = new THREE.Mesh(rimGeo, chromeMat);
    rimTop.position.y = 2.7;
    group.add(rimTop);

    addInspectionCards(1.35, 0.85);
    return group;
  }

  // PRODUCE / FRUITS / APPLE
  if (
    cat.includes('овощ') ||
    cat.includes('фрукт') ||
    cat.includes('միրգ') ||
    cat.includes('яблок') ||
    name.includes('яблок') ||
    name.includes('խնձոր')
  ) {
    const fruitGeo = new THREE.SphereGeometry(1.2, 24, 24);
    const fruitMat = materialMode === 'standard'
      ? new THREE.MeshStandardMaterial({
          color: name.includes('зелен') ? '#22c55e' : '#dc2626',
          roughness: 0.2,
          metalness: 0.1,
        })
      : mainMaterial;

    const fruitMesh = new THREE.Mesh(fruitGeo, fruitMat);
    fruitMesh.position.y = 1.2;
    group.add(fruitMesh);

    const plateGeo = new THREE.PlaneGeometry(1.5, 1.65);
    const plateMesh = new THREE.Mesh(plateGeo, mainMaterial);
    plateMesh.position.set(0, 1.2, 1.22);
    group.add(plateMesh);

    const stemGeo = new THREE.CylinderGeometry(0.08, 0.05, 0.45);
    const stemMat = new THREE.MeshStandardMaterial({ color: '#78350f' });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 2.5;
    group.add(stem);

    return group;
  }

  // BAKERY / BREAD / SACKS
  if (cat.includes('хлеб') || cat.includes('հաց') || cat.includes('круп') || cat.includes('ձավար')) {
    const sackGeo = new THREE.CylinderGeometry(0.85, 1.02, 2.6, 20);
    const sackMesh = new THREE.Mesh(sackGeo, bodyMaterial);
    sackMesh.position.y = 1.3;
    group.add(sackMesh);

    const tieGeo = new THREE.TorusGeometry(0.82, 0.08, 12, 20);
    tieGeo.rotateX(Math.PI / 2);
    const tie = new THREE.Mesh(tieGeo, goldMat);
    tie.position.y = 2.6;
    group.add(tie);

    addInspectionCards(1.3, 1.04);
    return group;
  }

  // CONSTRUCTION & PAINT BUCKETS
  if (
    cat.includes('строй') ||
    cat.includes('шпак') ||
    cat.includes('շին') ||
    cat.includes('մածիկ') ||
    name.includes('краск') ||
    name.includes('шпат')
  ) {
    const bucketGeo = new THREE.CylinderGeometry(1.15, 0.95, 2.5, 24);
    const bucketMesh = new THREE.Mesh(bucketGeo, bodyMaterial);
    bucketMesh.position.y = 1.25;
    group.add(bucketMesh);

    const handleRing = new THREE.TorusGeometry(1.17, 0.06, 12, 24);
    handleRing.rotateX(Math.PI / 2);
    const handleMesh = new THREE.Mesh(handleRing, chromeMat);
    handleMesh.position.y = 2.45;
    group.add(handleMesh);

    addInspectionCards(1.25, 1.16);
    return group;
  }

  // TOOLS & WRENCHES
  if (cat.includes('инструмент') || cat.includes('գործիք') || name.includes('дрель') || name.includes('молоток')) {
    const toolBoxGeo = new THREE.BoxGeometry(2.4, 1.8, 0.9);
    const mats = [bodyMaterial, bodyMaterial, bodyMaterial, bodyMaterial, mainMaterial, mainMaterial];
    const toolBoxMesh = new THREE.Mesh(toolBoxGeo, mats);
    toolBoxMesh.position.y = 0.9;
    group.add(toolBoxMesh);

    const handleGeo = new THREE.BoxGeometry(1.1, 0.22, 0.22);
    const handle = new THREE.Mesh(handleGeo, chromeMat);
    handle.position.set(0, 1.9, 0);
    group.add(handle);

    return group;
  }

  // DEFAULT SHOWCASE BOX (Unstretched front/back, solid sides)
  const mainBoxGeo = new THREE.BoxGeometry(2.1, 2.7, 0.6);
  const boxMats = [bodyMaterial, bodyMaterial, bodyMaterial, bodyMaterial, mainMaterial, mainMaterial];
  const mainBoxMesh = new THREE.Mesh(mainBoxGeo, boxMats);
  mainBoxMesh.position.y = 1.35;
  group.add(mainBoxMesh);

  return group;
}

export const Product3dInspectionModal: React.FC<Product3dInspectionModalProps> = React.memo(({
  isOpen,
  onClose,
  lang,
  product,
  onAddToCart,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isHy = lang === 'hy';

  const [autoRotate, setAutoRotate] = useState(true);
  const [materialMode, setMaterialMode] = useState<'standard' | 'hologram' | 'wireframe'>('standard');
  const [isArMode, setIsArMode] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addedToCartSuccess, setAddedToCartSuccess] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const autoRotateRef = useRef(true);
  const modelGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (!isOpen) {
      stopCalmArmenianSpeech(() => setIsSpeaking(false));
    }
  }, [isOpen]);

  // Calm Armenian speech helper for specifications
  const speakSpecs = useCallback(() => {
    if (!product) return;
    if (isSpeaking) {
      stopCalmArmenianSpeech(() => setIsSpeaking(false));
      return;
    }

    const textHy = buildCalmArmenianInspectionText(product);
    speakCalmArmenian(
      textHy,
      `inspect-${product.id}`,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  }, [product, isSpeaking]);

  // 3D Scene Initialization
  useEffect(() => {
    if (!isOpen || !product || !containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = isArMode ? null : new THREE.Color('#020617');
    if (!isArMode) {
      scene.fog = new THREE.FogExp2('#020617', 0.02);
    }

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 3.2, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Fast studio lighting (zero PMREM generation lag)
    const ambientLight = new THREE.AmbientLight('#ffffff', 1.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#fef08a', 2.4);
    keyLight.position.set(5, 12, 8);
    scene.add(keyLight);

    const blueLight = new THREE.PointLight('#38bdf8', 2.5, 20);
    blueLight.position.set(-6, 5, -4);
    scene.add(blueLight);

    const emeraldLight = new THREE.PointLight('#34d399', 2.5, 20);
    emeraldLight.position.set(6, 5, 4);
    scene.add(emeraldLight);

    // Holographic Pedestal Platform
    const pedestalGeo = new THREE.CylinderGeometry(2.2, 2.6, 0.4, 24);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      metalness: 0.9,
      roughness: 0.15,
      transparent: isArMode,
      opacity: isArMode ? 0.35 : 1.0,
    });
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.y = -0.2;
    scene.add(pedestalMesh);

    const ringGeo = new THREE.RingGeometry(2.3, 2.5, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: product.department === 'groceries' ? '#10b981' : '#38bdf8',
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.01;
    scene.add(ringMesh);

    // 3D Product Mesh Group
    let frameId = 0;
    let renderScheduled = false;
    const clock = new THREE.Clock();

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.minDistance = 2.5;
    controls.maxDistance = 15;
    controls.target.set(0, 1.2, 0);
    controls.update();

    const requestRender = () => {
      if (document.hidden || renderScheduled) return;
      renderScheduled = true;
      frameId = requestAnimationFrame(() => {
        renderScheduled = false;
        const dt = Math.min(clock.getDelta(), 0.05);
        if (autoRotateRef.current && modelGroupRef.current) {
          modelGroupRef.current.rotation.y += dt * 0.45;
        }
        renderer.render(scene, camera);
        if (autoRotateRef.current) {
          frameId = window.setTimeout(requestRender, 45);
        }
      });
    };

    const productGroup = createDetailedProduct3dMesh(product, lang, materialMode, () => {
      requestRender();
    });
    scene.add(productGroup);
    modelGroupRef.current = productGroup;

    controls.addEventListener('change', requestRender);
    requestRender();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      requestRender();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.removeEventListener('change', requestRender);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      pedestalMat.dispose();
      ringMat.dispose();
      pedestalGeo.dispose();
      ringGeo.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isOpen, product, lang, materialMode, isArMode]);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/95 select-none font-sans">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-slate-100">
        {/* Левая половина: 3D Canvas просмотрщика */}
        <div className={`relative flex-1 min-h-[320px] md:min-h-full ${isArMode ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950/60' : 'bg-slate-950'}`}>
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* AR Overlay HUD */}
          {isArMode && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 text-xs font-mono font-bold animate-pulse flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AR REALITY MODE ACTIVE</span>
                </span>
              </div>
              <div className="self-center w-48 h-48 border-2 border-dashed border-emerald-400/40 rounded-full flex items-center justify-center animate-spin-slow">
                <div className="w-4 h-4 rounded-full bg-emerald-400/60" />
              </div>
              <p className="text-center text-xs text-emerald-300/80 font-mono bg-slate-950/80 p-2 rounded-xl border border-emerald-500/30">
                {isHy ? 'Պտտեք մոդելը սենյակում տեղադրելու համար' : 'Вращайте и масштабируйте модель для примерки в интерьере'}
              </p>
            </div>
          )}

          {/* Плашка режима 3D просмотра */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMaterialMode('standard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                materialMode === 'standard'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {isHy ? '3D Ռեալիստիկ' : '3D Реалистичный'}
            </button>
            <button
              onClick={() => setMaterialMode('hologram')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                materialMode === 'hologram'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              ⚡ {isHy ? 'Գոլոգրամա' : 'Голограмма'}
            </button>
            <button
              onClick={() => setMaterialMode('wireframe')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                materialMode === 'wireframe'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              📐 Wireframe
            </button>

            {/* AR Mode Toggle */}
            <button
              onClick={() => setIsArMode(!isArMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isArMode
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-900/90 text-emerald-400 hover:text-emerald-300 border border-emerald-500/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isArMode ? (isHy ? 'AR Անջատել' : 'Выйти из AR') : (isHy ? 'AR Պրոյեկցիա' : 'AR Примерка')}</span>
            </button>
          </div>

          {/* Кнопка вращения */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`absolute bottom-4 left-4 z-10 p-2.5 rounded-2xl border transition-all cursor-pointer ${
              autoRotate
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg'
                : 'bg-slate-900/90 text-slate-400 border-slate-700'
            }`}
            title={autoRotate ? (isHy ? 'Անջատել պտույտը' : 'Выключить вращение') : (isHy ? 'Միացնել 360° պտույտը' : 'Включить 360° вращение')}
          >
            <RotateCcw className={`w-4 h-4 ${autoRotate ? 'animate-spin-slow' : ''}`} />
          </button>
        </div>

        {/* Правая половина: Подробная информация, спецификации и покупка */}
        <div className="w-full md:w-[420px] p-5 sm:p-6 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col justify-between overflow-y-auto">
          {/* Шапка модалки */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  3D INSPECTION VIEW • 🇦🇲 ՀԱՅԵՐԵՆ ՁԱՅՆ
                </span>
                <h2 className="text-xl font-extrabold text-white mt-1">
                  {isHy ? product.nameHy : product.nameRu}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Описание */}
            <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              {isHy ? product.descriptionHy : product.descriptionRu}
            </p>

            {/* Детализированные характеристики */}
            <div className="space-y-2 mb-4 font-mono text-xs">
              <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-sans">{isHy ? 'Արժեքը' : 'Стоимость'}:</span>
                <span className="text-base font-bold text-emerald-400">
                  {formatDram(product.priceDram)} / {isHy ? product.unitHy : product.unitRu}
                </span>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-sans">{isHy ? 'Արտադրող' : 'Производитель'}:</span>
                <span className="text-white font-bold">{isHy ? product.manufacturerHy || 'Համակարգ 2000' : product.manufacturerRu || 'Система 2000'}</span>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-sans">{isHy ? 'Շտրիխ կոդ' : 'Штрихкод / SKU'}:</span>
                <span className="text-amber-400">{product.barcode || `SKU-${product.id}`}</span>
              </div>

              <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/40 text-emerald-300">
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{isHy ? '10% Ցմահ դեպոզիտ ժառանգությամբ' : '10% Пожизненный депозит с наследованием'}</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans">
                  {isHy
                    ? '10 000 ֏-ից սկսած 100% ծախսերը վերածվում են ավանդի 15 օրից:'
                    : '100% затрат от 10 000 ֏ превращаются в пожизненный депозит спустя 15 дней.'}
                </p>
              </div>
            </div>
          </div>

          {/* Панель заказа и озвучки */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              {/* Счетчик */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-750 rounded-2xl p-1 shrink-0">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-xs font-bold font-mono text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Добавить в корзину */}
              <button
                onClick={() => {
                  onAddToCart(product, quantity);
                  setAddedToCartSuccess(true);
                  setTimeout(() => setAddedToCartSuccess(false), 3000);
                }}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2 ${
                  addedToCartSuccess
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/25 active:scale-95'
                }`}
              >
                {addedToCartSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isHy ? 'Ավելացվեց!' : 'Добавлено в корзину!'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>
                      {isHy ? 'Ավելացնել' : 'В корзину'} ({formatDram(product.priceDram * quantity)})
                    </span>
                  </>
                )}
              </button>

              <button
                onClick={speakSpecs}
                className={`p-3 border rounded-2xl transition-colors cursor-pointer shrink-0 ${
                  isSpeaking
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                }`}
                title={isHy ? 'Հանգիստ հայերեն ձայնով ակնարկ' : 'Спокойная озвучка на армянском языке'}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

