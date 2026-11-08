import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Background } from './components/Background';
import { ScrollObject3D } from './components/ScrollObject3D';
import { Hero3D } from './components/Hero3D';
import { Magnetic } from './components/Magnetic';
import { Skills } from './components/Skills';

import formaImg from './images/project-forma.png';
import luxoraImg from './images/project-luxora.png';
import lumenImg from './images/project-lumen.png';
import logoImg from './images/logo.svg';

gsap.registerPlugin(ScrollTrigger);

interface Project {
  n: string;
  t: string;
  d: string;
  g: string;
  s: string[];
  image: string;
}

const PROJECTS: Project[] = [
  {
    n: 'Forma Studio',
    t: 'Where vision meets form.',
    d: 'A minimal portfolio for an architecture studio, focused on timeless design.',
    g: 'linear-gradient(135deg,#0b1224,#1d3a6e 60%,#050914)',
    s: ['Next.js', 'GSAP', 'Tailwind'],
    image: formaImg,
  },
  {
    n: 'Luxora',
    t: 'The new standard of luxury.',
    d: 'Luxury e-commerce experience with immersive product storytelling.',
    g: 'linear-gradient(135deg,#050914,#1a2a52 70%,#2e4f8f)',
    s: ['Next.js', 'React', 'Sanity'],
    image: luxoraImg,
  },
  {
    n: 'Lumen Finance',
    t: 'Invest with clarity.',
    d: 'Fintech landing page with interactive data visualizations and animations.',
    g: 'linear-gradient(135deg,#0d1f3a,#1f4f86)',
    s: ['Next.js', 'Chart.js', 'Framer Motion'],
    image: lumenImg,
  },
];

const VALUES: [string, string][] = [
  ['Pixel-perfect', 'I pay attention to every detail to ensure a refined and consistent user experience.'],
  ['Performance-driven', 'I write clean, optimized code that delivers fast load times and smooth interactions.'],
  ['User-centered', 'I design with empathy, focusing on real user needs and behaviors.'],
  ['Continuous learner', 'I stay curious and constantly explore new technologies and design trends.'],
];

export function App() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let onMouseMoveGlow: ((e: MouseEvent) => void) | undefined;
    let tickerCallback: (() => void) | undefined;

    const ctx = gsap.context(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      if (reduce) return;

      // Hero entrance timeline
      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .fromTo('.ln > span', { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.12 })
        .fromTo(
          '.hero .sm, .hero p, .btns, .stats',
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 },
          '-=0.7'
        )
        .fromTo(
          '.portrait',
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2 },
          '-=1.0'
        )
        .fromTo(
          '.badge',
          { scale: 0, rotation: -90 },
          { scale: 1, rotation: 0, duration: 0.9, ease: 'back.out(1.7)' },
          '-=0.5'
        );

      // Continuous slow badge rotation
      gsap.to('.badge', { rotation: 360, duration: 24, repeat: -1, ease: 'none' });

      // Parallax effect on portrait
      gsap.to('.pin', {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: '.portrait',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Animated stat counters
      gsap.utils.toArray<HTMLElement>('.num').forEach((el) => {
        const targetValue = +(el.dataset.to || '0');
        const state = { v: 0 };
        gsap.to(state, {
          v: targetValue,
          duration: 1.8,
          ease: 'power2.out',
          delay: 1,
          onUpdate: () => {
            el.textContent = Math.round(state.v).toString();
          },
        });
      });

      // Marquee that speeds up with scroll velocity
      const tw = gsap.to('.track', { xPercent: -50, duration: 22, repeat: -1, ease: 'none' });
      ScrollTrigger.create({
        onUpdate: (s) => {
          tw.timeScale(Math.min(1 + Math.abs(s.getVelocity()) / 400, 6));
        },
      });

      tickerCallback = () => {
        const k = tw.timeScale();
        if (k > 1) {
          tw.timeScale(Math.max(1, k * 0.96));
        }
      };
      gsap.ticker.add(tickerCallback);

      // Scroll reveals for section headings, cards, and list items
      gsap.utils.toArray<HTMLElement>('.sec h2').forEach((h) => {
        gsap.fromTo(
          h,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: h,
              start: 'top 85%',
              once: true,
            },
          }
        );
      });

      gsap.fromTo(
        '.card',
        { y: 70, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.grid',
            start: 'top 80%',
            once: true,
          },
        }
      );

      gsap.fromTo(
        '.about li',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.about ul',
            start: 'top 80%',
            once: true,
          },
        }
      );

      gsap.fromTo(
        '.cl a',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.8,
          scrollTrigger: {
            trigger: '.cl',
            start: 'top 85%',
            once: true,
          },
        }
      );

      // Refresh ScrollTrigger after initial render to compute accurate positions
      ScrollTrigger.refresh();

      // Smooth cursor glow tracking
      const gx = gsap.quickTo('.glow', 'x', { duration: 0.8 });
      const gy = gsap.quickTo('.glow', 'y', { duration: 0.8 });
      onMouseMoveGlow = (e: MouseEvent) => {
        gx(e.clientX);
        gy(e.clientY);
      };
      window.addEventListener('mousemove', onMouseMoveGlow);

      // Card 3D perspective tilt effect
      gsap.utils.toArray<HTMLElement>('.card').forEach((c) => {
        const onCardMove = (e: MouseEvent) => {
          const b = c.getBoundingClientRect();
          gsap.to(c, {
            rotationY: ((e.clientX - b.left) / b.width - 0.5) * 8,
            rotationX: -((e.clientY - b.top) / b.height - 0.5) * 8,
            transformPerspective: 800,
            duration: 0.4,
          });
        };

        const onCardLeave = () => {
          gsap.to(c, {
            rotationX: 0,
            rotationY: 0,
            duration: 0.6,
            ease: 'power2.out',
          });
        };

        c.addEventListener('mousemove', onCardMove);
        c.addEventListener('mouseleave', onCardLeave);
      });
    }, root);

    return () => {
      ctx.revert();
      if (onMouseMoveGlow) {
        window.removeEventListener('mousemove', onMouseMoveGlow);
      }
      if (tickerCallback) {
        gsap.ticker.remove(tickerCallback);
      }
    };
  }, []);

  const words = ['React', 'GSAP', 'Figma', 'Next.js', 'TypeScript', 'Tailwind', 'Motion', 'Design systems'];
  const marqueeItems = [...words, ...words].map((w, i) => (
    <span key={i}>
      {w} <i>✦</i>
    </span>
  ));

  return (
    <div ref={rootRef} className="app-root">
      <Background />
      <ScrollObject3D />
      <div className="glow" />

      <header>
        <div className="w">
          <a className="logo" href="#top" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <img src={logoImg} alt="Auravisuals logo" style={{ width: '24px', height: '24px', borderRadius: '6px' }} />
            AURAVISUALS
          </a>
          <nav>
            <a href="#work">Work</a>
            <a href="#skills">Skills</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <a className="pill" href="#contact">
            <i className="dot" />
            Available on Upwork
          </a>
        </div>
      </header>

      <main id="top">
        <section className="hero" id="hero">
          <div className="w hero-grid">
            <div className="hero-content">
              <span className="sm">Frontend developer &amp; UI/UX designer</span>
              <h1>
                <span className="ln">
                  <span>I craft digital</span>
                </span>
                <span className="ln">
                  <span className="grad">experiences</span>
                </span>
                <span className="ln">
                  <span>with purpose.</span>
                </span>
              </h1>
              <p>
                I design and build elegant, performant websites and web apps that merge aesthetics with engineering.
                Focused on user experience, driven by details.
              </p>
              <div className="btns">
                <Magnetic href="#work" className="btn">
                  View selected work <span>→</span>
                </Magnetic>
                <a className="link" href="#about">
                  About me
                </a>
              </div>
              <div className="stats">
                <div>
                  <b>
                    <span className="num" data-to="60">
                      0
                    </span>
                    +
                  </b>
                  <span>Projects delivered</span>
                </div>
                <div>
                  <b>
                    <span className="num" data-to="100">
                      0
                    </span>
                    %
                  </b>
                  <span>Job success on Upwork</span>
                </div>
                <div>
                  <b>
                    <span className="num" data-to="5">
                      0
                    </span>
                    +
                  </b>
                  <span>Years of experience</span>
                </div>
              </div>
            </div>
            <Hero3D />
          </div>
        </section>

        <div className="marq" aria-hidden="true">
          <div className="track">{marqueeItems}</div>
        </div>

        <section className="sec" id="work">
          <div className="w">
            <div className="sh">
              <h2>Featured projects</h2>
              <a className="link" href="#contact">
                Hire me for yours
              </a>
            </div>
            <div className="grid">
              {PROJECTS.map((p) => (
                <article className="card" key={p.n}>
                  <div className="thumb" style={{ '--g': p.g } as React.CSSProperties}>
                    <img src={p.image} alt={p.n} className="thumb-img" />
                    <span>{p.t}</span>
                  </div>
                  <div className="cb">
                    <h3>{p.n}</h3>
                    <p>{p.d}</p>
                    <div className="tags">
                      {p.s.map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" id="skills">
          <div className="w">
            <div className="sh">
              <h2>Tech stack &amp; skills</h2>
              <p className="sm" style={{ maxWidth: 300, margin: 0 }}>
                A strong foundation in modern technologies and tools to build scalable, high-performance digital
                products.
              </p>
            </div>
            <Skills />
          </div>
        </section>

        <section className="sec" id="about">
          <div className="w about">
            <div>
              <h2>Design is intelligence made visible.</h2>
              <p style={{ marginTop: 24 }}>
                I’m a frontend developer and UI/UX designer with a passion for building digital products that are not
                only beautiful but also functional, accessible, and human-centered.
              </p>
              <p>
                With a background in design and a deep love for code, I bridge the gap between aesthetic vision and
                technical execution.
              </p>
            </div>
            <ul>
              {VALUES.map(([title, desc]) => (
                <li key={title}>
                  <b>{title}</b>
                  <span>{desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="sec" id="contact">
          <div className="w contact">
            <div>
              <h2>Let’s build something exceptional together.</h2>
              <p style={{ color: 'var(--mu)', margin: '22px 0 28px', maxWidth: 360 }}>
                Have a project in mind? Send an invite on Upwork or reach out directly. I reply within 24 hours.
              </p>
              <Magnetic href="mailto:hello@auravisuals.dev" className="btn">
                Get in touch <span>→</span>
              </Magnetic>
            </div>
            <div className="cl">
              <a href="mailto:hello@auravisuals.dev">
                Email <span>hello@auravisuals.dev</span>
              </a>
              <a href="https://upwork.com" target="_blank" rel="noopener noreferrer">
                Upwork <span>upwork.com/freelancers/auravisuals</span>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                GitHub <span>github.com/auravisuals</span>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                LinkedIn <span>linkedin.com/in/auravisuals</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="w">
          <span>AURAVISUALS © 2026. All rights reserved.</span>
          <span>Privacy policy · Terms of use</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
