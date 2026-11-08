import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Figure: React.FC = () => {
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
      const width = el.clientWidth || 400;
      const height = el.clientHeight || 500;
      const aspect = width / height;
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(32, aspect, 0.1, 50);
      cam.position.set(0, 0.2, aspect < 0.85 ? (10.6 / aspect) * 0.85 : 10.6);

      rd = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      rd.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rd.setSize(width, height);
      if ('outputColorSpace' in rd) {
        (rd as unknown as { outputColorSpace: string }).outputColorSpace = THREE.SRGBColorSpace;
      }
      rd.domElement.style.display = 'block';
      el.appendChild(rd.domElement);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x6a7088, 1.0));
      const dl = new THREE.DirectionalLight(0xffffff, 0.8);
      dl.position.set(3, 5, 6);
      scene.add(dl);

      const gl = new THREE.PointLight(0x4ea1ff, 0.9, 14);
      gl.position.set(-3.5, 1, 2.5);
      scene.add(gl);

      const rim = new THREE.PointLight(0x22d3ee, 1.2, 14);
      rim.position.set(3.5, 0, -3);
      scene.add(rim);

      // Gradient map for Toon shading
      const format = THREE.RedFormat;
      const gmap = new THREE.DataTexture(new Uint8Array([120, 190, 255]), 3, 1, format);
      gmap.minFilter = gmap.magFilter = THREE.NearestFilter;
      gmap.generateMipmaps = false;
      gmap.needsUpdate = true;

      const makeToon = (c: number, o?: THREE.MeshToonMaterialParameters) =>
        new THREE.MeshToonMaterial({ color: c, gradientMap: gmap, ...(o || {}) });

      const skin = makeToon(0xd49b76);
      const blush = makeToon(0xc9645f, { transparent: true, opacity: 0.3 });
      const white = makeToon(0xffffff);
      const iris = makeToon(0x6a4326);
      const dark = makeToon(0x120a08);
      const mouthM = makeToon(0x5a1f22);
      const brow = makeToon(0xf0ece4);
      const beard = makeToon(0xf0ece4);
      const capM = makeToon(0x1b2f52, { side: THREE.DoubleSide });
      const gold = makeToon(0xf2c53d);
      const jacket = makeToon(0x2f5b97);
      const trim = makeToon(0xf7f4ee);
      const pants = makeToon(0xe9e6df);
      const boot = makeToon(0x5a3a26);
      const belt = makeToon(0x3a2a20);

      [white, iris, dark, blush, mouthM].forEach((m) => (m.userData.no = true));

      const outlineMat = new THREE.MeshBasicMaterial({ color: 0x0a0a10, side: THREE.BackSide });

      const addPart = (
        par: THREE.Object3D,
        geo: THREE.BufferGeometry,
        mt: THREE.Material,
        x = 0,
        y = 0,
        z = 0,
        sx = 1,
        sy = 1,
        sz = 1
      ) => {
        const m = new THREE.Mesh(geo, mt);
        m.position.set(x, y, z);
        m.scale.set(sx, sy, sz);
        if (!mt.userData.no) {
          const o = new THREE.Mesh(geo, outlineMat);
          o.scale.setScalar(1.06);
          m.add(o);
        }
        par.add(m);
        return m;
      };

      const sp = (r: number, s = 28) => new THREE.SphereGeometry(r, s, Math.round(s * 0.75));
      const cy = (a: number, b: number, h: number) => new THREE.CylinderGeometry(a, b, h, 24, 1);

      const fig = new THREE.Group();
      scene.add(fig);

      // ---- Head (big cartoon)
      const head = new THREE.Group();
      head.position.set(0, 1.75, 0);
      head.scale.setScalar(1.3);
      fig.add(head);

      addPart(head, sp(0.38, 36), skin, 0, 0, 0, 0.97, 1, 0.97);

      const eyes: THREE.Group[] = [];
      [-1, 1].forEach((s) => {
        addPart(head, sp(0.065), skin, s * 0.37, -0.02, 0, 0.5, 1, 0.8);
        const eg = new THREE.Group();
        eg.position.set(s * 0.14, 0.03, 0.3);
        head.add(eg);
        eyes.push(eg);

        addPart(eg, sp(0.085), white, 0, 0, 0, 1, 1.15, 0.6);
        const ir = addPart(eg, sp(0.052), iris, s * -0.004, -0.004, 0.03, 1, 1.1, 0.5);
        addPart(ir, sp(0.03), dark, 0, 0, 0.02, 1, 1, 0.5);
        addPart(eg, sp(0.015), white, 0.018, 0.025, 0.062);
        addPart(head, new THREE.BoxGeometry(0.15, 0.035, 0.04), brow, s * 0.14, 0.15, 0.31).rotation.z = s * 0.18;
        addPart(head, sp(0.07), blush, s * 0.23, -0.1, 0.26, 1, 0.7, 0.35);
      });

      addPart(head, sp(0.07), skin, 0, -0.06, 0.375, 1.05, 0.95, 1);
      addPart(head, new THREE.CircleGeometry(0.09, 18, Math.PI, Math.PI), mouthM, 0, -0.115, 0.337);
      addPart(head, new THREE.BoxGeometry(0.12, 0.022, 0.01), white, 0, -0.125, 0.339);
      addPart(head, sp(0.27, 24), beard, 0, -0.3, 0.06, 1.05, 0.72, 0.85);
      [-1, 1].forEach((s) => {
        addPart(head, sp(0.12), beard, s * 0.2, -0.22, 0.15, 1, 1, 0.8);
        addPart(head, sp(0.075), beard, s * 0.06, -0.095, 0.36, 1.7, 0.5, 0.7);
      });
      addPart(head, sp(0.4, 24), beard, 0, -0.03, -0.07, 0.88, 1.08, 0.95);

      // Captain cap
      addPart(head, new THREE.CylinderGeometry(0.37, 0.37, 0.14, 28), capM, 0, 0.22, 0, 0.95, 1, 0.98);
      addPart(head, new THREE.CylinderGeometry(0.46, 0.38, 0.22, 28), capM, 0, 0.38, 0, 0.95, 1, 0.98);
      addPart(head, new THREE.CylinderGeometry(0.4, 0.4, 0.025, 24, 1, false, -Math.PI / 2, Math.PI), capM, 0, 0.15, 0, 0.98, 1, 1.35).rotation.x = 0.1;
      addPart(head, sp(0.055), gold, 0, 0.25, 0.38, 1.2, 1.2, 0.4);
      addPart(head, new THREE.TorusGeometry(0.385, 0.014, 6, 28), gold, 0, 0.29, 0, 0.95, 0.98, 1).rotation.x = Math.PI / 2;
      addPart(fig, cy(0.15, 0.17, 0.3), skin, 0, 1.1, 0);

      // ---- Body
      const tp = [
        [0, -0.95],
        [0.4, -0.95],
        [0.46, -0.7],
        [0.5, -0.2],
        [0.48, 0.3],
        [0.52, 0.6],
        [0.5, 0.8],
        [0.3, 0.92],
        [0.14, 0.96],
        [0, 0.97],
      ].map((p) => new THREE.Vector2(p[0], p[1]));

      const torso = addPart(fig, new THREE.LatheGeometry(tp, 36), jacket, 0, 0, 0, 1, 1, 0.75);
      addPart(fig, new THREE.TorusGeometry(0.26, 0.07, 12, 30), trim, 0, 0.92, 0, 1, 0.8, 1).rotation.x = Math.PI / 2;
      [[0.5], [0.15], [-0.2]].forEach((b) =>
        [-1, 1].forEach((s) => addPart(fig, sp(0.042), gold, s * 0.09, b[0], 0.385, 1, 1, 0.6))
      );
      addPart(fig, new THREE.TorusGeometry(0.5, 0.05, 8, 36), belt, 0, -0.55, 0, 1, 0.78, 1).rotation.x = Math.PI / 2;
      addPart(fig, new THREE.BoxGeometry(0.14, 0.12, 0.04), gold, 0, -0.55, 0.39);
      addPart(fig, sp(0.4), pants, 0, -0.85, 0, 1.18, 0.75, 0.85);

      // Arms
      const makeArm = (s: number) => {
        const g = new THREE.Group();
        g.position.set(s * 0.64, 0.7, 0);
        fig.add(g);
        addPart(g, sp(0.2), jacket, 0, 0, 0);
        addPart(g, cy(0.155, 0.125, 0.8), jacket, 0, -0.4, 0);
        const e2 = new THREE.Group();
        e2.position.y = -0.8;
        g.add(e2);
        addPart(e2, sp(0.125), jacket, 0, 0, 0);
        addPart(e2, cy(0.125, 0.105, 0.72), jacket, 0, -0.36, 0);
        addPart(e2, new THREE.TorusGeometry(0.115, 0.04, 8, 18), trim, 0, -0.72, 0).rotation.x = Math.PI / 2;
        addPart(e2, sp(0.125), skin, 0, -0.84, 0, 1, 1.1, 0.85);
        addPart(e2, sp(0.055), skin, -s * 0.1, -0.78, 0.07);
        return { g, el: e2 };
      };

      const aL = makeArm(-1);
      const aR = makeArm(1);

      // Legs
      [-1, 1].forEach((s) => {
        addPart(fig, cy(0.2, 0.17, 1.05), pants, s * 0.22, -1.5, 0);
        addPart(fig, sp(0.23), boot, s * 0.22, -2.13, 0.1, 1, 0.75, 1.5);
      });

      // Soft ground shadow
      const sc2 = document.createElement('canvas');
      sc2.width = sc2.height = 128;
      const sg = sc2.getContext('2d')!;
      const gr2 = sg.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr2.addColorStop(0, 'rgba(0,0,0,0.6)');
      gr2.addColorStop(1, 'rgba(0,0,0,0)');
      sg.fillStyle = gr2;
      sg.fillRect(0, 0, 128, 128);

      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 3.2),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc2), transparent: true, depthWrite: false })
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -2.33;
      scene.add(shadow);

      // Miniature website screen held by mascot
      const cv = document.createElement('canvas');
      cv.width = 640;
      cv.height = 400;
      const ctx2 = cv.getContext('2d')!;
      ctx2.fillStyle = '#060a14';
      ctx2.fillRect(0, 0, 640, 400);
      ctx2.fillStyle = '#0e1628';
      ctx2.fillRect(0, 0, 640, 36);
      ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
        ctx2.fillStyle = c;
        ctx2.beginPath();
        ctx2.arc(20 + i * 20, 18, 6, 0, 7);
        ctx2.fill();
      });
      ctx2.fillStyle = '#182340';
      ctx2.fillRect(110, 8, 420, 20);
      ctx2.fillStyle = '#8e8e96';
      ctx2.font = '12px sans-serif';
      ctx2.fillText('auravisuals.dev', 122, 22);
      ctx2.fillStyle = '#f1efea';
      ctx2.font = 'bold 54px Impact, sans-serif';
      ctx2.fillText('I CRAFT DIGITAL', 36, 120);
      ctx2.fillStyle = '#4ea1ff';
      ctx2.fillText('EXPERIENCES', 36, 176);
      ctx2.fillStyle = '#41547a';
      [0, 1, 2].forEach((i) => ctx2.fillRect(36, 200 + i * 14, 300 - i * 40, 6));
      ctx2.fillStyle = '#f1efea';
      ctx2.fillRect(36, 262, 120, 30);
      ctx2.fillStyle = '#16284a';
      ctx2.fillRect(420, 70, 190, 170);
      [0, 1, 2].forEach((i) => {
        ctx2.fillStyle = ['#1b3560', '#162646', '#223a66'][i];
        ctx2.fillRect(36 + i * 190, 316, 170, 70);
      });

      const tex = new THREE.CanvasTexture(cv);
      if ('colorSpace' in tex) {
        (tex as unknown as { colorSpace: string }).colorSpace = THREE.SRGBColorSpace;
      }

      const scr = new THREE.Group();
      scr.position.set(0, 0.25, 1.4);
      fig.add(scr);
      scr.add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.38), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })));
      scr.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(2.2, 1.38, 0.06)),
          new THREE.LineBasicMaterial({ color: 0x4ea1ff })
        )
      );

      // Rings + particles
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.9, 0.012, 8, 120),
        new THREE.MeshBasicMaterial({ color: 0x4ea1ff, transparent: true, opacity: 0.7 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -2.35;
      scene.add(ring);

      const ring2 = ring.clone();
      ring2.scale.setScalar(1.35);
      ring2.material = ring.material.clone();
      ring2.material.opacity = 0.25;
      scene.add(ring2);

      const N = 160;
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 7;
        pos[i + 1] = (Math.random() - 0.5) * 7;
        pos[i + 2] = (Math.random() - 0.5) * 4;
      }
      const pg = new THREE.BufferGeometry();
      pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(
        pg,
        new THREE.PointsMaterial({ color: 0xf1efea, size: 0.035, transparent: true, opacity: 0.6 })
      );
      scene.add(pts);

      let mx = 0;
      let my = 0;
      const onPointerMove = (e: PointerEvent) => {
        mx = (e.clientX / window.innerWidth) * 2 - 1;
        my = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener('pointermove', onPointerMove, { passive: true });

      const ro = new ResizeObserver(() => {
        if (!rd || !el) return;
        const w = el.clientWidth || 400;
        const h = el.clientHeight || 500;
        rd.setSize(w, h);
        const asp = w / h;
        cam.aspect = asp;
        cam.position.z = asp < 0.85 ? (10.6 / asp) * 0.85 : 10.6;
        cam.updateProjectionMatrix();
      });
      ro.observe(el);

      const io = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
      });
      io.observe(el);

      const clock = new THREE.Clock();
      let ry = 0;
      let hx = 0;
      let hy = 0;
      let t = 0;
      let ap = 0;
      let nb = 2.5;
      let bl = -1;

      const tick = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        if (!isVisible || document.hidden) {
          raf = requestAnimationFrame(tick);
          return;
        }
        t += dt;
        ap = Math.min(1, ap + dt * 1.1);
        const ease = 1 - Math.pow(1 - ap, 3);
        const k = 1 - Math.exp(-3.5 * dt);
        const b = Math.sin(t * 1.3) * 0.035;

        ry += (mx * 0.6 - ry) * k;
        hy += (mx * 0.5 - hy) * (1 - Math.exp(-6 * dt));
        hx += (my * 0.3 - hx) * (1 - Math.exp(-6 * dt));

        fig.scale.setScalar(0.7 + 0.3 * ease);
        fig.rotation.y = ry + Math.sin(t * 0.4) * 0.1 + (1 - ease) * -0.6;
        fig.position.y = Math.sin(t * 1.3) * 0.05;

        head.rotation.y = hy;
        head.rotation.x = hx;
        head.rotation.z = Math.sin(t * 0.9) * 0.035;
        head.position.y = 1.75 + Math.sin(t * 2.6 + 1) * 0.012;

        torso.scale.y = 1 + Math.sin(t * 1.8) * 0.012;

        aL.g.rotation.x = aR.g.rotation.x = -0.45 + b;
        aL.el.rotation.x = aR.el.rotation.x = -1.05 + b * 1.4;
        aL.g.rotation.z = 0.12;
        aR.g.rotation.z = -0.12;

        scr.rotation.y = Math.sin(t * 0.9) * 0.05;
        scr.position.y = 0.25 + Math.sin(t * 1.5) * 0.035;

        // Blinking eyes logic
        if (t > nb && bl < 0) {
          bl = 0;
          nb = t + 2.5 + Math.random() * 2.5;
        }
        let sy = 1;
        if (bl >= 0) {
          bl += dt * 9;
          sy = Math.max(0.08, Math.abs(Math.cos((bl * Math.PI) / 2)));
          if (bl >= 1) {
            bl = -1;
            sy = 1;
          }
        }
        eyes.forEach((g) => (g.scale.y = sy));

        shadow.scale.setScalar(1 - Math.sin(t * 1.3) * 0.03);
        ring.rotation.z = t * 0.4;
        ring2.rotation.z = -t * 0.25;
        pts.rotation.y = t * 0.05;
        gl.position.x = -3.5 + Math.sin(t * 0.7) * 1.2;

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
      console.error('WebGL Figure unavailable', e);
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
      aria-label="Bob, the cartoon sailor mascot, holding a website"
    />
  );
};
