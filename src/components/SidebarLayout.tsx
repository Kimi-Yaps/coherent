import { ReactNode } from 'react';
import './SidebarLayout.css';

interface SidebarLayoutProps {
  sidebarContent: ReactNode;
  children: ReactNode;
  className?: string;
  isMobileViewingChat?: boolean;
}

const SidebarLayout = ({ 
  sidebarContent, 
  children,
  className = '',
  isMobileViewingChat 
}: SidebarLayoutProps) => {
  const mobileClass = isMobileViewingChat !== undefined
    ? (isMobileViewingChat ? 'mobile-view-chat' : 'mobile-view-list')
    : '';

  return (
    <div className={`sidebar-layout ${className} ${mobileClass}`}>
      <aside className="sidebar">
        {sidebarContent}
      </aside>
      <div className="content-area">
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;
