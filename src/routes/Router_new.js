// Router.js
import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import ProtectedRoute from './ProtectedRoute'; // Make sure to import the ProtectedRoute component

const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));
const ModernDash = Loadable(lazy(() => import('../views/dashboard/Modern')));
const FormProject = Loadable(lazy(() => import('../views/forms/FormProject')));
const FormSection = Loadable(lazy(() => import('../views/forms/FormSection')));
const FormComponent = Loadable(lazy(() => import('../views/forms/FormComponent')));
const FormQRCodeReader = Loadable(lazy(() => import('../views/forms/FormQRCodeReader')));
const Error = Loadable(lazy(() => import('../views/authentication/Error')));
const Login = Loadable(lazy(() => import('../views/authentication/auth1/Login')));

const Router = [
  {
    path: '/',
    element: <FullLayout />,
    children: [
      { path: '/', element: <Navigate to="/dashboards/modern" /> },
      { 
        path: '/dashboards/modern', 
        element: <ProtectedRoute roles={['Admin', 'Manager', 'Site User']} element={<ModernDash />} /> 
      },
      { 
        path: '/forms/form-project', 
        element: <ProtectedRoute roles={['Admin']} element={<FormProject />} /> 
      },
      { 
        path: '/forms/form-section', 
        element: <ProtectedRoute roles={['Admin']} element={<FormSection />} /> 
      },
      { 
        path: '/forms/form-component', 
        element: <ProtectedRoute roles={['Admin']} element={<FormComponent />} /> 
      },
      { 
        path: '/forms/form-qr-code-reader', 
        element: <ProtectedRoute roles={['Admin', 'Site User']} element={<FormQRCodeReader />} /> 
      },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '/auth/404', element: <Error /> },
      { path: '/auth/login', element: <Login /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

export default Router;
