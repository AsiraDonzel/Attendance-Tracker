/**
 * Privacy Policy page - premium styled with section navigation.
 */
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';

const SECTIONS = [
  {
    title: 'Information We Collect',
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />',
    items: [
      { label: 'Student Data', desc: 'Full name, matriculation number, academic level, department, email address, phone number, and fingerprint ID.' },
      { label: 'Lecturer Data', desc: 'Name, title, department, email, office phone number, and course assignments.' },
      { label: 'Attendance Records', desc: 'Timestamps of attendance marking, class session details, and verification logs.' },
      { label: 'System Logs', desc: 'Action logs for security and audit purposes.' },
    ],
  },
  {
    title: 'How We Use Your Information',
    icon: '<circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />',
    items: [
      { desc: 'Verifying student identity for attendance marking' },
      { desc: 'Recording and calculating attendance percentages' },
      { desc: 'Generating attendance reports and grade calculations' },
      { desc: 'System administration and security auditing' },
    ],
  },
  {
    title: 'Data Security',
    icon: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />',
    items: [
      { desc: 'Encrypted password storage using industry-standard hashing algorithms' },
      { desc: 'JWT-based authentication with token expiration' },
      { desc: 'TOTP-based verification for student attendance (hardware-dependent)' },
      { desc: 'Access controls based on user roles (student, lecturer, admin)' },
    ],
  },
  {
    title: 'Data Retention',
    icon: '<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />',
    items: [
      { desc: 'Attendance records are retained for the duration of the academic program.' },
      { desc: 'Account data is kept active while enrolled or employed.' },
      { desc: 'System logs are retained for up to 12 months for audit purposes.' },
    ],
  },
  {
    title: 'Your Rights',
    icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />',
    items: [
      { desc: 'Request access to your personal data held in the system.' },
      { desc: 'Request correction of inaccurate information.' },
      { desc: 'Contact the system administrator for data-related inquiries.' },
    ],
  },
];

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f2f5' }}>
      <div style={{ flex: 1, padding: '40px 24px' }}>
        <div style={{ maxWidth: '740px', margin: '0 auto' }}>
          {/* Back */}
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm"
            style={{ color: '#8896a7', marginBottom: '16px', padding: '6px 0' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Go Back
          </button>

          {/* Hero section */}
          <div style={{
            background: 'linear-gradient(135deg, #1a2332, #233044)',
            padding: '40px', borderRadius: '16px', marginBottom: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(46,125,50,0.15)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Privacy Policy</h1>
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', margin: 0 }}>
              Last updated: April 2026 -- AttendTrack Attendance System
            </p>
          </div>

          {/* Sections */}
          <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {SECTIONS.map((section, idx) => (
              <div key={idx} style={{
                background: '#fff', borderRadius: '14px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                overflow: 'hidden',
              }}>
                {/* Section header */}
                <div style={{
                  padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px',
                  borderBottom: '1px solid #f0f2f5',
                }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2"
                      dangerouslySetInnerHTML={{ __html: section.icon }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#a0aec0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Section {idx + 1}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#1a1a2e', fontWeight: 700 }}>{section.title}</h3>
                  </div>
                </div>

                {/* Items */}
                <div style={{ padding: '16px 24px 20px' }}>
                  {section.items.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                      padding: '10px 0', borderBottom: i < section.items.length - 1 ? '1px solid #f8f9fa' : 'none',
                    }}>
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%', background: '#2E7D32',
                        marginTop: '7px', flexShrink: 0,
                      }} />
                      <div>
                        {item.label && (
                          <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.88rem' }}>
                            {item.label}: {' '}
                          </span>
                        )}
                        <span style={{ color: '#4a5568', fontSize: '0.88rem', lineHeight: 1.7 }}>
                          {item.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact footer */}
          <div style={{
            marginTop: '24px', padding: '20px 24px', background: '#fff',
            borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1565c0" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22 6 12 13 2 6" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', color: '#8896a7' }}>For privacy concerns or data requests, contact</div>
              <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.9rem' }}>example@attendtrack.edu</div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
