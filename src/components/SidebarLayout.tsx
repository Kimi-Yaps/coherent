import { ReactNode } from 'react';
import './SidebarLayout.css';

interface SidebarLayoutProps {
  sidebarContent: ReactNode;
  children: ReactNode;
}

const SidebarLayout = ({ sidebarContent, children }: SidebarLayoutProps) => {
  return (
    <div className="sidebar-layout">
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
