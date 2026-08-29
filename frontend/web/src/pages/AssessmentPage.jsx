import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import EditProfileDrawer from '../components/EditProfileDrawer';
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
  Target,
  ChevronRight
} from 'lucide-react';
import {
  getAssessmentsApi,
  getAssessmentDetailApi,
  startAssessmentAttemptApi,
  submitAssessmentAnswerApi,
  completeAssessmentAttemptApi,
  getMyLatestAssessmentResultApi,
  generateRecommendationsApi,
  getLatestRecommendationsApi,
} from '../api/client';

export const AssessmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const forceTakeMode = searchParams.get('mode') === 'take' || searchParams.get('retake') === 'true';

  // Dashboard Shell State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  // Assessment State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('intro'); // 'intro' | 'quiz' | 'submitting' | 'result'
  
  const [assessment, setAssessment] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { question_id: selected_option_id }
  const [result, setResult] = useState(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [recommendationError, setRecommendationError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [location.search]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Check if user already has a completed result, unless force take mode is requested
      const latestResult = await getMyLatestAssessmentResultApi().catch(() => null);
      if (latestResult && !forceTakeMode) {
        setResult(latestResult);
        setStep('result');
        // Fetch existing recommendations
        setIsGeneratingRecs(true);
        try {
          const recRes = await getLatestRecommendationsApi();
          setRecommendations(recRes);
        } catch (recErr) {
          console.error('Failed to load existing recommendations:', recErr);
        } finally {
          setIsGeneratingRecs(false);
        }
        setLoading(false);
        return;
      }

      // 2. Fetch active assessments for quiz attempt
      const assessmentsList = await getAssessmentsApi();
      if (!assessmentsList || assessmentsList.length === 0) {
        setError('No active career assessments available at this time.');
        setLoading(false);
        return;
      }

      const defaultAssessmentId = assessmentsList[0].id;
      const detail = await getAssessmentDetailApi(defaultAssessmentId);
      setAssessment(detail);
      setStep('intro');
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
    setRecommendationError(null);
    setRecommendations(null);
    try {
      const res = await completeAssessmentAttemptApi(attempt.id);
      setResult(res);
      setStep('result');
      
      // Try generating recommendations in the background
      setIsGeneratingRecs(true);
      try {
        const recRes = await generateRecommendationsApi();
        setRecommendations(recRes);
      } catch (recErr) {
        console.error('Failed to generate career recommendations:', recErr);
        setRecommendationError('Your assessment is saved, but personalised recommendations could not be generated right now.');
      } finally {
        setIsGeneratingRecs(false);
      }
    } catch (err) {
      console.error('Failed to complete assessment:', err);
      setError(err.response?.data?.detail || 'Failed to calculate assessment result.');
      setStep('quiz');
    }
  };

  const handleRetryGenerateRecommendations = async () => {
    setRecommendationError(null);
    setIsGeneratingRecs(true);
    try {
      const recRes = await generateRecommendationsApi();
      setRecommendations(recRes);
    } catch (recErr) {
      console.error('Failed to generate career recommendations:', recErr);
      setRecommendationError('Your assessment is saved, but personalised recommendations could not be generated right now.');
    } finally {
      setIsGeneratingRecs(false);
    }
  };

  const handleRetakeAssessment = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    try {
      let currentAssessment = assessment;
      if (!currentAssessment) {
        const assessmentsList = await getAssessmentsApi();
        if (!assessmentsList || assessmentsList.length === 0) {
          setError('No active career assessments available at this time.');
          setLoading(false);
          return;
        }
        const defaultAssessmentId = assessmentsList[0].id;
        currentAssessment = await getAssessmentDetailApi(defaultAssessmentId);
        setAssessment(currentAssessment);
      }

      const newAttempt = await startAssessmentAttemptApi(currentAssessment.id);
      setAttempt(newAttempt);
      setStep('quiz');
    } catch (err) {
      console.error('Failed to retake assessment:', err);
      setError(err.response?.data?.detail || 'Failed to retake assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#0F172A] flex font-sans selection:bg-[#005F60] selection:text-white">
      {/* Dashboard Sidebar Navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Viewport */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)}
          onEditProfileClick={() => setIsEditDrawerOpen(true)}
        />

        {/* Dashboard Assessment Container */}
        <main className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">

          {/* Loading Indicator */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-600">
              <Loader2 className="w-8 h-8 animate-spin text-[#005F60]" />
              <span className="text-sm font-bold text-[#0F172A]">Loading Career Discovery Assessment...</span>
            </div>
          )}

          {/* Error Banner */}
          {!loading && error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-3 max-w-7xl mx-auto">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* STEP 1: INTRO SCREEN */}
          {!loading && step === 'intro' && assessment && (
            <div className="max-w-4xl mx-auto space-y-6">
              <Card className="shadow-xs border border-slate-200/80 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-teal-900 via-[#005F60] to-teal-950 text-white p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-extrabold text-teal-300 bg-teal-950/80 px-3 py-1 rounded-full border border-teal-700/80">
                      Karnataka Student Guidance
                    </span>
                    <span className="text-xs font-bold text-teal-200 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#F97316]" /> Career Discovery
                    </span>
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl text-white font-black tracking-tight">
                    {assessment.title || 'Career Discovery Assessment'}
                  </CardTitle>
                  <CardDescription className="text-teal-100/90 text-xs sm:text-sm mt-2 leading-relaxed font-medium">
                    {assessment.description || 'Discover subjects, educational routes, and career directions aligned with your interests and academic background.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-[#F8FAF8] border border-slate-200/80 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Questions</span>
                      <span className="text-base font-black text-[#0F172A]">{assessment.questions?.length || 10} Questions</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#F8FAF8] border border-slate-200/80 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Time</span>
                      <span className="text-base font-black text-[#0F172A]">~5 Minutes</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#F8FAF8] border border-slate-200/80 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coverage</span>
                      <span className="text-base font-black text-[#0F172A]">PUC, Diploma, ITI</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-xs text-teal-950 font-medium space-y-2">
                    <div className="flex items-center gap-2 font-black text-[#005F60] text-sm">
                      <Compass className="w-4 h-4 text-[#005F60]" />
                      What this assessment helps you discover:
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1 leading-relaxed">
                      <li>Subject and activity preferences (Science, Mathematics, Arts, Business)</li>
                      <li>Learning and problem-solving preferences (Practical hands-on vs Analytical)</li>
                      <li>Educational routes after SSLC & PUC (Polytechnic Diploma, ITI Trades, PUC Streams)</li>
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="p-6 sm:p-8 pt-0 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-[#005F60] cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Dashboard</span>
                  </button>

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
            </div>
          )}

          {/* STEP 2: QUIZ / QUESTION SCREEN */}
          {!loading && step === 'quiz' && assessment && (
            <div className="max-w-3xl mx-auto">
              <Card className="shadow-md border border-slate-200/80 rounded-3xl overflow-hidden bg-white">
                
                {/* Progress Header */}
                <div className="p-6 bg-slate-900 text-white border-b border-slate-800">
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
                      className="bg-[#F97316] h-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIdx + 1) / assessment.questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question & Options */}
                {assessment.questions[currentQuestionIdx] && (
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#005F60] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                        Section: {assessment.questions[currentQuestionIdx].dimension}
                      </span>
                      <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A] leading-snug">
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
                            className={`p-4 rounded-2xl border text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-teal-50/80 border-[#005F60] text-teal-950 shadow-2xs ring-2 ring-[#005F60]/20'
                                : 'bg-[#F8FAF8] border-slate-200 text-slate-800 hover:border-teal-300 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#005F60] text-white' : 'bg-slate-200 text-slate-600'
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
                <CardFooter className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-3xl">
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
            </div>
          )}

          {/* STEP 3: SUBMITTING PROCESSING SCREEN */}
          {!loading && step === 'submitting' && (
            <div className="max-w-xl mx-auto py-12">
              <Card className="shadow-md p-12 text-center border border-slate-200 rounded-3xl bg-white flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-[#005F60]" />
                <h2 className="text-xl font-black text-[#0F172A]">Generating Your Career Direction Signals...</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Analyzing responses across Science, Commerce, Arts, Polytechnic Diploma, and ITI Vocational options.
                </p>
              </Card>
            </div>
          )}

          {/* STEP 4: RESULT SCREEN (Authenticated Dashboard Shell) */}
          {!loading && step === 'result' && result && (
            <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in-rise">
              
              {/* Header Banner */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-[#005F60] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Assessment completed</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0F172A] tracking-tight">
                      Your Career Direction
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      Exploration guidance signals generated from your responses to help you discover suitable education routes.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center space-x-2 bg-[#F8FAF8] hover:bg-teal-50 text-slate-700 hover:text-[#005F60] border border-slate-200 hover:border-teal-200 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Dashboard</span>
                  </button>
                </div>
              </div>

              {/* 2-Column Desktop Grid for Results */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column (7 cols): Main Recommendation & Guidance Cards */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Primary Direction Card */}
                  <div className="bg-gradient-to-br from-teal-900 via-[#005F60] to-teal-950 text-white border border-teal-800 rounded-3xl p-6 sm:p-8 shadow-md space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-teal-300 bg-teal-950/80 px-3 py-0.5 rounded-full border border-teal-700/80 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#F97316]" /> Primary Direction
                      </span>
                      <span className="text-xs text-teal-200 font-bold">Strong Alignment</span>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {result.primary_stream_recommendation}
                      </h2>
                      <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed font-medium">
                        Your responses show stronger alignment with educational pathways in this stream post Class 10 SSLC.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-teal-800/80 flex items-center justify-between">
                      <span className="text-xs text-teal-200">Ready to see available options?</span>
                      <button
                        type="button"
                        onClick={() => navigate('/pathways')}
                        className="bg-[#F97316] hover:bg-orange-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs inline-flex items-center space-x-1.5 cursor-pointer"
                      >
                        <span>Explore pathways</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Other Strong Areas Card */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <span className="text-xs font-black uppercase tracking-wider text-[#005F60]">
                        Other Strong Areas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-[#F8FAF8] border border-slate-200/80 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Secondary Direction</span>
                        <span className="font-extrabold text-[#005F60] text-sm block">
                          {result.secondary_stream_recommendation || 'Polytechnic Diploma'}
                        </span>
                      </div>

                      {result.top_career_match && (
                        <div className="p-4 rounded-2xl bg-[#F8FAF8] border border-slate-200/80 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Suggested Target Role</span>
                          <span className="font-extrabold text-[#F97316] text-sm block">
                            {result.top_career_match}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      These secondary signals highlight related technical or professional routes you may also enjoy exploring.
                    </p>
                  </div>

                  {/* Guidance Report */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#005F60]">
                      Guidance Report
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                      {result.summary_text || 'Your responses indicate areas worth exploring. Use these insights as tools for career exploration, not fixed diagnoses.'}
                    </p>
                  </div>

                </div>

                {/* Right Column (5 cols): Dimension Scores & Next Actions */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Dimension Aptitude Breakdown */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#005F60] flex items-center space-x-1.5">
                        <BarChart3 className="w-4 h-4 text-[#005F60]" />
                        <span>Aptitude Breakdown</span>
                      </h3>
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
                          <div key={dim} className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-slate-800">{dimLabelMap[dim] || dim}</span>
                              <span className="text-[#005F60]">{score} pts ({pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-[#005F60] h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Next Action Box */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      What would you like to do next?
                    </h3>

                    <div className="space-y-3">
                      {/* Recommendations Loading State */}
                      {isGeneratingRecs && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center space-x-2 text-slate-600 animate-pulse font-sans">
                          <Loader2 className="w-4 h-4 animate-spin text-[#005F60] shrink-0" />
                          <span className="font-bold">Generating personalized recommendations...</span>
                        </div>
                      )}

                      {/* Recommendations Success State */}
                      {!isGeneratingRecs && recommendations && recommendations.recommendations && recommendations.recommendations.length > 0 && (
                        <button
                          type="button"
                          onClick={() => navigate('/pathways')}
                          className="w-full bg-[#F97316] hover:bg-orange-500 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-between cursor-pointer font-sans"
                        >
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-white" />
                            <span>View My Recommended Pathways</span>
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}

                      {/* Recommendations Error State */}
                      {!isGeneratingRecs && recommendationError && (
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900 font-sans">
                          <p className="font-semibold">{recommendationError}</p>
                          <button
                            type="button"
                            onClick={handleRetryGenerateRecommendations}
                            className="bg-[#005F60] hover:bg-teal-800 text-white font-extrabold px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            Retry Generating Recommendations
                          </button>
                        </div>
                      )}

                      {/* Default Explore Pathways Button */}
                      {(!recommendations || !recommendations.recommendations || recommendations.recommendations.length === 0) && !isGeneratingRecs && !recommendationError && (
                        <button
                          type="button"
                          onClick={() => navigate('/pathways')}
                          className="w-full bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-between cursor-pointer font-sans"
                        >
                          <span>Explore pathways</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleRetakeAssessment}
                        className="w-full text-center text-xs font-bold text-[#005F60] hover:underline pt-2 cursor-pointer flex items-center justify-center space-x-1.5 font-sans"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retake assessment</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

        </main>

        {/* Dashboard Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-8 text-center text-xs text-slate-500 mt-8">
          Udaan AI — Student Career Discovery Assessment
        </footer>
      </div>

      {/* Edit Profile Drawer */}
      <EditProfileDrawer 
        isOpen={isEditDrawerOpen} 
        onClose={() => setIsEditDrawerOpen(false)} 
      />
    </div>
  );
};

export default AssessmentPage;
