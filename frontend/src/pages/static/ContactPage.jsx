/**
 * Contact Us page with premium split-panel design.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f2f5' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ width: '100%', maxWidth: '640px', marginBottom: '24px' }}>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm"
            style={{ color: '#8896a7', marginBottom: '16px', padding: '6px 0' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Go Back
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '6px' }}>Get in Touch</h1>
          <p style={{ color: '#8896a7', fontSize: '0.95rem' }}>
            Have a question or need help? Send us a message and we will respond promptly.
          </p>
        </div>

        {/* Card */}
        <div className="slide-up" style={{
          width: '100%', maxWidth: '640px', background: '#fff',
          borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          {/* Green accent bar */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #2E7D32, #43a047)' }} />

          <div style={{ padding: '36px 40px' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{
                  width: '72px', height: '72px', background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', animation: 'scaleIn 0.4s ease',
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Message Sent</h2>
                <p style={{ color: '#8896a7', margin: '8px 0 28px', fontSize: '0.92rem' }}>
                  Thank you for reaching out. We will get back to you shortly.
                </p>
                <button className="btn btn-secondary" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', message: '' }); }}
                  style={{ borderRadius: '10px', border: '1.5px solid #e2e8f0', padding: '10px 24px' }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Your Name</label>
                    <input className="form-input" placeholder="Full name" value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Email Address</label>
                    <input className="form-input" type="email" placeholder="you@university.edu" value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-textarea" placeholder="How can we help?" value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required
                    style={{ minHeight: '140px', borderRadius: '10px' }} />
                </div>
                <button type="submit" className="btn btn-primary btn-full"
                  style={{ borderRadius: '10px', padding: '13px', fontSize: '0.95rem', fontWeight: 700,
                    background: 'linear-gradient(135deg, #2E7D32, #388e3c)', boxShadow: '0 2px 8px rgba(46,125,50,0.25)' }}>
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Info section */}
          {!submitted && (
            <div style={{ borderTop: '1px solid #f0f2f5', padding: '24px 40px', background: '#fafbfc' }}>
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22 6 12 13 2 6" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#a0aec0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</div>
                    <div style={{ fontSize: '0.85rem', color: '#1a1a2e', fontWeight: 600 }}>support@attendtrack.edu</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1565c0" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#a0aec0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Response Time</div>
                    <div style={{ fontSize: '0.85rem', color: '#1a1a2e', fontWeight: 600 }}>Within 24 hours</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
