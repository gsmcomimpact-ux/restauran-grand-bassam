
import React, { useState } from 'react';

const LogoSmall: React.FC = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8 md:w-10 md:h-10 text-orange-600 drop-shadow-sm">
    <path 
      d="M30 70 Q50 20 70 70 M50 35 L50 70" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="8" 
      strokeLinecap="round" 
    />
    <circle cx="50" cy="30" r="5" className="fill-orange-500" />
    <path d="M40 75 H60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-stone-900" />
  </svg>
);

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 90; // Matching App.tsx offset for consistency
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    } else if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-stone-100 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 md:h-24">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => scrollToSection('hero')}
              className="flex items-center gap-3 transition-transform active:scale-95 text-left"
            >
              <LogoSmall />
              <div className="flex flex-col leading-none">
                <span className="text-stone-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] mb-1">Restaurant</span>
                <span className="text-xl md:text-2xl font-serif font-bold italic text-stone-900 tracking-tighter">Grand Bassam</span>
              </div>
            </button>
          </div>
          
          <div className="hidden md:flex items-center space-x-12">
            <button onClick={() => scrollToSection('histoire')} className="text-stone-500 hover:text-orange-600 text-[11px] font-black uppercase tracking-[0.2em] transition-all">L'Histoire</button>
            <button onClick={() => scrollToSection('menu')} className="text-stone-500 hover:text-orange-600 text-[11px] font-black uppercase tracking-[0.2em] transition-all">La Carte</button>
            <button onClick={() => scrollToSection('reserve')} className="text-stone-500 hover:text-orange-600 text-[11px] font-black uppercase tracking-[0.2em] transition-all">Réservation</button>
            <button 
                onClick={() => scrollToSection('reserve')}
                className="bg-stone-950 text-white px-10 py-4 rounded-2xl hover:bg-orange-600 transition-all text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-stone-900/10"
            >
              Réserver
            </button>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-stone-900 p-2 bg-stone-50 rounded-xl" aria-label="Menu">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M12 12h8M16 18h4" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-b border-stone-100 py-10 animate-in slide-in-from-top duration-500 shadow-xl">
          <div className="flex flex-col space-y-10 px-8">
            <button onClick={() => scrollToSection('histoire')} className="text-stone-900 text-sm font-black uppercase tracking-[0.2em] text-left">L'Histoire</button>
            <button onClick={() => scrollToSection('menu')} className="text-stone-900 text-sm font-black uppercase tracking-[0.2em] text-left">La Carte</button>
            <button onClick={() => scrollToSection('reserve')} className="text-stone-900 text-sm font-black uppercase tracking-[0.2em] text-left">Réservation</button>
            <button onClick={() => scrollToSection('reserve')} className="bg-stone-900 text-white px-8 py-6 rounded-[2rem] text-center text-sm font-black uppercase tracking-[0.3em] shadow-2xl">RÉSERVER UNE TABLE</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
