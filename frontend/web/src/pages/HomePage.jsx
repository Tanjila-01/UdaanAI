import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
  CheckSquare
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hero visual image asset slot
  const heroImageSrc = '/hero_career_pathway.png';

  // State for Interactive Stream Explorer (Section 5)
  const [activeBranch, setActiveBranch] = useState('science');

  // State for Merged Capability Flow (Section 4)
  const [activeFlowStep, setActiveFlowStep] = useState(0);

  // State for Personalized Roadmap Step Focus (Section 6)
  const [activeRoadmapStep, setActiveRoadmapStep] = useState(0);

  // Merged 5-Step Experience Data ("From Self-Discovery to Career Direction")
  const flowSteps = [
    {
      id: 'discover',
      stepNum: '01',
      tabTitle: 'Discover Yourself',
      title: 'Understand Strengths & Interests',
      shortDesc: 'Understand interests, strengths, preferences and academic context.',
      fullDesc: 'Take guided interest assessments mapping your natural aptitude across SSLC subjects, logical reasoning, hands-on mechanics, or creative problem-solving.',
      bullets: [
        'SSLC subject affinity breakdown',
        'Aptitude & interest pattern matching',
        'Karnataka educational context mapping'
      ],
      icon: <Compass className="w-5 h-5 text-[#005F60]" />,
      badge: 'Step 01: Profile Assessment',
      visualType: 'radar'
    },
    {
      id: 'explore',
      stepNum: '02',
      tabTitle: 'Explore Careers',
      title: 'Explore Mapped Opportunities',
      shortDesc: 'Explore careers connected to your interests and education options.',
      fullDesc: 'Browse over 140+ verified career options mapped to current industrial demand across Bengaluru, Mysuru, Hubballi, and Karnataka hubs.',
      bullets: [
        'Real-world salary ranges & growth rates',
        'Key technical and soft skills required',
        'Industry demand ratings updated for 2026'
      ],
      icon: <Briefcase className="w-5 h-5 text-[#E06D14]" />,
      badge: 'Step 02: Career Matching',
      visualType: 'careers'
    },
    {
      id: 'compare',
      stepNum: '03',
      tabTitle: 'Compare Pathways',
      title: 'Compare Education Streams Side-by-Side',
      shortDesc: 'Compare PUC, Diploma, ITI and degree routes.',
      fullDesc: 'Transparently evaluate PUC (Science, Commerce, Arts) vs 3-Year Polytechnic Technical Diplomas vs ITI Vocational Trades before making decisions.',
      bullets: [
        'Duration, tuition estimates, and eligibility',
        'Entrance exams: KCET, NEET, DCET',
        'Direct 2nd-year lateral entry B.Tech paths'
      ],
      icon: <GitBranch className="w-5 h-5 text-blue-600" />,
      badge: 'Step 03: Stream Analysis',
      visualType: 'compare'
    },
    {
      id: 'roadmap',
      stepNum: '04',
      tabTitle: 'Build Your Roadmap',
      title: 'Construct Your Milestone Roadmap',
      shortDesc: 'Turn a chosen direction into a structured sequence of milestones.',
      fullDesc: 'Generate a step-by-step sequential action timeline connecting your current grade directly to entrance exams, higher degrees, and target job roles.',
      bullets: [
        'Grade-by-grade timeline markers',
        'Exam preparation target dates',
        'Skill certification milestones'
      ],
      icon: <Milestone className="w-5 h-5 text-purple-600" />,
      badge: 'Step 04: Actionable Plan',
      visualType: 'roadmap'
    },
    {
      id: 'track',
      stepNum: '05',
      tabTitle: 'Track Your Progress',
      title: 'Track Milestones & Achievements',
      shortDesc: 'Keep track of important milestones and next steps.',
      fullDesc: 'Continuously track SSLC score goals, KCET/DCET prep milestones, and skill achievements with progress metrics that keep you on route.',
      bullets: [
        'SSLC target score tracker',
        'Entrance exam prep milestones',
        'Skill certification badges'
      ],
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      badge: 'Step 05: Execution',
      visualType: 'track'
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
        <section id="capabilities" className="py-20 bg-white border-b border-slate-100 scroll-mt-28">
          <Container size="xl">

            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge variant="primary" size="md" dot className="mb-3">
                Interactive Guided System
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                From Self-Discovery to Career Direction
              </h2>
              <p className="text-base text-slate-700 mt-3 font-semibold">
                Explore yourself, compare possibilities, understand pathways, and build a clearer next step.
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

                  <Link to={user ? "/dashboard" : "/register"} className="pt-2">
                    <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Try This Step Now
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
                          {flowSteps[activeFlowStep].tabTitle} Module Preview
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Live UI</span>
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
                      <div className="py-4 space-y-2.5">
                        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-950 block">AI & Software Engineer</span>
                            <span className="text-[10px] text-slate-700 font-medium">Demand: High (+24%) • ₹4.5L - ₹14L</span>
                          </div>
                          <Badge variant="primary" size="sm">Top Match</Badge>
                        </div>
                        <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-950 block">Industrial Automation Tech</span>
                            <span className="text-[10px] text-slate-700 font-medium">Demand: Steady (+16%) • ₹3.2L - ₹8.5L</span>
                          </div>
                          <Badge variant="warning" size="sm">High Demand</Badge>
                        </div>
                      </div>
                    )}

                    {activeFlowStep === 2 && (
                      <div className="py-4 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                            <span className="font-bold text-[#004D4E] block">PUC Science</span>
                            <span className="text-[10px] text-slate-600">2 Yrs • KCET Prep</span>
                          </div>
                          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                            <span className="font-bold text-blue-900 block">Polytechnic Diploma</span>
                            <span className="text-[10px] text-slate-600">3 Yrs • Direct B.Tech 2nd Yr</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-100 text-[11px] text-slate-700 font-semibold text-center">
                          Result: Diploma provides earlier practical exposure; PUC offers broader university entrance options.
                        </div>
                      </div>
                    )}

                    {activeFlowStep === 3 && (
                      <div className="py-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#005F60] text-white flex items-center justify-center font-bold text-xs">10</div>
                          <div className="flex-1 border-b border-slate-200 pb-1">
                            <span className="text-xs font-bold text-slate-900 block">SSLC Class 10 Completion</span>
                            <span className="text-[10px] text-slate-600">Target Score: 85%+</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E06D14] text-white flex items-center justify-center font-bold text-xs">Dip</div>
                          <div className="flex-1 border-b border-slate-200 pb-1">
                            <span className="text-xs font-bold text-slate-900 block">Polytechnic CSE Diploma</span>
                            <span className="text-[10px] text-slate-600">3 Years Applied Learning</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">Eng</div>
                          <div className="flex-1">
                            <span className="text-xs font-bold text-slate-900 block">B.Tech 2nd Year Lateral Entry</span>
                            <span className="text-[10px] text-slate-600">DCET Karnataka Exam</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeFlowStep === 4 && (
                      <div className="py-4 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span>Overall Roadmap Progress</span>
                          <span className="text-[#005F60]">4 of 6 Milestones Completed</span>
                        </div>
                        <ProgressBar value={66} variant="primary" size="lg" />
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700">
                          <span className="flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> SSLC Verified
                          </span>
                          <span className="flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Stream Selected
                          </span>
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
        {/* SECTION 5: INTERACTIVE BRANCH EXPLORER */}
        {/* ========================================================= */}
        <section id="pathways" className="py-20 bg-slate-50 border-b border-slate-200/60 scroll-mt-28">
          <Container size="xl">

            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="primary" size="md" dot className="mb-3">
                Interactive Branch Explorer
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                Explore Karnataka Education Streams
              </h2>
              <p className="text-sm sm:text-base text-slate-700 mt-3 font-semibold">
                Click any education stream below to view sub-tracks, entrance exams, and career outcomes.
              </p>
            </div>

            {/* Interactive Stream Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-10 max-w-4xl mx-auto p-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              {[
                { id: 'science', label: 'PUC Science' },
                { id: 'commerce', label: 'PUC Commerce' },
                { id: 'arts', label: 'PUC Arts' },
                { id: 'diploma', label: 'Polytechnic Diploma' },
                { id: 'iti', label: 'ITI Trades' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveBranch(tab.id)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none flex items-center justify-center text-center ${activeBranch === tab.id
                    ? 'bg-[#005F60] text-white shadow-xs'
                    : 'text-slate-800 hover:bg-slate-100'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Expanded Active Branch Showcase */}
            {branchData[activeBranch] && (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-md max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl font-bold text-slate-950">
                        {branchData[activeBranch].title}
                      </h3>
                      <Badge variant="primary" size="sm">
                        {branchData[activeBranch].badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 font-semibold">
                      {branchData[activeBranch].subtitle}
                    </p>
                  </div>

                  <Link to={user ? "/dashboard" : "/register"}>
                    <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Explore All Pathways
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Specialization Sub-Tracks */}
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Key Specialization Streams:
                    </h4>
                    {branchData[activeBranch].subTracks.map((sub, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-sm font-bold text-slate-950 block mb-1">{sub.name}</span>
                        <span className="text-xs text-slate-700 leading-relaxed font-medium">{sub.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Right Column: Exams & Outcomes */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Key Entrance Exams:
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {branchData[activeBranch].entranceExams.map((exam, i) => (
                          <Badge key={i} variant="neutral" size="sm">
                            {exam}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Target Career Outcomes:
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {branchData[activeBranch].careerOutcomes.map((career, i) => (
                          <Tag key={i} className="text-xs font-bold">
                            {career}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 6: STREAMLINED YOUR PERSONALIZED CAREER ROADMAP */}
        {/* (Refactored 6 Steps with Interactive Milestone Timeline) */}
        {/* ========================================================= */}
        <section id="roadmap" className="py-20 bg-white border-b border-slate-100 scroll-mt-28">
          <Container size="xl">

            <div className="text-center max-w-2xl mx-auto mb-14">
              <Badge variant="primary" size="md" dot className="mb-3">
                Intelligent Personalization
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                Your Personalized Career Roadmap
              </h2>
              <p className="text-sm sm:text-base text-slate-700 mt-3 font-semibold">
                How Udaan AI dynamically generates your step-by-step career path from profile to opportunity.
              </p>
            </div>

            {/* Interactive 6-Step Timeline Container */}
            <div className="max-w-5xl mx-auto bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md">

              {/* Timeline Sequence Nodes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center mb-8">
                {roadmapSteps.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveRoadmapStep(index)}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between items-center gap-1.5 transition-all cursor-pointer text-left ${activeRoadmapStep === index
                      ? 'bg-[#005F60] text-white border-[#005F60] shadow-md ring-2 ring-teal-600/30'
                      : 'bg-white border-slate-200 hover:border-teal-400 text-slate-800'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] font-bold uppercase ${activeRoadmapStep === index ? 'text-teal-200' : 'text-slate-500'
                        }`}>
                        Step {item.step}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${activeRoadmapStep === index ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                        {item.badge}
                      </span>
                    </div>

                    <span className="text-xs font-bold leading-tight my-1">{item.title}</span>
                    <span className={`text-[9px] font-medium ${activeRoadmapStep === index ? 'text-teal-100' : 'text-slate-500'
                      }`}>
                      {item.subtitle}
                    </span>
                  </button>
                ))}
              </div>

              {/* Selected Step Detail Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#005F60] bg-teal-50 px-2 py-0.5 rounded">
                      Step {roadmapSteps[activeRoadmapStep].step} Focus
                    </span>
                    <h4 className="text-base font-bold text-slate-950">
                      {roadmapSteps[activeRoadmapStep].title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    {roadmapSteps[activeRoadmapStep].detail}
                  </p>
                </div>

                <Link to={user ? "/dashboard" : "/register"} className="shrink-0">
                  <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Generate Your Roadmap
                  </Button>
                </Link>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-800 font-bold">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5 text-[#005F60]" />
                  Roadmaps dynamically update as you submit SSLC marks and milestone targets.
                </span>
                <span className="text-[#005F60]">6 Verified Milestone Stages</span>
              </div>

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

                  <a href="#workshops" className="w-full sm:w-auto">
                    <button
                      type="button"
                      className="w-full sm:w-auto h-12 px-6 rounded-xl font-bold text-sm text-slate-200 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      Request a Workshop
                    </button>
                  </a>
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
    </div>
  );
};

export default HomePage;
