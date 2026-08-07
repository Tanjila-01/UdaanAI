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
import Stat from '../components/ui/Stat';
import ProgressBar from '../components/ui/ProgressBar';
import ProgressRing from '../components/ui/ProgressRing';
import WorkshopCard from '../components/product/WorkshopCard';
import CareerNode from '../components/product/CareerNode';
import CareerPathCard from '../components/product/CareerPathCard';
import PathwayVisualizer from '../components/product/PathwayVisualizer';

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
  Download,
  FileText,
  Check,
  CheckCircle
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for Interactive Career Explorer (Section 6)
  const [activeBranch, setActiveBranch] = useState('science');

  // Branch data for Section 6
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

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#005F60] selection:text-white">
      
      {/* GLOBAL NAVBAR */}
      <Navbar />

      <main className="flex-1">

        {/* ========================================================= */}
        {/* SECTION 1: HERO (SPLIT LAYOUT WITH PRODUCT ILLUSTRATION) */}
        {/* ========================================================= */}
        <section id="hero" className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 bg-gradient-to-b from-slate-50 via-white to-slate-50/50 overflow-hidden border-b border-slate-200/60">
          
          {/* Background Geometry */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-teal-50/60 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-orange-50/50 rounded-full blur-3xl pointer-events-none" />

          <Container size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* LEFT COLUMN: Powerful Copy & CTAs */}
              <div className="lg:col-span-6 flex flex-col items-start gap-6">
                
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-300 text-[#004D4E] text-xs font-bold tracking-wide uppercase shadow-2xs">
                  <Send className="w-3.5 h-3.5 text-[#C2580E] animate-paper-plane" />
                  <span>AI Career Exploration Platform for Karnataka</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.12]">
                  Discover Your Pathway. <br className="hidden sm:block" />
                  <span className="text-[#005F60]">Build Your Future</span> with Confidence.
                </h1>

                <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-xl font-medium">
                  Udaan AI helps Karnataka students across <strong>Class 8–10 (SSLC)</strong>, <strong>PUC</strong>, <strong>Polytechnic Diploma</strong>, and <strong>ITI Trades</strong> discover verified education pathways, future careers, and structured roadmaps before making life-changing decisions.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
                  <Link to={user ? "/dashboard" : "/register"} className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Start Your Journey
                    </Button>
                  </Link>

                  <a href="#pathways" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" fullWidth className="font-bold text-slate-800 border-slate-300 hover:border-slate-400">
                      Explore Pathways
                    </Button>
                  </a>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center gap-6 pt-6 text-xs font-bold text-slate-800 border-t border-slate-200/80 w-full">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#005F60]" />
                    Aligned with KSEEB & DTE Karnataka
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#005F60]" />
                    100% Free for Students
                  </span>
                </div>

              </div>

              {/* RIGHT COLUMN: Custom Interactive Pathway Vector Preview */}
              <div className="lg:col-span-6 relative">
                <div className="relative w-full aspect-square max-w-lg mx-auto bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-slate-300 p-8 shadow-xl overflow-hidden flex flex-col justify-between">
                  
                  {/* Decorative Grid Pattern Background */}
                  <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

                  {/* Top Bar Status */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse" />
                      <span className="text-xs font-bold text-slate-900">Live Pathway Generation</span>
                    </div>
                    <Badge variant="primary" size="sm">
                      Karnataka 2026
                    </Badge>
                  </div>

                  {/* Connected Pathway Nodes Illustration SVG */}
                  <div className="relative z-10 my-auto py-4 flex flex-col gap-5">
                    
                    {/* Node 1: SSLC */}
                    <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#005F60] flex items-center justify-center font-bold text-xs shrink-0">
                        10th
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-950 block">Class 10 SSLC Completion</span>
                        <span className="text-[11px] text-slate-700 font-medium">Karnataka State Board (KSEEB)</span>
                      </div>
                      <Badge variant="success" size="sm">Completed</Badge>
                    </div>

                    {/* Connecting Line Vector */}
                    <div className="ml-8 -my-2.5 h-5 w-0.5 border-l-2 border-dashed border-[#005F60]" />

                    {/* Node 2: Decision Branches (PUC / Diploma / ITI) */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-300 text-center">
                        <span className="text-[11px] font-bold text-[#004D4E] block">PUC Science</span>
                        <span className="text-[9px] font-bold text-slate-700">2 Yrs • KCET</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-300 text-center">
                        <span className="text-[11px] font-bold text-[#C2580E] block">Diploma CSE</span>
                        <span className="text-[9px] font-bold text-slate-700">3 Yrs • B.Tech</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-300 text-center">
                        <span className="text-[11px] font-bold text-blue-900 block">ITI Trades</span>
                        <span className="text-[9px] font-bold text-slate-700">1-2 Yrs • NCVT</span>
                      </div>
                    </div>

                    {/* Connecting Line Vector */}
                    <div className="ml-8 -my-2.5 h-5 w-0.5 border-l-2 border-dashed border-[#C2580E]" />

                    {/* Node 3: Career Goal */}
                    <div className="flex items-center gap-4 bg-[#005F60] text-white p-3.5 rounded-xl shadow-md">
                      <div className="w-10 h-10 rounded-lg bg-white/20 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold block">AI & Software Application Engineer</span>
                        <span className="text-[11px] text-teal-100 font-medium">Estimated Industry Demand: High (+24%)</span>
                      </div>
                      <Badge variant="secondary" size="sm">Goal Reached</Badge>
                    </div>

                  </div>

                  {/* Bottom Flight Badge */}
                  <div className="relative z-10 flex items-center justify-between text-xs text-slate-800 font-bold border-t border-slate-200 pt-3">
                    <span className="flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-[#005F60]" />
                      Verified Academic Map
                    </span>
                    <span className="font-bold text-[#005F60]">31 Districts Covered</span>
                  </div>

                </div>
              </div>

            </div>
          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 2: TRUST & CREDIBILITY STATS */}
        {/* ========================================================= */}
        <section id="about" className="py-14 bg-white border-b border-slate-200/60">
          <Container size="xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Stat
                label="Karnataka Students Guided"
                value="24,500+"
                subtitle="Class 8-10, PUC, Diploma & ITI"
                trend="+18% YoY"
                icon={<Users className="w-5 h-5 text-[#005F60]" />}
              />
              <Stat
                label="Verified Career Pathways"
                value="140+"
                subtitle="Mapped to KSEEB, DTE & Universities"
                trend="Verified"
                icon={<GraduationCap className="w-5 h-5 text-[#005F60]" />}
              />
              <Stat
                label="Districts Covered"
                value="31"
                subtitle="Statewide Karnataka student outreach"
                trend="100% State"
                icon={<ShieldCheck className="w-5 h-5 text-[#005F60]" />}
              />
              <Stat
                label="Career Workshops"
                value="85+"
                subtitle="Conducted in school & polytechnic hubs"
                trend="Live"
                icon={<Calendar className="w-5 h-5 text-[#005F60]" />}
              />
            </div>
          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 3: THE CAREER CROSSROADS PROBLEM */}
        {/* ========================================================= */}
        <section id="problem" className="py-20 bg-slate-950 text-white relative overflow-hidden">
          
          {/* Subtle Glow Overlay */}
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

              {/* Visual Decision Grid Matrix */}
              <div className="lg:col-span-7">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
                  
                  <div className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-6 flex items-center justify-between">
                    <span>The Decision Maze</span>
                    <span className="text-slate-300 font-bold">Class 10 SSLC Junction</span>
                  </div>

                  {/* Decision Grid Matrix */}
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

                  {/* Solution Overlay Banner */}
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
        {/* SECTION 4: WHAT STUDENTS CAN DO */}
        {/* ========================================================= */}
        <section id="capabilities" className="py-20 bg-white border-b border-slate-100">
          <Container size="xl">
            
            <div className="text-center max-w-2xl mx-auto mb-14">
              <Badge variant="primary" size="md" dot className="mb-3">
                Student Capabilities
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                What You Can Do on Udaan AI
              </h2>
              <p className="text-sm sm:text-base text-slate-700 mt-3 font-semibold">
                Everything you need to discover, compare, and execute your career roadmap.
              </p>
            </div>

            {/* Cleaner Feature Showcase (6 Core Capabilities) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-400 hover:bg-white transition-all flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#004D4E] flex items-center justify-center font-bold">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-950">1. Discover Career Interests</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Take interactive interest assessments mapping your natural strengths in Mathematics, Science, Commerce, or Technical Trades.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-400 hover:bg-white transition-all flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#C2580E] flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-950">2. Explore Education Pathways</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Deep-dive into Karnataka streams: PUC (Science, Commerce, Arts), Polytechnic Diplomas, and ITI Vocational Trades.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-white transition-all flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <GitBranch className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-950">3. Compare Streams Side-by-Side</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Compare program durations, fee structures, entrance exams (KCET, NEET, DCET), and lateral entry options transparently.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-400 hover:bg-white transition-all flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <Milestone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-950">4. Build Personalized Roadmap</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Generate a customized step-by-step timeline connecting your current grade directly to university degrees and job roles.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-white transition-all flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-950">5. Track Learning Journey</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Monitor your SSLC marks goals, KCET entrance exam milestones, and essential skill development over time.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-white transition-all flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-950">6. Attend Career Workshops</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Reserve free seats for live regional orientation sessions conducted by Karnataka educational experts.
                </p>
              </div>

            </div>
          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 5: HOW UDAAN WORKS (5-STEP METHOD) */}
        {/* ========================================================= */}
        <section id="how-it-works" className="py-20 bg-slate-50 border-b border-slate-200/60">
          <Container size="xl">
            
            <div className="text-center max-w-2xl mx-auto mb-14">
              <Badge variant="primary" size="md" dot className="mb-3">
                5-Step Method
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                How Udaan AI Guides Your Path
              </h2>
              <p className="text-sm sm:text-base text-slate-700 mt-3 font-semibold">
                A structured process from self-discovery to milestone execution.
              </p>
            </div>

            {/* Stepper Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { step: '01', title: 'Discover Yourself', desc: 'Map your academic strengths in SSLC subjects and interests.', icon: <Compass className="w-5 h-5" /> },
                { step: '02', title: 'Explore Careers', desc: 'Browse 140+ verified careers across technology, engineering & commerce.', icon: <Briefcase className="w-5 h-5" /> },
                { step: '03', title: 'Compare Pathways', desc: 'Compare PUC vs Polytechnic Diploma vs ITI trade durations & fees.', icon: <GitBranch className="w-5 h-5" /> },
                { step: '04', title: 'Create Roadmap', desc: 'Generate a personalized step-by-step milestone execution map.', icon: <Milestone className="w-5 h-5" /> },
                { step: '05', title: 'Track Progress', desc: 'Update marks, entrance prep milestones & skill achievements.', icon: <TrendingUp className="w-5 h-5" /> },
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-start p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-teal-400 transition-all">
                  <div className="flex items-center justify-between w-full mb-3">
                    <span className="text-xs font-bold text-[#004D4E] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                      Step {item.step}
                    </span>
                    <div className="text-slate-700">
                      {item.icon}
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-950 mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>

          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 6: INTERACTIVE CAREER EXPLORER */}
        {/* ========================================================= */}
        <section id="pathways" className="py-20 bg-white border-b border-slate-100">
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
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10 max-w-4xl mx-auto p-2 bg-slate-100 rounded-2xl border border-slate-200 shadow-2xs">
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
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
                    activeBranch === tab.id
                      ? 'bg-[#005F60] text-white shadow-xs'
                      : 'text-slate-800 hover:bg-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Expanded Active Branch Showcase */}
            {branchData[activeBranch] && (
              <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-md max-w-5xl mx-auto animate-fade-in-rise">
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

                  <Link to={user ? "/pathways" : "/register"}>
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
                      <div key={i} className="p-4 rounded-xl bg-white border border-slate-200">
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

            {/* Representative Outcome Cards */}
            <div className="pt-16">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-950 tracking-tight">
                  Featured Career Pathways
                </h3>
                <span className="text-xs font-bold text-[#005F60]">
                  High-Growth Sectors in Karnataka
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CareerPathCard
                  title="Software & AI Application Engineer"
                  category="Technology Stream"
                  salaryRange="₹4.5 LPA - ₹14.0 LPA"
                  growthRate="High Growth (+24%)"
                  description="Develop web software, cloud infrastructure, and AI models for global technology enterprises."
                  topSkills={['Python', 'JavaScript', 'React', 'Database Systems']}
                  onExplore={() => navigate(user ? '/pathways' : '/register')}
                />
                <CareerPathCard
                  title="Industrial Automation Technician"
                  category="Polytechnic / ITI"
                  salaryRange="₹3.2 LPA - ₹8.5 LPA"
                  growthRate="Steady Demand (+16%)"
                  description="Maintain PLC controllers, industrial robotics, motor drives, and solar power installations."
                  topSkills={['Electrical Wiring', 'PLC Systems', 'Circuit Testing', 'CAD']}
                  onExplore={() => navigate(user ? '/pathways' : '/register')}
                />
                <CareerPathCard
                  title="Financial Analyst & CA Associate"
                  category="Commerce Stream"
                  salaryRange="₹4.0 LPA - ₹12.0 LPA"
                  growthRate="High Growth (+20%)"
                  description="Manage corporate taxation, financial auditing, investment planning, and business accounting."
                  topSkills={['Tally Prime', 'Corporate Law', 'Auditing', 'Excel']}
                  onExplore={() => navigate(user ? '/pathways' : '/register')}
                />
              </div>
            </div>

          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 7: YOUR CAREER ROADMAP (CONNECTED PRODUCT JOURNEY) */}
        {/* ========================================================= */}
        <section id="roadmap" className="py-20 bg-slate-50 border-b border-slate-200/60">
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

            {/* Connected Visual Product Journey Flow */}
            <div className="max-w-5xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
                
                {[
                  { step: '1', title: 'Student Profile', desc: 'SSLC / Grade 10', bg: 'bg-teal-50 border-teal-300 text-[#004D4E]' },
                  { step: '2', title: 'Career Goal', desc: 'Target Industry Role', bg: 'bg-orange-50 border-orange-300 text-[#C2580E]' },
                  { step: '3', title: 'Recommended Pathway', desc: 'PUC / Diploma Stream', bg: 'bg-[#005F60] text-white' },
                  { step: '4', title: 'Entrance Exams', desc: 'KCET / NEET / DCET', bg: 'bg-blue-50 border-blue-300 text-blue-900' },
                  { step: '5', title: 'Skills to Learn', desc: 'Core Technical Skills', bg: 'bg-purple-50 border-purple-300 text-purple-900' },
                  { step: '6', title: 'Projects', desc: 'Practical Application', bg: 'bg-amber-50 border-amber-300 text-amber-900' },
                  { step: '7', title: 'Certifications', desc: 'Academic & Trade', bg: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
                  { step: '8', title: 'Career Opportunity', desc: 'Job / Higher Degree', bg: 'bg-slate-950 text-white' },
                ].map((item, index) => (
                  <div key={index} className={`p-3.5 rounded-xl border flex flex-col justify-between items-center gap-1.5 ${item.bg}`}>
                    <span className="text-[10px] font-bold uppercase opacity-80">Step {item.step}</span>
                    <span className="text-xs font-bold leading-tight">{item.title}</span>
                    <span className="text-[9px] font-bold opacity-90">{item.desc}</span>
                  </div>
                ))}

              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-800 font-bold">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5 text-[#005F60]" />
                  Roadmaps automatically adjust based on SSLC marks and skill progress.
                </span>
                <Link to={user ? "/dashboard" : "/register"}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Generate Your Roadmap
                  </Button>
                </Link>
              </div>
            </div>

          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 8: FEATURED WORKSHOPS (MAX 3 CARDS) */}
        {/* ========================================================= */}
        <section id="workshops" className="py-20 bg-white border-b border-slate-100">
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
        {/* SECTION 9: STUDENT TESTIMONIALS & TRUST STORIES */}
        {/* ========================================================= */}
        <section id="testimonials" className="py-20 bg-slate-50 border-b border-slate-200/60">
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
              
              <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
                <div>
                  <Quote className="w-8 h-8 text-[#005F60] opacity-50 mb-3" />
                  <p className="text-xs text-slate-800 leading-relaxed italic font-medium mb-6">
                    "After Class 10 in Mysuru, I was confused between PUC Science and Diploma CSE. Udaan AI's roadmap showed me how Polytechnic Diploma leads directly to 2nd-year B.Tech lateral entry. That saved me a year of entrance exam stress!"
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-teal-100 text-[#004D4E] font-bold text-xs flex items-center justify-center">
                    M
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-950 block">Meghana S.</span>
                    <span className="text-[10px] font-bold text-slate-700">Diploma CSE Student, Mysuru</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
                <div>
                  <Quote className="w-8 h-8 text-[#E06D14] opacity-50 mb-3" />
                  <p className="text-xs text-slate-800 leading-relaxed italic font-medium mb-6">
                    "I attended the ITI trade bootcamp in Hubballi. The transparent fee structures, NCVT trade info, and job salary range data helped me choose the solar electrician trade with full confidence."
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-orange-100 text-[#C2580E] font-bold text-xs flex items-center justify-center">
                    R
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-950 block">Rahul K.</span>
                    <span className="text-[10px] font-bold text-slate-700">ITI Electrician Trade, Hubballi</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
                <div>
                  <Quote className="w-8 h-8 text-blue-600 opacity-50 mb-3" />
                  <p className="text-xs text-slate-800 leading-relaxed italic font-medium mb-6">
                    "Our school hosted an Udaan AI career orientation session for 300 SSLC students in Bengaluru. The interactive stream visualizer made it so easy for us to understand PUC PCMB vs PCMC vs CEBA."
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
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
        {/* SECTION 10: STUDENT RESOURCES HUB */}
        {/* ========================================================= */}
        <section id="resources" className="py-20 bg-white border-b border-slate-100">
          <Container size="xl">
            
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
              <div>
                <Badge variant="primary" size="md" dot className="mb-2">
                  Student Resource Hub
                </Badge>
                <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                  Free Education Pathway Guides
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-700">
                Verified Curriculum References for Karnataka
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <FileText className="w-8 h-8 text-[#005F60] mb-3" />
                  <h4 className="text-sm font-bold text-slate-950 mb-1">SSLC Career Stream Guide 2026</h4>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    Complete breakdown of PUC, Diploma, and ITI trade entry rules post Class 10.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-4 font-bold text-slate-800 border-slate-300 hover:border-slate-400" leftIcon={<Download className="w-3.5 h-3.5" />}>
                  Download PDF
                </Button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <FileText className="w-8 h-8 text-[#E06D14] mb-3" />
                  <h4 className="text-sm font-bold text-slate-950 mb-1">KCET Entrance Exam Roadmap</h4>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    Key Physics, Chemistry, and Math syllabus weightage for Engineering seats.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-4 font-bold text-slate-800 border-slate-300 hover:border-slate-400" leftIcon={<Download className="w-3.5 h-3.5" />}>
                  Download PDF
                </Button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <FileText className="w-8 h-8 text-blue-600 mb-3" />
                  <h4 className="text-sm font-bold text-slate-950 mb-1">Diploma Lateral Entry Chart</h4>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    How DCET Karnataka enables direct 2nd-year entry to B.E. / B.Tech degrees.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-4 font-bold text-slate-800 border-slate-300 hover:border-slate-400" leftIcon={<Download className="w-3.5 h-3.5" />}>
                  Download PDF
                </Button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <FileText className="w-8 h-8 text-emerald-600 mb-3" />
                  <h4 className="text-sm font-bold text-slate-950 mb-1">ITI Trades & Skill Checklist</h4>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    NCVT trade certifications, solar electrician apprenticeship & career scope.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-4 font-bold text-slate-800 border-slate-300 hover:border-slate-400" leftIcon={<Download className="w-3.5 h-3.5" />}>
                  Download PDF
                </Button>
              </div>

            </div>

          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 11: BRING UDAAN AI TO YOUR SCHOOL */}
        {/* ========================================================= */}
        <section id="school-invitation" className="py-20 bg-slate-950 text-white relative overflow-hidden">
          <Container size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-8 space-y-4">
                <Badge variant="primary" size="md">
                  School & College Sessions
                </Badge>
                
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Bring Udaan AI to Your School
                </h2>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium max-w-2xl">
                  Schools and colleges across Karnataka can invite Udaan AI to conduct career guidance sessions, pathway exploration workshops, and AI awareness programs for their students.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link to="/register">
                    <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Invite Udaan AI
                    </Button>
                  </Link>

                  <a href="#workshops">
                    <Button variant="outline" size="md" className="bg-transparent text-white border-slate-700 hover:bg-slate-800">
                      Request a Workshop
                    </Button>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center flex flex-col items-center gap-3">
                <School className="w-10 h-10 text-[#005F60]" />
                <h3 className="text-base font-bold text-white">Karnataka Educational Outreach</h3>
                <p className="text-xs text-slate-300 font-medium">
                  Statewide sessions for SSLC 10th and PUC schools across all 31 districts.
                </p>
              </div>

            </div>
          </Container>
        </section>


        {/* ========================================================= */}
        {/* SECTION 12: FINAL CALL TO ACTION */}
        {/* ========================================================= */}
        <section id="cta" className="py-20 bg-white">
          <Container size="xl">
            <CTABanner
              title="Your Future Shouldn't Depend on Guesswork."
              description="Join over 24,000+ Karnataka students taking control of their education pathways with clarity, confidence, and verified milestone roadmaps."
              primaryCtaText="Create Free Account"
              onPrimaryCtaClick={() => navigate(user ? '/dashboard' : '/register')}
              secondaryCtaText="Explore Careers"
              onSecondaryCtaClick={() => {
                const el = document.getElementById('pathways');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
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
