// [MES] useLandingCinematics — lazy desktop-only GSAP layer for the landing/login page.
// Gates on fine pointer + ≥1024px + motion-safe, then dynamically imports GSAP so
// phones and reduced-motion users ship zero animation JS. Returns { active, settled }:
// `active` → render cinematic-only DOM (video, cursor dot); `settled` → intro finished
// (or GSAP failed to load) so the CSS pre-hide class can be dropped.
import { useEffect, useRef, useState } from 'react';

export const CINEMATIC_QUERY =
  '(pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)';

const matchesCinematic = () =>
  typeof window !== 'undefined' && window.matchMedia(CINEMATIC_QUERY).matches;

export default function useLandingCinematics(rootRef) {
  const [active, setActive] = useState(matchesCinematic);
  const [settled, setSettled] = useState(false);
  const settledRef = useRef(false);
  const markSettled = () => {
    settledRef.current = true;
    setSettled(true);
  };

  useEffect(() => {
    const mq = window.matchMedia(CINEMATIC_QUERY);
    const onChange = (e) => setActive(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!active || !rootRef.current) return undefined;

    let cancelled = false;
    let ctx;
    const teardowns = [];

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([gsapModule, stModule]) => {
        if (cancelled || !rootRef.current) return;
        const gsap = gsapModule.gsap || gsapModule.default;
        const ScrollTrigger = stModule.ScrollTrigger || stModule.default;
        gsap.registerPlugin(ScrollTrigger);
        const root = rootRef.current;

        ctx = gsap.context(() => {
          const lines = gsap.utils.toArray('[data-hero-line]');
          const words = gsap.utils.toArray('[data-hero-word]');
          const stages = gsap.utils.toArray('[data-pipe-stage]');
          const sub = root.querySelector('[data-hero-sub]');
          const track = root.querySelector('[data-pipe-track]');
          const panel = root.querySelector('[data-login-panel]');
          const hero = root.querySelector('[data-hero]');

          // Words launch from below the line masks with their own mass. The lines
          // just become visible (inline style overrides the CSS pre-hide) — the
          // masks stay put, only the words move.
          gsap.set(words, { yPercent: 120, rotate: 5, transformOrigin: '0% 100%' });
          gsap.set(lines, { opacity: 1 });
          gsap.set(stages, { y: 14 });
          if (sub) gsap.set(sub, { y: 24 });
          if (panel) gsap.set(panel, { x: 40 });

          const tl = gsap.timeline({
            defaults: { ease: 'power4.out' },
            onComplete: () => {
              if (!settledRef.current) markSettled();
            },
          });
          tl.to(words, { yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.09 })
            .to(sub, { y: 0, opacity: 1, duration: 0.9 }, '-=0.85')
            .to(stages, { y: 0, opacity: 1, duration: 0.7, stagger: 0.06 }, '-=0.75')
            .to(track, { opacity: 1, duration: 0.5 }, '<')
            .to(panel, { x: 0, opacity: 1, duration: 1 }, '-=0.8');

          // Intro is skippable: first scroll jumps it to its end state.
          const skipIntro = () => tl.progress(1);
          window.addEventListener('wheel', skipIntro, { once: true, passive: true });
          window.addEventListener('touchmove', skipIntro, { once: true, passive: true });
          teardowns.push(() => {
            window.removeEventListener('wheel', skipIntro);
            window.removeEventListener('touchmove', skipIntro);
          });

          // Hero hands off as the story scrolls in — scrubbed, reversible,
          // so the sections breathe into each other instead of stacking.
          if (hero) {
            gsap.to(hero, {
              yPercent: -10,
              opacity: 0.3,
              ease: 'none',
              scrollTrigger: { trigger: root, start: 'top top', end: '+=480', scrub: 0.5 },
            });
          }

          // Chapter reveals scrub with scroll position (not trigger-once):
          // body rises while its gold rule draws in, both reverse on scroll-back.
          gsap.utils.toArray('[data-chapter]').forEach((el) => {
            const rule = el.querySelector('[data-chapter-rule]');
            const ct = gsap.timeline({
              defaults: { ease: 'none' },
              // clamp() keeps the scrub range inside the scrollable area so
              // chapters near the page bottom still reach their end state.
              scrollTrigger: { trigger: el, start: 'clamp(top 96%)', end: 'clamp(top 58%)', scrub: 0.6 },
            });
            ct.fromTo(el, { opacity: 0, y: 64 }, { opacity: 1, y: 0 });
            if (rule) {
              ct.fromTo(rule, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1 }, 0.15);
            }
          });

          // Gold pipeline progress line scrubs with the story scroll and lights
          // each stage as it passes it (is-lit styles live in tokens.css).
          const story = root.querySelector('[data-story]');
          const progress = root.querySelector('[data-pipe-progress]');
          if (story && progress) {
            const lastIndex = Math.max(stages.length - 1, 1);
            gsap.fromTo(
              progress,
              { scaleX: 0 },
              {
                scaleX: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: story,
                  start: 'top 75%',
                  end: 'bottom bottom',
                  scrub: true,
                  onUpdate: (self) => {
                    stages.forEach((stage, i) => {
                      stage.classList.toggle('is-lit', self.progress >= i / lastIndex - 0.001);
                    });
                  },
                },
              },
            );
            teardowns.push(() => stages.forEach((stage) => stage.classList.remove('is-lit')));
          }

          // Video: fade in to barely-visible (never pops), slow parallax scale,
          // and a veil that dims the whole layer as the story takes over.
          const video = root.querySelector('[data-hero-video]');
          if (video) {
            gsap.to(video, { opacity: 0.16, duration: 1.8, ease: 'power2.inOut' });
            gsap.to(video, {
              scale: 1.08,
              ease: 'none',
              scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
            });
          }
          const veil = root.querySelector('[data-video-veil]');
          if (veil && story) {
            gsap.to(veil, {
              opacity: 0.55,
              ease: 'none',
              // Starts below the resting viewport so the hero video is undimmed
              // until the user actually scrolls into the story.
              scrollTrigger: { trigger: story, start: 'top 45%', end: 'clamp(top 8%)', scrub: 0.5 },
            });
          }

          // Custom gold-dot cursor. Hidden over the login panel (native cursor there).
          const dot = root.querySelector('[data-mes-cursor]');
          if (dot) {
            const xTo = gsap.quickTo(dot, 'x', { duration: 0.18, ease: 'power2.out' });
            const yTo = gsap.quickTo(dot, 'y', { duration: 0.18, ease: 'power2.out' });
            let dotShown = false;
            const onMove = (e) => {
              if (!dotShown) {
                dotShown = true;
                gsap.set(dot, { x: e.clientX, y: e.clientY });
                gsap.to(dot, { opacity: 1, duration: 0.2 });
              }
              xTo(e.clientX);
              yTo(e.clientY);
            };
            const onOver = (e) => {
              if (e.target.closest('[data-login-panel]')) {
                gsap.to(dot, { scale: 0, opacity: 0, duration: 0.2 });
              } else if (e.target.closest('a, button')) {
                gsap.to(dot, { scale: 2.4, opacity: 0.9, duration: 0.25 });
              } else {
                gsap.to(dot, { scale: 1, opacity: 1, duration: 0.25 });
              }
            };
            window.addEventListener('mousemove', onMove, { passive: true });
            document.addEventListener('mouseover', onOver, { passive: true });
            teardowns.push(() => {
              window.removeEventListener('mousemove', onMove);
              document.removeEventListener('mouseover', onOver);
            });
          }

          // Magnetic pull on the login submit button and any [data-magnetic] element.
          const magnets = gsap.utils.toArray(
            '[data-magnetic], [data-login-panel] button[type="submit"]',
          );
          magnets.forEach((el) => {
            const pullX = gsap.quickTo(el, 'x', { duration: 0.3, ease: 'power3.out' });
            const pullY = gsap.quickTo(el, 'y', { duration: 0.3, ease: 'power3.out' });
            const onMagnetMove = (e) => {
              const r = el.getBoundingClientRect();
              pullX((e.clientX - (r.left + r.width / 2)) * 0.3);
              pullY((e.clientY - (r.top + r.height / 2)) * 0.3);
            };
            const onMagnetLeave = () => {
              gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.45)' });
            };
            el.addEventListener('mousemove', onMagnetMove, { passive: true });
            el.addEventListener('mouseleave', onMagnetLeave);
            teardowns.push(() => {
              el.removeEventListener('mousemove', onMagnetMove);
              el.removeEventListener('mouseleave', onMagnetLeave);
            });
          });
        }, root);
      })
      .catch(() => {
        // GSAP failed to load — drop the pre-hide so the static page is fully visible.
        if (!cancelled) markSettled();
      });

    return () => {
      cancelled = true;
      teardowns.forEach((fn) => fn());
      if (ctx) ctx.revert();
    };
  }, [active, rootRef]);

  return { active, settled };
}
