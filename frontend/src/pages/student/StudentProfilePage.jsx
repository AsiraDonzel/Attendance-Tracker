/**
 * Student Profile Page.
 * Read-only view of student details.
 */
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me/')
      .then(res => setProfile(res.data.student_profile))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="loading-center"><div className="spinner"></div></div></Layout>;
  if (!profile) return <Layout><div className="empty-state">Failed to load profile.</div></Layout>;

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
            {profile.full_name.charAt(0)}
          </div>
        </div>
        
        <div style={{ padding: '56px 32px 32px 32px' }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: '#1a1a2e' }}>{profile.full_name}</h2>
          <p style={{ color: '#8896a7', margin: '0 0 24px 0' }}>{profile.matric_number}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#8896a7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Department</div>
              <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{profile.department} Engineering</div>
            </div>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#8896a7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Level</div>
              <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{profile.level}</div>
            </div>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#8896a7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Fingerprint ID</div>
              <div style={{ fontWeight: 600, color: '#1a1a2e', fontFamily: 'monospace', letterSpacing: '1px' }}>{profile.fingerprint_id}</div>
            </div>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#8896a7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Hardware MFA</div>
              <div style={{ fontWeight: 600, color: '#2E7D32', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
