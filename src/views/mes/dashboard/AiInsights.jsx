// [MES] AiInsights — AI risk & defect analysis cards (auth-gated, ADR-0003 locked for guests)
import { useState, useEffect, useCallback } from 'react';
import { Icon } from 'src/components/mes/Icon';
import { StatusBadge } from 'src/components/mes/StatusBadge';
import { Spinner } from 'src/components/mes/ui';
import { AiLockedState } from 'src/components/mes/ai/AiLockedState';
import { fetchAiRiskAnalysis, fetchAiDefectAnalysis } from 'src/utils/api';
import { fmt } from 'src/components/mes/status-meta';

// Card frame shared by both insight panels — mes-card + inline header (mirrors
// RightPanel's card structure). A min-height keeps the guest lock overlay and
// the loading spinner centred consistently across both cards.
function CardFrame({ icon, title, children }) {
  return (
    <section className="mes-card flex min-h-[20rem] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-mes-border px-4 py-3 text-sm font-semibold">
        <Icon name={icon} size={17} /> {title}
      </div>
      {children}
    </section>
  );
}

// Generic "AI unavailable" fallback with a retry button — the defect card's
// graceful-degradation path (503 today, GLM key empty) and any risk fetch fault.
function ErrorState({ onRetry }) {
  return (
    <div className="flex grow flex-col items-center justify-center gap-3 px-4 py-10 text-center">
      <span className="text-mes-muted"><Icon name="alert-triangle" size={26} /></span>
      <p className="text-sm text-mes-text">บทวิเคราะห์ AI ไม่พร้อมใช้งานชั่วคราว</p>
      <button type="button" className="mes-btn mes-btn-ghost" onClick={onRetry}>
        <Icon name="refresh" size={15} /> ลองใหม่
      </button>
    </div>
  );
}

// One-shot fetch with reload — each card owns its own instance so one failing
// panel never blanks the other.
function useInsight(fetcher) {
  const [state, setState] = useState({ status: 'loading', data: null });
  const load = useCallback(() => {
    setState({ status: 'loading', data: null });
    fetcher()
      .then((res) => setState({ status: 'ready', data: res.data }))
      .catch(() => setState({ status: 'error', data: null }));
  }, [fetcher]);
  useEffect(() => {
    load();
  }, [load]);
  return { ...state, reload: load };
}

const RISK_RANK = { high: 0, medium: 1, low: 2 };
const RISK_TAG = {
  high: { th: 'เสี่ยงสูง', className: 'font-semibold', style: { color: 'var(--sem-danger)' } },
  medium: { th: 'ปานกลาง', className: 'text-mes-text' },
  low: { th: 'ต่ำ', className: 'text-mes-muted' },
};

// Risk level is NOT a component status — render it as text emphasis only
// (sem-danger for high per F1 precedent), never with status colors.
function RiskTag({ level }) {
  const m = RISK_TAG[level] || RISK_TAG.low;
  return <span className={`shrink-0 text-xs ${m.className}`} style={m.style}>{m.th}</span>;
}

function SummaryChip({ label, value, danger }) {
  return (
    <div className="rounded-sm bg-mes-surface-2 p-2">
      <div className="text-lg font-bold tabular-nums" style={danger ? { color: 'var(--sem-danger)' } : undefined}>
        {fmt(value)}
      </div>
      <div className="text-xs text-mes-muted">{label}</div>
    </div>
  );
}

// Card 1 — วิเคราะห์ความเสี่ยง: summary chips + top-5 highest-risk components.
function RiskCard() {
  const { status, data, reload } = useInsight(fetchAiRiskAnalysis);

  let body;
  if (status === 'loading') {
    body = <Spinner label="กำลังวิเคราะห์ความเสี่ยง…" />;
  } else if (status === 'error') {
    body = <ErrorState onRetry={reload} />;
  } else {
    const summary = data?.summary || { high: 0, medium: 0, low: 0 };
    const top = [...(data?.components || [])]
      .sort(
        (a, b) =>
          (RISK_RANK[a.risk_level] ?? 3) - (RISK_RANK[b.risk_level] ?? 3) ||
          (b.hours_in_status || 0) - (a.hours_in_status || 0),
      )
      .slice(0, 5);
    body = (
      <div className="flex grow flex-col gap-3 p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <SummaryChip label="เสี่ยงสูง" value={summary.high} danger />
          <SummaryChip label="ปานกลาง" value={summary.medium} />
          <SummaryChip label="ต่ำ" value={summary.low} />
        </div>
        {top.length === 0 ? (
          <p className="py-4 text-center text-sm text-mes-muted">ไม่พบชิ้นงานที่มีความเสี่ยง</p>
        ) : (
          <ul>
            {top.map((c) => (
              <li key={c.id} className="flex items-start gap-3 border-b border-mes-border py-2 last:border-0">
                <div className="min-w-0 grow">
                  <div className="truncate text-sm font-medium text-mes-text">{c.name}</div>
                  <div className="truncate text-xs text-mes-muted">
                    {c.project_name} · {c.section_name}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge status={c.current_status} size="sm" />
                    <span className="text-xs text-mes-muted">ค้างสถานะ {fmt(c.hours_in_status)} ชม.</span>
                  </div>
                </div>
                <RiskTag level={c.risk_level} />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return <CardFrame icon="alert-triangle" title="วิเคราะห์ความเสี่ยง">{body}</CardFrame>;
}

// Card 2 — วิเคราะห์ข้อบกพร่อง: GLM narrative + rejection counts by section.
// Degrades gracefully to ErrorState (503 fallback while GLM_API_KEY is empty).
function DefectCard() {
  const { status, data, reload } = useInsight(fetchAiDefectAnalysis);

  let body;
  if (status === 'loading') {
    body = <Spinner label="กำลังวิเคราะห์ข้อบกพร่อง…" />;
  } else if (status === 'error') {
    body = <ErrorState onRetry={reload} />;
  } else {
    const bySection = [...(data?.by_section || [])]
      .sort((a, b) => (b.rejection_count || 0) - (a.rejection_count || 0))
      .slice(0, 5);
    const notes = data?.note_count;
    body = (
      <div className="flex grow flex-col gap-3 p-4">
        {data?.ai_analysis ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-mes-text">{data.ai_analysis}</p>
        ) : (
          <p className="text-sm text-mes-muted">ยังไม่มีบทวิเคราะห์</p>
        )}
        {bySection.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-semibold text-mes-muted">แยกตามชั้น (ถูกปฏิเสธมากสุด)</div>
            <ul>
              {bySection.map((s) => (
                <li
                  key={`${s.project_name}-${s.section_name}`}
                  className="flex items-center gap-2 border-b border-mes-border py-1.5 text-xs last:border-0"
                >
                  <span className="min-w-0 grow truncate text-mes-text">{s.section_name}</span>
                  <span className="shrink-0 tabular-nums text-mes-muted">{fmt(s.rejection_count)} ครั้ง</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {notes && (
          <div className="text-xs text-mes-muted">
            อ้างอิงหมายเหตุ {fmt(notes.analysed)}/{fmt(notes.total)} รายการ
          </div>
        )}
      </div>
    );
  }

  return <CardFrame icon="clipboard-list" title="วิเคราะห์ข้อบกพร่อง">{body}</CardFrame>;
}

// Guest skeletons — content-shaped pulse blocks shown beneath the ADR-0003
// lock overlay. Rendered by AiLockedState; no fetch fires for guests.
function RiskSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4" aria-hidden="true">
      <div className="grid grid-cols-3 gap-2">
        <div className="h-14 animate-pulse rounded-sm bg-mes-surface-2" />
        <div className="h-14 animate-pulse rounded-sm bg-mes-surface-2" />
        <div className="h-14 animate-pulse rounded-sm bg-mes-surface-2" />
      </div>
      <div className="h-10 animate-pulse rounded-sm bg-mes-surface-2" />
      <div className="h-10 animate-pulse rounded-sm bg-mes-surface-2" />
      <div className="h-10 animate-pulse rounded-sm bg-mes-surface-2" />
    </div>
  );
}

function DefectSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4" aria-hidden="true">
      <div className="h-4 w-full animate-pulse rounded-sm bg-mes-surface-2" />
      <div className="h-4 w-11/12 animate-pulse rounded-sm bg-mes-surface-2" />
      <div className="h-4 w-3/4 animate-pulse rounded-sm bg-mes-surface-2" />
      <div className="mt-2 h-8 w-full animate-pulse rounded-sm bg-mes-surface-2" />
      <div className="h-8 w-full animate-pulse rounded-sm bg-mes-surface-2" />
    </div>
  );
}

export function AiInsights({ user }) {
  return (
    <section className="mt-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-mes-muted">
        <Icon name="message-chatbot" size={15} /> บทวิเคราะห์ด้วย AI
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {user ? (
          <>
            <RiskCard />
            <DefectCard />
          </>
        ) : (
          <>
            <CardFrame icon="alert-triangle" title="วิเคราะห์ความเสี่ยง">
              <AiLockedState message="เข้าสู่ระบบเพื่อดูบทวิเคราะห์ AI" skeleton={<RiskSkeleton />} />
            </CardFrame>
            <CardFrame icon="clipboard-list" title="วิเคราะห์ข้อบกพร่อง">
              <AiLockedState message="เข้าสู่ระบบเพื่อดูบทวิเคราะห์ AI" skeleton={<DefectSkeleton />} />
            </CardFrame>
          </>
        )}
      </div>
    </section>
  );
}
