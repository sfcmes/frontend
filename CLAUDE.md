# Frontend CLAUDE.md — sfcmes-frontend-v3

React 18 SPA (Vite) for SFC MES v3. **Rebuilt 2026-07 as a dark-only industrial UI** (ADR-0005, ADR-0006) — the MUI template and all its demo pages are gone.

---

## Stack

| Concern | Package |
|---|---|
| Framework | React 18 |
| Build tool | Vite 4 |
| Routing | React Router v6 |
| Styling | **Tailwind CSS v3 + `src/styles/tokens.css`** (the ONLY file allowed to contain hex colors) |
| State | Local React state + `AuthContext` — **no Redux** |
| Forms | Formik + Yup |
| HTTP client | Axios 0.27 (`src/utils/api.js` — all backend calls) |
| Charts | Custom SVG primitives (`src/components/mes/charts.jsx`) — no chart library |
| Typeface | IBM Plex Sans Thai (self-hosted via @fontsource) |
| QR | `qrcode.react` (render), `jsqr` + `react-qr-reader` (scan), `html2canvas` (print/save) |
| Excel | xlsx |
| Module system | ES modules |

### Non-negotiable design rules (ADR-0006)

1. **No hex values outside `src/styles/tokens.css`** — components use Tailwind classes (`bg-mes-surface`, `text-status-installed`) or `var(--…)`. Exceptions: `index.html` pre-CSS anti-flash values and the `--qr-ink/--qr-paper` tokens read via `getComputedStyle` for canvas QR rendering.
2. **Status colors render only in `StatusBadge` and the chart primitives** (PipelineBar, Donut, Timeline) — never on nav, layout, backgrounds, or generic buttons.
3. **One dark theme.** No light mode, no user theming.
4. **Canonical statuses live in `src/components/mes/status-meta.js`** — one status = one Thai label (CONTEXT.md). Never define status labels/colors locally.
5. Every MES component gets a `// [MES] Name — what it does` header comment.
6. Mobile-first: base styles target <640px; 48px touch targets below `md`; no horizontal page scroll at any width.

---

## Folder Structure (MES-only now)

```
src/
├── main.jsx                 Entry — fonts, tokens.css, BrowserRouter (no Redux/mockApis/i18n)
├── App.jsx                  AuthProvider + routes (no MUI ThemeProvider)
├── styles/tokens.css        ALL colors + Tailwind layers + .mes-* component classes
├── routes/Router.js         3 route groups (public dashboard / protected MES / BlankLayout public)
├── utils/api.js             Central API module (untouched by the redesign)
├── contexts/AuthContext.js  { user, login, logout, loading, error }
├── layouts/
│   ├── mes/                 MesShell (app shell), Sidebar (md+), BottomNav (<md), nav.js (NAV registry), Logo
│   └── blank/BlankLayout.js
├── components/
│   ├── mes/                 Design system: status-meta.js, StatusBadge, charts (PipelineBar/Donut/Timeline),
│   │                        Icon (ICON_PATHS), ui (Modal/ConfirmDialog/useToast/EmptyState/CardHeader/Spinner)
│   ├── shared/              Loadable, ScrollToTop
│   ├── container/           PageContainer (Helmet titles)
│   └── forms/form-validation/  FVProject, FVSection, FVComponent, FVPurchaseOrder,
│                                Precast/Other component forms + managers, ExcelUploadForm
└── views/
    ├── mes/dashboard/       Dashboard, Hero, ProjectTable, RightPanel, Drawer, OtherComponentsTab, SitePhotos, data.js
    ├── forms/               FormProject/Section/Component/PO/QRCodeReader/ComponentCard + po-dialogs/ + modals
    ├── pages/qrcode/        QRCodePage, ComponentDetailsPage
    └── authentication/      auth1/ (Login, Register, ManageUser+UserList, ForgotPassword), authForms/AuthRegister, Error.jsx
```

## Routing

Three groups in `Router.js` (all lazy via `components/shared/Loadable`):
1. **Public dashboard** — `MesShell`, no gate: `/` → `/dashboards/modern` (intentionally public — CONTEXT.md AI Access Boundary).
2. **Protected MES** — `AuthWrapper` + `MesShell`: `/forms/form-{project,section,component,qr-code-reader,po}`, `/pages/qr-code`.
3. **BlankLayout public** — `/auth/*`, `/component/:id`, `/forms/form-component-card/:id`, `*` → `/auth/404`.

Nav items register in `layouts/mes/nav.js` (`NAV_SECTIONS`) — drives both Sidebar and BottomNav. New page = route + NAV entry.

## Patterns

- **Data fetching**: `useEffect` + `useState` via `api.js` functions (unchanged). `publicApi` for public reads, `api` for authenticated calls.
- **Dialogs**: `Modal` from `components/mes/ui` (bottom sheet at base, dialog at md+). Destructive actions use `ConfirmDialog` — never `window.confirm`.
- **Toasts**: `useToast()` from `components/mes/ui` — never `alert()` or per-page snackbars.
- **Tables**: cards below `md` (`md:hidden` block), `<table>` with `.mes-th/.mes-td` at `md+`. Never horizontally scroll the page.
- **Inputs**: `.mes-input` / `.mes-label` / `.mes-btn mes-btn-{primary,ghost,danger}` classes from tokens.css.
- **Thai-first UI**: all user-facing strings are Thai (English identifiers in code). Status labels come from status-meta only.

## Lessons Learned

- `fetchComponentsByProjectId` returns `{ precast: [], other: [] }`, not an array — several legacy pages broke assuming an array.
- The `buyer` role is not seeded in the backend; Admin is the interim buyer (`user.role === 'buyer' || user.role === 'Admin'`).
- Canvas APIs (`QRCodeCanvas`, html2canvas) cannot resolve CSS `var()` — read `--qr-ink`/`--qr-paper` via `getComputedStyle`.
