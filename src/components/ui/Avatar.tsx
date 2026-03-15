import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#162032] ${sizes[size]} ${className}`}>
      {src ? (
        <img className="h-full w-full object-cover" src={src} alt={alt || fallback} />
      ) : (
        <span className="font-medium text-slate-400">{fallback}</span>
      )}
    </div>
  );
};
