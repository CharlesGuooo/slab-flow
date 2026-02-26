import { ReactNode } from 'react';

interface PlatformAdminLayoutProps {
  children: ReactNode;
}

export default function PlatformAdminLayout({ children }: PlatformAdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-900">
      {children}
    </div>
  );
}
