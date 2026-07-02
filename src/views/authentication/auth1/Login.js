// [MES] Login — Landing + Login combined page («จากแบบหล่อ สู่หน้างาน»).
// Mobile-first: login card above the fold, story below, CSS-only motion.
// Desktop fine-pointer: lazy GSAP cinematic layer (useLandingCinematics) —
// intro timeline, scroll reveals, custom cursor, magnetic button.
// Auth flow (AuthLogin + AuthContext) is untouched — UI shell only.
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'src/contexts/AuthContext';
import PageContainer from 'src/components/container/PageContainer';
import { COMPONENT_STATUS } from 'src/components/mes/status-meta';
import { Donut } from 'src/components/mes/charts';
import { Spinner } from 'src/components/mes/ui';
import { fetchProjects, fetchComponentsByProjectId } from 'src/utils/api';
import { buildStatusFromComponents } from 'src/views/mes/dashboard/data';
import AuthLogin from './AuthLogin';
import useLandingCinematics from './useLandingCinematics';
import videoBg from 'src/assets/videos/Slow_cinematic_dolly_shot_in.mp4';
import videoPoster from 'src/assets/images/hero-poster.jpg';
import heroBgStatic from 'src/assets/images/hero-bg-static.jpg';
import profileCover from 'src/assets/images/profile-cover.jpg';

// Lifecycle stages shown on the landing strip (workflow order, no rejected).
// Labels come from status-meta (ADR-0006 rule 4); rendered in brand gold/muted
// only — status colors stay exclusive to StatusBadge and chart primitives.
const STAGES = ['planning', 'manufactured', 'transported', 'accepted', 'installed'].map(
  (key) => COMPONENT_STATUS[key],
);

// Hero headline pre-split into Thai words (no runtime segmentation) so the
// cinematic layer can give each word its own mass. Rest state renders
// identically to plain text — spans are inline-block with no styling of their own.
const HERO_LINES = [
  [{ text: 'จาก' }, { text: 'แบบหล่อ' }],
  [{ text: 'สู่' }, { text: 'หน้างาน', dot: true }],
];

// Company facts sourced from company-profile.pdf (repo root) — do not invent numbers.
const COMPANY_STATS = [
  { value: '2512', label: 'ก่อตั้งแสงฟ้าก่อสร้าง' },
  { value: '2552', label: 'เปิดโรงงานพรีคาสท์' },
  { value: '350', unit: 'ตร.ม./วัน', label: 'กำลังการผลิตสูงสุด' },
  { value: '380', unit: 'KSC', label: 'กำลังอัดคอนกรีต' },
];

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

const thNumber = new Intl.NumberFormat('th-TH');

// [MES] ProfileBookCard — e-book teaser for the hosted company profile.
// Real cover thumbnail tilts upright on hover; magnetic under the cinematic
// layer. Rendered twice: desktop company zone + mobile end-of-story.
const ProfileBookCard = ({ className = '' }) => (
  <a
    href="https://sfcmes.github.io/sangfahpc.com/"
    target="_blank"
    rel="noreferrer"
    className={`group flex items-center gap-4 rounded-lg border border-mes-border bg-mes-surface p-4 transition-colors duration-500 hover:border-brand-gold ${className}`}
  >
    <img
      src={profileCover}
      alt="ปก Company Profile — SFC Precast"
      className="w-14 shrink-0 -rotate-3 rounded-sm shadow-overlay transition-transform duration-500 ease-out motion-safe:group-hover:rotate-0 motion-safe:group-hover:scale-105"
    />
    <span className="min-w-0 flex-1">
      <span className="block font-mono text-[10px] tracking-[0.25em] text-mes-muted">
        COMPANY PROFILE — E-BOOK
      </span>
      <span className="mt-1 block text-sm font-semibold">รู้จักแสงฟ้าให้มากขึ้น</span>
      <span className="mt-1 block font-mono text-xs text-brand-gold">
        เปิดอ่านฉบับเต็ม{' '}
        <span
          aria-hidden
          className="inline-block transition-transform duration-500 ease-out motion-safe:group-hover:translate-x-1"
        >
          →
        </span>
      </span>
    </span>
  </a>
);

// [MES] PerfCard — flip card in the performance bento. Front: thin numeral +
// site name. Back (on click/tap): live per-status rings for that project,
// lazy-fetched on first flip. Flip + ring pop are CSS-only (mobile-safe);
// status colors render via the Donut chart primitive per ADR-0006.
const PerfCard = ({ site, featured = false }) => {
  const [flipped, setFlipped] = useState(false);
  const [status, setStatus] = useState(null); // null → 'loading' → status object

  const toggle = () => {
    setFlipped((f) => !f);
    if (status === null) {
      setStatus('loading');
      // Returns { precast, other } and never throws (api.js catches internally).
      fetchComponentsByProjectId(site.id).then((res) => {
        setStatus(buildStatusFromComponents(res));
      });
    }
  };

  const loaded = status !== null && status !== 'loading';
  const statusTotal = loaded
    ? Object.values(status).reduce((sum, v) => sum + v, 0)
    : 0;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={flipped}
      data-perf-card
      className={`mes-flip relative flex flex-col text-left ${
        featured
          ? 'min-h-[240px] sm:col-span-2 sm:row-span-2 sm:min-h-[360px]'
          : 'min-h-[190px]'
      }`}
    >
      <div className={`mes-flip-inner w-full flex-1 ${flipped ? 'is-flipped' : ''}`}>
        {/* Front */}
        <div
          className={`mes-flip-face flex h-full w-full flex-col justify-between rounded-lg border border-mes-border bg-mes-surface ${
            featured ? 'p-6 sm:p-8' : 'p-6'
          }`}
        >
          <div className="self-end text-right">
            <span
              className={
                featured
                  ? 'text-6xl font-normal tabular-nums sm:text-8xl'
                  : 'text-4xl font-normal tabular-nums'
              }
            >
              {thNumber.format(site.components)}
            </span>
            {featured && <span className="ml-2 font-mono text-xs text-mes-muted">ชิ้น</span>}
          </div>
          <div>
            <div className={featured ? 'text-lg font-semibold sm:text-xl' : 'text-sm font-semibold'}>
              {site.name}
            </div>
            <div className="mt-1 font-mono text-xs text-mes-muted">
              {featured ? 'ชิ้นงานที่ติดตามในโครงการนี้' : 'ชิ้นงาน'} · แตะดูสถานะ
            </div>
          </div>
        </div>

        {/* Back — mini status dashboard */}
        <div
          className={`mes-flip-back flex h-full w-full flex-col rounded-lg border border-mes-border bg-mes-surface ${
            featured ? 'p-6 sm:p-8' : 'p-4'
          }`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <div className={`truncate font-semibold ${featured ? 'text-lg' : 'text-xs'}`}>
              {site.name}
            </div>
            <div className="shrink-0 font-mono text-[10px] text-mes-muted">สถานะชิ้นงาน</div>
          </div>
          <div className="flex w-full flex-1 items-center">
            {loaded ? (
              <div className="grid w-full grid-cols-5 gap-1">
                {STAGES.map((stage, i) => {
                  const count = status[stage.key] || 0;
                  return (
                    <div
                      key={stage.key}
                      className="mes-flip-ring flex min-w-0 flex-col items-center gap-1"
                      style={{ '--ring-i': i }}
                    >
                      <Donut
                        size={featured ? 56 : 38}
                        thickness={featured ? 7 : 4}
                        segments={[
                          { value: count, cssVar: stage.cssVar },
                          { value: Math.max(statusTotal - count, 0), cssVar: '--mes-surface-2' },
                        ]}
                      >
                        <span className={`tabular-nums ${featured ? 'text-sm' : 'text-[10px]'}`}>
                          {thNumber.format(count)}
                        </span>
                      </Donut>
                      <span className="w-full truncate text-center font-mono text-[10px] text-mes-muted">
                        {stage.th}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              flipped && <Spinner label="กำลังโหลดสถานะ…" />
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rootRef = useRef(null);
  // Live numbers from the same public endpoint the dashboard uses — the
  // "เรียลไทม์" chapter proves itself. Stays null (blocks not rendered) on
  // failure or empty data; fetchProjects never throws.
  const [liveStats, setLiveStats] = useState(null);
  const { active, settled } = useLandingCinematics(rootRef, Boolean(liveStats));

  useEffect(() => {
    let mounted = true;
    fetchProjects().then((res) => {
      const projects = Array.isArray(res?.data) ? res.data : [];
      if (!mounted || projects.length === 0) return;
      const components = projects.reduce(
        (sum, p) => sum + (parseInt(p.components, 10) || 0),
        0,
      );
      // Performance bento: featured = biggest site (stable anchor); the four
      // small cards are a random draw from the rest, so each visit shows a
      // different mix of the customers we support.
      const sorted = projects
        .map((p) => ({
          id: p.id,
          name: p.name || p.project_code || '—',
          components: parseInt(p.components, 10) || 0,
        }))
        // ≥20 pieces: keeps small real customers, drops internal test projects
        // ("test", sample panels) from the public showcase.
        .filter((p) => p.components >= 20)
        .sort((a, b) => b.components - a.components);
      const pool = sorted.slice(1);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const top = sorted.length ? [sorted[0], ...pool.slice(0, 4)] : [];
      setLiveStats({ projects: projects.length, components, top });
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboards/modern', { replace: true });
    }
  }, [user, navigate]);

  const cineClass = active ? ` mes-cinematic${settled ? '' : ' mes-cine-prehide'}` : '';

  return (
    <PageContainer title="เข้าสู่ระบบ — SFC MES" description="SFC Precast MES — landing and login">
      <div ref={rootRef} className={`mes-landing relative min-h-dvh bg-mes-bg${cineClass}`}>
        {/* Static hero image for every non-cinematic context (phones, tablets,
            reduced-motion, GSAP failure) — 103KB, CSS-only, same scene as the video. */}
        {!active && (
          <>
            <img
              src={heroBgStatic}
              alt=""
              aria-hidden
              className="fixed inset-0 h-full w-full object-cover opacity-25"
            />
            <div className="fixed inset-0 bg-brand-navy opacity-50" />
          </>
        )}

        {/* Cinematic-only background: video never loads on mobile/reduced-motion.
            Video starts invisible — GSAP fades it to its barely-there level, a
            vignette pushes the edges into the page bg, and the veil dims the whole
            layer as the story scrolls in. */}
        {active && (
          <>
            <video
              data-hero-video
              src={videoBg}
              poster={videoPoster}
              autoPlay
              muted
              loop
              playsInline
              className="fixed inset-0 h-full w-full object-cover opacity-0"
            />
            <div className="fixed inset-0 bg-brand-navy opacity-20" />
            <div className="mes-hero-vignette fixed inset-0" aria-hidden />
            <div data-video-veil className="fixed inset-0 bg-mes-bg opacity-0" aria-hidden />
            <div
              data-mes-cursor
              className="pointer-events-none fixed left-0 top-0 z-50 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-gold opacity-0"
            />
          </>
        )}

        <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-x-20 lg:gap-y-14 lg:pt-24">
          {/* Hero — mobile position 1 / desktop left column.
              Each line is an overflow mask; words rise inside it individually. */}
          <header data-hero className="mes-landing-rise">
            <p className="font-mono text-xs tracking-[0.3em] text-mes-muted">
              SFC PRECAST <span className="text-brand-gold">—</span> MES
            </p>
            <h1 className="mt-6 text-5xl font-bold leading-[1.3] sm:text-6xl xl:text-7xl">
              {HERO_LINES.map((words, li) => (
                <span key={li} className="block overflow-hidden">
                  <span data-hero-line className="block">
                    {words.map((word) => (
                      <span key={word.text} data-hero-word className="inline-block">
                        {word.text}
                        {word.dot && (
                          <span className="text-brand-gold" aria-hidden>
                            .
                          </span>
                        )}
                      </span>
                    ))}
                  </span>
                </span>
              ))}
            </h1>
            <p data-hero-sub className="mt-6 max-w-xl text-sm text-mes-muted sm:text-base">
              ระบบติดตามการผลิต ขนส่ง และติดตั้งชิ้นส่วนคอนกรีตสำเร็จรูป — ทุกสถานะ ทุกชิ้นงาน
              ในที่เดียว
            </p>
          </header>

          {/* Login — mobile position 2 (above the fold) / desktop sticky right column */}
          <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div
              data-login-panel
              className="mes-landing-rise lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1 [--rise-delay:0.1s]"
            >
              <div className="mes-fill-surface-80 rounded-lg border border-mes-border p-6 shadow-overlay backdrop-blur-md">
                <AuthLogin />
              </div>

              {/* Company profile — fills the desktop right column below the card;
                  travels inside the sticky wrapper so it never collides with it.
                  Facts from company-profile.pdf. Desktop-only: mobile keeps the
                  login card tight above the story. */}
              <div className="mt-6 hidden lg:block">
                <p className="font-mono text-xs tracking-[0.3em] text-mes-muted">
                  SFC PRECAST CO., LTD.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-mes-muted">
                  โรงงานผลิตชิ้นส่วนคอนกรีตสำเร็จรูปในเครือแสงฟ้าก่อสร้าง — ดำเนินธุรกิจด้วยความ
                  «มุ่งมั่น และ ซื่อสัตย์» มาตั้งแต่ปี 2512
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
                  {COMPANY_STATS.map((stat) => (
                    <div key={stat.label} className="border-t border-mes-border pt-2">
                      <dt className="font-mono text-xs text-mes-muted">{stat.label}</dt>
                      <dd className="mt-1 text-xl font-bold">
                        {stat.value}
                        {stat.unit && (
                          <span className="ml-1 text-sm font-normal text-mes-muted">
                            {stat.unit}
                          </span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
                <ProfileBookCard className="mt-4" />
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
                      className={`mes-stage-no font-mono text-xs ${
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

            {/* Chapters — desktop reveals scrub with scroll; gold rule draws in */}
            <div className="mt-14 flex flex-col gap-12 lg:mt-24 lg:gap-24">
              {CHAPTERS.map((chapter) => (
                <article key={chapter.no} data-chapter className="max-w-xl">
                  <div data-chapter-rule className="mb-5 h-px w-16 bg-brand-gold opacity-70" aria-hidden />
                  <div className="font-mono text-xs tracking-[0.3em] text-brand-gold">
                    {chapter.no}
                  </div>
                  <h2 className="mt-2 text-xl font-bold sm:text-2xl">{chapter.title}</h2>
                  <p className="mt-2 text-sm text-mes-muted sm:text-base">{chapter.body}</p>
                  {chapter.no === '01' && liveStats && (
                    <div className="mt-6">
                      <p className="flex items-center gap-2 font-mono text-xs text-mes-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" aria-hidden />
                        ข้อมูลจริงจากระบบ
                      </p>
                      <div className="mt-3 flex gap-10">
                        <div>
                          <div className="text-4xl font-normal tabular-nums sm:text-5xl">
                            {thNumber.format(liveStats.projects)}
                          </div>
                          <div className="mt-2 font-mono text-xs text-mes-muted">
                            โครงการที่ติดตามอยู่
                          </div>
                        </div>
                        <div>
                          <div className="text-4xl font-normal tabular-nums sm:text-5xl">
                            {thNumber.format(liveStats.components)}
                          </div>
                          <div className="mt-2 font-mono text-xs text-mes-muted">
                            ชิ้นงานในระบบ
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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

            {/* Mobile-only: the company-profile e-book card lives in the desktop
                right column; phones get it at the end of the story instead. */}
            <ProfileBookCard className="mt-12 lg:hidden" />
          </section>
        </div>

        {/* Performance bento — real sites + component counts from the live API.
            Spans the full container below both columns; hidden entirely when the
            API has no data. Card sizes vary (featured 2x2, smalls, gold CTA). */}
        {liveStats?.top?.length > 0 && (
          <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-4 sm:px-8 lg:pt-12">
            <div data-perf-head className="max-w-2xl">
              <p className="flex items-center gap-2 font-mono text-xs tracking-[0.3em] text-mes-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" aria-hidden />
                OUR PERFORMANCE
              </p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                ผลงานที่พิสูจน์ได้ ทุกไซต์งาน
              </h2>
              <p className="mt-3 text-sm text-mes-muted sm:text-base">
                โครงการจริงของลูกค้าที่เราดูแล — ตัวเลขดึงจากระบบสด ณ เวลานี้
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Featured: largest site; smaller cards: random draw per visit.
                  Every card flips to a live per-status mini dashboard. */}
              <PerfCard site={liveStats.top[0]} featured />
              {liveStats.top.slice(1).map((site) => (
                <PerfCard key={site.id} site={site} />
              ))}

              {/* Gold accent card — the one full-color card (brand gold, navy ink) */}
              <Link
                to="/dashboards/modern"
                data-perf-card
                className="group flex min-h-[190px] rounded-lg bg-brand-gold text-brand-navy"
              >
                <span className="flex flex-1 flex-col justify-between p-6 transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-1">
                  <span className="font-mono text-xs">เปิดดูได้ ไม่ต้องเข้าสู่ระบบ</span>
                  <span className="text-lg font-bold">
                    เปิดแดชบอร์ดสาธารณะ{' '}
                    <span
                      aria-hidden
                      className="inline-block transition-transform duration-500 ease-out motion-safe:group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </span>
              </Link>
            </div>
          </section>
        )}

        <footer className="relative z-10 mx-auto w-full max-w-6xl border-t border-mes-border px-5 pb-10 pt-5 font-mono text-xs text-mes-muted sm:px-8">
          SFC PRECAST — ระบบภายในสำหรับทีมผลิตและหน้างาน
        </footer>
      </div>
    </PageContainer>
  );
};

export default Login;
