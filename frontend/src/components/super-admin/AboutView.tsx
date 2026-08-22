import React, { useState, useEffect } from 'react';
import { SuperAdminApiService, AboutInfoData } from '../../services/super-admin-api.service';
import { ForbiddenState } from './ForbiddenState';

interface Props {
  themeColor?: string;
}

export const AboutView: React.FC<Props> = ({ themeColor = '#312E81' }) => {
  const [info, setInfo] = useState<AboutInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await SuperAdminApiService.getAboutInfo();
      setInfo(res);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des métadonnées système.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des informations système...</div>;
  if (error?.includes('403')) return <ForbiddenState message="Accès réservé aux administrateurs de la plateforme." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>ℹ️ À Propos & Versioning Officiel</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Métadonnées du serveur et versioning officiel de KPSyDesk Suite</p>
      </div>

      {info && (
        <div style={{ background: 'var(--bg-card)', padding: 32, borderRadius: 12, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: themeColor }}>{info.appName}</div>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{info.description}</p>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '8px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 14 }}>
            <div><strong>Version Officielle :</strong> {info.version}</div>
            <div><strong>Environnement :</strong> {info.environment}</div>
            <div><strong>Auteur / Éditeur :</strong> {info.author}</div>
            <div><strong>Node Runtime :</strong> {info.nodeVersion}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong style={{ fontSize: 14, color: '#0F172A', display: 'block', marginBottom: 8 }}>Secteurs d'Activité UEMOA Supportés :</strong>
            <div style={{ display: 'flex', gap: 8 }}>
              {info.supportedSectors.map((s) => (
                <span key={s} style={{ padding: '4px 12px', background: 'var(--bg-main)', color: 'var(--text-muted)', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
