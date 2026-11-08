import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

export const SKILLS: Record<string, string[]> = {
  Frontend: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'GSAP', 'Framer Motion', 'GraphQL'],
  'UI/UX': ['Figma', 'Prototyping', 'Design systems', 'User research', 'Wireframing', 'Accessibility', 'Motion design'],
  Backend: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'REST APIs', 'Supabase', 'Firebase'],
  Tools: ['Git', 'Vercel', 'Docker', 'Storybook', 'Jest', 'Notion', 'Slack'],
};

export const Skills: React.FC = () => {
  const [tab, setTab] = useState<string>('Frontend');
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gridRef.current?.children) {
      gsap.fromTo(
        gridRef.current.children,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease: 'power3.out' }
      );
    }
  }, [tab]);

  return (
    <div>
      <div className="tabs" role="tablist">
        {Object.keys(SKILLS).map((k) => (
          <button
            key={k}
            className="tab"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="skills" ref={gridRef}>
        {SKILLS[tab].map((s) => (
          <div className="sk" key={tab + s}>
            <b>{s[0]}</b>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
};
