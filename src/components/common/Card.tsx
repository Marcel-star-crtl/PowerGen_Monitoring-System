import React from 'react';
import { classNames } from '@/utils/helpers';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export const Card: React.FC<CardProps> = ({ children, className, padding = 'md' }) => {
  const paddingStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    none: '',
  };

  return (
    <div className={classNames('bg-white rounded-lg shadow', paddingStyles[padding], className)}>
      {children}
    </div>
  );
};