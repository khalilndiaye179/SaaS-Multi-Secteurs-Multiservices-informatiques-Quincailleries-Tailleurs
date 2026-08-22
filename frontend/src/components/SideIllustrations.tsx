import React from 'react';
import leftSceneImg from '../assets/left_side_scene.png';
import rightSceneImg from '../assets/right_side_scene.png';

/**
 * ─── Illustration Latérale Gauche ───
 * Scène Isométrique 3D HD : Échoppe Quincaillerie & Atelier Tailleur
 */
export const LeftSideIllustration: React.FC = () => (
  <div
    className="side-illustration side-illustration-left"
    style={{
      width: '280px',
      maxHeight: '480px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      filter: 'drop-shadow(0 12px 24px rgba(15, 61, 46, 0.15))',
    }}
    aria-hidden="true"
    role="presentation"
  >
    <img
      src={leftSceneImg}
      alt="Scène Isométrique 3D Quincaillerie et Tailleur"
      style={{
        width: '100%',
        height: 'auto',
        objectFit: 'contain',
        borderRadius: '16px',
      }}
    />
  </div>
);

/**
 * ─── Illustration Latérale Droite ───
 * Scène Isométrique 3D HD : Kiosque Multiservices IT & Réparation
 */
export const RightSideIllustration: React.FC = () => (
  <div
    className="side-illustration side-illustration-right"
    style={{
      width: '280px',
      maxHeight: '480px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      filter: 'drop-shadow(0 12px 24px rgba(15, 61, 46, 0.15))',
    }}
    aria-hidden="true"
    role="presentation"
  >
    <img
      src={rightSceneImg}
      alt="Scène Isométrique 3D Kiosque Multiservices IT"
      style={{
        width: '100%',
        height: 'auto',
        objectFit: 'contain',
        borderRadius: '16px',
      }}
    />
  </div>
);
