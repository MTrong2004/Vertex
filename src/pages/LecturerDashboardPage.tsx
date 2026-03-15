import React from 'react';
import { LecturerDashboard } from '../components/dashboard/lecturer/LecturerDashboard';

interface LecturerDashboardPageProps {
  onNavigate?: (page: string) => void;
}

export const LecturerDashboardPage: React.FC<LecturerDashboardPageProps> = ({ onNavigate }) => {
  return <LecturerDashboard onNavigate={onNavigate} />;
};
