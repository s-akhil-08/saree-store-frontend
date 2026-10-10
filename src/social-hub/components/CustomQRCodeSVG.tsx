import React, { useMemo } from 'react';
import QRCode from 'qrcode';

export interface CustomQRCodeSVGProps {
  value: string;
  fgColor?: string;
  bgColor?: string;
  size?: number;
  includeLogo?: boolean;
  logoSrc?: string;
  className?: string;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export function isFinderModule(r: number, c: number, matrixSize: number): boolean {
  // 7x7 Finders
  const tl = r >= 0 && r < 7 && c >= 0 && c < 7;
  const tr = r >= 0 && r < 7 && c >= matrixSize - 7 && c < matrixSize;
  const bl = r >= matrixSize - 7 && r < matrixSize && c >= 0 && c < 7;
  return tl || tr || bl;
}

export default function CustomQRCodeSVG({
  value,
  fgColor = '#18181A',
  bgColor = '#FFFFFF',
  size = 600,
  includeLogo = true,
  logoSrc = '/st_logo.png',
  className = '',
  svgRef,
}: CustomQRCodeSVGProps) {
  // Synchronous, instantaneous matrix generation (0ms)
  const qr = useMemo(() => {
    try {
      return QRCode.create(value, { errorCorrectionLevel: 'H' });
    } catch (e) {
      console.error('QR creation error:', e);
      return null;
    }
  }, [value]);

  if (!qr) return null;

  const matrixSize = qr.modules.size;
  // Compact 1-module border for optimal edge-to-edge container fit
  const borderModules = 1;
  const totalModules = matrixSize + borderModules * 2;
  const moduleSize = size / totalModules;
  const offset = borderModules * moduleSize;
  const dotRadius = moduleSize * 0.44;

  // 3 Squircle Finder Positions
  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: matrixSize - 7 },
    { r: matrixSize - 7, c: 0 },
  ];

  const finderOuterSize = 7.0 * moduleSize;
  const finderInnerOffset = 2.0 * moduleSize;
  const finderInnerSize = 3.0 * moduleSize;
  const finderRxOuter = finderOuterSize * 0.30;
  const finderRxInner = finderInnerSize * 0.28;
  const eyeStroke = moduleSize * 0.98;

  // Logo bounding zone in modules (center)
  const logoModules = includeLogo ? Math.max(7, Math.floor(matrixSize * 0.26)) : 0;
  const logoStart = Math.floor((matrixSize - logoModules) / 2);
  const logoEnd = logoStart + logoModules;

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      style={{ backgroundColor: bgColor }}
      className={`select-none ${className}`}
    >
      {/* 1. Background */}
      <rect width={size} height={size} fill={bgColor} rx={size * 0.05} />

      {/* 2. Regular Data Modules as Crisp Circular Dots */}
      <g fill={fgColor} stroke="none">
        {Array.from({ length: matrixSize }).flatMap((_, r) =>
          Array.from({ length: matrixSize }).map((_, c) => {
            const isDark = qr.modules.get(r, c);
            if (!isDark) return null;
            if (isFinderModule(r, c, matrixSize)) return null;

            // Clear center modules if logo is active
            if (includeLogo && r >= logoStart && r < logoEnd && c >= logoStart && c < logoEnd) {
              return null;
            }

            const cx = offset + (c + 0.5) * moduleSize;
            const cy = offset + (r + 0.5) * moduleSize;

            return (
              <circle
                key={`dot-${r}-${c}`}
                cx={cx}
                cy={cy}
                r={dotRadius}
              />
            );
          })
        )}

        {/* 3. 3 Custom Rounded Squircle Finder Eyes */}
        {finderPositions.map((pos, idx) => {
          const fx = offset + pos.c * moduleSize;
          const fy = offset + pos.r * moduleSize;

          return (
            <g key={`finder-${idx}`}>
              {/* Outer squircle frame */}
              <rect
                x={fx + eyeStroke / 2}
                y={fy + eyeStroke / 2}
                width={finderOuterSize - eyeStroke}
                height={finderOuterSize - eyeStroke}
                rx={finderRxOuter}
                ry={finderRxOuter}
                fill="none"
                stroke={fgColor}
                strokeWidth={eyeStroke}
              />
              {/* Inner solid squircle dot */}
              <rect
                x={fx + finderInnerOffset}
                y={fy + finderInnerOffset}
                width={finderInnerSize}
                height={finderInnerSize}
                rx={finderRxInner}
                ry={finderRxInner}
                fill={fgColor}
              />
            </g>
          );
        })}
      </g>

      {/* 4. Center Logo with White Badge */}
      {includeLogo && (
        <g>
          {/* Circular/Squircle White Badge Backing */}
          <rect
            x={size / 2 - (logoModules * moduleSize * 1.15) / 2}
            y={size / 2 - (logoModules * moduleSize * 1.15) / 2}
            width={logoModules * moduleSize * 1.15}
            height={logoModules * moduleSize * 1.15}
            rx={logoModules * moduleSize * 0.32}
            fill="#FFFFFF"
            stroke={fgColor}
            strokeOpacity="0.12"
            strokeWidth="2"
          />
          {/* Logo Image */}
          <image
            href={logoSrc}
            x={size / 2 - (logoModules * moduleSize * 0.9) / 2}
            y={size / 2 - (logoModules * moduleSize * 0.9) / 2}
            width={logoModules * moduleSize * 0.9}
            height={logoModules * moduleSize * 0.9}
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
      )}
    </svg>
  );
}

/**
 * Utility to generate high-resolution PNG bytes/dataURL on offscreen canvas in 0ms
 */
export async function generateClientQRPNG(
  value: string,
  fgColor: string = '#18181A',
  bgColor: string = '#FFFFFF',
  includeLogo: boolean = true,
  logoSrc: string = '/st_logo.png',
  size: number = 1200
): Promise<string> {
  const qr = QRCode.create(value, { errorCorrectionLevel: 'H' });
  const matrixSize = qr.modules.size;
  const borderModules = 1;
  const totalModules = matrixSize + borderModules * 2;
  const moduleSize = size / totalModules;
  const offset = borderModules * moduleSize;
  const dotRadius = moduleSize * 0.44;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Data Dots
  ctx.fillStyle = fgColor;
  const logoModules = includeLogo ? Math.max(7, Math.floor(matrixSize * 0.26)) : 0;
  const logoStart = Math.floor((matrixSize - logoModules) / 2);
  const logoEnd = logoStart + logoModules;

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (qr.modules.get(r, c) && !isFinderModule(r, c, matrixSize)) {
        if (includeLogo && r >= logoStart && r < logoEnd && c >= logoStart && c < logoEnd) {
          continue;
        }
        const cx = offset + (c + 0.5) * moduleSize;
        const cy = offset + (r + 0.5) * moduleSize;
        ctx.beginPath();
        ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 3 Finders
  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: matrixSize - 7 },
    { r: matrixSize - 7, c: 0 },
  ];
  const finderOuterSize = 7.0 * moduleSize;
  const finderInnerOffset = 2.0 * moduleSize;
  const finderInnerSize = 3.0 * moduleSize;
  const finderRxOuter = finderOuterSize * 0.30;
  const finderRxInner = finderInnerSize * 0.28;
  const eyeStroke = moduleSize * 0.98;

  for (const pos of finderPositions) {
    const fx = offset + pos.c * moduleSize;
    const fy = offset + pos.r * moduleSize;

    // Outer squircle
    ctx.lineWidth = eyeStroke;
    ctx.strokeStyle = fgColor;
    ctx.beginPath();
    ctx.roundRect(
      fx + eyeStroke / 2,
      fy + eyeStroke / 2,
      finderOuterSize - eyeStroke,
      finderOuterSize - eyeStroke,
      finderRxOuter
    );
    ctx.stroke();

    // Inner dot
    ctx.fillStyle = fgColor;
    ctx.beginPath();
    ctx.roundRect(
      fx + finderInnerOffset,
      fy + finderInnerOffset,
      finderInnerSize,
      finderInnerSize,
      finderRxInner
    );
    ctx.fill();
  }

  // Logo Embedding
  if (includeLogo && logoSrc) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = logoSrc;
      });

      const badgeSize = logoModules * moduleSize * 1.15;
      const badgeX = size / 2 - badgeSize / 2;
      const badgeY = size / 2 - badgeSize / 2;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, badgeSize * 0.28);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 3;
      ctx.stroke();

      const logoImgSize = logoModules * moduleSize * 0.85;
      const logoX = size / 2 - logoImgSize / 2;
      const logoY = size / 2 - logoImgSize / 2;
      ctx.drawImage(img, logoX, logoY, logoImgSize, logoImgSize);
    } catch {
      // ignore logo draw failure if image not found
    }
  }

  return canvas.toDataURL('image/png');
}
