import React from 'react';

interface SectorCardProps {
  type: 'QUINCAILLERIE' | 'MULTISERVICES_IT' | 'TAILLEUR';
  title: string;
  description: string;
  borderColor: string;
  glowColor: string;
  textColor: string;
  isSelected: boolean;
  onSelect: () => void;
  iconSvg: React.ReactNode;
}

export const SectorCard: React.FC<SectorCardProps> = ({
  type,
  title,
  description,
  borderColor,
  glowColor,
  textColor,
  isSelected,
  onSelect,
  iconSvg,
}) => {
  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative bg-white rounded-3xl p-8 border-2 ${borderColor} ${glowColor} ${
        isSelected
          ? 'ring-4 ring-[#0A3225] scale-[1.03] shadow-2xl z-10'
          : 'shadow-lg hover:-translate-y-1.5 hover:shadow-xl opacity-95 hover:opacity-100'
      } transition-all duration-300 cursor-pointer flex flex-col items-center text-center justify-between min-h-[380px] overflow-hidden focus:outline-none focus:ring-4 focus:ring-[#0A3225]/40`}
    >
      {/* Pattern Bogolan Filigrane Interne */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white/90 pointer-events-none" />

      {/* Icône Custom Line-Art */}
      <div className="relative z-10 my-auto py-4 flex items-center justify-center">
        {iconSvg}
      </div>

      {/* Textes reproduits à l'identique de la maquette */}
      <div className="relative z-10 space-y-3 mb-4">
        <h3 className={`text-xl font-['Sora'] font-extrabold ${textColor}`}>{title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed font-medium max-w-[250px] mx-auto">
          {description}
        </p>
      </div>

      {/* Badge d'état Sélectionné */}
      {isSelected && (
        <div className="relative z-10 mt-2">
          <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-[#0A3225] text-[#D9A441] border border-[#D9A441]">
            ✓ SECTEUR SÉLECTIONNÉ
          </span>
        </div>
      )}
    </div>
  );
};
