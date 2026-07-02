// [MES] App — root component. Dark-only token theme (tokens.css); no MUI theme,
// no user theming (ADR-0005/0006).
import { useRoutes } from 'react-router-dom';
import ScrollToTop from './components/shared/ScrollToTop';
import Router from './routes/Router';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const routing = useRoutes(Router);

  return (
    <AuthProvider>
      <ScrollToTop>{routing}</ScrollToTop>
    </AuthProvider>
  );
}

export default App;
