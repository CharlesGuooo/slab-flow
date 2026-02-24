import { ReactNode } from 'react';

interface PlatformAdminLayoutProps {
  children: ReactNode;
}

export default function PlatformAdminLayout({ children }: PlatformAdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
