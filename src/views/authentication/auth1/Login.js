// [MES] Login — Landing + Login combined page («จากแบบหล่อ สู่หน้างาน»).
// Mobile-first: login card above the fold, story below, CSS-only motion.
// Desktop fine-pointer: lazy GSAP cinematic layer (useLandingCinematics) —
// intro timeline, scroll reveals, custom cursor, magnetic button.
// Auth flow (AuthLogin + AuthContext) is untouched — UI shell only.
import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'src/contexts/AuthContext';
import PageContainer from 'src/components/container/PageContainer';
import { COMPONENT_STATUS } from 'src/components/mes/status-meta';
import AuthLogin from './AuthLogin';
import useLandingCinematics from './useLandingCinematics';
import videoBg from 'src/assets/videos/Gen-3_image-prompt_landing.mp4';

// Lifecycle stages shown on the landing strip (workflow order, no rejected).
// Labels come from status-meta (ADR-0006 rule 4); rendered in brand gold/muted
// only — status colors stay exclusive to StatusBadge and chart primitives.
const STAGES = ['planning', 'manufactured', 'transported', 'accepted', 'installed'].map(
  (key) => COMPONENT_STATUS[key],
);

const CHAPTERS = [
  {
    no: '01',
    title: 'ติดตามทุกชิ้นงาน เรียลไทม์',
    body: 'โครงการ → โซน → ชิ้นงาน ทุกชิ้นมีสถานะเป็นของตัวเอง อัปเดตจากหน้างานถึงแดชบอร์ดทันที ภาพรวมโครงการเปิดดูได้โดยไม่ต้องเข้าสู่ระบบ',
    cta: { to: '/dashboards/modern', label: 'เปิดแดชบอร์ดสาธารณะ' },
  },
  {
    no: '02',
    title: 'สแกน QR ที่หน้างาน',
    body: 'ชิ้นงานทุกชิ้นมี QR ประจำตัว สแกนด้วยมือถือเพื่อดูรายละเอียด อัปเดตสถานะ และพิมพ์บัตรชิ้นงานได้จากจุดติดตั้ง',
  },
  {
    no: '03',
    title: 'ใบสั่งซื้อครบวงจร',
    body: 'จัดการใบสั่งซื้อวัสดุตั้งแต่ฉบับร่างจนถึงรับของเข้าคลัง เชื่อมกับโครงการและติดตามสถานะได้ในที่เดียว',
  },
];

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rootRef = useRef(null);
  const { active, settled } = useLandingCinematics(rootRef);

  useEffect(() => {
    if (user) {
      navigate('/dashboards/modern', { replace: true });
    }
  }, [user, navigate]);

  const cineClass = active ? ` mes-cinematic${settled ? '' : ' mes-cine-prehide'}` : '';

  return (
    <PageContainer title="เข้าสู่ระบบ — SFC MES" description="SFC Precast MES — landing and login">
      <div ref={rootRef} className={`mes-landing relative min-h-dvh bg-mes-bg${cineClass}`}>
        {/* Cinematic-only background: video never loads on mobile/reduced-motion */}
        {active && (
          <>
            <video
              data-hero-video
              src={videoBg}
              autoPlay
              muted
              loop
              playsInline
              className="fixed inset-0 h-full w-full object-cover opacity-25"
            />
            <div className="fixed inset-0 bg-brand-navy/70" />
            <div
              data-mes-cursor
              className="pointer-events-none fixed left-0 top-0 z-50 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-gold opacity-0"
            />
          </>
        )}

        <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-x-20 lg:gap-y-14 lg:pt-24">
          {/* Hero — mobile position 1 / desktop left column */}
          <header className="mes-landing-rise">
            <p className="font-mono text-xs tracking-[0.3em] text-mes-muted">
              SFC PRECAST <span className="text-brand-gold">—</span> MES
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.3] sm:text-5xl xl:text-6xl">
              <span className="block overflow-hidden">
                <span data-hero-line className="block">
                  จากแบบหล่อ
                </span>
              </span>
              <span className="block overflow-hidden">
                <span data-hero-line className="block">
                  สู่หน้างาน<span className="text-brand-gold">.</span>
                </span>
              </span>
            </h1>
            <p data-hero-sub className="mt-4 max-w-xl text-sm text-mes-muted sm:text-base">
              ระบบติดตามการผลิต ขนส่ง และติดตั้งชิ้นส่วนคอนกรีตสำเร็จรูป — ทุกสถานะ ทุกชิ้นงาน
              ในที่เดียว
            </p>
          </header>

          {/* Login — mobile position 2 (above the fold) / desktop sticky right column */}
          <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div
              data-login-panel
              className="mes-landing-rise lg:sticky lg:top-24 [--rise-delay:0.1s]"
            >
              <div className="rounded-lg border border-mes-border bg-mes-surface/80 p-6 shadow-overlay backdrop-blur-md">
                <AuthLogin />
              </div>
            </div>
          </aside>

          {/* Story — mobile position 3 / desktop left column below hero */}
          <section data-story className="lg:col-start-1 lg:row-start-2">
            {/* Lifecycle strip — the MES workflow as the landing's signature motif */}
            <div className="mes-landing-rise [--rise-delay:0.2s]" aria-label="ขั้นตอนการติดตามชิ้นงาน">
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-5">
                {STAGES.map((stage, i) => (
                  <div
                    key={stage.key}
                    data-pipe-stage
                    className={`border-t-2 pt-2 ${
                      i === 0 ? 'border-brand-gold' : 'border-mes-border'
                    }`}
                  >
                    <div
                      className={`font-mono text-xs ${
                        i === 0 ? 'text-brand-gold' : 'text-mes-muted'
                      }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="mt-1 text-sm font-semibold">{stage.th}</div>
                  </div>
                ))}
              </div>
              <div data-pipe-track className="relative mt-6 h-px w-full bg-mes-border">
                <div
                  data-pipe-progress
                  className="absolute inset-0 origin-left scale-x-0 bg-brand-gold"
                />
              </div>
            </div>

            {/* Chapters */}
            <div className="mt-14 flex flex-col gap-12 lg:mt-20 lg:gap-16">
              {CHAPTERS.map((chapter) => (
                <article key={chapter.no} data-chapter className="max-w-xl">
                  <div className="font-mono text-xs tracking-[0.3em] text-brand-gold">
                    {chapter.no}
                  </div>
                  <h2 className="mt-2 text-xl font-bold sm:text-2xl">{chapter.title}</h2>
                  <p className="mt-2 text-sm text-mes-muted sm:text-base">{chapter.body}</p>
                  {chapter.cta && (
                    <Link
                      to={chapter.cta.to}
                      data-magnetic
                      className="mes-btn mes-btn-ghost mt-4 inline-flex"
                    >
                      {chapter.cta.label}
                      <span className="text-brand-gold" aria-hidden>
                        →
                      </span>
                    </Link>
                  )}
                </article>
              ))}
            </div>

            <footer className="mt-16 border-t border-mes-border pt-5 font-mono text-xs text-mes-muted lg:mt-20">
              SFC PRECAST — ระบบภายในสำหรับทีมผลิตและหน้างาน
            </footer>
          </section>
        </div>
      </div>
    </PageContainer>
  );
};

export default Login;
