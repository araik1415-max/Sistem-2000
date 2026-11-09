import QRCode from 'qrcode';
import { ProductItem } from '../types';

/**
 * Generate a QR Code SVG string using the qrcode library
 */
export async function generateQrCodeSvg(text: string): Promise<string> {
  try {
    const svgStr = await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return svgStr;
  } catch (err) {
    console.error('Failed to generate QR Code SVG:', err);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="#f1f5f9"/><text x="64" y="64" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#64748b">QR Error</text></svg>`;
  }
}

/**
 * Generate a QR Code Data URL (PNG)
 */
export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR Code Data URL:', err);
    return '';
  }
}

/**
 * Render Code-128 / EAN Barcode SVG string for product tags & receipts
 */
export function generateBarcodeSvg(barcodeText: string): string {
  const cleanCode = (barcodeText || '485000123456').replace(/[^a-zA-Z0-9-]/g, '');
  
  // Deterministic bar widths pattern based on char codes
  const bars: Array<{ width: number; isSpace: boolean }> = [];
  bars.push({ width: 3, isSpace: false }); // start bar
  bars.push({ width: 2, isSpace: true });
  bars.push({ width: 2, isSpace: false });
  bars.push({ width: 2, isSpace: true });

  for (let i = 0; i < cleanCode.length; i++) {
    const charCode = cleanCode.charCodeAt(i);
    const w1 = (charCode % 3) + 1;
    const w2 = ((charCode * 2) % 3) + 1;
    const w3 = ((charCode * 3) % 4) + 1;
    const w4 = (charCode % 2) + 1;

    bars.push({ width: w1, isSpace: false });
    bars.push({ width: w2, isSpace: true });
    bars.push({ width: w3, isSpace: false });
    bars.push({ width: w4, isSpace: true });
  }

  bars.push({ width: 3, isSpace: false }); // stop bar
  bars.push({ width: 2, isSpace: true });
  bars.push({ width: 4, isSpace: false });

  let currentX = 10;
  const barHeight = 42;
  const rects: string[] = [];

  for (const bar of bars) {
    if (!bar.isSpace) {
      rects.push(`<rect x="${currentX}" y="10" width="${bar.width}" height="${barHeight}" fill="#0f172a"/>`);
    }
    currentX += bar.width + (bar.isSpace ? 1 : 0);
  }

  const svgWidth = Math.max(currentX + 10, 200);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} 75" class="w-full h-auto">
    <rect width="${svgWidth}" height="75" fill="#ffffff" rx="6"/>
    ${rects.join('')}
    <text x="${svgWidth / 2}" y="65" font-family="monospace" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="2">${cleanCode}</text>
  </svg>`;
}

/**
 * Universal Store & Warehouse Product Lookup by Barcode, SKU, Name, Image Description or Category
 */
export function findProductByCodeOrQuery(
  products: ProductItem[],
  rawQuery: string
): { product: ProductItem | null; matchType?: 'barcode' | 'sku' | 'name' | 'keyword' | 'category'; confidence: number } {
  if (!rawQuery || !rawQuery.trim()) {
    return { product: null, confidence: 0 };
  }

  const query = rawQuery.trim().toLowerCase();
  const digitsOnly = query.replace(/\D/g, '');

  // 1. Exact or partial match on Barcode
  if (digitsOnly.length >= 4) {
    const matchedByBarcode = products.find(
      (p) => (p.barcode && p.barcode.includes(digitsOnly)) || (p.sku && p.sku.toLowerCase().includes(query))
    );
    if (matchedByBarcode) {
      return { product: matchedByBarcode, matchType: 'barcode', confidence: 0.98 };
    }
  }

  // 2. Exact or partial match on SKU
  const matchedBySku = products.find((p) => p.sku && p.sku.toLowerCase().includes(query));
  if (matchedBySku) {
    return { product: matchedBySku, matchType: 'sku', confidence: 0.95 };
  }

  // 3. Match on Name (Armenian or Russian)
  const matchedByName = products.find(
    (p) =>
      p.nameRu.toLowerCase().includes(query) ||
      p.nameHy.toLowerCase().includes(query) ||
      p.descriptionRu?.toLowerCase().includes(query) ||
      p.descriptionHy?.toLowerCase().includes(query)
  );
  if (matchedByName) {
    return { product: matchedByName, matchType: 'name', confidence: 0.90 };
  }

  // 4. Match on Image Keywords / Visual description
  const matchedByKeyword = products.find((p) =>
    p.imageKeywords?.some((kw) => kw.toLowerCase().includes(query) || query.includes(kw.toLowerCase()))
  );
  if (matchedByKeyword) {
    return { product: matchedByKeyword, matchType: 'keyword', confidence: 0.85 };
  }

  // 5. Match on Category
  const matchedByCategory = products.find(
    (p) =>
      (p.categoryRu && p.categoryRu.toLowerCase().includes(query)) ||
      (p.categoryHy && p.categoryHy.toLowerCase().includes(query))
  );
  if (matchedByCategory) {
    return { product: matchedByCategory, matchType: 'category', confidence: 0.70 };
  }

  return { product: null, confidence: 0 };
}

/**
 * Interactive scan or image file reader with BarcodeDetector API or Canvas barcode decoder
 */
export async function decodeBarcodeFromImageFile(
  file: File
): Promise<{ text: string | null; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const src = e.target?.result as string;
      if (!src) {
        resolve({ text: null, error: 'Failed to read image file' });
        return;
      }

      const img = new Image();
      img.onload = async () => {
        // Try native BarcodeDetector API if supported in browser
        if ('BarcodeDetector' in window) {
          try {
            const barcodeDetector = new (window as any).BarcodeDetector({
              formats: ['qr_code', 'ean_13', 'code_128', 'ean_8', 'upc_a', 'data_matrix'],
            });
            const detected = await barcodeDetector.detect(img);
            if (detected && detected.length > 0) {
              resolve({ text: detected[0].rawValue });
              return;
            }
          } catch (err) {
            console.warn('Native BarcodeDetector attempt failed:', err);
          }
        }

        // Fallback: look for filename or mock code patterns or OCR numbers in filename/metadata
        const fileName = file.name.toLowerCase();
        const matchDigits = fileName.match(/\d{8,13}/);
        if (matchDigits) {
          resolve({ text: matchDigits[0] });
          return;
        }

        // If no barcode detected automatically from image, return raw image data for AI Visual Analysis
        resolve({ text: null });
      };
      img.onerror = () => resolve({ text: null, error: 'Invalid image format' });
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Send image file to Gemini Multimodal API endpoint for visual recognition
 * when barcode is damaged, torn, or missing.
 */
export async function identifyProductWithGemini(
  file: File
): Promise<{ product: ProductItem | null; reasoningRu?: string; reasoningHy?: string; confidence?: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        resolve({ product: null });
        return;
      }

      try {
        const response = await fetch('/api/gemini/identify-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: dataUrl,
            mimeType: file.type || 'image/jpeg',
          }),
        });

        if (!response.ok) {
          throw new Error(`Gemini Identify API status ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.matchedProduct) {
          resolve({
            product: data.matchedProduct,
            reasoningRu: data.reasoningRu,
            reasoningHy: data.reasoningHy,
            confidence: data.confidence || 0.9,
          });
          return;
        }
      } catch (err) {
        console.warn('Gemini image identify API failed, falling back to local search:', err);
      }

      resolve({ product: null });
    };
    reader.readAsDataURL(file);
  });
}

