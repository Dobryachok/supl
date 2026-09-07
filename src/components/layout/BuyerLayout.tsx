import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

export function BuyerLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-ink-50 [--header-offset:calc(4rem+0.75rem)] lg:[--header-offset:calc(4rem+2.5rem+0.75rem+3px)]">
      <Header />
      <main className="flex-1 pb-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
