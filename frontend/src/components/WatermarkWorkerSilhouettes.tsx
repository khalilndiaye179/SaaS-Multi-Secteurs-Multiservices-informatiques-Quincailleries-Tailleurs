import React from 'react';
import leftSceneImg from '../assets/left_side_scene.png';
import rightSceneImg from '../assets/right_side_scene.png';

interface Props {
  mode: 'selection' | 'login';
}

/**
 * ─── Composant Décoratif Filigrane / Watermark Silhouettes 3D HD ───
 * Utilise les scènes 3D isométriques riches générées en version filigrane très douce (opacité 10-12%)
 * pour sublimer l'arrière-plan sans jamais altérer la lisibilité des formulaires.
 */
export const WatermarkWorkerSilhouettes: React.FC<Props> = ({ mode }) => {
  if (mode === 'selection') {
    return (
      <div
        className="watermark-silhouettes watermark-selection"
        aria-hidden="true"
        role="presentation"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {/* Filigrane Gauche Haut */}
        <div style={{ position: 'absolute', top: '5%', left: '2%', width: '300px', opacity: 0.10 }}>
          <img src={leftSceneImg} alt="" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Filigrane Droit Bas */}
        <div style={{ position: 'absolute', bottom: '4%', right: '2%', width: '300px', opacity: 0.10 }}>
          <img src={rightSceneImg} alt="" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
        </div>
      </div>
    );
  }

  // mode === 'login'
  return (
    <div
      className="watermark-silhouettes watermark-login"
      aria-hidden="true"
      role="presentation"
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Filigrane Gauche - Arrière-plan Présentation Commerciale KPSyDesk */}
      <div style={{ position: 'absolute', top: '15%', left: '20px', width: '320px', opacity: 0.12 }}>
        <img src={rightSceneImg} alt="" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
      </div>

      {/* Filigrane Droit - Marge Extérieure à Droite de la carte Formulaire */}
      <div style={{ position: 'absolute', top: '18%', right: '20px', width: '320px', opacity: 0.12 }}>
        <img src={leftSceneImg} alt="" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
      </div>
    </div>
  );
};
