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
          const stages = gsap.utils.toArray('[data-pipe-stage]');
          const sub = root.querySelector('[data-hero-sub]');
          const track = root.querySelector('[data-pipe-track]');
          const panel = root.querySelector('[data-login-panel]');

          // Position intro targets while the CSS pre-hide keeps them at opacity 0.
          gsap.set(lines, { yPercent: 110 });
          gsap.set(stages, { y: 14 });
          if (sub) gsap.set(sub, { y: 16 });
          if (panel) gsap.set(panel, { x: 40 });

          const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            onComplete: () => {
              if (!settledRef.current) markSettled();
            },
          });
          tl.to(lines, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.12 })
            .to(sub, { y: 0, opacity: 1, duration: 0.6 }, '-=0.55')
            .to(stages, { y: 0, opacity: 1, duration: 0.5, stagger: 0.07 }, '-=0.45')
            .to(track, { opacity: 1, duration: 0.4 }, '<')
            .to(panel, { x: 0, opacity: 1, duration: 0.7 }, '-=0.55');

          // Intro is skippable: first scroll jumps it to its end state.
          const skipIntro = () => tl.progress(1);
          window.addEventListener('wheel', skipIntro, { once: true, passive: true });
          window.addEventListener('touchmove', skipIntro, { once: true, passive: true });
          teardowns.push(() => {
            window.removeEventListener('wheel', skipIntro);
            window.removeEventListener('touchmove', skipIntro);
          });

          // Scroll-linked reveals: chapters rise as they enter the viewport.
          gsap.utils.toArray('[data-chapter]').forEach((el) => {
            gsap.from(el, {
              opacity: 0,
              y: 40,
              duration: 0.7,
              ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 82%' },
            });
          });

          // Gold pipeline progress line scrubs with the story scroll.
          const story = root.querySelector('[data-story]');
          const progress = root.querySelector('[data-pipe-progress]');
          if (story && progress) {
            gsap.fromTo(
              progress,
              { scaleX: 0 },
              {
                scaleX: 1,
                ease: 'none',
                scrollTrigger: { trigger: story, start: 'top 75%', end: 'bottom bottom', scrub: true },
              },
            );
          }

          // Subtle video parallax over the full page scroll.
          const video = root.querySelector('[data-hero-video]');
          if (video) {
            gsap.to(video, {
              scale: 1.08,
              ease: 'none',
              scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
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
