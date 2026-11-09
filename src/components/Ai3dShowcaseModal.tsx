import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  X,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Search,
  Box,
  Layers,
  Bot,
  Zap,
  Tag,
  ShieldCheck,
  Package,
  Eye,
  Filter,
  Barcode,
} from 'lucide-react';
import { ProductItem, Language } from '../types';
import { formatDram } from '../utils/finance';
import { Product3dInspectionModal } from './Product3dInspectionModal';
import {
  buildCalmArmenianPresentationText,
  speakCalmArmenian,
  stopCalmArmenianSpeech,
} from '../utils/armenianVoice';

interface Ai3dShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  products: ProductItem[];
  onAddToCart: (product: ProductItem, quantity?: number) => void;
}

// Detect software WebGL (SwiftShader/llvmpipe) once so we never overload CPU-rendered WebGL
const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
})();

// Global Texture Caches for high-speed instant load & zero memory leak overhead
const textureCache = new Map<string, THREE.CanvasTexture>();
const spriteTextureCache = new Map<string, THREE.CanvasTexture>();

// Shared Geometry Pool to avoid allocation overhead during 3D scene construction
const sharedGeometries = {
  cylinderMilk: new THREE.CylinderGeometry(0.42, 0.48, 1.5, 24),
  cylinderCan: new THREE.CylinderGeometry(0.44, 0.44, 1.45, 24),
  cylinderCap: new THREE.CylinderGeometry(0.22, 0.22, 0.14, 16),
  cylinderSack: new THREE.CylinderGeometry(0.46, 0.54, 1.38, 20),
  cylinderBucket: new THREE.CylinderGeometry(0.62, 0.52, 1.35, 24),
  cylinderTube: new THREE.CylinderGeometry(0.36, 0.36, 1.35, 20),
  sphereFruit: new THREE.SphereGeometry(0.66, 24, 24),
  boxTool: new THREE.BoxGeometry(1.45, 1.15, 0.55),
  boxStand: new THREE.BoxGeometry(1.25, 1.5, 0.38),
  // Flat unstretched high-clarity front & back label plates for cylindrical/spherical items
  labelCardFront: new THREE.PlaneGeometry(0.92, 1.15),
  planePlate: new THREE.PlaneGeometry(0.86, 0.96),
  torusRim: new THREE.TorusGeometry(0.44, 0.035, 10, 24),
  torusTie: new THREE.TorusGeometry(0.45, 0.045, 10, 20),
  torusHandle: new THREE.TorusGeometry(0.63, 0.03, 10, 24),
  pedestal: new THREE.CylinderGeometry(0.95, 1.12, 0.36, 24),
  ringGlow: new THREE.RingGeometry(0.98, 1.08, 32),
  stemGeo: new THREE.CylinderGeometry(0.04, 0.03, 0.25, 8),
  toolHandleGeo: new THREE.BoxGeometry(0.55, 0.12, 0.12),
  nozzleGeo: new THREE.ConeGeometry(0.14, 0.38, 12),
  // Real Supermarket Store Shelving Geometries
  shelfBoard: new THREE.BoxGeometry(2.3, 0.08, 1.1),
  shelfPillar: new THREE.BoxGeometry(0.06, 2.8, 0.06),
  shelfBacking: new THREE.PlaneGeometry(2.2, 2.6),
  priceRail: new THREE.BoxGeometry(2.28, 0.1, 0.04),
  shelfLedStrip: new THREE.BoxGeometry(2.2, 0.04, 0.04),
};
sharedGeometries.torusRim.rotateX(Math.PI / 2);
sharedGeometries.torusTie.rotateX(Math.PI / 2);
sharedGeometries.torusHandle.rotateX(Math.PI / 2);
sharedGeometries.ringGlow.rotateX(-Math.PI / 2);

// Shared Material Pool for zero allocation overhead and fast shader execution
const sharedMaterials = {
  chrome: new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.65, roughness: 0.2 }),
  gold: new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.5, roughness: 0.25 }),
  cap: new THREE.MeshStandardMaterial({ color: '#ef4444', metalness: 0.2, roughness: 0.35 }),
  stem: new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.6 }),
  fruitRed: new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.25, metalness: 0.08 }),
  fruitGreen: new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.25, metalness: 0.08 }),
  dairyBody: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.2, metalness: 0.1 }),
  canBody: new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.25, metalness: 0.45 }),
  sackBody: new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.55, metalness: 0.1 }),
  bucketBody: new THREE.MeshStandardMaterial({ color: '#1e40af', roughness: 0.3, metalness: 0.25 }),
  tubeBody: new THREE.MeshStandardMaterial({ color: '#0f766e', roughness: 0.3, metalness: 0.25 }),
  boxSideGrocery: new THREE.MeshStandardMaterial({ color: '#065f46', roughness: 0.35, metalness: 0.2 }),
  boxSideConstruct: new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.35, metalness: 0.2 }),
  shelfWood: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4, metalness: 0.3 }),
  shelfMetal: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.3, metalness: 0.5 }),
  shelfBacking: new THREE.MeshBasicMaterial({ color: '#0f172a' }),
  priceRail: new THREE.MeshBasicMaterial({ color: '#0284c7' }),
  shelfLed: new THREE.MeshBasicMaterial({ color: '#fef08a' }),
  pedestal: new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.45, roughness: 0.3 }),
  glowRing: new THREE.MeshBasicMaterial({ color: '#10b981', side: THREE.DoubleSide }),
};

const labelMaterialCache = new Map<string, THREE.MeshBasicMaterial>();
let activeShowcaseRenderCallback: (() => void) | null = null;

/**
 * Draws an image with aspect-ratio-preserving cover crop so photos are never stretched
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const nw = img.naturalWidth || img.width || w;
  const nh = img.naturalHeight || img.height || h;
  const imgRatio = nw / nh;
  const boxRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = nw;
  let sh = nh;

  if (imgRatio > boxRatio) {
    sw = nh * boxRatio;
    sx = (nw - sw) * 0.5;
  } else {
    sh = nw / boxRatio;
    sy = (nh - sh) * 0.5;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * Creates a razor-sharp 512x512 Canvas Texture for 3D products,
 * using LinearFilter (no mipmap blur) and unstretched cover-cropped product photography.
 */
function createProductLabelTexture(
  product: ProductItem,
  lang: Language,
  onTextureUpdate?: () => void
): THREE.CanvasTexture {
  const cacheKey = `${product.id}_${lang}_hd_v2`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const isHy = lang === 'hy';
  const name = isHy ? product.nameHy : product.nameRu;
  const isGroceries = product.department === 'groceries';

  // Base background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  if (isGroceries) {
    grad.addColorStop(0, '#064e3b');
    grad.addColorStop(0.5, '#022c22');
    grad.addColorStop(1, '#0f172a');
  } else {
    grad.addColorStop(0, '#1e3a8a');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#020617');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Glowing Outer Frame
  ctx.strokeStyle = isGroceries ? '#10b981' : '#38bdf8';
  ctx.lineWidth = 10;
  ctx.strokeRect(6, 6, 500, 500);

  // Header Brand Tag
  ctx.fillStyle = isGroceries ? '#059669' : '#0284c7';
  ctx.fillRect(14, 14, 484, 46);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isHy ? 'ՀԱՄԱԿԱՐԳ 2000 • 3D ԱՊՐԱՆՔ' : 'СИСТЕМА 2000 • 3D ТОВАР', 256, 44);

  // Crisp studio placeholder box while photo loads
  ctx.fillStyle = isGroceries ? '#065f46' : '#1e40af';
  ctx.beginPath();
  ctx.roundRect(28, 72, 456, 266, 16);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.strokeRect(28, 72, 456, 266);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText(isGroceries ? '🍏' : '🛠️', 256, 195);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(product.sku || `#${product.id}`, 256, 255);

  const renderDetails = () => {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';

    const words = name.split(' ');
    let line1 = '';
    let line2 = '';
    words.forEach((w) => {
      if ((line1 + ' ' + w).length < 20) {
        line1 += (line1 ? ' ' : '') + w;
      } else {
        line2 += (line2 ? ' ' : '') + w;
      }
    });

    ctx.fillText(line1, 256, 372);
    if (line2) {
      ctx.fillText(line2.length > 22 ? line2.substring(0, 21) + '…' : line2, 256, 406);
    }

    // Price Tag Banner
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(28, 426, 456, 62, 14);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 32px monospace';
    ctx.fillText(formatDram(product.priceDram), 256, 468);
  };

  renderDetails();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Prevent mipmap blurring at grazing camera angles
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = 8;
  textureCache.set(cacheKey, texture);

  // Asynchronously load the catalog product image onto the 3D model face with cover crop
  if (product.imageUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(28, 72, 456, 266, 16);
      ctx.clip();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(28, 72, 456, 266);
      drawImageCover(ctx, img, 28, 72, 456, 266);
      ctx.restore();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(28, 72, 456, 266);

      renderDetails();
      texture.needsUpdate = true;
      if (onTextureUpdate) onTextureUpdate();
      if (activeShowcaseRenderCallback) activeShowcaseRenderCallback();
    };
    img.src = product.imageUrl;
  }

  return texture;
}

/**
 * Creates a crisp 512x128 floating 3D canvas Sprite badge above each product in the vitrine
 */
function createProductSpriteLabel(product: ProductItem, lang: Language): THREE.Sprite {
  const cacheKey = `${product.id}_${product.priceDram}_${lang}_hd`;
  let texture = spriteTextureCache.get(cacheKey);

  if (!texture) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const isHy = lang === 'hy';
    const name = isHy ? product.nameHy : product.nameRu;
    const shortName = name.length > 18 ? name.substring(0, 17) + '…' : name;
    const isGroceries = product.department === 'groceries';

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = isGroceries ? '#10b981' : '#38bdf8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(6, 6, 500, 116, 24);
    ctx.fill();
    ctx.stroke();

    // Category indicator icon
    ctx.fillStyle = isGroceries ? '#059669' : '#0284c7';
    ctx.beginPath();
    ctx.arc(46, 64, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isGroceries ? '🍏' : '🛠️', 46, 73);

    // Product Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(shortName, 86, 54);

    // Price Tag
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(formatDram(product.priceDram), 86, 98);

    texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    spriteTextureCache.set(cacheKey, texture);
  }

  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(0, 2.05, 0);
  sprite.scale.set(2.35, 0.58, 1);
  return sprite;
}

/**
 * Helper to attach flat, unstretched front and back high-definition product cards
 * to cylindrical/round 3D models so the photo is never distorted around a cylinder.
 */
function addCrispFrontBackCards(
  group: THREE.Group,
  labelMat: THREE.Material,
  yPos: number,
  zOffset: number
) {
  const frontCard = new THREE.Mesh(sharedGeometries.labelCardFront, labelMat);
  frontCard.position.set(0, yPos, zOffset);
  group.add(frontCard);

  const backCard = new THREE.Mesh(sharedGeometries.labelCardFront, labelMat);
  backCard.position.set(0, yPos, -zOffset);
  backCard.rotation.y = Math.PI;
  group.add(backCard);
}

/**
 * Creates a unique procedural 3D model geometry matching the product type/category
 * with unstretched, crystal-clear product photography on front/back faces.
 */
function createCategoryProduct3dMesh(
  product: ProductItem,
  lang: Language,
  onTextureUpdate?: () => void
): THREE.Group {
  const group = new THREE.Group();
  const cat = (product.categoryRu || product.categoryHy || '').toLowerCase();
  const name = (product.nameRu || product.nameHy || '').toLowerCase();

  const matKey = `${product.id}_${lang}_hd`;
  let labelMat = labelMaterialCache.get(matKey);
  if (!labelMat) {
    const labelTexture = createProductLabelTexture(product, lang, onTextureUpdate);
    // Use unlit MeshBasicMaterial for the photo label so lighting/shadows never wash out or blur the photo
    labelMat = new THREE.MeshBasicMaterial({
      map: labelTexture,
    });
    labelMaterialCache.set(matKey, labelMat);
  }

  const sideMat =
    product.department === 'groceries'
      ? sharedMaterials.boxSideGrocery
      : sharedMaterials.boxSideConstruct;

  // Attach floating 3D Price Tag Sprite above product
  const spriteLabel = createProductSpriteLabel(product, lang);
  group.add(spriteLabel);

  // 1. MILK & DAIRY: 3D Milk Bottle + Crisp Front/Back Display Label
  if (cat.includes('молок') || cat.includes('կաթ') || name.includes('молок') || name.includes('կաթ')) {
    const bottleMesh = new THREE.Mesh(sharedGeometries.cylinderMilk, sharedMaterials.dairyBody);
    bottleMesh.position.y = 0.75;
    group.add(bottleMesh);

    const capMesh = new THREE.Mesh(sharedGeometries.cylinderCap, sharedMaterials.cap);
    capMesh.position.y = 1.56;
    group.add(capMesh);

    addCrispFrontBackCards(group, labelMat, 0.75, 0.49);
    return group;
  }

  // 2. BEVERAGES / DRINKS / JUICE / COFFEE: 3D Drink Can + Crisp Front/Back Label
  if (
    cat.includes('напиток') ||
    cat.includes('ըմպելիք') ||
    cat.includes('сок') ||
    cat.includes('кофе') ||
    cat.includes('սուրճ')
  ) {
    const canMesh = new THREE.Mesh(sharedGeometries.cylinderCan, sharedMaterials.canBody);
    canMesh.position.y = 0.725;
    group.add(canMesh);

    const rimTop = new THREE.Mesh(sharedGeometries.torusRim, sharedMaterials.chrome);
    rimTop.position.y = 1.45;
    group.add(rimTop);

    addCrispFrontBackCards(group, labelMat, 0.725, 0.46);
    return group;
  }

  // 3. PRODUCE / FRUITS / APPLE: 3D Fruit Sphere + Crisp Front/Back Plate
  if (
    cat.includes('овощ') ||
    cat.includes('фрукт') ||
    cat.includes('միրգ') ||
    cat.includes('яблок') ||
    name.includes('яблок') ||
    name.includes('խնձոր')
  ) {
    const fruitMat = name.includes('зелен') ? sharedMaterials.fruitGreen : sharedMaterials.fruitRed;
    const fruitMesh = new THREE.Mesh(sharedGeometries.sphereFruit, fruitMat);
    fruitMesh.position.y = 0.66;
    group.add(fruitMesh);

    addCrispFrontBackCards(group, labelMat, 0.66, 0.68);

    const stem = new THREE.Mesh(sharedGeometries.stemGeo, sharedMaterials.stem);
    stem.position.y = 1.36;
    group.add(stem);

    return group;
  }

  // 4. BAKERY / BREAD / GRAINS: 3D Sack + Crisp Front/Back Label
  if (cat.includes('хлеб') || cat.includes('հաց') || cat.includes('круп') || cat.includes('ձավար')) {
    const sackMesh = new THREE.Mesh(sharedGeometries.cylinderSack, sharedMaterials.sackBody);
    sackMesh.position.y = 0.69;
    group.add(sackMesh);

    const tie = new THREE.Mesh(sharedGeometries.torusTie, sharedMaterials.gold);
    tie.position.y = 1.38;
    group.add(tie);

    addCrispFrontBackCards(group, labelMat, 0.69, 0.55);
    return group;
  }

  // 5. CONSTRUCTION & PAINT & FINISHING: 3D Paint Bucket + Crisp Front/Back Label
  if (
    cat.includes('строй') ||
    cat.includes('шпак') ||
    cat.includes('շին') ||
    cat.includes('մածիկ') ||
    name.includes('краск') ||
    name.includes('шпат')
  ) {
    const bucketMesh = new THREE.Mesh(sharedGeometries.cylinderBucket, sharedMaterials.bucketBody);
    bucketMesh.position.y = 0.675;
    group.add(bucketMesh);

    const handleMesh = new THREE.Mesh(sharedGeometries.torusHandle, sharedMaterials.chrome);
    handleMesh.position.y = 1.32;
    group.add(handleMesh);

    addCrispFrontBackCards(group, labelMat, 0.675, 0.63);
    return group;
  }

  // 6. TOOLS & WRENCH: 3D Industrial Tool Box (Multi-material: crisp front/back, solid sides)
  if (cat.includes('инструмент') || cat.includes('գործիք') || name.includes('дрель') || name.includes('молоток')) {
    const boxMaterials = [sideMat, sideMat, sideMat, sideMat, labelMat, labelMat];
    const toolBoxMesh = new THREE.Mesh(sharedGeometries.boxTool, boxMaterials);
    toolBoxMesh.position.y = 0.575;
    group.add(toolBoxMesh);

    const handle = new THREE.Mesh(sharedGeometries.toolHandleGeo, sharedMaterials.chrome);
    handle.position.set(0, 1.2, 0);
    group.add(handle);

    return group;
  }

  // 7. ADHESIVES & GLUE: 3D Squeeze Cartridge Tube + Crisp Front/Back Label
  if (cat.includes('клей') || cat.includes('սոսինձ') || name.includes('клей') || name.includes('пена')) {
    const tubeMesh = new THREE.Mesh(sharedGeometries.cylinderTube, sharedMaterials.tubeBody);
    tubeMesh.position.y = 0.675;
    group.add(tubeMesh);

    const nozzleMesh = new THREE.Mesh(sharedGeometries.nozzleGeo, sharedMaterials.chrome);
    nozzleMesh.position.y = 1.52;
    group.add(nozzleMesh);

    addCrispFrontBackCards(group, labelMat, 0.675, 0.39);
    return group;
  }

  // DEFAULT 8. STANDARD 3D SHOWCASE DISPLAY STAND (Multi-material: crisp front/back, solid sides)
  const standMaterials = [sideMat, sideMat, sideMat, sideMat, labelMat, labelMat];
  const mainBoxMesh = new THREE.Mesh(sharedGeometries.boxStand, standMaterials);
  mainBoxMesh.position.y = 0.75;
  group.add(mainBoxMesh);

  return group;
}

export const Ai3dShowcaseModal: React.FC<Ai3dShowcaseModalProps> = React.memo(({
  isOpen,
  onClose,
  lang,
  products,
  onAddToCart,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isHy = lang === 'hy';

  // Controls state (default autoRotate to false so scene is 100% still and crystal-sharp unless user rotates)
  const [autoRotate, setAutoRotate] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCartSuccess, setAddedToCartSuccess] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<'all' | 'groceries' | 'construction'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);

  const autoRotateRef = useRef(false);
  const isInspectionOpenRef = useRef(false);
  const meshesMapRef = useRef<Map<number, THREE.Group>>(new Map());
  const raycastMeshesRef = useRef<THREE.Object3D[]>([]);
  const showcaseGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRenderRef = useRef<() => void>(() => {});

  const handleResetCamera = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 6.5, 16.5);
      controlsRef.current.target.set(0, 0.8, 0);
      controlsRef.current.update();
      requestRenderRef.current();
    }
  }, []);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
    requestRenderRef.current();
  }, [autoRotate]);

  useEffect(() => {
    isInspectionOpenRef.current = isInspectionOpen;
    if (!isInspectionOpen) {
      requestRenderRef.current();
    }
  }, [isInspectionOpen]);

  // Extract unique product categories dynamically
  const availableCategories = useMemo(() => {
    const cats = Array.from(
      new Set(
        products
          .map((p) => (isHy ? p.categoryHy || p.categoryRu : p.categoryRu || p.categoryHy))
          .filter(Boolean)
      )
    );
    return ['all', ...cats];
  }, [products, isHy]);

  // Calm Armenian Voice synthesis helper (Always speaks in calm, soothing Armenian)
  const speakProductPresentation = useCallback(
    (product: ProductItem) => {
      if (!voiceEnabled) return;
      const textHy = buildCalmArmenianPresentationText(product);
      speakCalmArmenian(
        textHy,
        `showcase_hy_${product.id}_${product.priceDram}`,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    },
    [voiceEnabled]
  );

  const stopSpeech = useCallback(() => {
    stopCalmArmenianSpeech(() => setIsSpeaking(false));
  }, []);

  // Memoize filtered products so background state updates never invalidate the array reference
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesDept = departmentFilter === 'all' || p.department === departmentFilter;
      const prodCat = (isHy ? p.categoryHy || p.categoryRu : p.categoryRu || p.categoryHy) || '';
      const matchesCat = selectedCategory === 'all' || prodCat.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        !q ||
        p.nameHy.toLowerCase().includes(q) ||
        p.nameRu.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q));
      return matchesDept && matchesCat && matchesSearch;
    });
  }, [products, departmentFilter, selectedCategory, search, isHy]);

  // Handle product click in 3D showcase
  const handleSelectProduct = useCallback(
    (product: ProductItem) => {
      setSelectedProduct(product);
      setQuantity(1);
      setAddedToCartSuccess(false);

      // Focus camera smoothly on the selected product group
      const meshGroup = meshesMapRef.current.get(product.id);
      if (meshGroup && cameraRef.current && controlsRef.current) {
        const targetPos = meshGroup.position;
        controlsRef.current.target.set(targetPos.x, targetPos.y + 0.8, targetPos.z);
        controlsRef.current.update();
        requestRenderRef.current();
      }

      speakProductPresentation(product);
    },
    [speakProductPresentation]
  );

  const handleSelectProductRef = useRef(handleSelectProduct);
  useEffect(() => {
    handleSelectProductRef.current = handleSelectProduct;
  }, [handleSelectProduct]);

  // Quick Barcode Scan & Focus Lookup
  const handleQuickBarcodeScan = useCallback(() => {
    if (products.length === 0) return;
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    if (randomProduct) {
      if (randomProduct.barcode) {
        setSearch(randomProduct.barcode);
      } else {
        setSearch(isHy ? randomProduct.nameHy : randomProduct.nameRu);
      }
      handleSelectProduct(randomProduct);
    }
  }, [products, isHy, handleSelectProduct]);

  // 1. Initialize Three.js WebGL Engine ONCE when modal opens (Never recreated on filter/search!)
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020617');
    scene.fog = new THREE.FogExp2('#020617', 0.015);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      150
    );
    camera.position.set(0, 6.5, 16.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // Clean, ultra-fast studio lighting (zero shadow-map or multi-spotlight overhead)
    const hemiLight = new THREE.HemisphereLight('#e0f2fe', '#0f172a', 1.25);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight('#fef08a', 1.8);
    dirLight.position.set(8, 18, 12);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight('#38bdf8', 0.9);
    fillLight.position.set(-10, 10, -8);
    scene.add(fillLight);

    // Supermarket Polished Tile Floor
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 256;
    floorCanvas.height = 256;
    const fctx = floorCanvas.getContext('2d')!;
    fctx.fillStyle = '#090d16';
    fctx.fillRect(0, 0, 256, 256);
    fctx.strokeStyle = '#1e293b';
    fctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 32) {
      fctx.beginPath();
      fctx.moveTo(i, 0);
      fctx.lineTo(i, 256);
      fctx.stroke();
      fctx.beginPath();
      fctx.moveTo(0, i);
      fctx.lineTo(256, i);
      fctx.stroke();
    }
    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(16, 16);

    const floorMat = new THREE.MeshBasicMaterial({
      map: floorTexture,
    });
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    scene.add(floorMesh);

    // Interactive Showcase World Group
    const showcaseGroup = new THREE.Group();
    scene.add(showcaseGroup);
    showcaseGroupRef.current = showcaseGroup;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 2.8;
    controls.maxDistance = 26;
    controls.target.set(0, 0.8, 0);
    controls.update();
    controlsRef.current = controls;

    // On-Demand Render Scheduler (coalesces texture loads, pointer drags, and filter changes into 1 frame)
    let frameId = 0;
    let renderScheduled = false;
    const clock = new THREE.Clock();

    function requestRender() {
      if (document.hidden || isInspectionOpenRef.current) return;
      if (renderScheduled) return;
      renderScheduled = true;
      frameId = requestAnimationFrame(() => {
        renderScheduled = false;
        const dt = Math.min(clock.getDelta(), 0.05);
        if (autoRotateRef.current) {
          showcaseGroup.rotation.y += dt * 0.18;
        }
        if (controls.enableDamping) {
          controls.update();
        }
        renderer.render(scene, camera);
        if (autoRotateRef.current) {
          frameId = window.setTimeout(requestRender, isSoftwareGl ? 60 : 16);
        }
      });
    }

    requestRenderRef.current = requestRender;
    activeShowcaseRenderCallback = requestRender;
    controls.addEventListener('change', requestRender);

    // Touch & Pointer Raycasting: Differentiate deliberate Taps vs Camera Rotation Swipes
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let startPointerX = 0;
    let startPointerY = 0;

    const handlePointerDown = (event: PointerEvent | TouchEvent) => {
      const clientX = 'touches' in event ? event.touches[0].clientX : (event as PointerEvent).clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : (event as PointerEvent).clientY;
      startPointerX = clientX;
      startPointerY = clientY;
    };

    const handlePointerUp = (event: PointerEvent | TouchEvent) => {
      const clientX =
        'changedTouches' in event && event.changedTouches.length > 0
          ? event.changedTouches[0].clientX
          : 'touches' in event && event.touches.length > 0
          ? event.touches[0].clientX
          : (event as PointerEvent).clientX;

      const clientY =
        'changedTouches' in event && event.changedTouches.length > 0
          ? event.changedTouches[0].clientY
          : 'touches' in event && event.touches.length > 0
          ? event.touches[0].clientY
          : (event as PointerEvent).clientY;

      const dragDistance = Math.hypot(clientX - startPointerX, clientY - startPointerY);
      if (dragDistance > 7) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(raycastMeshesRef.current, true);

      if (intersects.length > 0) {
        let clickedObj: THREE.Object3D | null = intersects[0].object;
        while (clickedObj && !clickedObj.userData?.product) {
          clickedObj = clickedObj.parent;
        }
        if (clickedObj && clickedObj.userData?.product) {
          handleSelectProductRef.current(clickedObj.userData.product);
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown as EventListener);
    domElement.addEventListener('pointerup', handlePointerUp as EventListener);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      requestRender();
    };
    window.addEventListener('resize', handleResize);

    // Initial render
    requestRender();

    return () => {
      activeShowcaseRenderCallback = null;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('change', requestRender);
      domElement.removeEventListener('pointerdown', handlePointerDown as EventListener);
      domElement.removeEventListener('pointerup', handlePointerUp as EventListener);
      controls.dispose();
      floorTexture.dispose();
      floorMat.dispose();
      renderer.dispose();
      showcaseGroupRef.current = null;
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      stopSpeech();
    };
  }, [isOpen, stopSpeech]);

  // 2. Populate or update ONLY the 3D shelves when filter/category/search changes (0ms instant update!)
  useEffect(() => {
    const showcaseGroup = showcaseGroupRef.current;
    if (!isOpen || !showcaseGroup) return;

    while (showcaseGroup.children.length > 0) {
      showcaseGroup.remove(showcaseGroup.children[0]);
    }
    raycastMeshesRef.current = [];
    meshesMapRef.current.clear();

    const displayProducts = filteredProducts.slice(0, 24);
    const totalItems = displayProducts.length;
    if (totalItems === 0) {
      requestRenderRef.current();
      return;
    }
    const radius = Math.max(7.2, Math.min(12.5, totalItems * 0.52));

    displayProducts.forEach((product, idx) => {
      const angle = (idx / totalItems) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      const standGroup = new THREE.Group();
      standGroup.position.set(x, 0, z);
      // Orient every stand so its front high-definition product card faces directly toward the viewer camera
      standGroup.lookAt(x * 0.25, 0, 26);

      const shelfRack = new THREE.Group();
      shelfRack.position.set(0, 0, 0);

      const board = new THREE.Mesh(sharedGeometries.shelfBoard, sharedMaterials.shelfWood);
      board.position.set(0, 0.38, 0);
      shelfRack.add(board);

      const priceRail = new THREE.Mesh(sharedGeometries.priceRail, sharedMaterials.priceRail);
      priceRail.position.set(0, 0.38, 0.56);
      shelfRack.add(priceRail);

      const ledStrip = new THREE.Mesh(sharedGeometries.shelfLedStrip, sharedMaterials.shelfLed);
      ledStrip.position.set(0, 0.34, 0.53);
      shelfRack.add(ledStrip);

      standGroup.add(shelfRack);

      const pedestal = new THREE.Mesh(sharedGeometries.pedestal, sharedMaterials.pedestal);
      pedestal.position.y = 0.2;
      standGroup.add(pedestal);

      const ring = new THREE.Mesh(sharedGeometries.ringGlow, sharedMaterials.glowRing);
      ring.position.y = 0.39;
      standGroup.add(ring);

      const product3dMesh = createCategoryProduct3dMesh(product, lang, () => {
        requestRenderRef.current();
      });
      product3dMesh.position.y = 0.42;
      product3dMesh.userData = { productId: product.id, product, standIndex: idx };
      standGroup.add(product3dMesh);

      pedestal.userData = { productId: product.id, product, standIndex: idx };
      raycastMeshesRef.current.push(product3dMesh, pedestal);

      meshesMapRef.current.set(product.id, standGroup);
      showcaseGroup.add(standGroup);
    });

    requestRenderRef.current();
  }, [isOpen, filteredProducts, lang]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden select-none font-sans">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Верхняя плашка управления 3D Витриной (без backdrop-blur для максимального FPS WebGL) */}
      <div className="fixed top-4 left-4 right-16 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Инфо Панель */}
        <div className="pointer-events-auto bg-slate-900/95 border border-slate-700 rounded-2xl p-3 shadow-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{isHy ? '3D AI Վիտրինա • Համակարգ 2000' : '3D AI Витрина Магазина'}</span>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                {filteredProducts.length} {isHy ? 'ապրանք' : 'товаров'}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              {isHy
                ? 'Ապրանքների HD 3D մոդելները՝ գնապիտակներով և հայերեն հանգիստ ձայնով'
                : 'Чёткие HD 3D-модели товаров с ценниками и спокойной армянской озвучкой'}
            </p>
          </div>
        </div>

        {/* Фильтры, Поиск и Управление Камерой */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/95 border border-slate-700 rounded-2xl p-2 shadow-2xl">
          <div className="relative w-44 sm:w-60 flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isHy ? 'Փնտրել 3D-ում...' : 'Поиск в 3D...'}
              className="w-full bg-slate-950 border border-slate-750 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              onClick={handleQuickBarcodeScan}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
              title={isHy ? 'Շտրիխ կոդի AI սկանավորում' : 'Сканировать штрихкод в 3D'}
            >
              <Barcode className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setDepartmentFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                departmentFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isHy ? 'Բոլորը' : 'Все'}
            </button>
            <button
              onClick={() => setDepartmentFilter('groceries')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                departmentFilter === 'groceries'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🍏 {isHy ? 'Մթերք' : 'Продукты'}
            </button>
            <button
              onClick={() => setDepartmentFilter('construction')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                departmentFilter === 'construction'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🛠️ {isHy ? 'Շինանյութ' : 'Стройка'}
            </button>
          </div>

          <button
            onClick={handleResetCamera}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500 transition-all cursor-pointer"
            title={isHy ? 'Վերականգնել տեսախցիկը' : 'Сбросить обзор камеры'}
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              autoRotate
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={autoRotate ? (isHy ? 'Անջատել պտույտը' : 'Выключить вращение') : (isHy ? 'Միացնել պտույտը' : 'Включить вращение')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (voiceEnabled) {
                stopSpeech();
                setVoiceEnabled(false);
              } else {
                setVoiceEnabled(true);
              }
            }}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              voiceEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-950/80 text-rose-400 border-rose-800/80'
            }`}
            title={voiceEnabled ? (isHy ? 'Անջատել AI ձայնը' : 'Выключить озвучку ИИ') : (isHy ? 'Միացնել AI ձայնը' : 'Включить озвучку ИИ')}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ПАНЕЛЬ ФИЛЬТРАЦИИ 3D-МОДЕЛЕЙ ПО КАТЕГОРИЯМ ПРОДУКЦИИ */}
      <div className="fixed top-20 left-4 right-16 z-10 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pointer-events-auto">
        <div className="bg-slate-900/95 border border-slate-700 rounded-2xl p-1.5 flex items-center gap-1.5 shadow-2xl shrink-0">
          <span className="px-2.5 py-1 text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5 shrink-0 border-r border-slate-800">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isHy ? 'Կատեգորիաներ:' : 'Категории:'}</span>
          </span>

          {availableCategories.map((cat) => {
            const isAll = cat === 'all';
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 scale-105'
                    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {isAll ? (isHy ? 'Բոլորը' : 'Все категории') : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Кнопка закрытия 3D Витрины */}
      <button
        type="button"
        onClick={() => {
          stopSpeech();
          onClose();
        }}
        className="fixed top-4 right-4 z-20 p-2.5 rounded-2xl bg-slate-900/95 hover:bg-rose-950 text-white border border-slate-700 hover:border-rose-600 transition-all shadow-2xl cursor-pointer"
        title={isHy ? 'Փակել 3D Վիտրինան' : 'Закрыть 3D Витрину'}
      >
        <X className="w-5 h-5" />
      </button>

      {/* ИИ ИНТЕРАКТИВНАЯ КАРТОЧКА ПРЕЗЕНТАЦИИ ТОВАРА (ПРИ КАСАНИИ В 3D) */}
      {selectedProduct && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4 animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-slate-900/95 border border-emerald-500/60 rounded-3xl p-5 shadow-2xl text-slate-100 relative overflow-hidden ring-1 ring-emerald-500/30">
            {/* Анимированный фоновый градиент ИИ */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Кнопка закрытия карточки */}
            <button
              onClick={() => {
                stopSpeech();
                setSelectedProduct(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ИИ Аватар и статус озвучки */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Bot className="w-6 h-6 text-emerald-400 animate-bounce-slow" />
                  </div>
                </div>
                {isSpeaking && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isHy ? '3D AI ԽՈՐՀՐԴԱՏՈՒ (ՀԱՅԵՐԵՆ)' : '3D AI КОНСУЛЬТАНТ (ՀԱՅԵՐԵՆ)'}</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[9px] font-mono">
                    🇦🇲 {isHy ? 'Հանգիստ ձայն' : 'Спокойный голос (Арм.)'}
                  </span>
                  {isSpeaking && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono animate-pulse">
                      {isHy ? 'ԽՈՍՈՒՄ Է ՀԱՅԵՐԵՆ...' : 'ОЗВУЧКА НА АРМЯНСКОМ...'}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-white leading-tight mt-0.5">
                  {selectedProduct.nameHy} {lang === 'ru' && selectedProduct.nameRu !== selectedProduct.nameHy ? `(${selectedProduct.nameRu})` : ''}
                </p>
              </div>
            </div>

            {/* Описание и армянская голосовая презентация */}
            <div className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-1.5">
              <p>{isHy ? selectedProduct.descriptionHy : selectedProduct.descriptionRu}</p>
              <p className="text-[11px] text-emerald-300/90 italic border-t border-slate-800/80 pt-1.5">
                🔊 «{buildCalmArmenianPresentationText(selectedProduct)}»
              </p>
            </div>

            {/* Характеристики и Выгода */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-mono">
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">{isHy ? 'Գինը' : 'Цена'}:</span>
                <span className="text-base font-bold text-emerald-400">
                  {formatDram(selectedProduct.priceDram)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  / {isHy ? selectedProduct.unitHy : selectedProduct.unitRu}
                </span>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-emerald-400 font-sans font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{isHy ? '10% Ցմահ դեպոզիտ' : '10% Пожизненно'}</span>
                </span>
                <span className="text-[11px] text-teal-300 font-bold block mt-0.5">
                  {isHy ? '+ 5% Քեշբեք' : '+ 5% Кешбэк'}
                </span>
              </div>
            </div>

            {/* Панель добавления в корзину */}
            <div className="flex items-center gap-3">
              {/* Счетчик количества */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-750 rounded-2xl p-1 shrink-0">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-xs font-bold font-mono text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Кнопка Добавить в корзину */}
              <button
                onClick={() => {
                  onAddToCart(selectedProduct, quantity);
                  setAddedToCartSuccess(true);
                  setTimeout(() => setAddedToCartSuccess(false), 3000);
                }}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2 ${
                  addedToCartSuccess
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/25 active:scale-95'
                }`}
              >
                {addedToCartSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isHy ? 'Ավելացվեց զամբյուղում!' : 'Добавлено в корзину!'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>
                      {isHy ? 'Ավելացնել զամբյուղ' : 'Добавить в корзину'} ({formatDram(selectedProduct.priceDram * quantity)})
                    </span>
                  </>
                )}
              </button>

              {/* Кнопка Детальный осмотр 3D */}
              <button
                onClick={() => setIsInspectionOpen(true)}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-2xl transition-colors cursor-pointer shrink-0 flex items-center gap-1 text-xs font-bold"
                title={isHy ? '3D Մանրամասն զննում' : 'Детальный осмотр 3D'}
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">{isHy ? 'Զննում' : 'Осмотр 3D'}</span>
              </button>

              {/* Переозвучка */}
              <button
                onClick={() => speakProductPresentation(selectedProduct)}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-2xl transition-colors cursor-pointer shrink-0"
                title={isHy ? 'Կրկին լսել AI-ի ներկայացումը' : 'Прослушать еще раз'}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно 360-градусного детального осмотра 3D-модели товара */}
      <Product3dInspectionModal
        isOpen={isInspectionOpen}
        onClose={() => setIsInspectionOpen(false)}
        lang={lang}
        product={selectedProduct}
        onAddToCart={onAddToCart}
      />
    </div>
  );
});

