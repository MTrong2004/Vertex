import React from 'react';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';

interface Props {
  onNavigate: (page: string) => void;
}

export const AdminDashboardPage: React.FC<Props> = ({ onNavigate }) => {
  return <AdminDashboard onNavigate={onNavigate} />;
};
