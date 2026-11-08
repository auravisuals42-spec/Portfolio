import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const ScrollObject3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAboutActive, setIsAboutActive] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [activeAboutTab, setActiveAboutTab] = useState<'story' | 'philosophy' | 'stack'>('story');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf: number;
    let renderer: THREE.WebGLRenderer | undefined;
    let cleanup: (() => void) | undefined;

    try {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      const width = window.innerWidth;
      const height = window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0, 7.5);

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      const pointLight1 = new THREE.PointLight(0x4ea1ff, 1.8, 20);
      pointLight1.position.set(4, 4, 4);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0x22d3ee, 1.4, 20);
      pointLight2.position.set(-4, -3, 3);
      scene.add(pointLight2);

      // --- 3D SCROLL ARTIFACT GROUP (TRANSLUCENT / HOLOGRAPHIC) ---
      const artifact = new THREE.Group();
      scene.add(artifact);

      // 1. Outer Geodesic Shell (Transparent Icosahedron Wireframe)
      const outerGeo = new THREE.IcosahedronGeometry(0.65, 0);
      const outerMat = new THREE.MeshBasicMaterial({
        color: 0x4ea1ff,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);
      artifact.add(outerMesh);

      // 2. Middle Octahedron Shell (Transparent Wireframe)
      const midGeo = new THREE.OctahedronGeometry(0.48, 0);
      const midMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const midMesh = new THREE.Mesh(midGeo, midMat);
      artifact.add(midMesh);

      // 3. Inner Glowing Pulsing Energy Core (Translucent Wireframe Sphere)
      const coreGeo = new THREE.IcosahedronGeometry(0.24, 1);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      artifact.add(coreMesh);

      // 4. Orbiting Quantum Rings (Subtle & Semi-transparent)
      const ringGeo1 = new THREE.TorusGeometry(0.9, 0.01, 8, 80);
      const ringMat1 = new THREE.MeshBasicMaterial({
        color: 0x4ea1ff,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
      ring1.rotation.x = Math.PI / 3;
      artifact.add(ring1);

      const ringGeo2 = new THREE.TorusGeometry(0.78, 0.008, 8, 80);
      const ringMat2 = new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
      ring2.rotation.y = Math.PI / 4;
      artifact.add(ring2);

      // 5. Orbiting energy particles (Delicate stardust)
      const particleCount = 60;
      const pPositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        const rad = 0.8 + Math.random() * 0.6;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;
        pPositions[i] = rad * Math.cos(phi) * Math.cos(theta);
        pPositions[i + 1] = rad * Math.sin(phi);
        pPositions[i + 2] = rad * Math.cos(phi) * Math.sin(theta);
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0x7dd3fc,
        size: 0.03,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const particles = new THREE.Points(pGeo, pMat);
      artifact.add(particles);

      // Mouse tracking
      let mouseX = 0;
      let mouseY = 0;
      const onPointerMove = (e: PointerEvent) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      window.addEventListener('pointermove', onPointerMove, { passive: true });

      const onResize = () => {
        if (!renderer) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);

      // ScrollTrigger for smooth vertical positioning
      let targetProgress = 0;
      let smoothProgress = 0;
      let inAboutSection = false;

      const stGlobal = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          targetProgress = self.progress;
          setScrollProgress(Math.round(self.progress * 100));
        },
      });

      // Dedicated ScrollTrigger tied directly to the #about section
      // Ensures the About card ONLY activates when viewing #about, never over the projects
      const stAbout = ScrollTrigger.create({
        trigger: '#about',
        start: 'top 65%',
        end: 'bottom 25%',
        onEnter: () => {
          inAboutSection = true;
          if (window.innerWidth > 860) {
            setIsAboutActive(true);
          }
        },
        onLeave: () => {
          inAboutSection = false;
          setIsAboutActive(false);
        },
        onEnterBack: () => {
          inAboutSection = true;
          if (window.innerWidth > 860) {
            setIsAboutActive(true);
          }
        },
        onLeaveBack: () => {
          inAboutSection = false;
          setIsAboutActive(false);
        },
      });

      const clock = new THREE.Clock();

      const tick = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        const time = clock.getElapsedTime();

        // Smooth scroll interpolation
        smoothProgress += (targetProgress - smoothProgress) * (1 - Math.exp(-6 * dt));

        // Position along the screen:
        // Stays in the middle horizontally (x=0), moves from top to bottom
        const baseY = 1.4 - smoothProgress * 3.2;
        const floatY = Math.sin(time * 2.2) * 0.05;
        artifact.position.y = baseY + floatY;

        // Subtle lateral sway and tilt responding to mouse
        artifact.position.x += (mouseX * 0.25 - artifact.position.x) * (1 - Math.exp(-4 * dt));
        artifact.rotation.x += (mouseY * 0.15 - artifact.rotation.x) * (1 - Math.exp(-4 * dt));

        // Rotations: Continuous spin
        outerMesh.rotation.x += 0.35 * dt;
        outerMesh.rotation.y += 0.5 * dt;

        midMesh.rotation.x -= 0.4 * dt;
        midMesh.rotation.z += 0.6 * dt;

        ring1.rotation.z += 0.7 * dt;
        ring2.rotation.x += 0.5 * dt;

        particles.rotation.y = time * 0.2;

        // Interactive expansion when in About section with mobile-aware scaling
        const isSmall = window.innerWidth <= 860;
        const targetScale = inAboutSection ? (isSmall ? 0.8 : 1.25) : (isSmall ? 0.55 : 1.0);
        const targetCorePulse = 0.24 + (inAboutSection ? Math.sin(time * 4) * 0.03 : Math.sin(time * 2) * 0.015);

        artifact.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
        coreMesh.scale.setScalar(targetCorePulse / 0.24);

        if (inAboutSection) {
          outerMat.opacity = isSmall ? 0.09 : 0.32;
          midMat.opacity = isSmall ? 0.06 : 0.24;
          coreMat.opacity = isSmall ? 0.10 : 0.38;
        } else {
          outerMat.opacity = isSmall ? 0.06 : 0.18;
          midMat.opacity = isSmall ? 0.04 : 0.14;
          coreMat.opacity = isSmall ? 0.07 : 0.22;
        }

        renderer?.render(scene, camera);

        if (!reduceMotion) {
          raf = requestAnimationFrame(tick);
        }
      };

      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        stGlobal.kill();
        stAbout.kill();
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('resize', onResize);
        renderer?.dispose();
      };
    } catch (e) {
      console.error('ScrollObject3D unavailable', e);
    }

    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="scroll-object-layer"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{
        display: 'block',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        opacity: isAboutActive ? 0.75 : 0.38,
        transition: 'opacity 0.6s ease',
      }}
      />

      {/* Floating Scroll Indicator HUD (subtle & transparent) */}
      <div
        className="scroll-hud"
        style={{
          position: 'fixed',
          left: '50%',
          top: '32px',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '5px 14px',
          borderRadius: '99px',
          background: 'rgba(6, 10, 20, 0.45)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(78, 161, 255, 0.18)',
          fontSize: '11px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#8896b4',
          zIndex: 15,
          opacity: scrollProgress > 4 && scrollProgress < 98 ? 0.7 : 0,
          transition: 'opacity 0.4s ease',
        }}
      >
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: '#38bdf8',
            boxShadow: '0 0 6px #38bdf8',
          }}
        />
        <span>Artifact Sync: {scrollProgress}%</span>
      </div>

      {/* REVEALED ABOUT HUD CARD: Appears only in #about section with translucent glassmorphic styling */}
      <div
        className={`about-portal-card ${isAboutActive && !isDismissed ? 'active' : ''}`}
        style={{
          position: 'fixed',
          left: '50%',
          bottom: '36px',
          transform: `translateX(-50%) translateY(${isAboutActive && !isDismissed ? '0' : '40px'})`,
          opacity: isAboutActive && !isDismissed ? 1 : 0,
          pointerEvents: isAboutActive && !isDismissed ? 'auto' : 'none',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          maxWidth: '540px',
          width: 'calc(100% - 36px)',
          padding: '22px 26px',
          borderRadius: '20px',
          background: 'rgba(11, 19, 37, 0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(78, 161, 255, 0.25)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), 0 0 25px rgba(78, 161, 255, 0.12)',
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#4ea1ff',
                boxShadow: '0 0 8px #4ea1ff',
              }}
            />
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '15px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#4ea1ff',
              }}
            >
              ✦ About Core Unlocked
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: '#8896b4' }}>AURAVISUALS BIO</span>
            <button
              onClick={() => setIsDismissed(true)}
              aria-label="Minimize About card"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#8896b4',
                cursor: 'pointer',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                lineHeight: 1,
                padding: 0,
                transition: 'all 0.2s',
              }}
              title="Minimize"
            >
              ×
            </button>
          </div>
        </div>

        {/* Interactive Tabs inside the About Object Card */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {(['story', 'philosophy', 'stack'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setActiveAboutTab(tabKey)}
              style={{
                background: activeAboutTab === tabKey ? 'rgba(78, 161, 255, 0.25)' : 'rgba(26, 38, 64, 0.4)',
                border: `1px solid ${activeAboutTab === tabKey ? '#4ea1ff' : 'rgba(26, 38, 64, 0.6)'}`,
                color: activeAboutTab === tabKey ? '#e8eefc' : '#8896b4',
                padding: '5px 13px',
                borderRadius: '99px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'capitalize',
              }}
            >
              {tabKey}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#e8eefc', minHeight: '62px' }}>
          {activeAboutTab === 'story' && (
            <p style={{ margin: 0 }}>
              Hi, I’m <strong>Auravisuals</strong>—a specialized frontend developer &amp; UI/UX designer. I merge
              computational precision with cinematic 3D storytelling to create unforgettable digital flagships and high-conversion web apps.
            </p>
          )}
          {activeAboutTab === 'philosophy' && (
            <p style={{ margin: 0 }}>
              <strong>Design is intelligence made visible.</strong> Every millisecond of motion, 3D interaction, and typography choice is designed with purpose to deliver maximum speed, accessibility, and emotional resonance.
            </p>
          )}
          {activeAboutTab === 'stack' && (
            <p style={{ margin: 0 }}>
              <strong>Core Technologies:</strong> React 19, TypeScript, Three.js, WebGL GLSL Shaders, GSAP Motion, Tailwind CSS, Next.js, and modern Figma design systems.
            </p>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(26, 38, 64, 0.6)',
            fontSize: '11.5px',
          }}
        >
          <span style={{ color: '#8896b4' }}>5+ Years Exp · 60+ Projects · 100% Upwork Score</span>
          <a
            href="#contact"
            style={{
              color: '#4ea1ff',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Let's Talk <span>→</span>
          </a>
        </div>
      </div>

      {/* Minimized Pill if user dismissed the card while in #about */}
      {isAboutActive && isDismissed && (
        <button
          className="about-portal-pill"
          onClick={() => setIsDismissed(false)}
          style={{
            position: 'fixed',
            left: '50%',
            bottom: '28px',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            borderRadius: '99px',
            background: 'rgba(11, 19, 37, 0.75)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(78, 161, 255, 0.35)',
            color: '#4ea1ff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            zIndex: 30,
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#4ea1ff',
              boxShadow: '0 0 6px #4ea1ff',
            }}
          />
          ✦ Reopen About Core
        </button>
      )}
    </div>
  );
};
