/**
 * Footer component - appears on all pages except auth pages.
 * Contains links to Contact, FAQ, Privacy, and copyright notice.
 */
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-links">
          <Link to="/contact">Contact Us</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
        <div className="footer-copyright">
          &copy; {currentYear} DEA Final Year Project
        </div>
      </div>
    </footer>
  );
}
