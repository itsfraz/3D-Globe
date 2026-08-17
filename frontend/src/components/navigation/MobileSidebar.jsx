import React, { useEffect } from 'react';
import { X, Sparkles, Trophy, Layers, Heart, User } from 'lucide-react';

export default function MobileSidebar({
  isOpen,
  onClose,
  onOpenExplore,
  onOpenCompare,
  onOpenQuiz,
  onOpenAIGuide,
  onOpenLayers,
  onOpenJourney,
  userJourneyFavoritesCount
}) {
  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleAction = (action) => {
    if (action) action();
    onClose();
  };

  return (
    <>
      {/* Overlay Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside 
        id="mobile-sidebar"
        className={`fixed top-0 right-0 z-50 h-[100dvh] w-[min(85vw,360px)] bg-[#070a12]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-bold gradient-text">Menu</h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-2">
          
          <button 
            type="button"
            onClick={() => handleAction(onOpenExplore)}
            className="w-full text-left px-4 py-3 rounded-xl text-teal-300 hover:text-teal-200 hover:bg-teal-500/10 font-bold transition-colors flex items-center gap-3"
          >
            <Sparkles size={18} /> 
            Explore the World
          </button>
          
          <button 
            type="button"
            onClick={() => handleAction(onOpenCompare)}
            className="w-full text-left px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-semibold transition-colors flex items-center gap-3"
          >
            <div className="w-[18px]" /> {/* Spacer for alignment if no icon */}
            Compare
          </button>
          
          <button 
            type="button"
            onClick={() => handleAction(onOpenQuiz)}
            className="w-full text-left px-4 py-3 rounded-xl text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 font-bold transition-colors flex items-center gap-3"
          >
            <Trophy size={18} /> 
            Geo Challenge
          </button>
          
          <button 
            type="button"
            onClick={() => handleAction(onOpenAIGuide)}
            className="w-full text-left px-4 py-3 rounded-xl text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 font-bold transition-colors flex items-center gap-3"
          >
            <Sparkles size={18} /> 
            AI Guide
          </button>
          
          <div className="h-px bg-white/10 my-2" />

          <button 
            type="button"
            onClick={() => handleAction(onOpenLayers)}
            className="w-full text-left px-4 py-3 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-medium transition-colors flex items-center gap-3 sm:hidden"
          >
            <Layers size={18} /> 
            Map Layers
          </button>

          <button 
            type="button"
            onClick={() => handleAction(onOpenJourney)}
            className="w-full text-left px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium transition-colors flex items-center gap-3 sm:hidden relative"
          >
            <Heart size={18} /> 
            My Journey
            {userJourneyFavoritesCount > 0 && (
              <span className="absolute right-4 w-5 h-5 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center text-xs font-bold">
                {userJourneyFavoritesCount}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => handleAction(onOpenJourney)}
            className="w-full text-left px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium transition-colors flex items-center gap-3 sm:hidden"
          >
            <User size={18} /> 
            Profile
          </button>

        </div>
      </aside>
    </>
  );
}
