import React, { useEffect } from 'react';

/**
 * ThemeProvider ensures the application always renders in light mode.
 * Dark-mode is intentionally disabled for the academic portal.
 * The context layer was removed since no component consumes it.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem('mentora_theme', 'light');
  }, []);

  return <>{children}</>;
};
