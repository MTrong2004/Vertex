import React from 'react';
import { Dashboard } from '../components/dashboard/Dashboard';

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  return <Dashboard onNavigate={onNavigate} />;
};
