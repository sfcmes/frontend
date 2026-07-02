// [MES] Logo — SFC brand mark drawn with brand tokens (red diamond, gold disc, navy letters).

export function SfcMark({ size = 28 }) {
  return (
    <svg viewBox="0 0 208.24 208.24" width={size} height={size} aria-label="SFC">
      <rect
        fill="var(--brand-red)"
        x="30.5" y="30.5" width="147.25" height="147.25"
        transform="translate(-43.13 104.12) rotate(-45)"
      />
      <circle fill="var(--brand-gold)" cx="104.12" cy="104.12" r="63.41" />
      <text
        x="104" y="122"
        textAnchor="middle"
        fontFamily="var(--font-sans)"
        fontWeight="700"
        fontSize="52"
        fill="var(--brand-navy)"
      >
        SFC
      </text>
    </svg>
  );
}

export function BrandWord() {
  return (
    <div className="leading-tight">
      <div className="text-[15px] font-bold tracking-wide text-mes-text">
        SFC<span className="text-mes-accent">·PC</span>
      </div>
      <div className="text-[10px] tracking-[0.18em] text-mes-muted">PRECAST MES</div>
    </div>
  );
}
