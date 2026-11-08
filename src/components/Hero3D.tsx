import React, { useState, useEffect } from 'react';
import { Figure } from './Figure';
import { Globe } from './Globe';

export const Hero3D: React.FC = () => {
  const [mode, setMode] = useState<'figure' | 'globe'>('figure');

  useEffect(() => {
    // On small mobile screens, default to globe for lightweight footprint
    if (window.innerWidth <= 640) {
      setMode('globe');
    }
  }, []);

  return (
    <div className="portrait">
      {mode === 'figure' ? <Figure /> : <Globe />}
      <div className="badge">Digital craftsmanship</div>
      <button
        type="button"
        className="up"
        onClick={() => setMode((m) => (m === 'figure' ? 'globe' : 'figure'))}
        title="Toggle 3D View"
        aria-label="Toggle between 3D mascot and 3D globe"
      >
        <span>{mode === 'figure' ? 'View 3D Globe 🌐' : 'View 3D Mascot ✦'}</span>
      </button>
    </div>
  );
};
