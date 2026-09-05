import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EducationPathwayMap, { STRUCTURAL_NODES } from '../components/product/EducationPathwayMap';
import ExploreAuthPrompt from '../components/product/ExploreAuthPrompt';
import WorkshopRequestModal from '../components/product/WorkshopRequestModal';

// Layout & UI Components
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import SectionHeader from '../components/layout/SectionHeader';
import SectionContainer from '../components/ui/SectionContainer';
import CTABanner from '../components/layout/CTABanner';

import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Tag from '../components/ui/Tag';
import AnimatedStat from '../components/ui/AnimatedStat';
import ProgressBar from '../components/ui/ProgressBar';
import WorkshopCard from '../components/product/WorkshopCard';

import {
  Send,
  ArrowRight,
  Sparkles,
  Compass,
  Target,
  BookOpen,
  GraduationCap,
  Users,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Cpu,
  Layers,
  Award,
  Zap,
  ChevronRight,
  School,
  MapPin,
  Quote,
  GitBranch,
  Milestone,
  HelpCircle,
  Clock,
  Check,
  CheckCircle,
  FileCheck,
  BarChart3,
  Layers3,
  Lightbulb,
  CheckSquare,
  Route as RouteIcon,
  Map as MapIcon
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Hero visual image asset slot
  const heroImageSrc = '/hero_career_pathway.png';

  // State for Public Pathway Map Preview (Section 5)
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [workshopModalOpen, setWorkshopModalOpen] = useState(false);
  const [targetNodeLabel, setTargetNodeLabel] = useState('');
  const [selectedPublicNodeId, setSelectedPublicNodeId] = useState('puc-science');

  // State for Interactive Stream Explorer (Section 5)
  const [activeBranch, setActiveBranch] = useState('science');

  // State for Merged Capability Flow (Section 4)
  const [activeFlowStep, setActiveFlowStep] = useState(0);

  // State for Personalized Roadmap Step Focus (Section 6)
  const [activeRoadmapStep, setActiveRoadmapStep] = useState(0);

  // Smooth scroll to section when URL hash is present
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.hash]);

  // Click handler for public homepage map nodes
  const handlePublicNodeClick = (nodeId) => {
    const node = STRUCTURAL_NODES[nodeId];
    const pathwayLabel = node ? node.label : 'this pathway';
    setSelectedPublicNodeId(nodeId);

    if (!user) {
      // Logged out visitor -> Show Auth Prompt Modal
      setTargetNodeLabel(pathwayLabel);
      setAuthPromptOpen(true);
    } else {
      // Logged in user -> Navigate to /pathways with selected node context (does NOT alter profile)
      const pathwayId = node?.pathwayId || nodeId;
      navigate(`/pathways?pathway_id=${encodeURIComponent(pathwayId)}`);
    }
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
      visualType: 'radar',
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
      visualType: 'pathways',
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
      visualType: 'choose',
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
      visualType: 'roadmap',
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
      visualType: 'track',
      targetRoute: '/dashboard',
      ctaLabel: 'Track Progress'
    }
  ];

  // Stream data for Branch Explorer (Section 5)
  const branchData = {
    science: {
      title: 'Pre-University Science (PUC Science)',
      badge: '2 Years (11th & 12th)',
      subtitle: 'For students aiming for Engineering (KCET/JEE), Medical (NEET), AI Research, or Pure Sciences.',
      subTracks: [
        { name: 'PCMB Stream', desc: 'Physics, Chemistry, Math, Biology → Medical, Biotechnology, Agri-Science' },
        { name: 'PCMC Stream', desc: 'Physics, Chemistry, Math, Computer Science → B.E./B.Tech, AI & ML, Software Engineering' },
      ],
      entranceExams: ['KCET Karnataka', 'NEET UG', 'JEE Main'],
      careerOutcomes: ['AI & Software Engineer', 'Medical Doctor', 'Biotech Researcher', 'Data Scientist'],
    },
    commerce: {
      title: 'Pre-University Commerce (PUC Commerce)',
      badge: '2 Years (11th & 12th)',
      subtitle: 'For students interested in Business, Chartered Accountancy, Corporate Law, and Finance.',
      subTracks: [
        { name: 'CEBA Stream', desc: 'Computer Science, Economics, Business, Accountancy → B.Com, Fintech, Data Analytics' },
        { name: 'SEBA Stream', desc: 'Statistics, Economics, Business, Accountancy → CA Foundation, Actuarial Science' },
      ],
      entranceExams: ['CA Foundation', 'CUET', 'CLAT Law Entrance'],
      careerOutcomes: ['Chartered Accountant (CA)', 'Financial Analyst', 'Fintech Specialist', 'Corporate Lawyer'],
    },
    arts: {
      title: 'Pre-University Arts & Humanities',
      badge: '2 Years (11th & 12th)',
      subtitle: 'For students targeting Civil Services (UPSC/KPSC), Journalism, Psychology, and Design.',
      subTracks: [
        { name: 'HEPS Stream', desc: 'History, Economics, Pol Science, Sociology → Civil Services, Law, Public Policy' },
        { name: 'Psychology & Media', desc: 'Psychology, English Lit, Journalism → Clinical Psychology, Digital Media' },
      ],
      entranceExams: ['CLAT', 'UPSC / KPSC', 'NID / NIFT Entrance'],
      careerOutcomes: ['IAS / KAS Officer', 'UI/UX & Product Designer', 'Journalist', 'Clinical Psychologist'],
    },
    diploma: {
      title: 'Polytechnic Technical Diploma',
      badge: '3 Years (Practical Technical)',
      subtitle: 'Hands-on engineering education with direct 2nd-year Lateral Entry to B.Tech degree programs.',
      subTracks: [
        { name: 'Computer Science & Engineering', desc: 'Software dev, networking, cloud & AI tools → Direct B.Tech 2nd Year' },
        { name: 'Electronics & Communication', desc: 'IoT, robotics, circuits & embedded systems → Industrial Tech' },
      ],
      entranceExams: ['DCET Karnataka (Diploma CET for B.Tech)'],
      careerOutcomes: ['Software Engineer (via B.Tech)', 'Robotics Technician', 'IoT Hardware Engineer'],
    },
    iti: {
      title: 'ITI Vocational Trades',
      badge: '1 - 2 Years (NCVT Certification)',
      subtitle: 'Job-oriented industrial technical trade certification for early career entry and apprenticeship.',
      subTracks: [
        { name: 'Electrician & Solar Trade', desc: 'Industrial wiring, solar installations, motor drives & power systems' },
        { name: 'Electronics Mechanic', desc: 'Consumer electronics repair, PCB testing & equipment maintenance' },
      ],
      entranceExams: ['NCVT Trade Certification', 'Apprenticeship NATS'],
      careerOutcomes: ['Industrial Automation Specialist', 'Solar Power Technician', 'Apprentice Specialist'],
    }
  };

  // 6 Streamlined Roadmap Steps (Section 6)
  const roadmapSteps = [
    { step: 1, title: 'Student Profile', subtitle: 'SSLC / Grade 10 Context', detail: 'Evaluate SSLC subject performance, interests, and location.', badge: 'Input' },
    { step: 2, title: 'Career Goal', subtitle: 'Target Industry Role', detail: 'Select target industry roles like Software, CA, Solar Tech, or Civil Services.', badge: 'Target' },
    { step: 3, title: 'Recommended Pathway', subtitle: 'PUC / Diploma / ITI Route', detail: 'Receive clear stream recommendations tailored to your timeline.', badge: 'Stream' },
    { step: 4, title: 'Entrance Exams', subtitle: 'KCET / NEET / DCET', detail: 'Track mandatory entrance exams, syllabus weightage, and application dates.', badge: 'Exam' },
    { step: 5, title: 'Skills to Learn', subtitle: 'Core Technical Competencies', detail: 'Build essential foundational skills required by your target sector.', badge: 'Skills' },
    { step: 6, title: 'Certifications', subtitle: 'Academic & Certification', detail: 'Attain verified NCVT, Polytechnic Diploma, or University Degree credentials.', badge: 'Outcome' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#005F60] selection:text-white">

      {/* GLOBAL NAVBAR */}
      <Navbar />

      <main className="flex-1">

        {/* ========================================================= */}
        {/* SECTION 1: HERO SECTION */}
        {/* ========================================================= */}
        <section id="hero" className="relative pt-20 pb-14 lg:pt-24 lg:pb-20 bg-white overflow-hidden scroll-mt-28 border-b border-slate-100">

          {/* RIGHT ARTWORK INTEGRATION (Clipped strictly inside Hero container) */}
          <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[58%] xl:w-[55%] h-full pointer-events-none flex items-center justify-end z-0">
            <div className="relative w-full h-full flex items-center justify-end">

              {/* Left-edge smooth gradient mask to blend into white background */}
              <div className="absolute inset-y-0 left-0 w-28 sm:w-40 lg:w-52 bg-gradient-to-r from-white via-white/85 to-transparent z-10" />

              {/* Top and bottom subtle edge fades to blend with hero borders */}
              <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white to-transparent z-10" />
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent z-10" />

              {/* Career Pathway Artwork */}
              <img
                src={heroImageSrc}
                alt="Student career pathway showing education choices from Class 10 to future career opportunities."
                className="w-full h-full object-contain object-right opacity-95 block"
              />

            </div>
          </div>

          <Container size="xl" className="relative z-10">
            <div className="max-w-xl lg:max-w-md xl:max-w-lg flex flex-col items-start gap-5">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#004D4E] text-[11px] font-bold tracking-wide uppercase shadow-2xs">
                <Send className="w-3.5 h-3.5 text-[#C2580E] animate-paper-plane" />
                <span>AI Career Platform for Karnataka</span>
              </div>

              {/* 4-Line Headline (Matching Reference Composition) */}
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] xl:text-[48px] font-extrabold text-slate-950 tracking-tight leading-[1.14]">
                Discover Your <br />
                Pathway. <br />
                <span className="text-[#005F60]">Build Your Future</span> <br />
                with Confidence.
              </h1>

              {/* Compact Paragraph */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium max-w-md">
                Every year, thousands of Karnataka students finish Class 10 unsure whether to choose <strong>PUC, Polytechnic Diploma</strong>, or <strong>ITI Trades</strong>. Udaan AI provides clear, step-by-step career guidance mapped to real job market demand.
              </p>

              {/* Both Hero CTAs */}
              <div className="flex items-center gap-3 pt-1">
                <Link to={user ? "/dashboard" : "/register"}>
                  <Button
                    variant="primary"
                    size="md"
                    className="bg-[#005F60] hover:bg-[#004D4E] text-white font-bold shadow-md hover:shadow-lg transition-all duration-200 rounded-xl px-5 h-11 text-xs sm:text-sm"
                    rightIcon={<ArrowRight className="w-4 h-4 text-white" />}
                  >
                    Start Your Journey
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
        {/* SECTION 2: STATS STRIP (SEPARATE SECTION BELOW HERO) */}
        {/* ========================================================= */}
        <section id="about" className="py-8 bg-slate-50/50 border-b border-slate-200/60 scroll-mt-28">
          <Container size="xl">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-md shadow-slate-900/5 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <AnimatedStat
                numericValue={24500}
                suffix="+"
                label="Karnataka Students Guided"
                subtitle="Class 8–10, PUC, Diploma & ITI"
                trend="+18% YoY"
                icon={<Users className="w-5 h-5" />}
              />
              <AnimatedStat
                numericValue={140}
                suffix="+"
                label="Verified Career Pathways"
                subtitle="Mapped to KSEEB, DTE & Universities"
                trend="Verified"
                icon={<GraduationCap className="w-5 h-5" />}
              />
              <AnimatedStat
                numericValue={31}
                label="Districts Covered"
                subtitle="Statewide Karnataka outreach"
                trend="100% State"
                icon={<ShieldCheck className="w-5 h-5" />}
              />
              <AnimatedStat
                numericValue={85}
                suffix="+"
                label="Career Workshops"
                subtitle="Conducted in school & polytechnic hubs"
                trend="Live"
                icon={<Calendar className="w-5 h-5" />}
              />
            </div>
          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 3: THE CAREER CROSSROADS PROBLEM */}
        {/* ========================================================= */}
        <section id="problem" className="py-20 bg-slate-950 text-white relative overflow-hidden scroll-mt-28">

          {/* Glow Overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#005F60]/20 blur-3xl pointer-events-none" />

          <Container size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

              {/* Story Narrative */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                <Badge variant="warning" size="md" dot>
                  The Career Crossroads Problem
                </Badge>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Class 10 Shouldn't Feel Like a Blind Choice.
                </h2>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                  Every year in Karnataka, over 800,000 students complete SSLC Class 10. More than 60% make education choices based on incomplete advice, leading to stream mismatches and career uncertainty.
                </p>

                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center gap-3 text-xs text-slate-100 font-bold bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>Should I choose PUC Science or a Polytechnic Diploma?</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-100 font-bold bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>What is the difference between ITI Electrician and Diploma ECE?</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-100 font-bold bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>Which stream leads to software engineering without JEE?</span>
                  </div>
                </div>
              </div>

              {/* Visual Decision Matrix */}
              <div className="lg:col-span-7">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">

                  <div className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-6 flex items-center justify-between">
                    <span>The Decision Maze</span>
                    <span className="text-slate-300 font-bold">Class 10 SSLC Junction</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                      <div key={i} className={`p-3.5 rounded-xl border text-center flex flex-col justify-between gap-1 ${item.color}`}>
                        <span className="text-xs font-bold">{item.name}</span>
                        <span className="text-[10px] font-bold opacity-90">{item.tag}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-xs text-slate-200 font-semibold">
                      Udaan AI replaces guesswork with a single, clear, data-backed roadmap.
                    </span>
                    <Link to="/register">
                      <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Solve Your Pathway
                      </Button>
                    </Link>
                  </div>

                </div>
              </div>

            </div>
          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 4: MERGED INTERACTIVE EXPERIENCE */}
        {/* "From Self-Discovery to Career Direction" */}
        {/* ========================================================= */}
        <section id="how-it-works" className="py-20 bg-white border-b border-slate-100 scroll-mt-28">
          <Container size="xl">

            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge variant="primary" size="md" dot className="mb-3">
                Interactive Guided System
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                From Self-Discovery to Career Direction
              </h2>
              <p className="text-base text-slate-700 mt-3 font-semibold">
                Explore yourself, understand connected pathways, choose a direction, and build a clearer next step.
              </p>
            </div>

            {/* Step Selection Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-10 w-fit max-w-full mx-auto p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/90 shadow-2xs">
              {flowSteps.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveFlowStep(idx)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none ${activeFlowStep === idx
                    ? 'bg-[#005F60] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white/80'
                    }`}
                >
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${activeFlowStep === idx ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                    }`}>
                    {step.stepNum}
                  </span>
                  <span>{step.tabTitle}</span>
                </button>
              ))}
            </div>

            {/* Active Step Interactive Showcase Container */}
            <div className="max-w-5xl mx-auto bg-slate-50 border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-md">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                {/* Left: Step Description & Highlights */}
                <div className="lg:col-span-6 flex flex-col items-start gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm" className="bg-teal-100 text-[#004D4E] border-teal-200">
                      {flowSteps[activeFlowStep].badge}
                    </Badge>
                  </div>

                  <h3 className="text-2xl font-extrabold text-slate-950 tracking-tight">
                    {flowSteps[activeFlowStep].title}
                  </h3>

                  <p className="text-sm text-slate-700 font-medium leading-relaxed">
                    {flowSteps[activeFlowStep].fullDesc}
                  </p>

                  <div className="flex flex-col gap-2.5 py-2 w-full">
                    {flowSteps[activeFlowStep].bullets.map((bullet, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs text-slate-800 font-bold bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-[#005F60] shrink-0" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>

                  <Link 
                    to={user ? flowSteps[activeFlowStep].targetRoute : "/register"} 
                    className="pt-2"
                  >
                    <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      {user ? flowSteps[activeFlowStep].ctaLabel : (activeFlowStep === 1 ? "Explore Pathways" : "Try This Step Now")}
                    </Button>
                  </Link>
                </div>

                {/* Right: Dynamic Visual Diagram Preview */}
                <div className="lg:col-span-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[300px] flex flex-col justify-between">

                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        {flowSteps[activeFlowStep].icon}
                        <span className="text-xs font-bold text-slate-900">
                          {flowSteps[activeFlowStep].tabTitle} Preview
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#005F60] font-bold uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Interactive Pathway Preview
                      </span>
                    </div>

                    {/* Content Preview based on active tab */}
                    {activeFlowStep === 0 && (
                      <div className="py-4 space-y-3">
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
                      <div className="py-3 space-y-2.5">
                        {/* Root: Class 10 */}
                        <div className="flex flex-col items-center">
                          <div className="px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>Class 10 (SSLC)</span>
                          </div>
                          <div className="w-0.5 h-2.5 bg-slate-300"></div>
                        </div>

                        {/* Split: PUC Science vs Diploma vs ITI */}
                        <div className="grid grid-cols-3 gap-2 relative">
                          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-teal-50 border border-teal-300 text-center shadow-2xs">
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

                        {/* Progression down from PUC Science */}
                        <div className="flex flex-col items-center gap-1.5 pt-0.5">
                          <div className="w-0.5 h-2.5 bg-teal-500"></div>

                          {/* Higher Education Node */}
                          <div className="w-full p-2 rounded-xl bg-[#005F60] text-white flex items-center justify-between shadow-2xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-teal-300"></span>
                              <span className="text-xs font-bold">B.E / B.Tech (Engineering)</span>
                            </div>
                            <span className="text-[10px] text-teal-200 font-mono">KCET / JEE</span>
                          </div>

                          <div className="w-0.5 h-2.5 bg-orange-400"></div>

                          {/* Destination Role Node */}
                          <div className="w-full p-2 rounded-xl bg-orange-50 border border-orange-300 text-[#C2410C] flex items-center justify-between shadow-2xs">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                              <span className="text-xs font-black text-slate-900">Software & AI Careers</span>
                            </div>
                            <span className="text-[10px] font-bold text-[#F97316] bg-white px-2 py-0.5 rounded border border-orange-200">
                              Career Direction
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeFlowStep === 2 && (
                      <div className="py-3 space-y-3">
                        <div className="p-3.5 rounded-2xl bg-teal-50/90 border-2 border-[#005F60] space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#005F60] bg-teal-100/80 px-2 py-0.5 rounded-full border border-teal-200">
                              Recommended Direction
                            </span>
                            <span className="text-[10px] font-bold text-teal-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#005F60]" /> Aligned
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-slate-900">Pre-University Science (PCMC)</h4>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-medium">
                              Why it fits: Strong analytical aptitude and interest in software systems. Direct eligibility for Karnataka B.E / B.Tech engineering admissions.
                            </p>
                          </div>
                          <div className="pt-0.5">
                            <div className="w-full bg-[#005F60] text-white font-extrabold text-xs py-2 px-3 rounded-xl shadow-2xs flex items-center justify-center gap-1.5 cursor-default">
                              <Target className="w-3.5 h-3.5" />
                              <span>Selected Active Direction</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
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
                      <div className="py-3 space-y-2">
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">1</div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-900 block truncate">10th SSLC Board Examination</span>
                            <span className="text-[10px] text-slate-500">Foundation marks in Mathematics & Science</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-teal-50 border border-teal-200">
                          <div className="w-7 h-7 rounded-full bg-[#005F60] text-white flex items-center justify-center font-bold text-xs shrink-0">2</div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-[#005F60] block truncate">PUC Science (PCMC) & CET Prep</span>
                            <span className="text-[10px] text-teal-700 font-medium">Physics, Chemistry, Math & Computer Science</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="w-7 h-7 rounded-full bg-[#F97316] text-white flex items-center justify-center font-bold text-xs shrink-0">3</div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-900 block truncate">KCET Engineering Allotment</span>
                            <span className="text-[10px] text-slate-500">Karnataka State Engineering Counselling</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeFlowStep === 4 && (
                      <div className="py-3 space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span>Milestone Progress</span>
                          <span className="text-[#005F60]">2 of 4 Steps Completed</span>
                        </div>
                        <ProgressBar value={50} variant="primary" size="md" />
                        <div className="space-y-1.5 pt-1 text-xs">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Explore education pathways</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Select active direction: PUC Science</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 text-amber-900 font-semibold border border-amber-200">
                            <span className="w-2 h-2 rounded-full bg-[#F97316] shrink-0 ml-1 mr-0.5"></span>
                            <span>Next: 1st PUC board preparation</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-500 font-medium border border-slate-200">
                            <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0 ml-1 mr-0.5"></span>
                            <span>Upcoming: KCET examination & counselling</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                      <span>Udaan AI Interactive Engine</span>
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
        <section id="pathways" className="py-20 bg-slate-50 border-b border-slate-200/60 scroll-mt-28 font-sans">
          <Container size="xl">

            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge variant="primary" size="md" dot className="mb-3">
                Explore Common Routes After SSLC
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                Explore Karnataka Education Pathways
              </h2>
              <p className="text-sm sm:text-base text-slate-700 mt-3 font-semibold leading-relaxed">
                See how PUC, Polytechnic Diploma, ITI, streams, and future study directions connect. Sign in to explore pathways based on your own education level.
              </p>
            </div>

            <div className="max-w-7xl mx-auto bg-white/40 border border-slate-200/80 p-4 sm:p-6 rounded-3xl shadow-sm">
              <EducationPathwayMap 
                selectedNodeId={selectedPublicNodeId}
                onSelectNode={handlePublicNodeClick}
              />
            </div>

          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 7: FEATURED WORKSHOPS */}
        {/* ========================================================= */}
        <section id="workshops" className="py-20 bg-slate-50 border-b border-slate-200/60 scroll-mt-28">
          <Container size="xl">

            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
              <div>
                <Badge variant="secondary" size="md" dot className="mb-2">
                  Regional Karnataka Webinars
                </Badge>
                <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                  Featured Career Orientation Workshops
                </h2>
              </div>
              <Link to="/register">
                <Button variant="ghost" size="sm" className="font-bold text-slate-800 hover:text-slate-950" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  View All Regional Events
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <WorkshopCard
                title="Polytechnic Diploma vs PUC Science Orientation"
                topic="Discovering practical technical diploma vs 2-year pre-university degrees for Class 10 SSLC students."
                date="August 18, 2026"
                time="10:30 AM - 12:00 PM IST"
                location="Virtual Zoom & Mysuru DTE Hall"
                speakerName="Dr. K. Srinivas"
                speakerRole="Former Director, DTE Karnataka"
                seatsLeft={14}
                onRegister={() => navigate(user ? '/dashboard' : '/register')}
              />
              <WorkshopCard
                title="ITI Trade Skill Bootcamp 2026"
                topic="Hands-on introduction to Electrician, Electronics Mechanic & Renewable Energy trades."
                date="August 22, 2026"
                time="2:00 PM - 4:00 PM IST"
                location="Bengaluru ITI Campus"
                speakerName="Prof. Anita Rao"
                speakerRole="Head of Vocational Skill Council"
                seatsLeft={6}
                onRegister={() => navigate(user ? '/dashboard' : '/register')}
              />
              <WorkshopCard
                title="Commerce & CA Foundation Seminar"
                topic="Career direction for PUC CEBA students preparing for CA, B.Com, and Corporate Finance."
                date="August 28, 2026"
                time="11:00 AM - 1:00 PM IST"
                location="Hubballi Orientation Center"
                speakerName="CA Rajesh Hegde"
                speakerRole="Senior Audit Partner"
                seatsLeft={19}
                onRegister={() => navigate(user ? '/dashboard' : '/register')}
              />
            </div>

          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 8: STUDENT TESTIMONIALS & TRUST STORIES */}
        {/* ========================================================= */}
        <section id="testimonials" className="py-20 bg-white border-b border-slate-100 scroll-mt-28">
          <Container size="xl">

            <div className="text-center max-w-2xl mx-auto mb-14">
              <Badge variant="primary" size="md" dot className="mb-3">
                Student & Workshop Stories
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                Trusted by Students Across Karnataka
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-2xs">
                <div>
                  <Quote className="w-8 h-8 text-[#005F60] opacity-50 mb-3" />
                  <p className="text-xs text-slate-800 leading-relaxed italic font-medium mb-6">
                    "After Class 10 in Mysuru, I was confused between PUC Science and Diploma CSE. Udaan AI's roadmap showed me how Polytechnic Diploma leads directly to 2nd-year B.Tech lateral entry. That saved me a year of entrance exam stress!"
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200/60">
                  <div className="w-9 h-9 rounded-full bg-teal-100 text-[#004D4E] font-bold text-xs flex items-center justify-center">
                    M
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-950 block">Meghana S.</span>
                    <span className="text-[10px] font-bold text-slate-700">Diploma CSE Student, Mysuru</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-2xs">
                <div>
                  <Quote className="w-8 h-8 text-[#E06D14] opacity-50 mb-3" />
                  <p className="text-xs text-slate-800 leading-relaxed italic font-medium mb-6">
                    "I attended the ITI trade bootcamp in Hubballi. The transparent fee structures, NCVT trade info, and job salary range data helped me choose the solar electrician trade with full confidence."
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200/60">
                  <div className="w-9 h-9 rounded-full bg-orange-100 text-[#C2580E] font-bold text-xs flex items-center justify-center">
                    R
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-950 block">Rahul K.</span>
                    <span className="text-[10px] font-bold text-slate-700">ITI Electrician Trade, Hubballi</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-2xs">
                <div>
                  <Quote className="w-8 h-8 text-blue-600 opacity-50 mb-3" />
                  <p className="text-xs text-slate-800 leading-relaxed italic font-medium mb-6">
                    "Our school hosted an Udaan AI career orientation session for 300 SSLC students in Bengaluru. The interactive stream visualizer made it so easy for us to understand PUC PCMB vs PCMC vs CEBA."
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200/60">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                    S
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-950 block">Siddharth N.</span>
                    <span className="text-[10px] font-bold text-slate-700">Class 10 SSLC Student, Bengaluru</span>
                  </div>
                </div>
              </div>

            </div>
          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 9: SCHOOL & INSTITUTION REGISTRATION */}
        {/* ========================================================= */}
        <section id="school-invitation" className="py-20 bg-slate-950 text-white relative overflow-hidden border-b border-slate-800 scroll-mt-28">
          <Container size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

              <div className="lg:col-span-8 flex flex-col items-start gap-5">
                <Badge variant="primary" size="md">
                  School & College Participation
                </Badge>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Bring Udaan AI to Your Institution
                </h2>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium max-w-2xl">
                  Schools, colleges, and polytechnics across Karnataka can partner with Udaan AI to bring structured career guidance, stream exploration workshops, and student assessment tools directly to their campuses.
                </p>

                {/* Visible, high-contrast, unclipped CTA actions */}
                <div className="flex flex-wrap items-center gap-4 pt-3 pb-2 w-full">
                  <Link to="/register" className="w-full sm:w-auto">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto bg-[#E06D14] hover:bg-[#C2580E] text-white font-bold shadow-md hover:shadow-lg transition-all duration-200 px-6"
                      rightIcon={<ArrowRight className="w-4.5 h-4.5 text-white" />}
                    >
                      Register for Workshop
                    </Button>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setWorkshopModalOpen(true)}
                    className="w-full sm:w-auto h-12 px-6 rounded-xl font-bold text-sm text-slate-200 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 shadow-2xs cursor-pointer flex items-center justify-center"
                  >
                    Request a Workshop
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-800 text-center flex flex-col items-center gap-3 shadow-lg">
                <School className="w-10 h-10 text-[#005F60]" />
                <h3 className="text-base font-bold text-white">Institutional Outreach</h3>
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
        <section id="cta" className="py-20 bg-white scroll-mt-28">
          <Container size="xl">
            <CTABanner
              title="Your Future Shouldn't Depend on Guesswork."
              description="Join over 24,000+ Karnataka students taking control of their education pathways with clarity, confidence, and verified milestone roadmaps."
              primaryCtaText="Explore Careers"
              onPrimaryCtaClick={() => {
                const el = document.getElementById('pathways');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              secondaryCtaText="Create Free Account"
              onSecondaryCtaClick={() => navigate(user ? '/dashboard' : '/register')}
            />
          </Container>
        </section>

      </main>

      {/* GLOBAL FOOTER */}
      <Footer />

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
      />
    </div>
  );
};

export default HomePage;
