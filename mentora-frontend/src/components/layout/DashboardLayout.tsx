import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-app)] transition-colors duration-200">
      {/* Sticky Navbar — fixed 64px tall */}
      <Navbar onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />

      {/* Body row: sidebar + scrollable main */}
      <div className="flex flex-1 overflow-hidden" style={{ marginTop: '64px' }}>
        {/* Desktop floating sidebar (sticky, not scroll-dependent) */}
        <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {/* Inner content wrapper: fluid, consistent padding */}
          <div
            className="w-full"
            style={{
              padding: 'var(--page-padding-y) var(--page-padding-x)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--section-gap)',
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
