import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Compass, LogIn, UserPlus } from 'lucide-react';

/**
 * Public Exploration Auth Prompt Modal
 * Displays a lightweight prompt when an unauthenticated visitor attempts to explore a pathway on the public homepage.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} [props.pathwayLabel]
 * @param {Function} props.onSignIn
 * @param {Function} props.onRegister
 */
export const ExploreAuthPrompt = ({
  isOpen,
  onClose,
  pathwayLabel = 'this pathway',
  onSignIn,
  onRegister,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center space-y-4 font-sans py-1">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/90 text-[#005F60] flex items-center justify-center shadow-2xs">
          <Compass className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Explore {pathwayLabel ? `"${pathwayLabel}"` : 'this pathway'} in detail
          </h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
            Sign in to see courses, eligibility, entrance routes, recommendations, and step-by-step career pathways.
          </p>
        </div>

        <div className="flex flex-col w-full space-y-2 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={onSignIn}
            className="w-full bg-[#005F60] hover:bg-teal-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
            rightIcon={<LogIn className="w-4 h-4 text-white" />}
          >
            <span>Sign In</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={onRegister}
            className="w-full bg-[#E06D14] hover:bg-[#C2580E] text-white font-bold text-xs py-2.5 rounded-xl shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
            rightIcon={<UserPlus className="w-4 h-4 text-white" />}
          >
            <span>Create Account</span>
          </Button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors py-1 cursor-pointer"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExploreAuthPrompt;
