/**
 * Layout wrapper with sidebar and footer.
 * Used for authenticated pages (lecturer/admin dashboards).
 */
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function Layout({ children, showSidebar = true }) {
  return (
    <div className="app-layout">
      {showSidebar && <Sidebar />}
      <div className={`main-content ${!showSidebar ? 'no-sidebar' : ''}`}>
        <div className="page-container fade-in">
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
}
