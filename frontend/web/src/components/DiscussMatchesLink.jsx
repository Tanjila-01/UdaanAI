import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function DiscussMatchesLink() {
  return <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-2">
    <p className="text-sm text-slate-600">Your assessment helps find your matches. Udaan helps you understand them.</p>
    <Link to="/student/ai-career?intent=explain_recommendations" className="inline-flex items-center gap-2 text-sm font-bold text-teal-800 hover:underline">
      <Sparkles size={17} /><span>Understand my matches with Udaan</span><ArrowRight size={16} />
    </Link>
  </div>;
}
