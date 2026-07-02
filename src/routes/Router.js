// [MES] Router — MES routes only. Template demo routes deleted (ADR-0005).
import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

import Loadable from '../components/shared/Loadable';

/* ***Layouts**** */
const MesShell = Loadable(lazy(() => import('../layouts/mes/MesShell')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

/* ****Pages***** */
const Dashboard = Loadable(lazy(() => import('../views/mes/dashboard/Dashboard')));
const QRCodePage = Loadable(lazy(() => import('../views/pages/qrcode/QRCodePage')));
const ComponentDetailsPage = Loadable(lazy(() => import('../views/pages/qrcode/ComponentDetailsPage')));

// MES forms
const FormProject = Loadable(lazy(() => import('../views/forms/FormProject')));
const FormComponent = Loadable(lazy(() => import('../views/forms/FormComponent')));
const FormSection = Loadable(lazy(() => import('../views/forms/FormSection')));
const FormQRCodeReader = Loadable(lazy(() => import('../views/forms/FormQRCodeReader')));
const FormPO = Loadable(lazy(() => import('../views/forms/FormPO')));
const FormComponentCard = Loadable(lazy(() => import('../views/forms/FormComponentCard')));

// authentication
const Register = Loadable(lazy(() => import('../views/authentication/auth1/Register')));
const ManageUser = Loadable(lazy(() => import('../views/authentication/auth1/ManageUser')));
const ForgotPassword = Loadable(lazy(() => import('../views/authentication/auth1/ForgotPassword')));
const Error = Loadable(lazy(() => import('../views/authentication/Error')));
const Login = Loadable(lazy(() => import('../views/authentication/auth1/Login')));

// Auth guard — redirects unauthenticated requests to login
const AuthWrapper = ({ children }) => {
  const isAuthenticated = () => localStorage.getItem('token') !== null;
  if (!isAuthenticated()) return <Navigate to="/auth/login" />;
  return children;
};

const Router = [
  // ── GROUP 1: Public MES dashboard ──────────────────────────────────────────
  // MesShell with no auth gate. Dashboard is intentionally public (CONTEXT.md).
  {
    path: '/',
    element: <MesShell />,
    children: [
      { path: '/', element: <Navigate to="/dashboards/modern" /> },
      { path: '/dashboards/modern', element: <Dashboard /> },
    ],
  },

  // ── GROUP 2: Protected MES pages ───────────────────────────────────────────
  {
    path: '/',
    element: <AuthWrapper><MesShell /></AuthWrapper>,
    children: [
      { path: '/forms/form-project', element: <FormProject /> },
      { path: '/forms/form-section', element: <FormSection /> },
      { path: '/forms/form-component', element: <FormComponent /> },
      { path: '/forms/form-qr-code-reader', element: <FormQRCodeReader /> },
      { path: '/forms/form-po', element: <FormPO /> },
      { path: '/pages/qr-code', element: <QRCodePage /> },
    ],
  },

  // ── GROUP 3: Public pages (auth + QR scan flow) ────────────────────────────
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '/auth/login', element: <Login /> },
      { path: '/auth/register', element: <Register /> },
      { path: '/auth/manageuser', element: <ManageUser /> },
      { path: '/auth/forgot-password', element: <ForgotPassword /> },
      { path: '/auth/404', element: <Error /> },
      { path: '/component/:id', element: <ComponentDetailsPage /> },
      { path: '/forms/form-component-card/:id', element: <FormComponentCard /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

export default Router;
