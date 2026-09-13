import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, MessageCircle, Route, Sparkles } from 'lucide-react';

export default function DashboardOverview({ firstName, academicContextStr, assessmentResult, activeGoal, recommendations, loading, assessmentError, goalError, freshnessCheckError }) {
  const current = assessmentResult?.is_current === true;
  const outdated = recommendations?.is_outdated || recommendations?.freshness_status === 'outdated';
  const unknown = freshnessCheckError || recommendations?.freshness_status === 'unknown';
  const matches = recommendations?.recommendations?.length || 0;
  const progress = Math.max(0, Math.min(100, Number(activeGoal?.progress?.percentage) || 0));
  const complete = activeGoal?.status === 'COMPLETED';
  const next = !current
    ? { title: assessmentResult ? 'Your interests can grow with you.' : 'Find a direction that feels like you.', text: assessmentResult ? 'Refresh your interests for your current education stage before exploring your latest matches.' : 'Start with your interests. Discover subjects and career directions worth exploring, one step at a time.', label: assessmentResult ? 'Refresh my interests' : 'Discover my interests', href: '/assessment?mode=take' }
    : !activeGoal
      ? { title: 'Turn your interests into possibilities.', text: 'Explore your saved matches, understand what each pathway involves and choose a direction to work towards.', label: 'Explore my pathways', href: '/pathways' }
      : { title: complete ? 'Look how far you have come.' : 'Small steps. A clearer future.', text: complete ? 'Your roadmap checklist is complete. Review your progress and explore what comes next.' : `Keep moving towards ${activeGoal.goal_title || 'your chosen goal'}. Your roadmap has the next steps ready.`, label: complete ? 'Review my roadmap' : 'Continue my roadmap', href: '/my-roadmap' };
  const failed = assessmentError || goalError;
  return (
    <>
      <header className="dashboard-welcome">
        <div><p className="dashboard-eyebrow">YOUR CAREER SPACE</p><h1>Welcome back, {firstName}<span className="dashboard-greeting-dot">.</span></h1><p>A little clarity today. More possibilities tomorrow.</p></div>
        <span className="dashboard-context">{academicContextStr || 'Your learning journey'}</span>
      </header>
      <section className="dashboard-overview" aria-label="Your next step and advisor">
        <div className="dashboard-focus" aria-busy={loading}>
          <span className="dashboard-eyebrow"><Sparkles size={15} aria-hidden="true" /> YOUR NEXT STEP</span>
          <h2>{loading ? 'Getting your journey ready…' : failed ? 'Your career space is here.' : next.title}</h2>
          <p>{loading ? 'Checking your interests, saved matches and roadmap.' : failed ? 'Some progress could not be loaded. Retry below, or keep exploring career pathways.' : next.text}</p>
          {!loading && <Link className="dashboard-primary" to={failed ? '/pathways' : next.href}>{failed ? 'Explore pathways' : next.label}<ArrowRight size={18} aria-hidden="true" /></Link>}
          <span className="dashboard-focus-note">Your interests are a starting point. You choose the direction.</span>
        </div>
        <div className="dashboard-advisor">
          <span className="dashboard-advisor-icon"><MessageCircle size={25} aria-hidden="true" /></span>
          <span className="dashboard-eyebrow">MEET UDAAN</span>
          <h2>A question is a good place to start.</h2>
          <p>Understand a career, talk through your matches or ask what to explore next.</p>
          <Link className="dashboard-text-link" to="/student/ai-career">Talk to your AI advisor <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>
      <section className="dashboard-stats" aria-label="Your journey at a glance" aria-busy={loading}>
        <Link to="/assessment" className="dashboard-stat"><Sparkles aria-hidden="true" /><div><span>Your interests</span><strong>{loading ? 'Loading…' : assessmentError ? 'Check unavailable' : current ? 'Ready to explore' : assessmentResult ? 'Refresh needed' : 'Not discovered yet'}</strong><small>{current ? 'Review what you learned about yourself' : 'Discover My Interests'}</small></div><ArrowRight size={16} aria-hidden="true" /></Link>
        <Link to="/pathways" className="dashboard-stat"><Compass aria-hidden="true" /><div><span>Saved career matches</span><strong>{loading ? 'Loading…' : unknown ? 'Check unavailable' : `${matches} ${matches === 1 ? 'pathway' : 'pathways'}`}</strong><small>{outdated ? 'Update needed · review below' : matches ? 'Explore your options side by side' : 'Explore available career directions'}</small></div><ArrowRight size={16} aria-hidden="true" /></Link>
        <Link to="/my-roadmap" className="dashboard-stat"><Route aria-hidden="true" /><div><span>Your roadmap</span><strong>{loading ? 'Loading…' : goalError ? 'Check unavailable' : activeGoal ? `${progress}% complete` : 'Choose your first goal'}</strong><small>{activeGoal ? `${activeGoal.progress?.completed || 0} of ${activeGoal.progress?.total || 0} milestones completed` : 'Build a plan at your own pace'}</small></div><ArrowRight size={16} aria-hidden="true" /></Link>
      </section>
    </>
  );
}
