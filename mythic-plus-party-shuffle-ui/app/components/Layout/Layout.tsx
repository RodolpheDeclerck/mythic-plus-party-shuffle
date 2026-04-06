'use client';

import React from 'react';
import HomeButton from '@/components/HomeButton/HomeButton';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout-container">
      <header className="layout-header">
        <HomeButton />
      </header>
      <main className="layout-content">{children}</main>
    </div>
  );
};

export default Layout;
