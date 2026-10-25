const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

function createPng(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Non-interlaced

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  function chunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const rowLen = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLen);

  const cx = width / 2;
  const cy = height / 2;
  const cornerR = width * 0.225; // macOS Squircle radius

  // Central Card Bounds
  const sheetX1 = width * 0.20;
  const sheetX2 = width * 0.80;
  const sheetY1 = height * 0.16;
  const sheetY2 = height * 0.86;
  const sheetCornerR = width * 0.045;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // filter None

    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 4;

      // 1. Check Squircle Boundary
      const qx = Math.max(0, Math.abs(x - cx) - (cx - cornerR));
      const qy = Math.max(0, Math.abs(y - cy) - (cy - cornerR));
      const cornerDist = Math.sqrt(qx * qx + qy * qy);

      if (cornerDist > cornerR) {
        // Transparent outside app icon
        rawData[px] = 0;
        rawData[px + 1] = 0;
        rawData[px + 2] = 0;
        rawData[px + 3] = 0;
        continue;
      }

      // Base App Gradient: Deep Tech Royal Blue to Violet Indigo
      const diagT = (x + y) / (width + height);
      let r = Math.round(24 + diagT * 25);
      let g = Math.round(58 + diagT * 20);
      let b = Math.round(180 + (1 - diagT) * 60);
      let a = 255;

      // Subtle Outer Rim Highlight (Apple Specular Glow)
      if (Math.abs(cornerDist - cornerR) < 6) {
        r = Math.min(255, r + 90);
        g = Math.min(255, g + 90);
        b = Math.min(255, b + 70);
      }

      // Ambient radial glow from top-center
      const glowDx = x - cx;
      const glowDy = y - (height * 0.25);
      const glowDist = Math.sqrt(glowDx * glowDx + glowDy * glowDy);
      if (glowDist < width * 0.45) {
        const glowFactor = (1 - glowDist / (width * 0.45)) * 0.28;
        r = Math.min(255, r + Math.round(90 * glowFactor));
        g = Math.min(255, g + Math.round(150 * glowFactor));
        b = Math.min(255, b + Math.round(255 * glowFactor));
      }

      // 2. Central White Document Sheet
      const inSheetBox = x >= sheetX1 && x <= sheetX2 && y >= sheetY1 && y <= sheetY2;
      let inSheet = false;
      if (inSheetBox) {
        const sqx = Math.max(0, Math.abs(x - (sheetX1 + sheetX2) / 2) - ((sheetX2 - sheetX1) / 2 - sheetCornerR));
        const sqy = Math.max(0, Math.abs(y - (sheetY1 + sheetY2) / 2) - ((sheetY2 - sheetY1) / 2 - sheetCornerR));
        if (Math.sqrt(sqx * sqx + sqy * sqy) <= sheetCornerR) {
          inSheet = true;
        }
      }

      // Drop shadow around sheet
      if (!inSheet && x >= sheetX1 - 18 && x <= sheetX2 + 18 && y >= sheetY1 - 8 && y <= sheetY2 + 24) {
        const shadowAlpha = 0.35;
        r = Math.round(r * (1 - shadowAlpha) + 10 * shadowAlpha);
        g = Math.round(g * (1 - shadowAlpha) + 15 * shadowAlpha);
        b = Math.round(b * (1 - shadowAlpha) + 40 * shadowAlpha);
      }

      if (inSheet) {
        // Base sheet color: crisp pure white with faint blue tint
        r = 252; g = 253; b = 255;

        // Document Header Bar (y in [sheetY1 + 24 .. sheetY1 + 84])
        const hdrY1 = sheetY1 + 24;
        const hdrY2 = sheetY1 + 90;
        if (y >= hdrY1 && y <= hdrY2 && x >= sheetX1 + 24 && x <= sheetX2 - 24) {
          // Gradient header bar
          const hdrT = (x - sheetX1) / (sheetX2 - sheetX1);
          r = Math.round(59 + hdrT * 40);
          g = Math.round(130 + hdrT * 20);
          b = Math.round(246 + hdrT * 5);
        }

        // Two-Way Matrix Grid Body
        const gridY1 = sheetY1 + 116;
        const gridY2 = sheetY2 - 32;
        const gridX1 = sheetX1 + 24;
        const gridX2 = sheetX2 - 24;

        if (x >= gridX1 && x <= gridX2 && y >= gridY1 && y <= gridY2) {
          // Table Background: Soft Ice Blue
          r = 241; g = 245; b = 252;

          // Matrix Columns:
          // 4 Columns: Col 0 (Unit), Col 1 (Knowledge), Col 2 (Application), Col 3 (Evaluation)
          const colW = (gridX2 - gridX1 - 30) / 4;
          const colIdx = Math.floor((x - gridX1) / (colW + 10));
          const colRem = (x - gridX1) % (colW + 10);

          // Matrix Rows: Header row + 4 data rows
          const rowH = (gridY2 - gridY1 - 40) / 5;
          const rowIdx = Math.floor((y - gridY1) / (rowH + 8));
          const rowRem = (y - gridY1) % (rowH + 8);

          // Cells inside table
          if (colIdx >= 0 && colIdx < 4 && colRem < colW && rowIdx >= 0 && rowIdx < 5 && rowRem < rowH) {
            if (rowIdx === 0) {
              // Table Header Cells
              if (colIdx === 0) { r = 203; g = 213; b = 225; } // Slate
              if (colIdx === 1) { r = 186; g = 230; b = 253; } // Sky Blue (知識)
              if (colIdx === 2) { r = 199; g = 210; b = 254; } // Indigo (應用)
              if (colIdx === 3) { r = 245; g = 208; b = 254; } // Purple (評鑑)
            } else {
              // Data Cells (Score Pills)
              if (colIdx === 0) {
                // Unit Label Pill
                r = 255; g = 255; b = 255;
              } else {
                // Colored Cognitive Score Pills
                const intensity = ((rowIdx * 3 + colIdx) % 3) + 1;
                if (colIdx === 1) {
                  // Knowledge (Sky Blue)
                  r = 14 + (3 - intensity) * 45;
                  g = 165 - (3 - intensity) * 30;
                  b = 233;
                } else if (colIdx === 2) {
                  // Application (Indigo)
                  r = 99 - (3 - intensity) * 20;
                  g = 102 + (3 - intensity) * 25;
                  b = 241;
                } else if (colIdx === 3) {
                  // Evaluation (Violet / Rose)
                  r = 217 - (3 - intensity) * 30;
                  g = 70 + (3 - intensity) * 20;
                  b = 239;
                }
              }
            }
          }
        }
      }

      // 3. Floating Brilliant AI Sparkle (Gold / Yellow / Cyan 4-pointed Star)
      const spkX = sheetX2 - 12;
      const spkY = sheetY1 + 18;
      const sDx = Math.abs(x - spkX);
      const sDy = Math.abs(y - spkY);

      // Star shape: (sDx * sDy <= threshold) within radius
      const sR = width * 0.075;
      if (sDx <= sR && sDy <= sR) {
        const starMetric = Math.pow(sDx / sR, 0.5) + Math.pow(sDy / sR, 0.5);
        if (starMetric <= 1.0) {
          const coreDist = Math.sqrt(sDx * sDx + sDy * sDy);
          const tCore = Math.max(0, 1.0 - coreDist / (sR * 0.6));
          r = 255;
          g = Math.round(215 + tCore * 40);
          b = Math.round(0 + tCore * 220);
        }
      }

      // Secondary mini sparkle
      const miniX = sheetX2 + 28;
      const miniY = sheetY1 - 22;
      const mDx = Math.abs(x - miniX);
      const mDy = Math.abs(y - miniY);
      const mR = width * 0.035;
      if (mDx <= mR && mDy <= mR) {
        const miniMetric = Math.pow(mDx / mR, 0.5) + Math.pow(mDy / mR, 0.5);
        if (miniMetric <= 1.0) {
          r = 56; g = 189; b = 248; // Cyan star
        }
      }

      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
      rawData[px + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

console.log('🎨 Generating high-res 1024x1024 TestAnls application icon...');
const pngBuffer = createPng(1024, 1024);
const outPng = path.join(__dirname, '../build/icon_1024.png');
fs.writeFileSync(outPng, pngBuffer);
console.log(`✅ Saved ${outPng} (${(pngBuffer.length / 1024).toFixed(1)} KB)`);

// Generate macOS icon.iconset and icon.icns using sips and iconutil
try {
  const iconsetDir = path.join(__dirname, '../build/icon.iconset');
  if (!fs.existsSync(iconsetDir)) fs.mkdirSync(iconsetDir, { recursive: true });

  const sizes = [16, 32, 128, 256, 512];
  for (const s of sizes) {
    execSync(`sips -z ${s} ${s} "${outPng}" --out "${iconsetDir}/icon_${s}x${s}.png" >/dev/null 2>&1`);
    execSync(`sips -z ${s * 2} ${s * 2} "${outPng}" --out "${iconsetDir}/icon_${s}x${s}@2x.png" >/dev/null 2>&1`);
  }

  const outIcns = path.join(__dirname, '../build/icon.icns');
  execSync(`iconutil -c icns "${iconsetDir}" -o "${outIcns}"`);
  console.log(`🎉 Successfully built macOS app icon: ${outIcns} (${(fs.statSync(outIcns).size / 1024).toFixed(1)} KB)`);
} catch (e) {
  console.error('Failed to create .icns:', e.message);
  process.exit(1);
}
