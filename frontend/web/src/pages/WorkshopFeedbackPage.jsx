import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWorkshopFeedbackContextApi, submitWorkshopFeedbackApi } from '../api/client';
import { normalizeApiError } from '../utils/errorHandler';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Star,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

const RATING_LABELS = {
  1: '1 — Needs Improvement',
  2: '2 — Fair',
  3: '3 — Good',
  4: '4 — Very Good',
  5: '5 — Excellent',
};

const TOPIC_TITLES = {
  polytechnic_vs_puc: 'Polytechnic Diploma vs PUC Science Deep Dive',
  future_skills: 'Future Skills & Emerging Industry Trades',
  career_guidance: 'Career Guidance & Stream Selection',
};

export const WorkshopFeedbackPage = () => {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    const fetchContext = async () => {
      if (!token) {
        setLoadError('Missing feedback link token.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setLoadError(null);
        const data = await getWorkshopFeedbackContextApi(token);
        setContext(data);
        if (data.already_submitted) {
          setSubmittedSuccess(true);
        }
      } catch (err) {
        setLoadError(normalizeApiError(err, 'Invalid or expired feedback link.'));
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!rating || rating < 1 || rating > 5) {
      setSubmitError('Please select a rating between 1 and 5 stars.');
      return;
    }

    if (comments.length > 1000) {
      setSubmitError('Comments cannot exceed 1000 characters.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      await submitWorkshopFeedbackApi(token, {
        rating,
        comments: comments.trim() ? comments.trim() : null,
      });
      setSubmittedSuccess(true);
    } catch (err) {
      setSubmitError(normalizeApiError(err, 'Failed to submit feedback.'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatTopics = (topics) => {
    if (!topics || topics.length === 0) return 'General Career Guidance';
    return topics.map((t) => TOPIC_TITLES[t] || t.replace(/_/g, ' ')).join(', ');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 py-4 px-6 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-black text-xl tracking-tight text-slate-950">
              Udaan <span className="text-[#005F60]">AI</span>
            </span>
          </Link>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Coordinator Feedback
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-10 px-4">
        <div className="max-w-xl mx-auto">
          {loading ? (
            <Card className="p-12 text-center space-y-3 border-slate-200">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-[#005F60] rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">Loading workshop details...</p>
            </Card>
          ) : loadError ? (
            <Card className="p-8 text-center space-y-4 border-rose-200 bg-white shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">Invalid Feedback Link</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {loadError}
              </p>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center text-xs font-bold text-[#005F60] hover:text-[#004D4E]"
                >
                  <span>Return to Homepage</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </Card>
          ) : submittedSuccess ? (
            <Card className="p-8 sm:p-10 text-center space-y-4 border-teal-200 bg-white shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#005F60] border border-teal-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-950">Thank You for Your Feedback!</h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Your rating and observations for <strong className="text-slate-900">{context?.institution_name}</strong> have been recorded. This helps us continue delivering high-impact career orientation for students across Karnataka.
              </p>
              <div className="pt-4 border-t border-slate-100 flex justify-center">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-[#005F60] hover:bg-[#004D4E] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <span>Explore Udaan AI</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Context Card */}
              <Card className="p-6 border-slate-200 bg-white shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="bg-teal-50 text-[#005F60] border border-teal-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Completed Workshop
                    </span>
                    <h1 className="text-xl font-extrabold text-slate-950 mt-1.5">
                      {context?.institution_name}
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatTopics(context?.preferred_topics)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-[#005F60]" />
                  </div>
                </div>

                <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3 flex items-start space-x-2 text-xs text-teal-950 font-medium leading-relaxed">
                  <Info className="w-4 h-4 text-[#005F60] shrink-0 mt-0.5" />
                  <span>
                    <strong>Coordinator Feedback via Shared Link:</strong> For school and college coordinators. Please submit your feedback on the session conducted for your students.
                  </span>
                </div>
              </Card>

              {/* Feedback Form */}
              <Card className="p-6 sm:p-8 border-slate-200 bg-white shadow-sm">
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {submitError && (
                    <div
                      role="alert"
                      className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start space-x-2 text-rose-800 text-xs"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Rating Field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Overall Workshop Rating <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const isHighlighted = (hoverRating || rating) >= starValue;
                        return (
                          <button
                            key={starValue}
                            type="button"
                            onClick={() => {
                              setRating(starValue);
                              setSubmitError(null);
                            }}
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(0)}
                            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                            className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#005F60]"
                          >
                            <Star
                              className={`w-8 h-8 transition-colors ${
                                isHighlighted
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-slate-300 hover:text-slate-400'
                              }`}
                            />
                          </button>
                        );
                      })}
                      {(hoverRating || rating) > 0 && (
                        <span className="text-xs font-bold text-slate-700 ml-2">
                          {RATING_LABELS[hoverRating || rating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comments Field */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label htmlFor="coordinator-comments" className="block text-xs font-bold text-slate-800">
                        Comments & Suggestions <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <span className={`text-[10px] ${comments.length > 1000 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                        {comments.length} / 1000
                      </span>
                    </div>
                    <textarea
                      id="coordinator-comments"
                      rows="4"
                      maxLength={1000}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Share feedback on facilitator clarity, student engagement, relevance to Class 10/PUC options, or suggestions for follow-up sessions..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#005F60] leading-relaxed"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      fullWidth
                      disabled={submitting || !rating}
                      className="bg-[#005F60] hover:bg-[#004D4E] text-white font-extrabold py-3 shadow-xs disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white">
        © {new Date().getFullYear()} Udaan AI — Empowering Karnataka Youth with Informed Career Decisions
      </footer>
    </div>
  );
};

export default WorkshopFeedbackPage;
