import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Fixed Top Navbar (h-16 / 64px) */}
      <Navbar onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />

      {/* Main Content Area below Navbar */}
      <div className="flex flex-1 pt-16 h-screen max-w-full overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

        {/* Scrollable Page Main Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 max-w-full bg-[#f8fafc]">
          <div className="w-full max-w-[1360px] mx-auto p-3.5 sm:p-6 md:p-8 space-y-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
