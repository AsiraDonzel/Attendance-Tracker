/**
 * Lecturer Profile Page.
 * Read-only view of lecturer details.
 */
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

export default function LecturerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me/')
      .then(res => {
        setProfile(res.data.lecturer_profile);
        setEmail(res.data.email);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="loading-center"><div className="spinner"></div></div></Layout>;
  if (!profile) return <Layout><div className="empty-state">Failed to load profile.</div></Layout>;

  const fullName = `${profile.title} ${profile.first_name} ${profile.last_name}`;

  return (
    <Layout>
      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      <div className="card slide-up" style={{ maxWidth: '600px', margin: '0 auto', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a2332, #233044)', height: '120px', position: 'relative' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', background: '#fff', 
            position: 'absolute', bottom: '-40px', left: '32px', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            fontSize: '2rem', fontWeight: 800, color: '#2E7D32'
          }}>
            {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
          </div>
        </div>
        
        <div style={{ padding: '56px 32px 32px 32px' }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: '#1a1a2e' }}>{fullName}</h2>
          <p style={{ color: '#8896a7', margin: '0 0 24px 0' }}>{email}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#8896a7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Department</div>
              <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{profile.department} Engineering</div>
            </div>
            
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#8896a7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Levels Taught</div>
              <div style={{ fontWeight: 600, color: '#1a1a2e' }}>
                {Array.isArray(profile.levels_taught) ? profile.levels_taught.join(', ') : profile.levels_taught || 'None'}
              </div>
            </div>

            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#8896a7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Phone Number</div>
              <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{profile.phone || 'Not provided'}</div>
            </div>

            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#8896a7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Office Number</div>
              <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{profile.office_number || 'Not provided'}</div>
            </div>

            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.75rem', color: '#8896a7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Account Type</div>
              <div style={{ fontWeight: 600, color: '#2E7D32', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Lecturer
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
