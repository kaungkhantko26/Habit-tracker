import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const icons = [
  { size: 180, name: "apple-touch-icon.png" },
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  { size: 512, name: "icon-maskable-512.png" },
];

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function writePng(filepath, width, height, renderPixel) {
  const rows = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    rows[rowOffset] = 0;

    for (let x = 0; x < width; x += 1) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = renderPixel(x, y, width, height);
      rows[pixelOffset] = r;
      rows[pixelOffset + 1] = g;
      rows[pixelOffset + 2] = b;
      rows[pixelOffset + 3] = a;
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const output = Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  mkdirSync(dirname(filepath), { recursive: true });
  writeFileSync(filepath, output);
}

function insideRoundedRect(x, y, size, radius) {
  const left = radius;
  const right = size - radius;
  const top = radius;
  const bottom = size - radius;

  if ((x >= left && x <= right) || (y >= top && y <= bottom)) {
    return true;
  }

  const corners = [
    [left, top],
    [right, top],
    [left, bottom],
    [right, bottom],
  ];

  return corners.some(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2);
}

function renderIcon(x, y, width, height) {
  const size = Math.min(width, height);
  const radius = size * 0.22;
  const center = size / 2;
  const dx = x - center;
  const dy = y - center;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const t = (x + y) / (width + height);

  if (!insideRoundedRect(x, y, size, radius)) {
    return [0, 0, 0, 0];
  }

  let r = Math.round(106 + (105 - 106) * t);
  let g = Math.round(55 + (246 - 55) * t);
  let b = Math.round(212 + (184 - 212) * t);
  let a = 255;

  const glowRadius = size * 0.28;
  if (distance < glowRadius) {
    const glow = 1 - distance / glowRadius;
    r = Math.min(255, Math.round(r + 55 * glow));
    g = Math.min(255, Math.round(g + 40 * glow));
    b = Math.min(255, Math.round(b + 25 * glow));
  }

  const arcRadius = size * 0.18;
  const arcThickness = size * 0.055;
  const arcCenterX = size * 0.46;
  const arcCenterY = size * 0.5;
  const arcDistance = Math.sqrt((x - arcCenterX) ** 2 + (y - arcCenterY) ** 2);

  if (
    arcDistance > arcRadius - arcThickness &&
    arcDistance < arcRadius + arcThickness &&
    x < size * 0.57 &&
    y > size * 0.28 &&
    y < size * 0.72
  ) {
    return [248, 240, 255, 255];
  }

  const lineDistance = pointToSegmentDistance(
    x,
    y,
    size * 0.43,
    size * 0.52,
    size * 0.5,
    size * 0.59,
  );
  const lineDistance2 = pointToSegmentDistance(
    x,
    y,
    size * 0.5,
    size * 0.59,
    size * 0.66,
    size * 0.39,
  );
  const stroke = size * 0.03;

  if (lineDistance < stroke || lineDistance2 < stroke) {
    return [105, 246, 184, 255];
  }

  return [r, g, b, a];
}

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

for (const icon of icons) {
  writePng(resolve("public", icon.name), icon.size, icon.size, renderIcon);
}
