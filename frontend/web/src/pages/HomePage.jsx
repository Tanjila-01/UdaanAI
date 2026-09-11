import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAccountAction } from '../utils/accountActions';
import EducationPathwayMap, { STRUCTURAL_NODES, getVisualNodeId } from '../components/product/EducationPathwayMap';
import PathwayDetailPanel from '../components/product/PathwayDetailPanel';
import ExploreAuthPrompt from '../components/product/ExploreAuthPrompt';
import WorkshopRequestModal from '../components/product/WorkshopRequestModal';
import { getPathwayDetailApi } from '../api/client';
import { getCanonicalPathwayId } from '../utils/pathwayAdapter';

// Layout & UI Components
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import CTABanner from '../components/layout/CTABanner';

import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import AnimatedStat from '../components/ui/AnimatedStat';
import ProgressBar from '../components/ui/ProgressBar';
import WorkshopCard from '../components/product/WorkshopCard';

import {
  Send,
  ArrowRight,
  Sparkles,
  Compass,
  Target,
  GraduationCap,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  HelpCircle,
  School,
  Layers,
  Zap,
  Route as RouteIcon,
  Map as MapIcon,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPathwayParam = searchParams.get('pathway_id') || searchParams.get('id') || searchParams.get('node');

  const { user, profile, loading } = useAuth();
  const accountAction = getAccountAction(user, profile, loading);

  // Hero visual image asset slot
  const heroImageSrc = '/hero_career_pathway.png';

  // State for Public Pathway Map Preview (Section 5)
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [workshopModalOpen, setWorkshopModalOpen] = useState(false);
  const [selectedWorkshopTopic, setSelectedWorkshopTopic] = useState('career_guidance');
  const [targetNodeLabel, setTargetNodeLabel] = useState('');
  const [selectedPublicNodeId, setSelectedPublicNodeId] = useState(null);

  // State for Public Read-Only Pathway Details
  const [publicPathwayDetail, setPublicPathwayDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [isPathwayUnavailable, setIsPathwayUnavailable] = useState(false);
  const activeFetchRequestIdRef = useRef(0);

  // State for Merged Capability Flow (Section 4)
  const [activeFlowStep, setActiveFlowStep] = useState(0);

  // Smooth scroll to section when URL hash is present (with reduced-motion awareness)
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        Boolean(window.matchMedia('(prefers-reduced-motion: reduce)')?.matches);
      const behavior = prefersReducedMotion ? 'auto' : 'smooth';

      const scrollToTarget = () => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior });
          return true;
        }
        return false;
      };

      if (!scrollToTarget()) {
        const timer = setTimeout(scrollToTarget, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [location.hash]);

  const fetchPathwayDetail = async (pathwayId) => {
    if (!pathwayId) {
      setPublicPathwayDetail(null);
      setDetailLoading(false);
      setDetailError(null);
      setIsPathwayUnavailable(false);
      return;
    }

    const canonicalId = getCanonicalPathwayId(pathwayId);
    const requestId = ++activeFetchRequestIdRef.current;
    setDetailLoading(true);
    setDetailError(null);
    setIsPathwayUnavailable(false);

    try {
      const data = await getPathwayDetailApi(canonicalId);
      // Stale response protection
      if (requestId !== activeFetchRequestIdRef.current) return;

      if (!data) {
        setIsPathwayUnavailable(true);
        setPublicPathwayDetail(null);
      } else {
        setPublicPathwayDetail(data);
        setIsPathwayUnavailable(false);
      }
    } catch (err) {
      if (requestId !== activeFetchRequestIdRef.current) return;
      if (err.response?.status === 404) {
        setIsPathwayUnavailable(true);
        setPublicPathwayDetail(null);
      } else {
        setDetailError(err);
        setPublicPathwayDetail(null);
      }
    } finally {
      if (requestId === activeFetchRequestIdRef.current) {
        setDetailLoading(false);
      }
    }
  };

  const handleRetryDetail = () => {
    if (rawPathwayParam) {
      fetchPathwayDetail(rawPathwayParam);
    }
  };

  // Sync pathway from URL search param (supports refresh and Back/Forward)
  useEffect(() => {
    if (rawPathwayParam) {
      const visualNode = getVisualNodeId(rawPathwayParam) || rawPathwayParam;
      setSelectedPublicNodeId(visualNode);
      fetchPathwayDetail(rawPathwayParam);
    } else {
      setSelectedPublicNodeId(null);
      setPublicPathwayDetail(null);
      setDetailLoading(false);
      setDetailError(null);
      setIsPathwayUnavailable(false);
    }
  }, [rawPathwayParam]);

  // Click handler for public homepage map nodes
  const handlePublicNodeClick = (nodeId) => {
    const node = STRUCTURAL_NODES[nodeId];
    const pathwayLabel = node ? node.label : 'this pathway';
    const pathwayId = node?.pathwayId || nodeId;

    if (!user) {
      // Logged out visitor -> Show Auth Prompt Modal
      setSelectedPublicNodeId(nodeId);
      setTargetNodeLabel(pathwayLabel);
      setAuthPromptOpen(true);
    } else if (user.role === 'admin') {
      // Admin -> Show selected pathway's read-only details within the public homepage
      setSelectedPublicNodeId(nodeId);
      setSearchParams({ pathway_id: pathwayId }, { replace: false });
    } else {
      // Logged in student -> Navigate to student /pathways
      navigate(`/pathways?pathway_id=${encodeURIComponent(pathwayId)}`);
    }
  };

  const handleOpenWorkshopModal = (topicId = 'career_guidance') => {
    setSelectedWorkshopTopic(topicId);
    setWorkshopModalOpen(true);
  };

  // Merged 5-Step Experience Data ("From Self-Discovery to Career Direction")
  const flowSteps = [
    {
      id: 'discover',
      stepNum: '01',
      tabTitle: 'Discover Yourself',
      title: 'Understand Strengths & Interests',
      shortDesc: 'Understand interests, strengths, preferences and academic context.',
      fullDesc: 'Take a career discovery assessment designed around your current education stage, interests, strengths, and the decisions ahead of you.',
      bullets: [
        'Aptitude & interest pattern matching',
        'Questions tailored to your current education stage',
        'Karnataka curriculum and route alignment'
      ],
      icon: <Compass className="w-5 h-5 text-[#005F60]" />,
      badge: 'Step 01: Stage-Aware Assessment',
      targetRoute: '/assessment',
      ctaLabel: 'Take Assessment'
    },
    {
      id: 'explore',
      stepNum: '02',
      tabTitle: 'Explore Pathways',
      title: 'Explore Education & Career Pathways',
      shortDesc: 'See how PUC streams, diplomas, ITI trades, and higher degrees connect.',
      fullDesc: 'See how PUC streams, Polytechnic Diploma programs, ITI trades, higher education options, and career directions connect so you can understand where each choice can lead.',
      bullets: [
        'Understand what comes after each education choice',
        'Explore PUC, Diploma, ITI and higher-education routes',
        'See how courses connect to future career directions'
      ],
      icon: <RouteIcon className="w-5 h-5 text-[#005F60]" />,
      badge: 'Step 02: Explore Pathways',
      targetRoute: '/pathways',
      ctaLabel: 'Explore Pathways'
    },
    {
      id: 'choose',
      stepNum: '03',
      tabTitle: 'Choose a Direction',
      title: 'Choose the Direction That Fits You',
      shortDesc: 'Select an education or career direction as your active goal.',
      fullDesc: 'Review your recommended pathways, understand the available routes, and choose the direction you want to work toward.',
      bullets: [
        'Review recommendations aligned with your assessment',
        'Commit to an active education or career target',
        'Unlock your personalized milestone roadmap'
      ],
      icon: <Target className="w-5 h-5 text-[#005F60]" />,
      badge: 'Step 03: Select Goal',
      targetRoute: '/pathways',
      ctaLabel: 'Choose Direction'
    },
    {
      id: 'roadmap',
      stepNum: '04',
      tabTitle: 'Build Your Roadmap',
      title: 'Turn Your Direction Into a Roadmap',
      shortDesc: 'Turn a chosen direction into a structured sequence of milestones.',
      fullDesc: 'After selecting your direction, Udaan AI structures your journey into clear sequential milestones from your current stage to higher studies and career entry.',
      bullets: [
        'Clear grade-by-grade milestone markers',
        'Entrance exam milestones: KCET, NEET, DCET',
        'Key academic and skill preparation steps'
      ],
      icon: <MapIcon className="w-5 h-5 text-[#005F60]" />,
      badge: 'Step 04: Milestone Roadmap',
      targetRoute: '/my-roadmap',
      ctaLabel: 'View My Roadmap'
    },
    {
      id: 'track',
      stepNum: '05',
      tabTitle: 'Track Your Progress',
      title: 'Keep Moving Forward',
      shortDesc: 'Keep track of important milestones and next steps.',
      fullDesc: 'Continuously track your milestones, review your progress, and stay focused on the next concrete action in your educational journey.',
      bullets: [
        'Track completed and upcoming milestones',
        'Clear next-step indicators for your active goal',
        'Review and update your educational direction anytime'
      ],
      icon: <TrendingUp className="w-5 h-5 text-[#005F60]" />,
      badge: 'Step 05: Milestone Progress',
      targetRoute: '/dashboard',
      ctaLabel: 'Track Progress'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#005F60] selection:text-white">

      {/* GLOBAL NAVBAR */}
      <Navbar />

      <main className="flex-1">

        {/* ========================================================= */}
        {/* SECTION 1: HERO SECTION */}
        {/* ========================================================= */}
        <section id="hero" className="relative pt-16 pb-12 lg:pt-20 lg:pb-16 bg-white overflow-hidden scroll-mt-28 border-b border-slate-100">

          {/* RIGHT ARTWORK INTEGRATION */}
          <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[58%] xl:w-[55%] h-full pointer-events-none flex items-center justify-end z-0">
            <div className="relative w-full h-full flex items-center justify-end">
              <div className="absolute inset-y-0 left-0 w-24 sm:w-36 lg:w-48 bg-gradient-to-r from-white via-white/85 to-transparent z-10" />
              <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent z-10" />
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent z-10" />

              <img
                src={heroImageSrc}
                alt="Student career pathway showing education choices from Class 10 to future career opportunities."
                className="w-full h-full object-contain object-right opacity-95 block"
              />
            </div>
          </div>

          <Container size="xl" className="relative z-10">
            <div className="max-w-xl lg:max-w-md xl:max-w-lg flex flex-col items-start gap-4">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#004D4E] text-[11px] font-bold tracking-wide uppercase shadow-2xs">
                <Send className="w-3.5 h-3.5 text-[#C2580E] animate-paper-plane" />
                <span>AI Career Platform for Karnataka</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[40px] xl:text-[46px] font-extrabold text-slate-950 tracking-tight leading-[1.15]">
                Discover Your <br />
                Pathway. <br />
                <span className="text-[#005F60]">Build Your Future</span> <br />
                with Confidence.
              </h1>

              {/* Paragraph */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium max-w-md">
                Every year, students in Karnataka finish Class 10 exploring whether to choose <strong>PUC, Polytechnic Diploma</strong>, or <strong>ITI Trades</strong>. Udaan AI provides step-by-step guidance mapped to real opportunities.
              </p>

              {/* Hero CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link to={accountAction.destination || '#'}>
                  <Button
                    variant="primary"
                    size="md"
                    disabled={accountAction.isLoading}
                    className="bg-[#005F60] hover:bg-[#004D4E] text-white font-bold shadow-sm hover:shadow-md transition-all duration-200 rounded-xl px-5 h-11 text-xs sm:text-sm"
                    rightIcon={<ArrowRight className="w-4 h-4 text-white" />}
                  >
                    {accountAction.label}
                  </Button>
                </Link>

                <a href="#pathways">
                  <Button
                    variant="outline"
                    size="md"
                    className="font-bold text-slate-800 bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs rounded-xl px-5 h-11 text-xs sm:text-sm"
                  >
                    Explore Pathways
                  </Button>
                </a>
              </div>

            </div>
          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 2: STATS STRIP (FACTUAL & VERIFIABLE) */}
        {/* ========================================================= */}
        <section id="about" className="py-6 sm:py-8 bg-slate-50/60 border-b border-slate-200/60 scroll-mt-28">
          <Container size="xl">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <AnimatedStat
                numericValue={31}
                label="Districts Covered"
                subtitle="Statewide Karnataka outreach"
                trend="Statewide"
                icon={<ShieldCheck className="w-5 h-5" />}
              />
              <AnimatedStat
                numericValue={3}
                label="Core Education Routes"
                subtitle="PUC, Polytechnic Diploma & ITI"
                trend="Post-10th"
                icon={<GraduationCap className="w-5 h-5" />}
              />
              <AnimatedStat
                numericValue={12}
                suffix="+"
                label="Stream Combinations"
                subtitle="PCMB, PCMC, CEBA, HEPS & Trades"
                trend="Curricular"
                icon={<RouteIcon className="w-5 h-5" />}
              />
              <AnimatedStat
                numericValue={4}
                label="Workshop Topics"
                subtitle="Available for schools & colleges"
                trend="On Request"
                icon={<Calendar className="w-5 h-5" />}
              />
            </div>
          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 3: THE CAREER CROSSROADS PROBLEM */}
        {/* ========================================================= */}
        <section id="problem" className="py-8 sm:py-10 lg:py-12 bg-slate-950 text-white relative overflow-hidden scroll-mt-28">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#005F60]/20 blur-3xl pointer-events-none" />

          <Container size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

              {/* Story Narrative */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <Badge variant="warning" size="md" dot>
                  The Career Crossroads Problem
                </Badge>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Class 10 Shouldn't Feel Like a Blind Choice.
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  Every year across Karnataka, hundreds of thousands of students complete SSLC Class 10. Clear information about stream differences, diploma pathways, and admission eligibility helps students make confident choices.
                </p>

                <div className="flex flex-col gap-2.5 pt-1">
                  <div className="flex items-center gap-3 text-xs text-slate-100 font-bold bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Should I choose PUC Science or a Polytechnic Diploma?</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-100 font-bold bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>What is the difference between ITI Electrician and Diploma ECE?</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-100 font-bold bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Which stream leads to software engineering without JEE?</span>
                  </div>
                </div>
              </div>

              {/* Visual Decision Matrix */}
              <div className="lg:col-span-7">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl relative">
                  <div className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-5 flex items-center justify-between">
                    <span>The Decision Maze</span>
                    <span className="text-slate-400 font-bold">Class 10 SSLC Junction</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { name: 'PUC Science', tag: 'PCMB / PCMC', color: 'border-teal-500/70 bg-teal-950/70 text-teal-200' },
                      { name: 'PUC Commerce', tag: 'CEBA / SEBA', color: 'border-amber-500/70 bg-amber-950/70 text-amber-200' },
                      { name: 'PUC Arts', tag: 'HEPS / Humanities', color: 'border-purple-500/70 bg-purple-950/70 text-purple-200' },
                      { name: 'Polytechnic Diploma', tag: '3-Year Technical', color: 'border-blue-500/70 bg-blue-950/70 text-blue-200' },
                      { name: 'ITI Trade', tag: 'NCVT Certified', color: 'border-emerald-500/70 bg-emerald-950/70 text-emerald-200' },
                      { name: 'Engineering (B.E)', tag: 'KCET Entrance', color: 'border-cyan-500/70 bg-cyan-950/70 text-cyan-200' },
                      { name: 'Medical (MBBS)', tag: 'NEET Entrance', color: 'border-rose-500/70 bg-rose-950/70 text-rose-200' },
                      { name: 'Chartered Accountant', tag: 'CA Foundation', color: 'border-orange-500/70 bg-orange-950/70 text-orange-200' },
                    ].map((item, i) => (
                      <div key={i} className={`p-3 rounded-xl border text-center flex flex-col justify-between gap-1 ${item.color}`}>
                        <span className="text-xs font-bold">{item.name}</span>
                        <span className="text-[10px] font-bold opacity-90">{item.tag}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-xs text-slate-300 font-medium">
                      Udaan AI replaces guesswork with a clear, step-by-step pathway map.
                    </span>
                    <Link to={accountAction.destination || '#'}>
                      <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        {user ? accountAction.label : "Explore Pathways"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 4: GUIDED INTERACTIVE FLOW */}
        {/* ========================================================= */}
        <section id="how-it-works" className="py-8 sm:py-10 lg:py-12 bg-white border-b border-slate-100 scroll-mt-28">
          <Container size="xl">

            <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
              <Badge variant="primary" size="md" dot className="mb-2">
                Guided System
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                From Self-Discovery to Career Direction
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
                Understand strengths, explore connected pathways, choose a direction, and follow structured milestones.
              </p>
            </div>

            {/* Step Selection Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-8 w-fit max-w-full mx-auto p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/90 shadow-2xs">
              {flowSteps.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveFlowStep(idx)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
                    activeFlowStep === idx
                      ? 'bg-[#005F60] text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-white/80'
                  }`}
                >
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    activeFlowStep === idx ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {step.stepNum}
                  </span>
                  <span>{step.tabTitle}</span>
                </button>
              ))}
            </div>

            {/* Active Step Showcase */}
            <div className="max-w-5xl mx-auto bg-slate-50 border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                {/* Left: Step Description */}
                <div className="lg:col-span-6 flex flex-col items-start gap-3.5">
                  <Badge variant="primary" size="sm" className="bg-teal-100 text-[#004D4E] border-teal-200">
                    {flowSteps[activeFlowStep].badge}
                  </Badge>

                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                    {flowSteps[activeFlowStep].title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    {flowSteps[activeFlowStep].fullDesc}
                  </p>

                  <div className="flex flex-col gap-2 py-1 w-full">
                    {flowSteps[activeFlowStep].bullets.map((bullet, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs text-slate-800 font-medium bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-[#005F60] shrink-0" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>

                  <Link 
                    to={
                      user?.role === 'admin'
                        ? (activeFlowStep === 1 || activeFlowStep === 2 ? "/#pathways" : "/admin")
                        : (user ? flowSteps[activeFlowStep].targetRoute : "/register")
                    } 
                    className="pt-1"
                  >
                    <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      {user?.role === 'admin'
                        ? (activeFlowStep === 1 || activeFlowStep === 2 ? "Explore Pathways" : "Admin Dashboard")
                        : (user ? flowSteps[activeFlowStep].ctaLabel : (activeFlowStep === 1 ? "Explore Pathways" : "Try This Step Now"))}
                    </Button>
                  </Link>
                </div>

                {/* Right: Dynamic Visual Diagram Preview */}
                <div className="lg:col-span-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs min-h-[280px] flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        {flowSteps[activeFlowStep].icon}
                        <span className="text-xs font-bold text-slate-900">
                          {flowSteps[activeFlowStep].tabTitle} Preview
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#005F60] font-bold uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Interactive Engine
                      </span>
                    </div>

                    {activeFlowStep === 0 && (
                      <div className="py-3 space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-800">
                            <span>Logical & Technical Reasoning</span>
                            <span className="text-[#005F60]">88%</span>
                          </div>
                          <ProgressBar value={88} variant="primary" size="md" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-800">
                            <span>Hands-on Engineering Aptitude</span>
                            <span className="text-[#E06D14]">92%</span>
                          </div>
                          <ProgressBar value={92} variant="warning" size="md" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-800">
                            <span>Business & Commerce Analysis</span>
                            <span className="text-blue-600">74%</span>
                          </div>
                          <ProgressBar value={74} variant="info" size="md" />
                        </div>
                      </div>
                    )}

                    {activeFlowStep === 1 && (
                      <div className="py-2.5 space-y-2">
                        <div className="flex flex-col items-center">
                          <div className="px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>Class 10 (SSLC)</span>
                          </div>
                          <div className="w-0.5 h-2 bg-slate-300"></div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-teal-50 border border-teal-300 text-center">
                            <span className="text-[9px] font-black uppercase tracking-wider text-[#005F60]">Recommended</span>
                            <span className="text-xs font-black text-teal-950">PUC Science</span>
                            <span className="text-[10px] text-teal-700 font-medium">PCMB / PCMC</span>
                          </div>
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                            <span className="text-xs font-bold text-slate-700">Polytechnic</span>
                            <span className="text-[10px] text-slate-500 font-medium">3-Yr Diploma</span>
                          </div>
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                            <span className="text-xs font-bold text-slate-700">ITI Trades</span>
                            <span className="text-[10px] text-slate-500 font-medium">Vocational</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-1 pt-0.5">
                          <div className="w-0.5 h-2 bg-teal-500"></div>
                          <div className="w-full p-2 rounded-xl bg-[#005F60] text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-teal-300"></span>
                              <span className="text-xs font-bold">B.E / B.Tech (Engineering)</span>
                            </div>
                            <span className="text-[10px] text-teal-200 font-mono">KCET / JEE</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeFlowStep === 2 && (
                      <div className="py-2.5 space-y-2.5">
                        <div className="p-3 rounded-xl bg-teal-50/90 border-2 border-[#005F60] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#005F60] bg-teal-100/80 px-2 py-0.5 rounded-full border border-teal-200">
                              Recommended Direction
                            </span>
                            <span className="text-[10px] font-bold text-teal-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#005F60]" /> Aligned
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">Pre-University Science (PCMC)</h4>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                              Direct eligibility for Karnataka B.E / B.Tech engineering admissions via KCET.
                            </p>
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">Alternative: Polytechnic Diploma</span>
                            <span className="text-[10px] text-slate-500">Computer Science & Engineering</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            Available
                          </span>
                        </div>
                      </div>
                    )}

                    {activeFlowStep === 3 && (
                      <div className="py-2.5 space-y-2">
                        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">1</div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-900 block truncate">10th SSLC Board Examination</span>
                            <span className="text-[10px] text-slate-500">Foundation marks in Math & Science</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-teal-50 border border-teal-200">
                          <div className="w-6 h-6 rounded-full bg-[#005F60] text-white flex items-center justify-center font-bold text-xs shrink-0">2</div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-[#005F60] block truncate">PUC Science & CET Prep</span>
                            <span className="text-[10px] text-teal-700 font-medium">Physics, Chemistry, Math & CS</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="w-6 h-6 rounded-full bg-[#F97316] text-white flex items-center justify-center font-bold text-xs shrink-0">3</div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-900 block truncate">KCET Engineering Allotment</span>
                            <span className="text-[10px] text-slate-500">Karnataka State Engineering Counselling</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeFlowStep === 4 && (
                      <div className="py-2 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span>Milestone Progress</span>
                          <span className="text-[#005F60]">2 of 4 Steps Completed</span>
                        </div>
                        <ProgressBar value={50} variant="primary" size="md" />
                        <div className="space-y-1 pt-0.5 text-xs">
                          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Explore education pathways</span>
                          </div>
                          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Select active direction: PUC Science</span>
                          </div>
                          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-50 text-amber-900 font-semibold border border-amber-200">
                            <span className="w-2 h-2 rounded-full bg-[#F97316] shrink-0 ml-1 mr-0.5"></span>
                            <span>Next: 1st PUC board preparation</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                      <span>Udaan AI Guidance Engine</span>
                      <span className="text-[#005F60] font-bold">Karnataka Curriculum Aligned</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 5: PUBLIC PATHWAY MAP PREVIEW */}
        {/* ========================================================= */}
        <section id="pathways" className="py-8 sm:py-10 lg:py-12 bg-slate-50 border-b border-slate-200/60 scroll-mt-28 font-sans">
          <Container size="xl">

            <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
              <Badge variant="primary" size="md" dot className="mb-2">
                Explore Common Routes After SSLC
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Explore Karnataka Education Pathways
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium leading-relaxed">
                See how PUC, Polytechnic Diploma, ITI, streams, and future study directions connect across Karnataka education boards.
              </p>
            </div>

            <div className="max-w-7xl mx-auto bg-white/60 border border-slate-200/80 p-3 sm:p-5 rounded-3xl shadow-xs">
              <EducationPathwayMap 
                compactMobile
                selectedNodeId={selectedPublicNodeId}
                onSelectNode={handlePublicNodeClick}
              />
            </div>

            {/* Read-Only Public Pathway Detail Presentation */}
            {(rawPathwayParam || detailLoading || detailError || isPathwayUnavailable || user?.role === 'admin') && (
              <div id="pathway-detail-section" className="mt-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Badge variant="primary" size="sm" className="bg-teal-50 text-[#005F60] border-teal-200">
                      Public Catalog Preview
                    </Badge>
                    <span className="text-xs text-slate-500 font-medium">Read-Only Information</span>
                  </div>
                  {rawPathwayParam && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPublicNodeId(null);
                        setSearchParams({}, { replace: false });
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                    >
                      Clear selection
                    </button>
                  )}
                </div>

                {isPathwayUnavailable ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-center space-y-3 font-sans">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-800">Pathway Details Unavailable</h4>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                      The selected pathway is currently not available in the public catalog. Please select another stream or option on the map above.
                    </p>
                  </div>
                ) : (
                  <PathwayDetailPanel
                    detail={publicPathwayDetail}
                    loading={detailLoading}
                    error={detailError}
                    onRetry={handleRetryDetail}
                  />
                )}
              </div>
            )}

          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 7: WORKSHOPS WE CAN ARRANGE (HONEST INSTITUTIONAL) */}
        {/* ========================================================= */}
        <section id="workshops" className="py-8 sm:py-10 lg:py-12 bg-slate-50 border-b border-slate-200/60 scroll-mt-28">
          <Container size="xl">

            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-6 sm:mb-8 gap-4">
              <div>
                <Badge variant="primary" size="md" className="bg-teal-50 text-[#005F60] border-teal-200 mb-2">
                  For Schools & Colleges
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                  Workshops We Can Arrange
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 max-w-xl">
                  For school and college coordinators requesting a group workshop. Individual student registration is not available.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenWorkshopModal('career_guidance')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005F60] hover:text-[#004D4E] bg-white border border-slate-200 hover:border-teal-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <span>Request a Workshop</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <WorkshopCard
                title="Polytechnic Diploma vs PUC Science Deep Dive"
                topic="Helping Class 10 SSLC students understand hands-on 3-year polytechnic diplomas versus 2-year pre-university degrees, including DTE lateral entry to B.Tech."
                focusAreas={[
                  'PUC vs Diploma curriculum differences',
                  'Lateral entry to 2nd year B.Tech',
                  'Karnataka DTE admission timeline'
                ]}
                deliveryMode="Campus Session or Virtual"
                actionLabel="Request this Workshop"
                onRequest={() => handleOpenWorkshopModal('polytechnic_vs_puc')}
              />
              <WorkshopCard
                title="Future Skills & Emerging Industry Trades"
                topic="Practical orientation to high-demand vocational trades, NCVT industrial certifications, renewable solar tech, and structured apprenticeships."
                focusAreas={[
                  'NCVT trade certification pathways',
                  'Electrician & industrial automation',
                  'Apprenticeship and early career entry'
                ]}
                deliveryMode="Campus Session or Virtual"
                actionLabel="Request this Workshop"
                onRequest={() => handleOpenWorkshopModal('future_skills')}
              />
              <WorkshopCard
                title="Career Guidance & Stream Selection"
                topic="Comprehensive decision-making framework for SSLC Class 10 students navigating PCMB, PCMC, CEBA, and humanities combinations."
                focusAreas={[
                  'Aptitude and interest alignment',
                  'Entrance exam overview (KCET, NEET, CA)',
                  'Degree and job market directions'
                ]}
                deliveryMode="Campus Session or Virtual"
                actionLabel="Request this Workshop"
                onRequest={() => handleOpenWorkshopModal('career_guidance')}
              />
            </div>

          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 8: GUIDANCE FOCUS AREAS */}
        {/* ========================================================= */}
        <section id="guidance-focus" className="py-8 sm:py-10 lg:py-12 bg-white border-b border-slate-100 scroll-mt-28">
          <Container size="xl">

            <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
              <Badge variant="primary" size="md" className="bg-teal-50 text-[#005F60] border-teal-200 mb-2">
                Curricular Focus
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Structured Guidance for Every Pathway
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
                Clear, transparent route mapping aligned with Karnataka Secondary and Technical Education Boards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#004D4E] flex items-center justify-center font-bold text-sm mb-3">
                    <GraduationCap className="w-5 h-5 text-[#005F60]" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-950 mb-1.5">Pre-University Colleges (PUC)</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Detailed mapping of Science (PCMB/PCMC), Commerce (CEBA/SEBA), and Arts (HEPS) streams leading to university degree programs and professional entrance exams like KCET and NEET.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Duration: 2 Years</span>
                  <span className="text-[#005F60]">Academic Path</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm mb-3">
                    <Layers className="w-5 h-5 text-sky-700" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-950 mb-1.5">Polytechnic Technical Diplomas</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Three-year practical technical engineering education under DTE Karnataka offering direct lateral entry into the 2nd year of B.E / B.Tech degree programs via DCET.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Duration: 3 Years</span>
                  <span className="text-sky-700">DTE Lateral Entry</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm mb-3">
                    <Zap className="w-5 h-5 text-amber-700" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-950 mb-1.5">ITI Vocational Trades</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Job-oriented industrial trade certificates (Electrician, Electronics, Fitter, COPA) certified by NCVT for early technical career entry and verified state apprenticeships.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Duration: 1–2 Years</span>
                  <span className="text-amber-700">NCVT Certified</span>
                </div>
              </div>

            </div>
          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 9: SCHOOL & INSTITUTION PARTICIPATION */}
        {/* ========================================================= */}
        <section id="school-invitation" className="py-8 sm:py-10 lg:py-12 bg-slate-950 text-white relative overflow-hidden border-b border-slate-800 scroll-mt-28">
          <Container size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

              <div className="lg:col-span-8 flex flex-col items-start gap-4">
                <Badge variant="primary" size="md">
                  School & College Participation
                </Badge>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Bring Udaan AI to Your Institution
                </h2>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium max-w-2xl">
                  Schools, PU colleges, and polytechnics across Karnataka can partner with Udaan AI to bring structured career guidance, stream exploration workshops, and student assessment tools directly to their campuses.
                </p>

                {/* Honest CTA action */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenWorkshopModal('career_guidance')}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#005F60] hover:bg-[#004D4E] transition-all shadow-md cursor-pointer"
                  >
                    <span>Request a Workshop</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center flex flex-col items-center gap-2.5 shadow-lg">
                <School className="w-8 h-8 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Institutional Outreach</h3>
                <p className="text-xs text-slate-300 font-medium">
                  Statewide guidance sessions for SSLC Class 10 and PUC schools across all 31 Karnataka districts.
                </p>
              </div>

            </div>
          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 10: FINAL CALL TO ACTION */}
        {/* ========================================================= */}
        <section id="cta" className="py-8 sm:py-10 lg:py-12 bg-white scroll-mt-28">
          <Container size="xl">
            <CTABanner
              title="Explore your next education step"
              description="Understand your options, reflect on your interests, and build a roadmap at your own pace."
              primaryCtaText="Explore Pathways"
              onPrimaryCtaClick={() => {
                const el = document.getElementById('pathways');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              secondaryCtaText={accountAction.label}
              onSecondaryCtaClick={() => {
                if (accountAction.destination) navigate(accountAction.destination);
              }}
            />
          </Container>
        </section>

      </main>

      {/* GLOBAL FOOTER */}
      <Footer onRequestWorkshop={() => handleOpenWorkshopModal('career_guidance')} />

      {/* Public Exploration Auth Prompt Modal */}
      <ExploreAuthPrompt
        isOpen={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        pathwayLabel={targetNodeLabel}
        onSignIn={() => navigate('/login')}
        onRegister={() => navigate('/register')}
      />

      {/* Institutional Workshop Request Form Modal */}
      <WorkshopRequestModal
        isOpen={workshopModalOpen}
        onClose={() => setWorkshopModalOpen(false)}
        initialTopic={selectedWorkshopTopic}
      />
    </div>
  );
};

export default HomePage;
