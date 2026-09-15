import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import './Layout.css';

const Layout = () => {
  return (
    <div className="layout">
      <NavBar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
