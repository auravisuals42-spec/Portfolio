import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface MagneticProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const Magnetic: React.FC<MagneticProps> = ({ href, children, className }) => {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(hover:none)').matches) return;

    const onMouseMove = (e: MouseEvent) => {
      const b = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - b.left - b.width / 2) * 0.3,
        y: (e.clientY - b.top - b.height / 2) * 0.4,
        duration: 0.4,
        ease: 'power2.out',
      });
    };

    const onMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.4)',
      });
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <a ref={ref} href={href} className={className}>
      {children}
    </a>
  );
};
