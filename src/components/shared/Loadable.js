// [MES] Loadable — lazy-route wrapper with a token-styled fallback spinner.
import { Suspense } from 'react';

const Fallback = () => (
  <div className="flex min-h-dvh items-center justify-center bg-mes-bg">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-mes-border border-t-mes-accent" />
  </div>
);

const Loadable = (Component) => {
  const LoadableComponent = (props) => (
    <Suspense fallback={<Fallback />}>
      <Component {...props} />
    </Suspense>
  );
  LoadableComponent.displayName = 'Loadable';
  return LoadableComponent;
};

export default Loadable;
