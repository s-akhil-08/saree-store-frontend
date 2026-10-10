import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import './GradientWaves.css';

export interface GradientWavesProps {
  horizonColor?: string;
  waveColor?: string;
  crestColor?: string;
  speed?: number;
  amplitude?: number;
  waveScale?: number;
  waveRatio?: number;
  swell?: number;
  turbulence?: number;
  tilt?: number;
  zoom?: number;
  height?: number;
  fogDepth?: number;
  detail?: 'low' | 'medium' | 'high';
  brightness?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  parallaxStrength?: number;
  grain?: boolean;
  grainIntensity?: number;
  className?: string;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const detailToSteps = (detail: string): number => {
  if (detail === 'low') return 40.0;
  if (detail === 'high') return 110.0;
  return 70.0;
};

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaveScale;
uniform float uWaveRatio;
uniform float uSwell;
uniform float uTurbulence;
uniform float uTilt;
uniform float uZoom;
uniform float uHeight;
uniform float uFogDepth;
uniform float uSteps;
uniform float uBrightness;
uniform float uOpacity;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec2 uMouse;
uniform float uParallax;
uniform bool uEnableMouse;
uniform vec3 uHorizonColor;
uniform vec3 uWaveColor;
uniform vec3 uCrestColor;
out vec4 fragColor;

const float MAX_DIST = 20000.0;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float plasma(vec3 r, vec2 freq, vec4 tc) {
  float mx = r.x + tc.x;
  mx += uSwell * sin((r.y + mx) / 20.0 + tc.y);
  float my = r.y - tc.z;
  my += uTurbulence * cos(r.x / 23.0 + tc.w);
  return r.z - (sin(mx * freq.x) * uAmplitude + sin(my * freq.y) * uAmplitude + uHeight);
}

float raymarch(vec3 pos, vec3 dir, vec2 freq, vec4 tc) {
  float dist = 0.0;
  for (int i = 0; i < 128; i++) {
    if (float(i) >= uSteps) break;
    float dscene = plasma(pos + dist * dir, freq, tc);
    if (abs(dscene) < 0.1) break;
    dist += 0.9 * dscene;
    if (!(abs(dist) < MAX_DIST)) return MAX_DIST;
  }
  return dist;
}

void main() {
  float T = iTime * uSpeed;
  vec2 freq = vec2(uWaveScale / 7.0, (uWaveScale * uWaveRatio) / 3.0);
  vec4 tc = vec4(T / 0.130, T / 0.810, T / 0.200, T / 0.710);
  float c, s;
  float vfov = (3.14159 / 2.3) / max(uZoom, 0.05);
  vec3 cam = vec3(0.0, 0.0, 30.0);
  vec2 uv = (gl_FragCoord.xy / iResolution.xy) - 0.5;
  uv.x *= iResolution.x / iResolution.y;
  uv.y *= -1.0;

  vec3 dir = vec3(0.0, 0.0, -1.0);
  float ulen = length(uv);
  float xrot = vfov * ulen;
  c = cos(xrot); s = sin(xrot);
  dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  vec2 nuv = ulen > 1e-5 ? uv / ulen : vec2(1.0, 0.0);
  c = nuv.x; s = nuv.y;
  dir = mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0) * dir;
  c = cos(uTilt); s = sin(uTilt);
  dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;

  if (uEnableMouse) {
    float yaw = (uMouse.x - 0.5) * uParallax * 0.4;
    float pitch = (uMouse.y - 0.5) * uParallax * 0.4;
    c = cos(yaw); s = sin(yaw);
    dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;
    c = cos(pitch); s = sin(pitch);
    dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  }

  float dist = raymarch(cam, dir, freq, tc);
  vec3 pos = cam + dist * dir;

  float t = clamp(uFogDepth / max(dist, 0.001), 0.0, 1.0);
  vec3 body = mix(uWaveColor, uCrestColor, clamp(pos.z * 0.08 + 0.5, 0.0, 1.0));
  vec3 col = mix(uHorizonColor, body, t);
  col *= uBrightness;
  col = clamp(col, 0.0, 1.0);

  float alpha = clamp(t, 0.0, 1.0) * uOpacity;
  if (uGrain > 0.5) {
    float g = hash21(gl_FragCoord.xy + mod(iTime, 64.0) * 11.0);
    alpha += (g - 0.5) * uGrainIntensity;
  }
  alpha = clamp(alpha, 0.0, 1.0);
  fragColor = vec4(col * alpha, alpha);
}
`;

interface ContextEntry {
  renderer: Renderer;
  program: Program;
  mesh: Mesh;
}

const ctxMap = new WeakMap<HTMLDivElement, ContextEntry>();

export default function GradientWaves({
  horizonColor = '#5227FF',
  waveColor = '#FF9FFC',
  crestColor = '#FFFFFF',
  speed = 0.4,
  amplitude = 2.5,
  waveScale = 0.6,
  waveRatio = 0.9,
  swell = 35,
  turbulence = 20,
  tilt = 1.11,
  zoom = 1.0,
  height = 5.5,
  fogDepth = 15,
  detail = 'medium',
  brightness = 1.0,
  opacity = 1.0,
  mouseInteraction = true,
  parallaxStrength = 0.5,
  grain = true,
  grainIntensity = 0.05,
  className = '',
}: GradientWavesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const enableMouseRef = useRef(mouseInteraction);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobileOrTablet = typeof window !== 'undefined' && (
      'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || window.innerWidth < 1024
    );
    const maxDpr = isMobileOrTablet ? 1.25 : 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    const renderer = new Renderer({
      webgl: 2,
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      dpr,
    });

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uSpeed: { value: 0.4 },
        uAmplitude: { value: 2.5 },
        uWaveScale: { value: 0.6 },
        uWaveRatio: { value: 0.9 },
        uSwell: { value: 35 },
        uTurbulence: { value: 20 },
        uTilt: { value: 1.11 },
        uZoom: { value: 1.0 },
        uHeight: { value: 5.5 },
        uFogDepth: { value: 15 },
        uSteps: { value: isMobileOrTablet ? 55.0 : 70.0 },
        uBrightness: { value: 1.0 },
        uOpacity: { value: 1.0 },
        uGrain: { value: 1.0 },
        uGrainIntensity: { value: 0.05 },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uParallax: { value: 0.5 },
        uEnableMouse: { value: true },
        uHorizonColor: { value: new Float32Array([1, 1, 1]) },
        uWaveColor: { value: new Float32Array([1, 1, 1]) },
        uCrestColor: { value: new Float32Array([1, 1, 1]) },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctxMap.set(container, { renderer, program, mesh });

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      renderer.setSize(w, h);
      const res = program.uniforms.iResolution.value as Float32Array;
      res[0] = gl.drawingBufferWidth;
      res[1] = gl.drawingBufferHeight;
      renderer.render({ scene: mesh });
    };

    let resizeRaf: number | null = null;
    const handleResize = () => {
      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(setSize);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    setSize();

    const currentMouse = [0.5, 0.5];
    const targetMouse = [0.5, 0.5];

    // --- Gyroscope / Water-Slosh State ---
    let rawGyroX = 0;          // left–right tilt  (gamma)
    let rawGyroY = 0;          // front–back tilt  (beta)
    let smoothGyroX = 0;
    let smoothGyroY = 0;
    let gyroVelX = 0;          // momentum / velocity for slosh
    let gyroVelY = 0;
    let prevRawX = 0;
    let prevRawY = 0;
    let hasGyroData = false;
    const baseTilt = tilt;     // capture prop value so we can offset it dynamically

    const handlePointerLocation = (clientX: number, clientY: number) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      targetMouse[0] = Math.max(0, Math.min(1, clientX / w));
      targetMouse[1] = Math.max(0, Math.min(1, 1.0 - clientY / h));
    };

    const onPointerMove = (e: PointerEvent) => {
      handlePointerLocation(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        handlePointerLocation(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    // ── Water-Slosh Gyroscope Handler ──────────────────────────────────────
    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;

      let gx = e.gamma; // left–right tilt [-90, 90]
      let gy = e.beta;  // front–back tilt [-180, 180]

      // Adapt axes for landscape mode
      const orientationAngle =
        (window.screen?.orientation?.angle) ??
        (typeof window.orientation === 'number' ? (window.orientation as number) : 0);

      if (orientationAngle === 90) {
        const tmp = gx; gx = -gy; gy = tmp;
      } else if (orientationAngle === -90 || orientationAngle === 270) {
        const tmp = gx; gx = gy; gy = -tmp;
      } else if (orientationAngle === 180) {
        gx = -gx; gy = -gy;
      }

      // Stronger sensitivity: /18 instead of /28, bias beta around neutral ~30°
      rawGyroX = Math.max(-1, Math.min(1, gx / 18));
      rawGyroY = Math.max(-1, Math.min(1, (gy - 28) / 18));

      // Compute velocity (delta) — used for slosh "kick" momentum
      gyroVelX = rawGyroX - prevRawX;
      gyroVelY = rawGyroY - prevRawY;
      prevRawX = rawGyroX;
      prevRawY = rawGyroY;

      hasGyroData = true;
    };

    // iOS 13+ requires explicit permission for DeviceOrientationEvent
    const requestGyroPermission = async () => {
      const DOE = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (typeof DOE.requestPermission === 'function') {
        try {
          const result = await DOE.requestPermission();
          if (result === 'granted') {
            window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
          }
        } catch {
          window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
        }
      } else {
        window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      if (isMobileOrTablet) {
        // trigger on first user touch so iOS permission prompt can fire
        const onFirstTouch = () => {
          requestGyroPermission();
          window.removeEventListener('touchstart', onFirstTouch);
        };
        window.addEventListener('touchstart', onFirstTouch, { passive: true });
        // Also try immediately (works on Android without permission)
        window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
      } else {
        window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('orientationchange', handleResize, { passive: true });
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.addEventListener('change', handleResize);
      }
    }

    let raf = 0;
    let isVisible = true;
    let isPageVisible = !document.hidden;
    const t0 = performance.now();

    // LERP speed: faster on mobile for snappy water-slosh feel
    const lerpSpeed = isMobileOrTablet ? 0.14 : 0.085;

    const loop = (t: number) => {
      program.uniforms.iTime.value = (t - t0) * 0.001;

      if (hasGyroData) {
        // Two-stage filter:
        // 1. Fast response (alpha 0.22) to feel responsive to quick tilts
        // 2. Add velocity kick × 0.35 for slosh overshoot/momentum feel
        smoothGyroX += 0.22 * (rawGyroX - smoothGyroX) + gyroVelX * 0.35;
        smoothGyroY += 0.22 * (rawGyroY - smoothGyroY) + gyroVelY * 0.35;

        // Clamp to [-1, 1] to prevent runaway
        smoothGyroX = Math.max(-1, Math.min(1, smoothGyroX));
        smoothGyroY = Math.max(-1, Math.min(1, smoothGyroY));

        // Map to mouse uniform (0–1 range, centered at 0.5)
        // Use 0.95 multiplier so full tilt = almost full parallax sweep
        targetMouse[0] = 0.5 + smoothGyroX * 0.95;
        targetMouse[1] = 0.5 + smoothGyroY * 0.95;

        // Dynamically shift uTilt so the wave horizon tilts with the device
        const tiltOffset = smoothGyroX * 0.18; // up to ~10° of horizon lean
        program.uniforms.uTilt.value = baseTilt + tiltOffset;
      }

      const tx = enableMouseRef.current ? targetMouse[0] : 0.5;
      const ty = enableMouseRef.current ? targetMouse[1] : 0.5;
      currentMouse[0] += lerpSpeed * (tx - currentMouse[0]);
      currentMouse[1] += lerpSpeed * (ty - currentMouse[1]);
      const mouseUniform = program.uniforms.uMouse.value as Float32Array;
      mouseUniform[0] = currentMouse[0];
      mouseUniform[1] = currentMouse[1];
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };

    const tryStart = () => {
      if (isVisible && isPageVisible && raf === 0) raf = requestAnimationFrame(loop);
    };
    const tryStop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        isVisible ? tryStart() : tryStop();
      },
      { threshold: 0 }
    );
    io.observe(container);

    const onVisibility = () => {
      isPageVisible = !document.hidden;
      isPageVisible ? tryStart() : tryStop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    tryStart();

    return () => {
      tryStop();
      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onTouchMove);
      if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
        window.removeEventListener('deviceorientation', onDeviceOrientation);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('orientationchange', handleResize);
        if (window.screen && window.screen.orientation) {
          window.screen.orientation.removeEventListener('change', handleResize);
        }
      }
      ctxMap.delete(container);
      try {
        container.removeChild(canvas);
      } catch {}
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ctx = ctxMap.get(container);
    if (!ctx) return;
    const { program } = ctx;
    const u = program.uniforms;

    enableMouseRef.current = mouseInteraction;

    u.uSpeed.value = speed;
    u.uAmplitude.value = amplitude;
    u.uWaveScale.value = waveScale;
    u.uWaveRatio.value = waveRatio;
    u.uSwell.value = swell;
    u.uTurbulence.value = turbulence;
    u.uTilt.value = tilt;
    u.uZoom.value = zoom;
    u.uHeight.value = height;
    u.uFogDepth.value = fogDepth;
    u.uSteps.value = detailToSteps(detail);
    u.uBrightness.value = brightness;
    u.uOpacity.value = opacity;
    u.uGrain.value = grain ? 1.0 : 0.0;
    u.uGrainIntensity.value = grainIntensity;
    u.uParallax.value = parallaxStrength;
    u.uEnableMouse.value = mouseInteraction;

    const hc = u.uHorizonColor.value as Float32Array;
    const wc = u.uWaveColor.value as Float32Array;
    const cc = u.uCrestColor.value as Float32Array;
    const h = hexToRgb(horizonColor);
    const w = hexToRgb(waveColor);
    const cr = hexToRgb(crestColor);
    hc[0] = h[0];
    hc[1] = h[1];
    hc[2] = h[2];
    wc[0] = w[0];
    wc[1] = w[1];
    wc[2] = w[2];
    cc[0] = cr[0];
    cc[1] = cr[1];
    cc[2] = cr[2];
  }, [
    horizonColor,
    waveColor,
    crestColor,
    speed,
    amplitude,
    waveScale,
    waveRatio,
    swell,
    turbulence,
    tilt,
    zoom,
    height,
    fogDepth,
    detail,
    brightness,
    opacity,
    grain,
    grainIntensity,
    mouseInteraction,
    parallaxStrength,
  ]);

  return <div ref={containerRef} className={`gradient-waves-container ${className}`.trim()} />;
}
