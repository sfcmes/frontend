# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


TopPerformers Component Structure
│
├── Imports
│   ├── React and useState
│   └── Material-UI components
│
├── Mock Data
│   ├── projects (array of project objects)
│   └── generateMockFileRevisions (function)
│
├── Styled Components
│   └── StyledTableCell
│
├── Utility Functions
│   └── handleFileDownload
│
├── Sub-Components
│   ├── FileHistoryTable
│   │   └── Renders table of file revisions
│   │
│   ├── ComponentDialog
│   │   ├── Manages tabs for component details and file history
│   │   └── Renders component details and FileHistoryTable
│   │
│   ├── SectionRow
│   │   ├── Manages expansion state for section
│   │   ├── Renders list of components in a grid
│   │   └── Manages ComponentDialog for selected component
│   │
│   └── ProjectRow
│       ├── Manages expansion state for project
│       └── Renders list of SectionRows
│
└── Main TopPerformers Component
    ├── Manages month selection state
    ├── Renders overall layout
    │   ├── Title and month selector
    │   └── Table of ProjectRows
    └── Exports the component

Key State Management:
- Month selection in TopPerformers
- Expansion states in ProjectRow and SectionRow
- Selected component in SectionRow for ComponentDialog
- Tab selection in ComponentDialog

Data Flow:
projects → TopPerformers → ProjectRow → SectionRow → ComponentDialog