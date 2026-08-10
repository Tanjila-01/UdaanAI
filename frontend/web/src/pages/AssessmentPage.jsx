import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';

import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Tag from '../components/ui/Tag';
import {
  Compass,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Award,
  BookOpen,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import {
  getAssessmentsApi,
  getAssessmentDetailApi,
  startAssessmentAttemptApi,
  submitAssessmentAnswerApi,
  completeAssessmentAttemptApi,
  getMyLatestAssessmentResultApi,
} from '../api/client';

export const AssessmentPage = () => {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('intro'); // 'intro' | 'quiz' | 'submitting' | 'result'
  
  const [assessment, setAssessment] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { question_id: selected_option_id }
  const [result, setResult] = useState(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Check if user already has a completed result
      const latestResult = await getMyLatestAssessmentResultApi().catch(() => null);
      if (latestResult) {
        setResult(latestResult);
        setStep('result');
        setLoading(false);
        return;
      }

      // 2. Fetch active assessments
      const assessmentsList = await getAssessmentsApi();
      if (!assessmentsList || assessmentsList.length === 0) {
        setError('No active career assessments available at this time.');
        setLoading(false);
        return;
      }

      const defaultAssessmentId = assessmentsList[0].id;
      const detail = await getAssessmentDetailApi(defaultAssessmentId);
      setAssessment(detail);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load assessment data:', err);
      setError(err.response?.data?.detail || 'Failed to load assessment. Please try again.');
      setLoading(false);
    }
  };

  const handleStartAssessment = async () => {
    if (!assessment) return;
    setLoading(true);
    setError(null);
    try {
      const newAttempt = await startAssessmentAttemptApi(assessment.id);
      setAttempt(newAttempt);
      setStep('quiz');
      setCurrentQuestionIdx(0);
    } catch (err) {
      console.error('Failed to start attempt:', err);
      setError(err.response?.data?.detail || 'Failed to start assessment attempt.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleNextQuestion = async () => {
    if (!assessment || !attempt) return;
    const currentQ = assessment.questions[currentQuestionIdx];
    const selectedOptId = selectedAnswers[currentQ.id];

    if (!selectedOptId) return;

    setIsSubmittingAnswer(true);
    try {
      await submitAssessmentAnswerApi(attempt.id, currentQ.id, selectedOptId);
      if (currentQuestionIdx < assessment.questions.length - 1) {
        setCurrentQuestionIdx((prev) => prev + 1);
      } else {
        // Last question answered -> trigger completion
        handleCompleteAssessment();
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
      setError('Failed to submit your answer. Please try again.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    }
  };

  const handleCompleteAssessment = async () => {
    if (!attempt) return;
    setStep('submitting');
    try {
      const res = await completeAssessmentAttemptApi(attempt.id);
      setResult(res);
      setStep('result');
    } catch (err) {
      console.error('Failed to complete assessment:', err);
      setError(err.response?.data?.detail || 'Failed to calculate assessment result.');
      setStep('quiz');
    }
  };

  const handleRetakeAssessment = async () => {
    setResult(null);
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setStep('intro');
    if (!assessment) {
      fetchInitialData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-slate-600">
            <Loader2 className="w-8 h-8 animate-spin text-[#005F60]" />
            <span className="text-sm font-semibold">Initializing Assessment Engine...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      <main className="flex-1 py-12">
        <Container size="lg">

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-600 font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* STEP 1: INTRO SCREEN */}
          {step === 'intro' && assessment && (
            <Card className="max-w-3xl mx-auto shadow-md border border-slate-200">
              <CardHeader className="bg-gradient-to-r from-teal-900 to-[#005F60] text-white p-8 rounded-t-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" size="sm">
                    Karnataka SSLC Aptitude
                  </Badge>
                  <span className="text-xs font-bold text-teal-200 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Deterministic Engine
                  </span>
                </div>
                <CardTitle className="text-2xl sm:text-3xl text-white font-extrabold tracking-tight">
                  {assessment.title}
                </CardTitle>
                <CardDescription className="text-teal-100/90 text-xs sm:text-sm mt-2 leading-relaxed font-medium">
                  {assessment.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Questions</span>
                    <span className="text-lg font-extrabold text-slate-950">{assessment.questions?.length || 10} Questions</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estimated Time</span>
                    <span className="text-lg font-extrabold text-slate-950">~5 Minutes</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Coverage</span>
                    <span className="text-lg font-extrabold text-slate-950">PUC, Diploma, ITI</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200 text-xs text-teal-950 font-medium space-y-2">
                  <div className="flex items-center gap-2 font-bold text-teal-900 text-sm">
                    <Compass className="w-4 h-4 text-[#005F60]" />
                    What this assessment evaluates:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                    <li>Academic subject preferences (Math, Science, Social Studies, Commerce)</li>
                    <li>Problem-solving style (Theoretical vs Practical hardware hands-on)</li>
                    <li>Technical trade inclination (Software, Automation, Finance, Trades)</li>
                    <li>Higher education route readiness (KCET, DCET, NCVT Trades)</li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="p-8 pt-0 flex justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartAssessment}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Start Assessment
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* STEP 2: QUIZ / QUESTION SCREEN */}
          {step === 'quiz' && assessment && (
            <Card className="max-w-3xl mx-auto shadow-md border border-slate-200">
              
              {/* Progress Header */}
              <div className="p-6 bg-slate-900 text-white rounded-t-2xl border-b border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold mb-3">
                  <span className="text-teal-400 uppercase tracking-wider">
                    Question {currentQuestionIdx + 1} of {assessment.questions.length}
                  </span>
                  <span className="text-slate-400 font-semibold">
                    {Math.round(((currentQuestionIdx + 1) / assessment.questions.length) * 100)}% Completed
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#E06D14] h-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIdx + 1) / assessment.questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question & Options */}
              {assessment.questions[currentQuestionIdx] && (
                <CardContent className="p-8 space-y-6">
                  
                  <div className="space-y-2">
                    <Badge variant="neutral" size="sm">
                      Dimension: {assessment.questions[currentQuestionIdx].dimension}
                    </Badge>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-950 leading-snug">
                      {assessment.questions[currentQuestionIdx].question_text}
                    </h2>
                  </div>

                  {/* Options Stack */}
                  <div className="space-y-3 pt-2">
                    {assessment.questions[currentQuestionIdx].options.map((opt) => {
                      const isSelected = selectedAnswers[assessment.questions[currentQuestionIdx].id] === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleSelectOption(assessment.questions[currentQuestionIdx].id, opt.id)}
                          className={`p-4 rounded-xl border text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-teal-50 border-[#005F60] text-teal-950 shadow-xs ring-1 ring-[#005F60]'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[#005F60] text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {opt.option_code}
                            </span>
                            <span>{opt.option_text}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-[#005F60] shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}

              {/* Navigation Footer */}
              <CardFooter className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
                <Button
                  variant="outline"
                  size="md"
                  disabled={currentQuestionIdx === 0 || isSubmittingAnswer}
                  onClick={handlePrevQuestion}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  disabled={!selectedAnswers[assessment.questions[currentQuestionIdx]?.id] || isSubmittingAnswer}
                  isLoading={isSubmittingAnswer}
                  onClick={handleNextQuestion}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {currentQuestionIdx === assessment.questions.length - 1 ? 'Complete Assessment' : 'Next Question'}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* STEP 3: SUBMITTING PROCESSING SCREEN */}
          {step === 'submitting' && (
            <Card className="max-w-xl mx-auto shadow-md p-12 text-center border border-slate-200 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-[#005F60]" />
              <h2 className="text-xl font-bold text-slate-950">Calculating Your Career Aptitude & Stream Signals...</h2>
              <p className="text-xs text-slate-600 font-medium">
                Evaluating answers across PUC Science, Polytechnic Diploma, Commerce, Arts, and ITI Vocational dimensions.
              </p>
            </Card>
          )}

          {/* STEP 4: RESULT SCREEN */}
          {step === 'result' && result && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-rise">
              
              {/* Header Badge */}
              <div className="text-center space-y-2">
                <Badge variant="primary" size="md" dot>
                  Assessment Complete
                </Badge>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                  Your Karnataka Stream Match Results
                </h1>
                <p className="text-sm text-slate-600 font-semibold">
                  Deterministic profile signals generated for your career journey.
                </p>
              </div>

              {/* Main Recommendations Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Primary Stream */}
                <Card className="border-2 border-teal-600 bg-gradient-to-br from-teal-50/50 to-white shadow-md">
                  <CardHeader>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#005F60] flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#E06D14]" /> Primary Stream Match
                    </span>
                    <CardTitle className="text-2xl text-slate-950 font-extrabold mt-1">
                      {result.primary_stream_recommendation}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-slate-700 leading-relaxed font-medium">
                    Your assessment responses indicate the highest alignment with this education stream post Class 10 SSLC.
                  </CardContent>
                </Card>

                {/* Secondary & Career Match */}
                <Card className="border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                  <CardHeader>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      Secondary Stream & Target Role
                    </span>
                    <div className="space-y-2 mt-1">
                      <span className="text-sm font-bold text-slate-800 block">
                        Secondary Stream: <span className="text-[#005F60]">{result.secondary_stream_recommendation || 'Polytechnic Diploma'}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <Tag className="text-xs font-bold bg-orange-50 text-[#C2580E] border-orange-200">
                          Target Role: {result.top_career_match}
                        </Tag>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs text-slate-600 font-medium">
                    Recommended next step: Explore pathways matching these recommendations in the Pathway Explorer.
                  </CardContent>
                </Card>

              </div>

              {/* Dimension Aptitude Breakdown */}
              <Card className="border border-slate-200 bg-white shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#005F60]" />
                      Aptitude Score Breakdown by Dimension
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Weighted score accumulated from your 10 assessment answers.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {result.dimension_scores && Object.entries(result.dimension_scores).map(([dim, score]) => {
                    const maxPossible = 15;
                    const pct = Math.min(100, Math.round((score / maxPossible) * 100));
                    const dimLabelMap = {
                      science: 'PUC Science Aptitude',
                      diploma: 'Polytechnic Diploma Aptitude',
                      commerce: 'PUC Commerce Aptitude',
                      arts: 'PUC Arts & Humanities',
                      iti: 'ITI Trade Skills',
                    };

                    return (
                      <div key={dim} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-800">{dimLabelMap[dim] || dim}</span>
                          <span className="text-[#005F60]">{score} pts ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-[#005F60] h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Summary Text */}
              <Card className="border border-slate-200 bg-slate-900 text-white p-6 sm:p-8 rounded-2xl">
                <h4 className="text-sm font-bold uppercase tracking-wider text-teal-400 mb-2">
                  Assessment Summary Report
                </h4>
                <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                  {result.summary_text}
                </p>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleRetakeAssessment}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Retake Assessment
                </Button>

                <div className="flex items-center gap-3">
                  <Link to="/dashboard">
                    <Button variant="outline" size="md">
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link to="/pathways">
                    <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Explore Pathways
                    </Button>
                  </Link>
                </div>
              </div>

            </div>
          )}

        </Container>
      </main>

      <Footer />
    </div>
  );
};

export default AssessmentPage;
