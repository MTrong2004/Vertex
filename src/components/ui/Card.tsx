import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverEffect = false, onClick }) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' } : {}}
      className={`bg-[#0F1A2A]/70 backdrop-blur-xl rounded-2xl border border-[#22C55E]/10 shadow-sm shadow-green-500/5 p-6 ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};
