/**
 * FAQ page - premium accordion design with search.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FAQ_ITEMS } from '../../utils/constants';
import Footer from '../../components/Footer';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filtered = search
    ? FAQ_ITEMS.filter(item =>
        item.question.toLowerCase().includes(search.toLowerCase()) ||
        item.answer.toLowerCase().includes(search.toLowerCase())
      )
    : FAQ_ITEMS;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f2f5' }}>
      <div style={{ flex: 1, padding: '40px 24px' }}>
        <div style={{ maxWidth: '740px', margin: '0 auto' }}>
          {/* Back + Header */}
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm"
            style={{ color: '#8896a7', marginBottom: '16px', padding: '6px 0' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Go Back
          </button>

          {/* Hero section */}
          <div style={{
            background: 'linear-gradient(135deg, #2E7D32, #43a047)',
            padding: '40px', borderRadius: '16px', marginBottom: '28px',
            boxShadow: '0 4px 20px rgba(46,125,50,0.2)',
          }}>
            <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
              Frequently Asked Questions
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', marginBottom: '20px' }}>
              Find answers to common questions about the attendance system.
            </p>
            {/* Search box */}
            <div style={{ position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text" placeholder="Search questions..." value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '13px 16px 13px 44px',
                  borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                  color: '#fff', fontSize: '0.9rem', outline: 'none',
                  fontFamily: 'var(--font-family)',
                }}
              />
            </div>
          </div>

          {/* FAQ items */}
          <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '48px', background: '#fff',
                borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <p style={{ color: '#8896a7', fontSize: '0.92rem' }}>No matching questions found.</p>
              </div>
            ) : filtered.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={index} style={{
                  background: '#fff', borderRadius: '14px',
                  boxShadow: isOpen ? '0 4px 16px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.04)',
                  overflow: 'hidden', transition: 'box-shadow 0.2s ease',
                  border: isOpen ? '1px solid #c8e6c9' : '1px solid transparent',
                }}>
                  <button onClick={() => toggle(index)} style={{
                    width: '100%', padding: '18px 22px', border: 'none', background: 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    textAlign: 'left', fontFamily: 'var(--font-family)', gap: '14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                        background: isOpen ? 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' : '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s ease',
                      }}>
                        <span style={{ fontWeight: 800, fontSize: '0.78rem', color: isOpen ? '#2E7D32' : '#8896a7' }}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <span style={{
                        fontWeight: 600, fontSize: '0.92rem',
                        color: isOpen ? '#2E7D32' : '#1a1a2e',
                      }}>
                        {item.question}
                      </span>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isOpen ? '#2E7D32' : '#a0aec0'} strokeWidth="2"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: '0 22px 20px 68px', fontSize: '0.88rem',
                      color: '#4a5568', lineHeight: 1.7, animation: 'fadeIn 0.2s ease',
                    }}>
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
