import React, { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { Footer } from '../components/layout/Footer';
import { CreatePlanModal } from '../components/modals/CreatePlanModal';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreatePlan = (data: any) => {
    console.log('Plan created:', data);
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} currentPage="landing" />
      
      <main className="flex-1">
        <Hero 
          onStart={() => setIsModalOpen(true)}
        />
        <Features onNavigate={onNavigate} />
      </main>

      <Footer onNavigate={onNavigate} />

      <CreatePlanModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreatePlan} 
      />
    </div>
  );
};
