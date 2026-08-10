import React from 'react';

interface RegisterCTAButtonProps {
  isDisabled: boolean;
  onClick: () => void;
}

export const RegisterCTAButton: React.FC<RegisterCTAButtonProps> = ({ isDisabled, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={`px-10 py-3.5 rounded-2xl font-['Sora'] font-bold text-sm border-2 transition-all duration-300 shadow-xl flex items-center justify-center gap-2 ${
        isDisabled
          ? 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed opacity-60 shadow-none'
          : 'bg-[#0A3225] text-[#D9A441] border-[#D9A441] hover:bg-[#062118] hover:scale-105 hover:shadow-2xl cursor-pointer active:scale-95'
      }`}
    >
      <span>S'inscrire maintenant</span>
      {!isDisabled && <span>→</span>}
    </button>
  );
};
