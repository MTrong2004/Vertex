import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { PricingPage } from './pages/PricingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { LoginPage } from './pages/LoginPage';
import { ChangelogPage } from './pages/ChangelogPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { LegalPage } from './pages/LegalPage';
import { LecturerDashboardPage } from './pages/LecturerDashboardPage';

// Wrapper components to extract URL :tab param
function ResourcesPageWrapper({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { tab } = useParams<{ tab?: string }>();
  return <ResourcesPage onNavigate={onNavigate} initialTab={tab || 'docs'} key={tab} />;
}

function LegalPageWrapper({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { tab } = useParams<{ tab?: string }>();
  return <LegalPage onNavigate={onNavigate} initialTab={tab || 'terms'} key={tab} />;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleNavigate = (page: string) => {
    const routeMap: Record<string, string> = {
      login: '/login',
      dashboard: '/dashboard',
      lecturer: '/lecturer',
      features: '/features',
      pricing: '/pricing',
      landing: '/',
      changelog: '/changelog',
      resources: '/resources',
      docs: '/resources/docs',
      guide: '/resources/guide',
      blog: '/resources/blog',
      community: '/resources/community',
      legal: '/legal',
      terms: '/legal/terms',
      privacy: '/legal/privacy',
    };
    navigate(routeMap[page] || '/' + page);
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage onNavigate={handleNavigate} />} />
      <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
      <Route path="/admin" element={<AdminDashboardPage onNavigate={handleNavigate} />} />
      <Route path="/lecturer" element={<LecturerDashboardPage onNavigate={handleNavigate} />} />
      <Route path="/pricing" element={<PricingPage onNavigate={handleNavigate} />} />
      <Route path="/features" element={<FeaturesPage onNavigate={handleNavigate} />} />
      <Route path="/login" element={<LoginPage onNavigate={handleNavigate} />} />
      <Route path="/changelog" element={<ChangelogPage onNavigate={handleNavigate} />} />
      <Route path="/resources/:tab?" element={<ResourcesPageWrapper onNavigate={handleNavigate} />} />
      <Route path="/legal/:tab?" element={<LegalPageWrapper onNavigate={handleNavigate} />} />
    </Routes>
  );
}
