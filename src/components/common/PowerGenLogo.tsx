import React from 'react';
import logo from '@/assets/logo.png';

const PowerGenLogo: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style = {} }) => (
  <img
    src={logo}
    alt="PowerGen Logo"
    className={`w-20 h-20 ${className}`}
    style={style}
    draggable={false}
  />
);

export default PowerGenLogo;
