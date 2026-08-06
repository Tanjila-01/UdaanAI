import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { checkGatewayHealth } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  Sparkles, 
  Compass, 
  ArrowRight, 
  BookOpen, 
  Bot, 
  Mic, 
  Volume2, 
  TrendingUp, 
  CheckCircle2, 
  Award, 
  ChevronRight, 
  ChevronDown, 
  Users, 
  Building2, 
  Zap, 
  ShieldCheck, 
  ExternalLink, 
  HelpCircle, 
  Send, 
  RotateCcw,
  LayoutDashboard,
  Cpu,
  Terminal,
  Code,
  GraduationCap,
  Briefcase,
  Lightbulb,
  Radio,
  Star,
  MapPin,
  Calendar,
  Clock,
  UserCheck
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Gateway health check state
  const [gatewayConnected, setGatewayConnected] = useState(true);

  useEffect(() => {
    checkGatewayHealth().then(res => {
      setGatewayConnected(res.success);
    });
  }, []);

  // --- 1. INTERACTIVE PATHWAY EXPLORER STATE ---
  const [activePathwayLevel, setActivePathwayLevel] = useState('Class 10');
  const [activePathwayBranch, setActivePathwayBranch] = useState('PUC');

  const pathwayData = {
    'Class 10': {
      branches: [
        { 
          id: 'PUC', 
          name: 'Pre-University College (PUC)', 
          duration: '2 Years (11th & 12th)', 
          desc: 'Academic stream preparation for university degrees (Engineering, Medicine, Commerce, Law).',
          subTracks: [
            { name: 'Science Stream (PCMB / PCMC)', desc: 'Physics, Chemistry, Math, Bio/CS -> Engineering, Medical, AI Research' },
            { name: 'Commerce Stream (CEBA / SEBA)', desc: 'Computer Science, Economics, Business, Accounts -> CA, Finance, Management' },
            { name: 'Arts & Humanities (HEPS)', desc: 'History, Economics, Pol Science, Sociology -> Civil Services, Law, Design' }
          ]
        },
        { 
          id: 'Diploma', 
          name: 'Polytechnic Diploma', 
          duration: '3 Years (Practical Technical)', 
          desc: 'Hands-on technical engineering education with direct 2nd-year B.Tech lateral entry.',
          subTracks: [
            { name: 'Computer Science & Engineering', desc: 'Programming, Web Dev, Networking & AI Application' },
            { name: 'Electronics & Communication', desc: 'IoT, Circuits, Embedded Systems & Robotics' },
            { name: 'Mechanical & Automation', desc: 'CAD, Robotics, Automation & Manufacturing' }
          ]
        },
        { 
          id: 'ITI', 
          name: 'ITI Vocational Trades', 
          duration: '1 - 2 Years (Skill Certification)', 
          desc: 'Job-oriented industrial training under NCVT certification for early career entry.',
          subTracks: [
            { name: 'Electrician Trade', desc: 'Electrical wiring, motor maintenance & solar installations' },
            { name: 'Electronic Mechanic', desc: 'Circuit repair, consumer electronics & hardware troubleshooting' },
            { name: 'Fitter & Machinist', desc: 'Precision machining, industrial assembly & tool engineering' }
          ]
        }
      ]
    }
  };

  // --- 2. AI CAREER CONSTELLATION STATE ---
  const [selectedConstellationNode, setSelectedConstellationNode] = useState('ai_engineer');

  const constellationNodes = [
    {
      id: 'ai_engineer',
      title: 'AI & ML Engineer',
      category: 'Artificial Intelligence',
      salary: '₹8.5L - ₹26.0L / year',
      demand: '+65% Growth',
      x: 25, y: 35,
      skills: ['Python', 'PyTorch', 'LLM Prompting', 'Neural Networks'],
      desc: 'Designs, trains, and deploys intelligent machine learning models and LLM agents into real-world software.',
      path: 'PUC Science / CS Diploma -> B.Tech Computer Science / AI -> AI Engineer'
    },
    {
      id: 'prompt_engineer',
      title: 'Prompt & Context Architect',
      category: 'Generative AI',
      salary: '₹6.0L - ₹18.0L / year',
      demand: '+85% Growth',
      x: 48, y: 22,
      skills: ['System Prompting', 'NLP', 'Vector Databases', 'Logic Design'],
      desc: 'Optimizes natural language prompts and context windows to guide generative AI models accurately.',
      path: 'Any PUC Stream / Diploma -> AI Literacy Certification -> Prompt Architect'
    },
    {
      id: 'robotics_engineer',
      title: 'Robotics & Mechatronics Specialist',
      category: 'Hardware & AI',
      salary: '₹7.5L - ₹22.0L / year',
      demand: '+40% Growth',
      x: 75, y: 38,
      skills: ['ROS (Robot OS)', 'C++', 'Sensors & Kinematics', 'Embedded Systems'],
      desc: 'Combines mechanical engineering, microcontrollers, and computer vision to build autonomous robots.',
      path: 'PUC Science / Diploma Mech/ECE -> B.Tech Robotics -> Robotics Specialist'
    },
    {
      id: 'data_scientist',
      title: 'Data & Analytics Scientist',
      category: 'Data Science',
      salary: '₹8.0L - ₹24.0L / year',
      demand: '+45% Growth',
      x: 35, y: 70,
      skills: ['SQL', 'Python Data Science', 'Statistics', 'PowerBI / Tableau'],
      desc: 'Extracts strategic insights from massive datasets using statistical algorithms and predictive modeling.',
      path: 'PUC Science / Commerce -> B.Sc / B.Tech Data Science -> Data Scientist'
    },
    {
      id: 'cybersecurity',
      title: 'Cybersecurity & Defense Specialist',
      category: 'Security',
      salary: '₹7.0L - ₹20.0L / year',
      demand: '+50% Growth',
      x: 65, y: 75,
      skills: ['Network Security', 'Ethical Hacking', 'Cryptography', 'Cloud Security'],
      desc: 'Protects critical software infrastructure, databases, and digital networks from cyber attacks and data breaches.',
      path: 'PUC Science / CS Diploma -> B.Tech Cybersecurity / BCA -> Security Specialist'
    }
  ];

  const activeNodeData = constellationNodes.find(n => n.id === selectedConstellationNode) || constellationNodes[0];

  // --- 3. VOICE AI COMPANION SIMULATOR STATE ---
  const [activeVoicePrompt, setActiveVoicePrompt] = useState(0);
  const [isAudioSimulating, setIsAudioSimulating] = useState(false);

  const samplePrompts = [
    {
      question: "Can AI help me choose between PUC Science and CS Diploma?",
      answer: "Absolutely! If you enjoy practical coding and want early hands-on projects with direct B.Tech entry, Diploma is fantastic. If you want broad entrance preparation for JEE/NEET/KCET, PUC Science is ideal.",
      lang: "EN"
    },
    {
      question: "ನನಗೆ AI ಬಗ್ಗೆ ತಿಳಿಯಬೇಕು. ಎಲ್ಲಿಂದ ಪ್ರಾರಂಭಿಸಲಿ? (I want to learn AI. Where do I start?)",
      answer: "ಉಡಾನ್ AI ಉಚಿತ ಕಾರ್ಯಾಗಾರಗಳಿಂದ ಪ್ರಾರಂಭಿಸಿ! Class 8-10 ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ AI ಬೇಸಿಕ್ಸ್ ಮತ್ತು ಪ್ರಾಂಪ್ಟ್ ಇಂಜಿನಿಯರಿಂಗ್ ಪ್ರಾಯೋಗಿಕವಾಗಿ ಕಲಿಯಬಹುದು.",
      lang: "KN"
    },
    {
      question: "What skills are needed to become a Robotics Engineer after SSLC?",
      answer: "Start with Math and Physics in Class 10, explore Arduino microcontrollers in school, then choose PUC Science or Diploma in Electronics/Mechanical!",
      lang: "EN"
    }
  ];

  const triggerVoiceSim = (index) => {
    setActiveVoicePrompt(index);
    setIsAudioSimulating(true);
    setTimeout(() => {
      setIsAudioSimulating(false);
    }, 2500);
  };

  // --- 4. FAQ ACCORDION STATE ---
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const faqs = [
    {
      q: "Is Udaan AI completely free for Karnataka school and PUC students?",
      a: "Yes! Udaan AI is 100% free for all Karnataka KSEEB (Classes 8-10), PUC, Diploma, and ITI students. Our mission is to democratize career clarity and AI literacy for every student across urban and rural districts."
    },
    {
      q: "Is Udaan AI replacing traditional teachers and career counselors?",
      a: "No! Udaan AI puts the STUDENT at the center as the hero. AI acts as a friendly, intelligent guide to help students and teachers explore objective data, cutoffs, and skills together."
    },
    {
      q: "How do live Future Skills Workshops work?",
      a: "Workshops are live, interactive 90-minute online and offline sessions led by IISc, VTU, and industry mentors. Students build real AI prompts, mini-projects, and receive digital certificates."
    },
    {
      q: "Can school principals and teachers request Udaan AI workshops for their institutions?",
      a: "Yes! Schools can invite Udaan AI to host dedicated campus workshops on AI literacy, career pathways, and SSLC exam strategy."
    }
  ];

  // --- 5. WORKSHOP MODAL STATE ---
  const [selectedWorkshopModal, setSelectedWorkshopModal] = useState(null);

  const workshopsList = [
    {
      id: 1,
      title: 'AI Foundations & Prompting',
      subtitle: 'Master ChatGPT, Claude & Gemini for Accelerated Learning',
      speaker: 'Dr. Anand Kumar',
      role: 'IISc Alumnus & AI Researcher',
      duration: '90 Mins',
      level: 'Class 8–12',
      badge: 'LIVE SATURDAY',
      seats: 14,
      imageColor: 'from-[#005F60] to-[#043838]',
      topics: ['Neural Network Basics', 'Prompt Crafting', 'Homework Acceleration', 'Ethical AI']
    },
    {
      id: 2,
      title: 'Build Apps with Generative AI',
      subtitle: 'Create Web Apps & Interactive AI Tools with Zero Code',
      speaker: 'Priya Sharma',
      role: 'Senior AI Engineer, Bengaluru',
      duration: '2 Hours',
      level: 'Class 9–PUC',
      badge: 'LIVE SUNDAY',
      seats: 8,
      imageColor: 'from-[#F97316] to-[#C2410C]',
      topics: ['No-Code AI Platforms', 'Vector Data', 'UI Mockups', 'Publishing Live App']
    },
    {
      id: 3,
      title: 'Canva + AI Visual Design',
      subtitle: 'Design Presentations, Posters & Visual Stories with AI',
      speaker: 'Vikram R.',
      role: 'Design Director',
      duration: '90 Mins',
      level: 'All Levels',
      badge: 'UPCOMING',
      seats: 22,
      imageColor: 'from-[#004D4E] to-[#0F172A]',
      topics: ['Magic Studio', 'AI Image Models', 'Color Theory', 'Visual Storytelling']
    }
  ];

  return (
    <div className="min-h-screen bg-white text-[#0F172A] font-sans selection:bg-[#005F60] selection:text-white relative overflow-x-hidden">
      
      {/* Dynamic Keyframe Animations CSS */}
      <style>{`
        @keyframes paperPlaneFly {
          0% { transform: translate(-20px, 0px) rotate(0deg); }
          25% { transform: translate(180px, -25px) rotate(4deg); }
          50% { transform: translate(360px, -10px) rotate(-2deg); }
          75% { transform: translate(520px, -30px) rotate(5deg); }
          100% { transform: translate(700px, 0px) rotate(0deg); }
        }

        @keyframes soundWaveBar {
          0%, 100% { height: 8px; }
          50% { height: 28px; }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.08); }
        }

        @keyframes floatItem {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .anim-plane-fly { animation: paperPlaneFly 18s linear infinite; }
        .anim-sound-wave { animation: soundWaveBar 1.2s ease-in-out infinite; }
        .anim-glow-pulse { animation: glowPulse 4s ease-in-out infinite; }
        .anim-float { animation: floatItem 6s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .anim-plane-fly, .anim-sound-wave, .anim-glow-pulse, .anim-float {
            animation: none !important;
          }
        }
      `}</style>

      {/* Top Sticky Navigation */}
      <Navbar />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION — Interactive Cinematic Canvas Illustration */}
      {/* ========================================================================= */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden bg-gradient-to-b from-[#F8FAF8] via-white to-white">
        {/* Soft Ambient Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none anim-glow-pulse"></div>
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#F97316]/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Audience Pill Badge */}
              <div className="inline-flex items-center space-x-2 text-xs font-extrabold px-3.5 py-1.5 rounded-full bg-teal-50 text-[#005F60] border border-teal-200 shadow-2xs">
                <Sparkles className="w-4 h-4 text-[#F97316]" />
                <span>KARNATAKA STUDENT CAREER & FUTURE SKILLS PLATFORM</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#0F172A] leading-[1.1]">
                Your Future Starts Here. <br />
                <span className="text-[#005F60]">Discover Path. </span>
                <span className="text-[#F97316]">Master AI.</span>
              </h1>

              {/* Storytelling Subheading */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Discover careers. Explore education pathways after Class 10 & PUC. Build future-ready skills with practical AI workshops designed for Karnataka students.
              </p>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => {
                    const el = document.getElementById('pathways');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    else navigate('/pathways');
                  }}
                  className="inline-flex items-center space-x-2 bg-[#005F60] hover:bg-teal-800 text-white px-7 py-4 rounded-2xl font-extrabold text-sm transition-all shadow-lg shadow-[#005F60]/25 hover:scale-102 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Explore Your Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#workshops"
                  className="inline-flex items-center space-x-2 bg-orange-50 hover:bg-orange-100 text-[#F97316] border border-orange-200 px-6 py-4 rounded-2xl font-extrabold text-sm transition-colors cursor-pointer"
                >
                  <Radio className="w-4 h-4 text-[#F97316] animate-pulse" />
                  <span>Upcoming Workshops</span>
                </a>
              </div>

              {/* Trust Micro-Metrics */}
              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs font-bold text-slate-500">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#005F60]" />
                  <span>100% Free for Karnataka Students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#005F60]" />
                  <span>KSEEB, PUC, Diploma & ITI Aligned</span>
                </div>
              </div>

            </div>

            {/* Right Column: Interactive Animated SVG Landscape & Udaan Plane */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              
              {/* Flying Udaan Paper Plane Overhead */}
              <div className="absolute -top-8 left-0 w-full overflow-hidden pointer-events-none z-20">
                <div className="anim-plane-fly">
                  <div className="bg-white/90 border border-teal-200 px-3 py-1 rounded-full shadow-md text-[10px] font-extrabold text-[#005F60] flex items-center space-x-1.5">
                    <Send className="w-3 h-3 text-[#F97316] -rotate-45" />
                    <span>Udaan Trail</span>
                  </div>
                </div>
              </div>

              {/* Main Illustration Card Surface */}
              <div className="w-full max-w-md bg-gradient-to-br from-[#004D4E] via-[#005F60] to-[#0F172A] rounded-3xl p-6 shadow-2xl border border-teal-800/40 relative text-white space-y-6">
                
                {/* Header Badge in Illustration */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-extrabold tracking-wider bg-teal-500/20 text-teal-200 border border-teal-400/30 px-2.5 py-1 rounded-full">
                    Student Career Companion
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] animate-pulse"></span>
                </div>

                {/* SVG Visual Graphic */}
                <svg viewBox="0 0 400 240" className="w-full h-auto drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Glowing Path */}
                  <path d="M 40 200 Q 120 180, 200 130 T 360 40" stroke="#F97316" strokeWidth="4" strokeDasharray="6 4" />
                  
                  {/* Nodes on Path */}
                  <circle cx="40" cy="200" r="7" fill="#2DD4BF" />
                  <circle cx="120" cy="170" r="8" fill="#F97316" className="anim-glow-pulse" />
                  <circle cx="200" cy="130" r="9" fill="#2DD4BF" />
                  <circle cx="280" cy="85" r="10" fill="#F97316" />
                  <circle cx="360" cy="40" r="12" fill="#2DD4BF" />

                  {/* Student & AI Guide Figure */}
                  <g transform="translate(105, 125)">
                    {/* Student */}
                    <circle cx="10" cy="10" r="7" fill="#FFF" />
                    <path d="M10 17 L10 38 M4 25 L16 25 M10 38 L4 52 M10 38 L16 52" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
                    {/* Backpack */}
                    <rect x="2" y="20" width="7" height="12" rx="2" fill="#F97316" />
                    {/* Friendly Robot Companion */}
                    <rect x="26" y="18" width="16" height="14" rx="4" fill="#2DD4BF" />
                    <circle cx="30" cy="23" r="2" fill="#0F172A" />
                    <circle cx="38" cy="23" r="2" fill="#0F172A" />
                    <path d="M34 26 L34 32" stroke="#2DD4BF" strokeWidth="2" />
                  </g>
                </svg>

                {/* Floating Interactive Micro-Nodes */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/10 backdrop-blur-md border border-white/15 p-2.5 rounded-xl flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-teal-300" />
                    <span className="font-bold text-xs">Class 10 / PUC</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/15 p-2.5 rounded-xl flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-[#F97316]" />
                    <span className="font-bold text-xs">AI & Robotics</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. WHY UDAAN AI — Four Floating Interactive Value Panels */}
      {/* ========================================================================= */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#005F60] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Why Udaan AI Matters
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
              Designed for Student Clarity & Future Confidence
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              No generic coaching templates. Four fundamental pillars to guide Karnataka students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Panel 1: Career Guidance */}
            <div className="bg-[#F8FAF8] border border-slate-200/80 hover:border-[#005F60] rounded-3xl p-6 space-y-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#005F60] border border-teal-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-[#0F172A]">Why Career Guidance?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Eliminate confusion after SSLC (Class 10). Understand exact eligibility, options, and job outlooks for PUC, Diploma, and ITI.
                </p>
              </div>
              <span className="text-[10px] font-extrabold text-[#005F60] block pt-2">
                Clarity over Confusion →
              </span>
            </div>

            {/* Panel 2: AI Literacy */}
            <div className="bg-[#F8FAF8] border border-slate-200/80 hover:border-[#F97316] rounded-3xl p-6 space-y-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] border border-orange-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-[#0F172A]">Why AI Literacy?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  AI is transforming every domain. Learn prompt engineering, generative AI, and coding to become a creator, not just a consumer.
                </p>
              </div>
              <span className="text-[10px] font-extrabold text-[#F97316] block pt-2">
                Creator, Not Consumer →
              </span>
            </div>

            {/* Panel 3: Live Workshops */}
            <div className="bg-[#F8FAF8] border border-slate-200/80 hover:border-[#005F60] rounded-3xl p-6 space-y-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#005F60] border border-teal-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Radio className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-[#0F172A]">Why Workshops?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hands-on live sessions with IISc & VTU mentors. Build mini-projects, earn certificates, and ask real questions.
                </p>
              </div>
              <span className="text-[10px] font-extrabold text-[#005F60] block pt-2">
                Practical Experience →
              </span>
            </div>

            {/* Panel 4: Future Skills */}
            <div className="bg-[#F8FAF8] border border-slate-200/80 hover:border-[#F97316] rounded-3xl p-6 space-y-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] border border-orange-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-[#0F172A]">Why Future Skills?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Prepare for careers that will exist in 5-10 years. Build problem solving, logical thinking, and digital agility.
                </p>
              </div>
              <span className="text-[10px] font-extrabold text-[#F97316] block pt-2">
                Future Readiness →
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE PATHWAY EXPLORER — Branching Roadmap System */}
      {/* ========================================================================= */}
      <section id="pathways" className="py-20 bg-[#F8FAF8] border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#005F60] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Interactive Pathway Explorer
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
                Explore What Comes After Class 10
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Click a education level to watch post-SSLC choices branch organically.
              </p>
            </div>

            <Link
              to="/pathways"
              className="inline-flex items-center space-x-2 bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <span>Launch Full Pathways Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Interactive Branching Component */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 space-y-8 shadow-xs">
            
            {/* Level Selector Node */}
            <div className="flex items-center space-x-3 pb-6 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500">Step 1: Your Academic Stage</span>
              <div className="bg-teal-50 border border-teal-200 px-4 py-2 rounded-2xl text-xs font-black text-[#005F60] flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-[#005F60]" />
                <span>Class 10 (SSLC)</span>
              </div>
            </div>

            {/* Branch Choices (PUC, Diploma, ITI) */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-500 block">
                Step 2: Choose Post-SSLC Pathway Branch
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pathwayData['Class 10'].branches.map((b) => {
                  const isSelected = b.id === activePathwayBranch;

                  return (
                    <button
                      key={b.id}
                      onClick={() => setActivePathwayBranch(b.id)}
                      className={`text-left p-5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-teal-50/70 border-[#005F60] ring-2 ring-[#005F60]/20 shadow-xs'
                          : 'bg-[#F8FAF8] border-slate-200/80 hover:border-teal-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-teal-100 text-[#005F60]">
                          {b.id}
                        </span>
                        <span className="text-[11px] font-extrabold text-[#F97316]">
                          {b.duration}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-[#0F172A]">{b.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{b.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Organic Branch Details Sub-tracks */}
            {activePathwayBranch && (
              <div className="pt-6 border-t border-slate-100 space-y-4 bg-teal-50/30 p-6 rounded-2xl border border-teal-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#005F60]">
                    Available Sub-Streams & Specializations for {activePathwayBranch}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Karnataka Board Aligned
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pathwayData['Class 10'].branches.find(b => b.id === activePathwayBranch)?.subTracks.map((sub, i) => (
                    <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                      <span className="font-extrabold text-xs text-[#0F172A] block">{sub.name}</span>
                      <p className="text-xs text-slate-500 leading-normal">{sub.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FUTURE SKILLS WORKSHOPS — Event Posters (Core Offering) */}
      {/* ========================================================================= */}
      <section id="workshops" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#F97316] bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                CORE OFFERING
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
                Live Future Skills Workshops
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Practical AI, Prompt Engineering, and Coding workshops led by mentors.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
              <span>Registrations Open</span>
            </div>
          </div>

          {/* Poster-Style Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {workshopsList.map((ws) => (
              <div 
                key={ws.id}
                className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-2xl hover:border-[#005F60] transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Poster Top Banner */}
                <div className={`p-6 bg-gradient-to-br ${ws.imageColor} text-white space-y-4 relative`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white">
                      {ws.badge}
                    </span>
                    <span className="text-[11px] font-bold text-amber-300 bg-black/30 px-2 py-0.5 rounded-full">
                      {ws.seats} Seats Left
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black leading-snug group-hover:text-amber-300 transition-colors">
                      {ws.title}
                    </h3>
                    <p className="text-xs text-slate-200 leading-normal line-clamp-2">
                      {ws.subtitle}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-slate-300 border-t border-white/15">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-teal-300" />
                      <span>{ws.duration}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                      <span>{ws.level}</span>
                    </span>
                  </div>
                </div>

                {/* Poster Content & Speaker Details */}
                <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 bg-[#F8FAF8] p-3 rounded-2xl border border-slate-200/60">
                      <div className="w-9 h-9 rounded-xl bg-[#005F60] text-white flex items-center justify-center font-bold text-xs">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-[#0F172A] block">{ws.speaker}</span>
                        <span className="text-[10px] text-slate-500">{ws.role}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Topics Covered</span>
                      <div className="flex flex-wrap gap-1.5">
                        {ws.topics.map((t, idx) => (
                          <span key={idx} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedWorkshopModal(ws)}
                    className="w-full bg-[#F97316] hover:bg-orange-600 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shadow-[#F97316]/20 cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>Register Free Workshop</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. AI CAREER CONSTELLATION MAP */}
      {/* ========================================================================= */}
      <section id="constellation" className="py-20 bg-gradient-to-b from-[#0F172A] via-[#004D4E] to-[#0F172A] text-white overflow-hidden relative">
        
        {/* Background Network Stars */}
        <div className="absolute inset-0 bg-[radial-gradient(#2DD4BF_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
              Interactive Career Map
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              AI Career Constellation
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Click any glowing constellation node to inspect future salary, skill requirements, and learning path.
            </p>
          </div>

          {/* Interactive Constellation Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Constellation Nodes Interactive Canvas Box (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-teal-800/40 rounded-3xl p-6 sm:p-8 relative min-h-[380px] flex items-center justify-center">
              
              {/* SVG Connecting Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <line x1="25%" y1="35%" x2="48%" y2="22%" stroke="#F97316" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                <line x1="48%" y1="22%" x2="75%" y2="38%" stroke="#2DD4BF" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                <line x1="25%" y1="35%" x2="35%" y2="70%" stroke="#2DD4BF" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                <line x1="75%" y1="38%" x2="65%" y2="75%" stroke="#F97316" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                <line x1="35%" y1="70%" x2="65%" y2="75%" stroke="#2DD4BF" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
              </svg>

              {/* Node Buttons */}
              {constellationNodes.map((node) => {
                const isSelected = node.id === selectedConstellationNode;

                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedConstellationNode(node.id)}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-all duration-300`}
                  >
                    <div className={`relative flex items-center justify-center rounded-full transition-all ${
                      isSelected ? 'w-12 h-12 bg-[#F97316] ring-4 ring-[#F97316]/40 shadow-lg shadow-[#F97316]/50' : 'w-8 h-8 bg-teal-500/80 hover:scale-125'
                    }`}>
                      <Cpu className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-950'}`} />
                    </div>
                    <span className={`absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-extrabold px-2 py-0.5 rounded-full border transition-all ${
                      isSelected ? 'bg-[#F97316] text-white border-orange-300' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {node.title}
                    </span>
                  </button>
                );
              })}

            </div>

            {/* Selected Node Details Card (5 cols) */}
            <div className="lg:col-span-5 bg-white text-[#0F172A] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-teal-100 text-[#005F60]">
                  {activeNodeData.category}
                </span>
                <span className="text-xs font-extrabold text-[#F97316] bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                  {activeNodeData.demand}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-[#0F172A]">{activeNodeData.title}</h3>
                <span className="text-xs font-mono font-bold text-[#005F60] block">Average Salary: {activeNodeData.salary}</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {activeNodeData.desc}
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Recommended Learning Route</span>
                <p className="text-xs font-bold text-[#005F60] bg-teal-50/70 p-2.5 rounded-xl border border-teal-100 leading-snug">
                  {activeNodeData.path}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Key Future Competencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeNodeData.skills.map((s, idx) => (
                    <span key={idx} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/pathways')}
                className="w-full bg-[#005F60] hover:bg-teal-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Explore Full Pathway Requirements</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. VOICE AI COMPANION SHOWCASE */}
      {/* ========================================================================= */}
      <section id="ai-companion" className="py-20 bg-[#F8FAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#005F60] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Interactive Guide Preview
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
              Voice & Chat AI Companion
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Ask questions in English or Kannada about your education choices.
            </p>
          </div>

          {/* Interactive Chat Box Box */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 max-w-3xl mx-auto space-y-6 shadow-xs">
            
            {/* Student Micro Prompts Chips */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block">Click a sample student question to simulate voice response:</span>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => triggerVoiceSim(idx)}
                    className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all text-left cursor-pointer ${
                      activeVoicePrompt === idx
                        ? 'bg-teal-50 border-[#005F60] text-[#005F60] ring-2 ring-[#005F60]/20'
                        : 'bg-[#F8FAF8] border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span className="font-mono text-[9px] font-extrabold px-1 rounded bg-slate-200 text-slate-700 mr-1.5">{p.lang}</span>
                    <span>{p.question}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Animated Conversation */}
            <div className="bg-[#F8FAF8] border border-slate-200/80 rounded-2xl p-5 space-y-4">
              {/* Student Bubble */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs flex-shrink-0">
                  You
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-xs text-[#0F172A] font-medium max-w-lg shadow-2xs">
                  {samplePrompts[activeVoicePrompt].question}
                </div>
              </div>

              {/* Voice Soundwave Indicator */}
              {isAudioSimulating && (
                <div className="flex items-center space-x-2 py-1 px-4 bg-teal-50 border border-teal-200 rounded-full w-fit mx-auto text-xs font-bold text-[#005F60]">
                  <Mic className="w-3.5 h-3.5 text-[#F97316] animate-pulse" />
                  <span>AI Companion Responding...</span>
                  <div className="flex items-center space-x-1">
                    <span className="w-1 bg-[#005F60] anim-sound-wave"></span>
                    <span className="w-1 bg-[#005F60] anim-sound-wave" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1 bg-[#005F60] anim-sound-wave" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}

              {/* AI Companion Bubble */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#005F60] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-3.5 text-xs text-[#005F60] font-bold max-w-lg shadow-2xs leading-relaxed">
                  {samplePrompts[activeVoicePrompt].answer}
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. STUDENT JOURNEY — Step-by-Step Udaan Trail Timeline */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#005F60] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              The Udaan Trail
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
              6-Stage Guided Student Journey
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              From Class 8 to career entry, every step is clear and supported.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { stage: 1, name: 'Discover Yourself', desc: 'Identify interest & subject strengths', icon: Sparkles },
              { stage: 2, name: 'Explore Pathways', desc: 'Browse PUC, Diploma & ITI options', icon: Compass },
              { stage: 3, name: 'Attend Workshop', desc: 'Learn practical AI tools & coding', icon: Radio },
              { stage: 4, name: 'Learn AI Skills', desc: 'Master prompt engineering & tools', icon: Cpu },
              { stage: 5, name: 'Career Roadmap', desc: 'Step-by-step post-Class 10 plan', icon: MapPin },
              { stage: 6, name: 'Future Ready', desc: 'Make confident decisions & entry', icon: CheckCircle2 }
            ].map((st) => {
              const Icon = st.icon;

              return (
                <div key={st.stage} className="bg-[#F8FAF8] border border-slate-200/80 rounded-2xl p-4 space-y-2 text-left hover:border-teal-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-[#005F60] text-white flex items-center justify-center text-xs font-bold">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-teal-100 text-[#005F60]">
                      Stage {st.stage}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-xs text-[#0F172A]">{st.name}</h3>
                  <p className="text-[11px] text-slate-500 leading-tight">{st.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. RESOURCE LIBRARY — Floating 3D-Tilt Tool Cards */}
      {/* ========================================================================= */}
      <section id="resources" className="py-20 bg-[#F8FAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#005F60] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Curated Tool Library
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
              Essential AI Tools for Students
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Explore trusted, modern AI assistants for research, writing, coding, and problem solving.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'ChatGPT', tag: 'Writing & Reasoning', desc: 'OpenAI assistant for explaining complex math, science & essays.', icon: Bot },
              { name: 'Google Gemini', tag: 'Research & Multimodal', desc: 'Google AI tool integrated with search for verified research.', icon: Sparkles },
              { name: 'Claude AI', tag: 'Deep Analysis & Code', desc: 'Anthropic reasoning model for writing clean code & analysis.', icon: Cpu },
              { name: 'Perplexity AI', tag: 'Citations & Answers', desc: 'AI answer engine providing cited academic facts and links.', icon: Compass },
              { name: 'Cursor AI', tag: 'Code Building', desc: 'AI-first code editor for high school students learning software.', icon: Code },
              { name: 'Teachable Machine', tag: 'ML Experiments', desc: 'Google web tool to train your first image model in 5 minutes.', icon: Zap }
            ].map((res, idx) => {
              const Icon = res.icon;

              return (
                <div 
                  key={idx}
                  className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-3 hover:shadow-xl hover:border-[#005F60] transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#005F60] border border-teal-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {res.tag}
                      </span>
                    </div>

                    <h3 className="font-black text-base text-[#0F172A] group-hover:text-[#005F60]">
                      {res.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {res.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-[#005F60]">
                    <span>Explore Tool</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. IMPACT SECTION — Animated Metric Counters */}
      {/* ========================================================================= */}
      <section className="py-20 bg-gradient-to-br from-[#004D4E] via-[#005F60] to-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-200 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
              Karnataka Impact
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Empowering Students Across Karnataka
            </h2>
            <p className="text-xs sm:text-sm text-teal-100">
              Measurable progress across state schools, PUC colleges, and technical institutes.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 space-y-2">
              <span className="text-3xl sm:text-5xl font-black text-[#F97316] block">15,000+</span>
              <span className="text-xs font-bold text-slate-200">Students Guided</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 space-y-2">
              <span className="text-3xl sm:text-5xl font-black text-teal-300 block">120+</span>
              <span className="text-xs font-bold text-slate-200">Schools Connected</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 space-y-2">
              <span className="text-3xl sm:text-5xl font-black text-[#F97316] block">45+</span>
              <span className="text-xs font-bold text-slate-200">AI Workshops Conducted</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 space-y-2">
              <span className="text-3xl sm:text-5xl font-black text-teal-300 block">100%</span>
              <span className="text-xs font-bold text-slate-200">Free Access for All</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. TESTIMONIALS CAROUSEL */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#005F60] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Student Voices
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
              Loved by Students, Parents & Teachers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#F8FAF8] border border-slate-200/80 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "I was confused between PUC Science and CS Diploma after 10th. Udaan AI's pathway explorer made the decision crystal clear for me and my parents!"
              </p>
              <div className="flex items-center space-x-3 pt-3 border-t border-slate-200/60">
                <div className="w-9 h-9 rounded-full bg-[#005F60] text-white flex items-center justify-center font-bold text-xs">
                  S
                </div>
                <div>
                  <span className="font-extrabold text-xs text-[#0F172A] block">Suhas N.</span>
                  <span className="text-[10px] text-slate-500">Class 10 Student, Bengaluru</span>
                </div>
              </div>
            </div>

            <div className="bg-[#F8FAF8] border border-slate-200/80 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "The live AI Foundations workshop showed me how AI applies to medicine and engineering. Building my first prompt project was amazing!"
              </p>
              <div className="flex items-center space-x-3 pt-3 border-t border-slate-200/60">
                <div className="w-9 h-9 rounded-full bg-[#F97316] text-white flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <div>
                  <span className="font-extrabold text-xs text-[#0F172A] block">Ananya Rao</span>
                  <span className="text-[10px] text-slate-500">PUC 2 Science Student, Mysuru</span>
                </div>
              </div>
            </div>

            <div className="bg-[#F8FAF8] border border-slate-200/80 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "Udaan AI provides our SSLC students with career clarity that no ordinary textbook can match. The workshops give them real confidence."
              </p>
              <div className="flex items-center space-x-3 pt-3 border-t border-slate-200/60">
                <div className="w-9 h-9 rounded-full bg-[#005F60] text-white flex items-center justify-center font-bold text-xs">
                  R
                </div>
                <div>
                  <span className="font-extrabold text-xs text-[#0F172A] block">Principal Ramesh Bhat</span>
                  <span className="text-[10px] text-slate-500">Government High School, Hubballi</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FAQ ACCORDION */}
      {/* ========================================================================= */}
      <section className="py-20 bg-[#F8FAF8] border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#005F60] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;

              return (
                <div 
                  key={idx}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full p-5 text-left font-extrabold text-sm text-[#0F172A] flex items-center justify-between cursor-pointer hover:text-[#005F60]"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 text-[#005F60]' : 'text-slate-400'}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. FINAL CALL TO ACTION BANNER */}
      {/* ========================================================================= */}
      <section className="py-20 bg-gradient-to-br from-[#004D4E] via-[#005F60] to-[#0F172A] text-white">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider bg-teal-500/20 text-teal-200 border border-teal-400/30 px-3 py-1 rounded-full">
            START YOUR JOURNEY TODAY
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Ready to Build Your Future?
          </h2>
          <p className="text-xs sm:text-base text-teal-100 max-w-2xl mx-auto leading-relaxed">
            Join thousands of Karnataka students discovering pathways, building AI skills, and preparing for the careers of tomorrow.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="bg-[#F97316] hover:bg-orange-500 text-white font-extrabold text-sm px-8 py-4 rounded-2xl shadow-xl shadow-[#F97316]/30 transition-all hover:scale-102 cursor-pointer inline-flex items-center space-x-2"
            >
              <span>{user ? "Go to Dashboard" : "Register Free as Student"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. FOOTER — Dark Navy Minimal & Elegant */}
      {/* ========================================================================= */}
      <footer className="bg-[#0F172A] text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#005F60] flex items-center justify-center text-white font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-black text-lg text-white">Udaan AI</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Karnataka's Career Guidance & Future Skills Platform empowering school and PUC students.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-extrabold text-white uppercase text-[10px] tracking-wider block">Quick Links</span>
              <ul className="space-y-1.5">
                <li><a href="#about" className="hover:text-white transition-colors">About Udaan AI</a></li>
                <li><a href="#pathways" className="hover:text-white transition-colors">Pathway Explorer</a></li>
                <li><a href="#workshops" className="hover:text-white transition-colors">Future Skills Workshops</a></li>
                <li><a href="#constellation" className="hover:text-white transition-colors">AI Constellation</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-extrabold text-white uppercase text-[10px] tracking-wider block">Education Levels</span>
              <ul className="space-y-1.5">
                <li><Link to="/pathways" className="hover:text-white transition-colors">Class 8–10 (SSLC)</Link></li>
                <li><Link to="/pathways" className="hover:text-white transition-colors">PUC Science / Commerce / Arts</Link></li>
                <li><Link to="/pathways" className="hover:text-white transition-colors">Polytechnic Diploma</Link></li>
                <li><Link to="/pathways" className="hover:text-white transition-colors">ITI Vocational Trades</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-extrabold text-white uppercase text-[10px] tracking-wider block">Contact & Support</span>
              <p className="text-slate-400 leading-relaxed">
                Bengaluru, Karnataka, India <br />
                Email: support@udaanai.org
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <span>© {new Date().getFullYear()} Udaan AI — Karnataka Student Edition. All rights reserved.</span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-teal-400 hover:text-teal-300 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <span>Back to Top ↑</span>
            </button>
          </div>

        </div>
      </footer>

      {/* Workshop Registration Modal */}
      {selectedWorkshopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] border border-orange-200 flex items-center justify-center mx-auto">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-teal-100 text-[#005F60] px-2 py-0.5 rounded">
                Free Student Registration
              </span>
              <h3 className="text-xl font-black text-[#0F172A]">{selectedWorkshopModal.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {selectedWorkshopModal.subtitle}
              </p>
            </div>

            <div className="bg-[#F8FAF8] border border-slate-200/80 rounded-2xl p-4 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Mentor:</span>
                <span className="font-extrabold text-[#0F172A]">{selectedWorkshopModal.speaker} ({selectedWorkshopModal.role})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration & Level:</span>
                <span className="font-bold text-[#005F60]">{selectedWorkshopModal.duration} • {selectedWorkshopModal.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Available Seats:</span>
                <span className="font-extrabold text-[#F97316]">{selectedWorkshopModal.seats} Seats Remaining</span>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                to={user ? "/dashboard" : "/register"}
                onClick={() => setSelectedWorkshopModal(null)}
                className="w-full bg-[#005F60] hover:bg-teal-800 text-white font-extrabold py-3 rounded-xl text-xs transition-all shadow-md cursor-pointer block"
              >
                Confirm Free Registration
              </Link>
              <button
                onClick={() => setSelectedWorkshopModal(null)}
                className="w-full text-slate-500 text-xs font-bold py-2 cursor-pointer hover:text-slate-700"
              >
                Cancel & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HomePage;
