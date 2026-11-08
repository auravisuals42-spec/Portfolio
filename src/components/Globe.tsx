import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const LAND: Record<number, number[][]> = {
  1: [[22, 26]],
  2: [[10, 19], [22, 26], [38, 58]],
  3: [[3, 5], [7, 20], [22, 26], [30, 34], [35, 58]],
  4: [[2, 5], [6, 20], [23, 25], [30, 33], [34, 58]],
  5: [[5, 20], [28, 36], [37, 57]],
  6: [[6, 19], [28, 37], [38, 55]],
  7: [[9, 20], [28, 37], [38, 55]],
  8: [[9, 19], [28, 37], [38, 52], [54, 54]],
  9: [[9, 18], [27, 36], [37, 41], [42, 52]],
  10: [[10, 16], [27, 38], [38, 41], [42, 44], [45, 52]],
  11: [[12, 15], [27, 38], [39, 40], [42, 44], [47, 50]],
  12: [[13, 15], [27, 38], [42, 43], [47, 50]],
  13: [[16, 20], [28, 37], [47, 49]],
  14: [[16, 22], [30, 37], [48, 55]],
  15: [[16, 23], [31, 38], [48, 56]],
  16: [[16, 23], [31, 38], [49, 52], [55, 56]],
  17: [[17, 23], [31, 38], [51, 55]],
  18: [[17, 22], [31, 37], [39, 39], [49, 56]],
  19: [[17, 22], [31, 37], [49, 56]],
  20: [[18, 21], [32, 36], [50, 56]],
  21: [[19, 21], [52, 55], [58, 59]],
  22: [[19, 21], [58, 58]],
  23: [[19, 20]],
  26: [[0, 59]],
  27: [[0, 59]],
  28: [[0, 59]],
  29: [[0, 59]],
};

const isLand = (lat: number, lon: number): boolean => {
  const r = Math.floor((90 - lat) / 6);
  const c = Math.floor(((lon + 180) % 360) / 6);
  const rs = LAND[r];
  return !!rs && rs.some((a) => c >= a[0] && c <= a[1]);
};

export const Globe: React.FC = () => {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    let raf: number;
    let rd: THREE.WebGLRenderer | undefined;
    let cleanup: (() => void) | undefined;
    let isVisible = true;

    try {
      const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      const pr = Math.min(window.devicePixelRatio, 2);
      const R = 2;

      const scene = new THREE.Scene();
      const width = el.clientWidth || 300;
      const height = el.clientHeight || 300;
      const aspect = width / height;
      const cam = new THREE.PerspectiveCamera(40, aspect, 0.1, 50);
      cam.position.z = aspect < 1 ? (7.4 / aspect) * 0.95 : 7.4;

      rd = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rd.setPixelRatio(pr);
      rd.setSize(width, height);
      rd.domElement.style.display = 'block';
      el.appendChild(rd.domElement);

      const globe = new THREE.Group();
      scene.add(globe);

      // Dotted continents
      const N = 9000;
      const P: number[] = [];
      const C: number[] = [];
      const S: number[] = [];
      const cL = new THREE.Color(0x4ea1ff);
      const cO = new THREE.Color(0x1f3f86);

      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2;
        const rad = Math.sqrt(1 - y * y);
        const th = i * 2.399963;
        const x = Math.cos(th) * rad;
        const z = Math.sin(th) * rad;
        const lat = (Math.asin(y) * 180) / Math.PI;
        let lon = (Math.atan2(z, -x) * 180) / Math.PI - 180;
        lon = ((lon + 540) % 360) - 180;

        const land = isLand(lat, lon);
        if (!land && i % 3) continue;

        P.push(x * R, y * R, z * R);
        const c = land ? cL : cO;
        C.push(c.r, c.g, c.b);
        S.push(land ? 1 : 0.55);
      }

      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      gg.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      gg.setAttribute('aS', new THREE.Float32BufferAttribute(S, 1));

      const gm = new THREE.ShaderMaterial({
        uniforms: { uK: { value: 20 * pr } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          uniform float uK;
          attribute vec3 color;
          attribute float aS;
          varying vec3 vC;
          varying float vA;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uK * aS / -mv.z;
            vC = color;
            vA = aS > 0.8 ? 1.0 : 0.4;
          }
        `,
        fragmentShader: `
          varying vec3 vC;
          varying float vA;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            gl_FragColor = vec4(vC, vA * (1.0 - d * 1.6));
          }
        `,
      });

      globe.add(new THREE.Points(gg, gm));

      // Inner sphere and outer glow atmosphere
      scene.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(R * 0.985, 48, 36),
          new THREE.MeshBasicMaterial({ color: 0x050a16 })
        )
      );

      scene.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(R * 1.16, 48, 36),
          new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.BackSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexShader: `
              varying vec3 vN;
              void main() {
                vN = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              varying vec3 vN;
              void main() {
                float i = pow(max(0.72 - dot(vN, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
                gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * i * 1.7;
              }
            `,
          })
        )
      );

      // Cities + arcs connecting from Delhi
      const toVec3 = (lat: number, lon: number, r: number) => {
        const ph = ((90 - lat) * Math.PI) / 180;
        const th = ((lon + 180) * Math.PI) / 180;
        return new THREE.Vector3(
          -r * Math.sin(ph) * Math.cos(th),
          r * Math.cos(ph),
          r * Math.sin(ph) * Math.sin(th)
        );
      };

      const hub: [number, number] = [28.6, 77.2];
      const cities: [number, number][] = [
        [40.7, -74],
        [51.5, 0],
        [25.2, 55.3],
        [1.3, 103.8],
        [35.7, 139.7],
        [-33.9, 151.2],
        [-23.5, -46.6],
        [37.8, -122.4],
      ];

      const arcs: { curve: THREE.QuadraticBezierCurve3; pk: THREE.Mesh; o: number }[] = [];
      const marks: { rg: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; i: number }[] = [];

      const makeMarker = (c: [number, number], i: number) => {
        const p = toVec3(c[0], c[1], R * 1.005);
        const d = new THREE.Mesh(
          new THREE.SphereGeometry(0.045, 12, 10),
          new THREE.MeshBasicMaterial({ color: 0x7dd3fc })
        );
        d.position.copy(p);
        globe.add(d);

        const rg = new THREE.Mesh(
          new THREE.RingGeometry(0.06, 0.075, 28),
          new THREE.MeshBasicMaterial({
            color: 0x4ea1ff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        rg.position.copy(p);
        rg.lookAt(p.clone().multiplyScalar(2));
        globe.add(rg);
        marks.push({ rg, i });
        return p;
      };

      const a = makeMarker(hub, 0);
      cities.forEach((c, i) => {
        const b = makeMarker(c, i + 1);
        const mid = a
          .clone()
          .add(b)
          .multiplyScalar(0.5)
          .normalize()
          .multiplyScalar(R + a.distanceTo(b) * 0.42);
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        globe.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)),
            new THREE.LineBasicMaterial({ color: 0x4ea1ff, transparent: true, opacity: 0.5 })
          )
        );
        const pk = new THREE.Mesh(
          new THREE.SphereGeometry(0.035, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        globe.add(pk);
        arcs.push({ curve, pk, o: i * 0.13 });
      });

      // Orbit ring + satellite
      const orb = new THREE.Group();
      orb.rotation.set(1.2, 0, 0.4);
      scene.add(orb);
      orb.add(
        new THREE.Mesh(
          new THREE.TorusGeometry(R * 1.45, 0.006, 6, 160),
          new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.5 })
        )
      );
      const sat = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.08),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee })
      );
      orb.add(sat);

      let mx = 0;
      let my = 0;
      const onPointerMove = (e: PointerEvent) => {
        mx = (e.clientX / window.innerWidth) * 2 - 1;
        my = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener('pointermove', onPointerMove, { passive: true });

      const ro = new ResizeObserver(() => {
        if (!rd || !el) return;
        const w = el.clientWidth || 300;
        const h = el.clientHeight || 300;
        rd.setSize(w, h);
        const asp = w / h;
        cam.aspect = asp;
        cam.position.z = asp < 1 ? (7.4 / asp) * 0.95 : 7.4;
        cam.updateProjectionMatrix();
      });
      ro.observe(el);

      const io = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
      });
      io.observe(el);

      const clock = new THREE.Clock();
      let ry = 0;
      let rx = 0;
      let t = 0;
      let ap = 0;
      const base = -((78 + 90) * Math.PI) / 180;

      const tick = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        if (!isVisible || document.hidden) {
          raf = requestAnimationFrame(tick);
          return;
        }
        t += dt;
        ap = Math.min(1, ap + dt * 0.8);
        const ease = 1 - Math.pow(1 - ap, 3);
        const k = 1 - Math.exp(-3 * dt);
        ry += (mx * 0.5 - ry) * k;
        rx += (my * 0.3 - rx) * k;

        globe.rotation.y = base + t * 0.12 + ry + (1 - ease) * -2.2;
        globe.rotation.x = 0.38 + rx;
        globe.scale.setScalar(0.6 + 0.4 * ease);

        arcs.forEach((r) => r.pk.position.copy(r.curve.getPoint((t * 0.13 + r.o) % 1)));
        marks.forEach((m) => {
          const f = (t * 0.7 + m.i * 0.31) % 1;
          m.rg.scale.setScalar(1 + f * 2.4);
          m.rg.material.opacity = 0.8 * (1 - f);
        });

        sat.position.set(Math.cos(t * 0.5) * R * 1.45, Math.sin(t * 0.5) * R * 1.45, 0);

        rd?.render(scene, cam);
        if (!reduce) {
          raf = requestAnimationFrame(tick);
        }
      };

      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('pointermove', onPointerMove);
        ro.disconnect();
        io.disconnect();
        rd?.dispose();
      };
    } catch (e) {
      console.error('WebGL Globe unavailable', e);
    }

    return () => {
      cleanup?.();
      if (rd?.domElement?.parentNode) {
        rd.domElement.parentNode.removeChild(rd.domElement);
      }
    };
  }, []);

  return (
    <div
      className="pin has"
      ref={boxRef}
      role="img"
      aria-label="Animated 3D globe with connections around the world"
    />
  );
};
