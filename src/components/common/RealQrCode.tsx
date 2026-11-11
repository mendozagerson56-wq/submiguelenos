import React, { useMemo } from 'react';

interface RealQrCodeProps {
  value: string;
  size?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
}

// ISO/IEC 18004 Single-Block ECC Level L Specs (Versions 1 to 5)
const VERSION_SPECS = [
  { version: 1, size: 21, dataBytes: 19, ecBytes: 7, align: [] as number[] },
  { version: 2, size: 25, dataBytes: 34, ecBytes: 10, align: [6, 18] },
  { version: 3, size: 29, dataBytes: 55, ecBytes: 15, align: [6, 22] },
  { version: 4, size: 33, dataBytes: 80, ecBytes: 20, align: [6, 26] },
  { version: 5, size: 37, dataBytes: 108, ecBytes: 26, align: [6, 30] },
];

function gfMul(x: number, y: number, exp: Uint8Array, log: Uint8Array): number {
  if (x === 0 || y === 0) return 0;
  return exp[(log[x] + log[y]) % 255];
}

function computeReedSolomon(data: number[], ecLen: number): number[] {
  const exp = new Uint8Array(512);
  const log = new Uint8Array(256);
  let v = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = v;
    log[v] = i;
    v <<= 1;
    if (v & 0x100) v ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    exp[i] = exp[i - 255];
  }

  let gen = [1];
  for (let i = 0; i < ecLen; i++) {
    const next = new Array(gen.length + 1).fill(0);
    const factor = exp[i];
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= gfMul(gen[j], factor, exp, log);
    }
    gen = next;
  }

  const msg = new Array(data.length + ecLen).fill(0);
  for (let i = 0; i < data.length; i++) msg[i] = data[i];

  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef, exp, log);
      }
    }
  }

  return msg.slice(data.length);
}

function generateQrMatrix(text: string): boolean[][] {
  const utf8 = Array.from(new TextEncoder().encode(text));
  // Pick smallest version that fits (byte mode header = 4 bits mode + 8 bits len = 12 bits)
  const spec =
    VERSION_SPECS.find((s) => utf8.length + 2 <= s.dataBytes) ||
    VERSION_SPECS[VERSION_SPECS.length - 1];

  const payload = utf8.slice(0, spec.dataBytes - 2);
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  // Mode 0100 (Byte mode)
  pushBits(0b0100, 4);
  pushBits(payload.length, 8);
  for (const b of payload) pushBits(b, 8);

  // Terminator up to 4 bits
  const maxBits = spec.dataBytes * 8;
  const term = Math.min(4, maxBits - bits.length);
  pushBits(0, term);

  while (bits.length % 8 !== 0) bits.push(0);

  const dataBytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    dataBytes.push(byte);
  }

  let padToggle = true;
  while (dataBytes.length < spec.dataBytes) {
    dataBytes.push(padToggle ? 0xec : 0x11);
    padToggle = !padToggle;
  }

  const ecBytes = computeReedSolomon(dataBytes, spec.ecBytes);
  const allCodewords = [...dataBytes, ...ecBytes];

  const n = spec.size;
  const modules: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  const isFunction: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < n && c >= 0 && c < n) {
      modules[r][c] = dark;
      isFunction[r][c] = true;
    }
  };

  const drawFinder = (r0: number, c0: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = r0 + dr;
        const c = c0 + dc;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(r, c, inOuter && (onBorder || inInner));
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);

  // Timing patterns
  for (let i = 8; i < n - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  const align = spec.align;
  for (const ar of align) {
    for (const ac of align) {
      if (
        (ar === 6 && ac === 6) ||
        (ar === 6 && ac === n - 7) ||
        (ar === n - 7 && ac === 6)
      ) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark =
            Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
          setFunctionModule(ar + dr, ac + dc, dark);
        }
      }
    }
  }

  // Reserve format info areas & dark module
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      isFunction[8][i] = true;
      isFunction[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][n - 1 - i] = true;
    isFunction[n - 1 - i][8] = true;
  }
  setFunctionModule(n - 8, 8, true);

  // Place data bits in zigzag
  let bitIdx = 0;
  const totalBits = allCodewords.length * 8;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < n; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? n - 1 - vert : vert;
        if (!isFunction[r][c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            dark = ((allCodewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1) !== 0;
            bitIdx++;
          }
          // Mask 0: (r + c) % 2 === 0
          if ((r + c) % 2 === 0) dark = !dark;
          modules[r][c] = dark;
        }
      }
    }
  }

  // Draw Format Info for ECC L (01) + Mask 0 (000) -> 0x77c4
  const formatBits = 0x77c4;
  const getFormatBit = (bitIndexFromLsb: number) =>
    ((formatBits >> bitIndexFromLsb) & 1) !== 0;

  // Top-left around finder
  setFunctionModule(8, 0, getFormatBit(14));
  setFunctionModule(8, 1, getFormatBit(13));
  setFunctionModule(8, 2, getFormatBit(12));
  setFunctionModule(8, 3, getFormatBit(11));
  setFunctionModule(8, 4, getFormatBit(10));
  setFunctionModule(8, 5, getFormatBit(9));
  setFunctionModule(8, 7, getFormatBit(8));
  setFunctionModule(8, 8, getFormatBit(7));
  setFunctionModule(7, 8, getFormatBit(6));
  setFunctionModule(5, 8, getFormatBit(5));
  setFunctionModule(4, 8, getFormatBit(4));
  setFunctionModule(3, 8, getFormatBit(3));
  setFunctionModule(2, 8, getFormatBit(2));
  setFunctionModule(1, 8, getFormatBit(1));
  setFunctionModule(0, 8, getFormatBit(0));

  // Bottom-left vertical (bits 14..8) & Top-right horizontal (bits 7..0)
  for (let i = 0; i < 7; i++) {
    setFunctionModule(n - 1 - i, 8, getFormatBit(14 - i));
  }
  for (let i = 0; i < 8; i++) {
    setFunctionModule(8, n - 8 + i, getFormatBit(7 - i));
  }

  return modules;
}

export const RealQrCode: React.FC<RealQrCodeProps> = ({
  value,
  size = 180,
  className = '',
  fgColor = '#171717',
  bgColor = '#ffffff',
}) => {
  const matrix = useMemo(() => generateQrMatrix(value || 'LEALRESTO'), [value]);
  const quietZone = 2;
  const totalModules = matrix.length + quietZone * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${totalModules} ${totalModules}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Código QR para ${value}`}
    >
      <rect width={totalModules} height={totalModules} fill={bgColor} rx={1.5} />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c + quietZone}
              y={r + quietZone}
              width={1}
              height={1}
              fill={fgColor}
            />
          ) : null
        )
      )}
    </svg>
  );
};
