import { useState, useEffect } from 'react';

/**
 * Typewriter effect — cycles through an array of strings.
 * Each string is typed forward, pauses, then deleted.
 */
export function useTypewriter(phrases, { typingSpeed = 70, deletingSpeed = 40, pause = 1800 } = {}) {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIndex];
    let timeout;

    if (!deleting && charIndex < current.length) {
      timeout = setTimeout(() => setCharIndex((c) => c + 1), typingSpeed);
    } else if (!deleting && charIndex === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIndex > 0) {
      timeout = setTimeout(() => setCharIndex((c) => c - 1), deletingSpeed);
    } else if (deleting && charIndex === 0) {
      setDeleting(false);
      setPhraseIndex((p) => (p + 1) % phrases.length);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pause]);

  useEffect(() => setText(phrases[phraseIndex].slice(0, charIndex)), [charIndex, phraseIndex, phrases]);

  return text;
}

/**
 * Parallax orb — returns {x, y} offset values based on mouse position.
 * multiplier controls how much the orb moves (0.02 = very subtle).
 */
export function useParallax(multiplier = 0.02) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setOffset({
        x: (e.clientX - cx) * multiplier,
        y: (e.clientY - cy) * multiplier,
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [multiplier]);

  return offset;
}
