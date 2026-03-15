import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  icon,
  className = '',
  ...props
}) => {
  const isDisabled = isLoading || props.disabled;
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transform-gpu will-change-transform transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-[#34D399]/60 focus:ring-offset-2 focus:ring-offset-[#0A0F1A] disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'btn-vertex-primary',
    secondary: 'bg-[#162032]/80 backdrop-blur-md text-slate-100 border border-[#22C55E]/15 hover:bg-[#1C2B3B] hover:border-[#34D399]/35 hover:text-white shadow-[0_10px_24px_rgba(8,14,24,0.32)] hover:shadow-[0_16px_34px_rgba(34,197,94,0.18)]',
    outline: 'bg-transparent border-2 border-[#22C55E]/85 text-[#4ADE80] hover:bg-[#22C55E]/12 hover:border-[#6EE7B7] hover:text-[#BBF7D0] shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_12px_28px_rgba(34,197,94,0.16)]',
    ghost: 'bg-transparent text-slate-400 hover:bg-[#162032] hover:text-[#6EE7B7] hover:shadow-[inset_0_0_0_1px_rgba(74,222,128,0.25)]',
    danger: 'bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 hover:text-red-200 hover:border-red-400/35 hover:shadow-[0_12px_26px_rgba(239,68,68,0.2)]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };

  const hoverMotion = isDisabled
    ? undefined
    : variant === 'ghost'
      ? { y: -1, scale: 1.01 }
      : { y: -1.5, scale: 1.02 };

  return (
    <motion.button
      whileHover={hoverMotion}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24, mass: 0.6 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
};
