import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import './Ferrofluid.css';

const MAX_COLORS = 8;

const hexToRGB = (hex: string) => {
  const c = hex.replace('#', '').padEnd(6, '0');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return [r, g, b];
};

const prepColors = (input?: string[]) => {
  const base = (input && input.length ? input : ['#D41858', '#B89768', '#3395FF']).slice(0, MAX_COLORS);
  const count = base.length;
  const arr: number[][] = [];
  for (let i = 0; i < MAX_COLORS; i++) arr.push(hexToRGB(base[Math.min(i, base.length - 1)]));
  const avg = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    avg[0] += arr[i][0];
    avg[1] += arr[i][1];
    avg[2] += arr[i][2];
  }
  avg[0] /= count;
  avg[1] /= count;
  avg[2] /= count;
  return { arr, count, avg };
};

const flowVec = (d?: string) => {
  switch (d) {
    case 'up':
      return [0, 1];
    case 'down':
      return [0, -1];
    case 'left':
      return [-1, 0];
    case 'right':
      return [1, 0];
    default:
      return [0, -1];
  }
};

const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
precision highp float;

uniform vec3  iResolution;
uniform vec2  iMouse;
uniform float iTime;

uniform vec3  uColor0;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform vec3  uColor4;
uniform vec3  uColor5;
uniform vec3  uColor6;
uniform vec3  uColor7;
uniform int   uColorCount;

uniform vec3  uMouseColor;
uniform vec2  uFlow;
uniform float uSpeed;
uniform float uScale;
uniform float uTurbulence;
uniform float uFluidity;
uniform float uRimWidth;
uniform float uSharpness;
uniform float uShimmer;
uniform float uGlow;
uniform float uOpacity;
uniform float uMouseEnabled;
uniform float uMouseStrength;
uniform float uMouseRadius;

varying vec2 vUv;

#define PI 3.14159265

vec3 palette(float h) {
  int count = uColorCount;
  if (count < 1) count = 1;
  int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
  if (idx <= 0) return uColor0;
  if (idx == 1) return uColor1;
  if (idx == 2) return uColor2;
  if (idx == 3) return uColor3;
  if (idx == 4) return uColor4;
  if (idx == 5) return uColor5;
  if (idx == 6) return uColor6;
  return uColor7;
}

float hash(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float smin(float a, float b, float k) {
  float r = exp2(-a / k) + exp2(-b / k);
  return -k * log2(r);
}

float sinlerp(float a, float b, float w) {
  return mix(a, b, (sin(w * PI - PI / 2.0) + 1.0) / 2.0);
}

float vn(vec2 p, float s, float seed) {
  vec2 cellp = floor(p / s);
  vec2 relp = mod(p, s);
  float g1 = hash(vec3(cellp, seed));
  float g2 = hash(vec3(cellp.x + 1.0, cellp.y, seed));
  float g3 = hash(vec3(cellp.x + 1.0, cellp.y + 1.0, seed));
  float g4 = hash(vec3(cellp.x, cellp.y + 1.0, seed));
  float bx = sinlerp(g1, g2, relp.x / s);
  float tx = sinlerp(g4, g3, relp.x / s);
  return sinlerp(bx, tx, relp.y / s);
}

float dbn(vec2 p, float s, float seed) {
  float o = s / 2.0;
  float n0 = vn(p, s, seed);
  float n1 = vn(p + vec2(o, o), s, seed + 0.1);
  float n2 = vn(p + vec2(-o, o), s, seed + 0.2);
  float n3 = vn(p + vec2(o, -o), s, seed + 0.3);
  float n4 = vn(p + vec2(-o, -o), s, seed + 0.4);
  return (2.0 * n0 + 1.5 * n1 + 1.25 * n2 + 1.125 * n3 + n4) / 7.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  float ref = 700.0 / max(uScale, 0.05);
  vec2 p = fragCoord / iResolution.y * ref;

  float spd = 200.0 * uSpeed;
  float t = iTime;

  vec2 dir = uFlow;
  vec2 perp = vec2(-dir.y, dir.x);

  float distort1 = vn(p + perp * (t * spd), 60.0, 10.0) * 50.0 * uTurbulence;
  float distort2 = vn(p - perp * (t * spd), 120.0, 15.0) * 100.0 * uTurbulence;

  float peaks = dbn(p + distort1 + dir * (t * spd * 0.5), 40.0, 1.0);
  float peaks2 = dbn(p + distort2 - dir * (t * spd * 0.5), 40.0, 0.0);

  float mapeaks = smin(peaks, peaks2, max(uFluidity, 0.001));

  float mGlow = 0.0;
  if (uMouseEnabled > 0.5) {
    vec2 mp = iMouse / iResolution.y * ref;
    float md = length(p - mp) / ref;
    float rr = max(uMouseRadius, 0.02);
    mGlow = exp(-md * md / (rr * rr)) * uMouseStrength;
  }

  float band = (uRimWidth - abs((mapeaks - 0.4) * 2.0)) * 5.0;
  float ltn = clamp(band - vn(p + dir * (t * spd * 0.5), 60.0, 12.0) * uShimmer, 0.0, 1.0);
  ltn = pow(ltn, uSharpness) * uGlow;
  ltn *= clamp(1.0 - mGlow, 0.0, 1.0);

  float h = clamp(0.5 + (peaks - peaks2) * 0.8, 0.0, 1.0);
  vec3 col = palette(h);

  vec3 outc = col * ltn;
  float a = clamp(max(outc.r, max(outc.g, outc.b)), 0.0, 1.0);
  fragColor = vec4(outc, a * uOpacity);
}

void main() {
  vec4 color;
  mainImage(color, vUv * iResolution.xy);
  gl_FragColor = color;
}
`;

export interface FerrofluidProps {
  className?: string;
  dpr?: number;
  paused?: boolean;
  colors?: string[];
  speed?: number;
  scale?: number;
  turbulence?: number;
  fluidity?: number;
  rimWidth?: number;
  sharpness?: number;
  shimmer?: number;
  glow?: number;
  flowDirection?: 'up' | 'down' | 'left' | 'right';
  opacity?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  mouseRadius?: number;
  mouseDampening?: number;
  mixBlendMode?: any;
}

const Ferrofluid: React.FC<FerrofluidProps> = ({
  className,
  dpr,
  paused = false,
  colors = ['#ffffff', '#ffffff', '#ffffff'],
  speed = 0.4,
  scale = 1.5,
  turbulence = 0.85,
  fluidity = 0.14,
  rimWidth = 0.22,
  sharpness = 2.4,
  shimmer = 1.1,
  glow = 2.0,
  flowDirection = 'down',
  opacity = 0.55,
  mouseInteraction = true,
  mouseStrength = 0.4,
  mouseRadius = 0.22,
  mouseDampening = 0.22,
  mixBlendMode
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const programRef = useRef<any>(null);
  const meshRef = useRef<any>(null);
  const geometryRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const uniformsRef = useRef<any>(null);
  const mouseTargetRef = useRef<[number, number]>([0, 0]);
  const lastTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(paused);
  const mouseDampeningRef = useRef<number>(mouseDampening);

  isPausedRef.current = paused;
  mouseDampeningRef.current = mouseDampening;

  // 1. Initialize WebGL ONCE on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use lower DPR cap (max 1.5) for silky 60-120fps with zero frame drops
    const targetDpr = dpr ?? Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5);
    const renderer = new Renderer({
      dpr: targetDpr,
      alpha: true,
      antialias: false, // Turn off heavy multisampling for lightning performance
      powerPreference: 'high-performance'
    });
    rendererRef.current = renderer;
    const gl = renderer.gl;
    const canvas = gl.canvas;
    gl.clearColor(0, 0, 0, 0);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    const { arr, count, avg } = prepColors(colors);

    const uniforms: any = {
      iResolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight, 1] },
      iMouse: { value: [gl.drawingBufferWidth * 0.5, gl.drawingBufferHeight * 0.5] },
      iTime: { value: 0 },
      uColor0: { value: arr[0] },
      uColor1: { value: arr[1] },
      uColor2: { value: arr[2] },
      uColor3: { value: arr[3] },
      uColor4: { value: arr[4] },
      uColor5: { value: arr[5] },
      uColor6: { value: arr[6] },
      uColor7: { value: arr[7] },
      uColorCount: { value: count },
      uMouseColor: { value: avg },
      uFlow: { value: flowVec(flowDirection) },
      uSpeed: { value: speed },
      uScale: { value: scale },
      uTurbulence: { value: turbulence },
      uFluidity: { value: fluidity },
      uRimWidth: { value: rimWidth },
      uSharpness: { value: sharpness },
      uShimmer: { value: shimmer },
      uGlow: { value: glow },
      uOpacity: { value: opacity },
      uMouseEnabled: { value: mouseInteraction ? 1 : 0 },
      uMouseStrength: { value: mouseStrength },
      uMouseRadius: { value: mouseRadius }
    };
    uniformsRef.current = uniforms;

    const program = new Program(gl, { vertex, fragment, uniforms });
    programRef.current = program;

    const geometry = new Triangle(gl);
    geometryRef.current = geometry;
    const mesh = new Mesh(gl, { geometry, program });
    meshRef.current = mesh;

    let resizeTimer: any = null;
    const resize = () => {
      if (!container || !renderer) return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      renderer.setSize(rect.width, rect.height);
      uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight, 1];
    };

    resize();
    const ro = new ResizeObserver(() => {
      if (resizeTimer) cancelAnimationFrame(resizeTimer);
      resizeTimer = requestAnimationFrame(resize);
    });
    ro.observe(container);

    // Mouse & Touch Pointer Tracking
    const onPointerMove = (e: MouseEvent | PointerEvent | TouchEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const sc = renderer.dpr || 1;
      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const x = (clientX - rect.left) * sc;
      const y = (rect.height - (clientY - rect.top)) * sc;
      mouseTargetRef.current = [x, y];
      if (mouseDampeningRef.current <= 0) {
        uniforms.iMouse.value = [x, y];
      }
    };

    // Mobile & Tablet Gyroscope / Device Orientation Effect
    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        const tiltX = Math.max(-1, Math.min(1, e.gamma / 45));
        const tiltY = Math.max(-1, Math.min(1, (e.beta - 40) / 45));
        uniforms.uFlow.value = [tiltX * 0.7, -tiltY * 0.7 - 0.3];
      }
    };

    if (mouseInteraction) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });
    }

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
    }

    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      uniforms.iTime.value = t * 0.001;
      const md = mouseDampeningRef.current;
      if (md > 0) {
        if (!lastTimeRef.current) lastTimeRef.current = t;
        const dt = (t - lastTimeRef.current) / 1000;
        lastTimeRef.current = t;
        const tau = Math.max(1e-4, md);
        let factor = 1 - Math.exp(-dt / tau);
        if (factor > 1) factor = 1;
        const target = mouseTargetRef.current;
        const cur = uniforms.iMouse.value;
        cur[0] += (target[0] - cur[0]) * factor;
        cur[1] += (target[1] - cur[1]) * factor;
      } else {
        lastTimeRef.current = t;
      }
      if (!isPausedRef.current && programRef.current && meshRef.current && rendererRef.current) {
        try {
          rendererRef.current.render({ scene: meshRef.current });
        } catch (e) {
          // ignore transient resize errors
        }
      }
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resizeTimer) cancelAnimationFrame(resizeTimer);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
        window.removeEventListener('deviceorientation', onDeviceOrientation);
      }
      ro.disconnect();
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
      const callIfFn = (obj: any, key: string) => {
        const fn = obj && obj[key];
        if (typeof fn === 'function') {
          fn.call(obj);
        }
      };
      callIfFn(programRef.current, 'remove');
      callIfFn(geometryRef.current, 'remove');
      callIfFn(meshRef.current, 'remove');
      callIfFn(rendererRef.current, 'destroy');
      programRef.current = null;
      geometryRef.current = null;
      meshRef.current = null;
      rendererRef.current = null;
      uniformsRef.current = null;
    };
  }, []); // Run ONCE on mount

  // 2. In-Place Uniform Updates (0ms latency, zero WebGL rebuild on theme change)
  useEffect(() => {
    if (!uniformsRef.current) return;
    const { arr, count, avg } = prepColors(colors);
    const u = uniformsRef.current;
    u.uColor0.value = arr[0];
    u.uColor1.value = arr[1];
    u.uColor2.value = arr[2];
    u.uColor3.value = arr[3];
    u.uColor4.value = arr[4];
    u.uColor5.value = arr[5];
    u.uColor6.value = arr[6];
    u.uColor7.value = arr[7];
    u.uColorCount.value = count;
    u.uMouseColor.value = avg;
    u.uOpacity.value = opacity;
    u.uGlow.value = glow;
    u.uSharpness.value = sharpness;
    u.uSpeed.value = speed;
    u.uTurbulence.value = turbulence;
    u.uFluidity.value = fluidity;
    u.uRimWidth.value = rimWidth;
    u.uShimmer.value = shimmer;
    u.uMouseStrength.value = mouseStrength;
    u.uMouseRadius.value = mouseRadius;
  }, [
    colors,
    opacity,
    glow,
    sharpness,
    speed,
    turbulence,
    fluidity,
    rimWidth,
    shimmer,
    mouseStrength,
    mouseRadius
  ]);

  return (
    <div
      ref={containerRef}
      className={`ferrofluid-container ${className ?? ''}`}
      style={{
        ...(mixBlendMode && { mixBlendMode })
      }}
    />
  );
};

export default Ferrofluid;
