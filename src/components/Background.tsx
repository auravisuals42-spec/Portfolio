import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Background: React.FC = () => {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    let raf: number;
    let rd: THREE.WebGLRenderer | undefined;
    let cleanup: (() => void) | undefined;

    try {
      const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      const small = window.innerWidth <= 860;
      const pr = Math.min(window.devicePixelRatio, small ? 1.25 : 1.5);
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
      cam.position.set(0, 2, 10);

      rd = new THREE.WebGLRenderer({ antialias: !small, alpha: true });
      rd.setPixelRatio(pr);
      rd.setSize(window.innerWidth, window.innerHeight);
      el.appendChild(rd.domElement);

      const G = small ? 36 : 80;
      const sp = 42 / G;
      const gp = new Float32Array(G * G * 3);
      for (let i = 0; i < G; i++) {
        for (let j = 0; j < G; j++) {
          const k = (i * G + j) * 3;
          gp[k] = (i - G / 2) * sp;
          gp[k + 1] = 0;
          gp[k + 2] = (j - G / 2) * sp - 8;
        }
      }

      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.BufferAttribute(gp, 3));
      const gm = new THREE.ShaderMaterial({
        uniforms: {
          t: { value: 0 },
          uK: { value: (small ? 0.05 : 0.07) * window.innerHeight * 0.866 * pr },
        },
        transparent: true,
        depthWrite: false,
        vertexShader: `
          uniform float t;
          uniform float uK;
          varying float vA;
          void main() {
            vec3 p = position;
            p.y = sin(p.x * 0.4 + t) * 0.5 + cos(p.z * 0.4 + t * 0.8) * 0.5;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uK / -mv.z;
            vA = clamp(1.0 - (-mv.z) / 30.0, 0.0, 1.0) * ${small ? '0.45' : '0.75'};
          }
        `,
        fragmentShader: `
          varying float vA;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            gl_FragColor = vec4(0.31, 0.63, 1.0, vA * (1.0 - d * 1.6));
          }
        `,
      });

      const grid = new THREE.Points(gg, gm);
      grid.position.y = -4;
      grid.frustumCulled = false;
      scene.add(grid);

      const geos = [
        new THREE.IcosahedronGeometry(small ? 0.7 : 1, 0),
        new THREE.OctahedronGeometry(small ? 0.7 : 1, 0),
        new THREE.TorusGeometry(small ? 0.55 : 0.8, small ? 0.18 : 0.25, 8, 20),
      ];
      const shapes: THREE.Mesh[] = [];
      const numShapes = small ? 3 : 10;
      for (let i = 0; i < numShapes; i++) {
        const m = new THREE.Mesh(
          geos[i % 3],
          new THREE.MeshBasicMaterial({
            color: small ? (i % 2 ? 0x38bdf8 : 0x2563eb) : (i % 2 ? 0xf1efea : 0x4ea1ff),
            wireframe: true,
            transparent: true,
            opacity: small ? 0.07 : 0.2,
          })
        );
        m.position.set(
          (Math.random() - 0.5) * (small ? 16 : 28),
          (Math.random() - 0.5) * (small ? 14 : 18),
          -5 - Math.random() * (small ? 8 : 12)
        );
        m.scale.setScalar(small ? (0.6 + Math.random() * 0.6) : (0.8 + Math.random() * 1.6));
        m.userData.s = 0.1 + Math.random() * 0.25;
        scene.add(m);
        shapes.push(m);
      }

      let mx = 0;
      let sc = 0;
      const onPointerMove = (e: PointerEvent) => {
        mx = (e.clientX / window.innerWidth) * 2 - 1;
      };
      window.addEventListener('pointermove', onPointerMove, { passive: true });

      const onResize = () => {
        if (!rd) return;
        rd.setSize(window.innerWidth, window.innerHeight);
        cam.aspect = window.innerWidth / window.innerHeight;
        cam.updateProjectionMatrix();
        gm.uniforms.uK.value = 0.07 * window.innerHeight * 0.866 * pr;
      };
      window.addEventListener('resize', onResize);

      const clock = new THREE.Clock();
      let t = 0;

      const tick = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        if (document.hidden) {
          raf = requestAnimationFrame(tick);
          return;
        }
        t += dt;
        gm.uniforms.t.value = t;

        const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
        const tg = window.scrollY / maxScroll;
        sc += (tg - sc) * (1 - Math.exp(-3.5 * dt));

        cam.position.x += (mx * 1.5 - cam.position.x) * (1 - Math.exp(-2.5 * dt));
        cam.position.y = 2 - sc * 5;
        cam.position.z = 10 - sc * 8;
        cam.lookAt(0, -1, -8);
        cam.rotation.z += sc * 0.25;

        shapes.forEach((m) => {
          m.rotation.x += m.userData.s * 0.6 * dt;
          m.rotation.y += m.userData.s * 0.85 * dt;
        });

        rd?.render(scene, cam);
        if (!reduce) {
          raf = requestAnimationFrame(tick);
        }
      };

      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('resize', onResize);
        rd?.dispose();
      };
    } catch (e) {
      console.error('WebGL background unavailable', e);
    }

    return () => {
      cleanup?.();
      if (rd?.domElement?.parentNode) {
        rd.domElement.parentNode.removeChild(rd.domElement);
      }
    };
  }, []);

  return <div className="bg" ref={boxRef} aria-hidden="true" />;
};
