import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import FounderCard from '../components/product/FounderCard';
import { founders } from '../data/founders';
import {
  Compass,
  Route as RouteIcon,
  Layers,
  Map as MapIcon,
  ArrowRight,
  Target,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export const AboutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'About Us | Udaan AI - Karnataka Student Career Guidance';
    window.scrollTo(0, 0);
  }, []);

  const handleTalkToAdvisor = () => {
    if (!user) {
      navigate('/login', { state: { from: '/student/ai-career' } });
      return;
    }

    if (user.role === 'admin') {
      return;
    }

    navigate('/student/ai-career');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#005F60] selection:text-white">
      {/* Global Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================= */}
        <section className="pt-24 pb-12 sm:pt-32 sm:pb-16 bg-gradient-to-b from-teal-50/40 via-white to-white border-b border-slate-100">
          <Container size="xl">
            <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-4">
              <Badge variant="primary" size="md" dot>
                About Udaan AI
              </Badge>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
                Helping Students Find a <br />
                <span className="text-[#005F60]">Clearer Path Forward</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium max-w-2xl">
                Udaan AI helps Karnataka students understand education and career choices after important academic stages, especially when deciding between routes such as <strong>PUC</strong>, <strong>Polytechnic Diploma</strong>, and <strong>ITI Trades</strong>.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link to="/#pathways">
                  <Button
                    variant="primary"
                    size="md"
                    className="bg-[#005F60] hover:bg-[#004D4E] text-white font-bold shadow-xs hover:shadow-md transition-all duration-200 rounded-xl px-5 h-11"
                    rightIcon={<ArrowRight className="w-4 h-4 text-white" />}
                  >
                    Explore Karnataka Pathways
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button
                    variant="outline"
                    size="md"
                    className="font-bold text-slate-800 bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-2xs rounded-xl px-5 h-11"
                  >
                    Contact Our Team
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* ========================================================= */}
        {/* WHY UDAAN AI EXISTS */}
        {/* ========================================================= */}
        <section className="py-12 sm:py-16 bg-slate-50/60 border-b border-slate-200/60">
          <Container size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 flex flex-col gap-4">
                <Badge variant="warning" size="md">
                  The Problem We Address
                </Badge>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight leading-tight">
                  Why Udaan AI Exists
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Every year across Karnataka, hundreds of thousands of students finish SSLC Class 10 standing at a critical educational crossroads. Most students must choose between Pre-University College (PUC), Polytechnic 3-year technical diplomas, or vocational ITI trades without structured information about where each route leads.
                </p>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  When choices are made based on guesswork or peer pressure, students can face unexpected barriers later, such as eligibility constraints for entrance exams or missing prerequisites for university admissions.
                </p>

                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center gap-3 text-xs text-slate-800 font-medium bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-[#005F60] shrink-0" />
                    <span>Transparent breakdown of Karnataka secondary and technical education routes</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-800 font-medium bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-[#005F60] shrink-0" />
                    <span>Side-by-side comparison of curriculum duration, lateral entry, and eligibility</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-800 font-medium bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-[#005F60] shrink-0" />
                    <span>Personalized milestone planning grounded in official state examination bodies (KEA, DTE)</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#005F60]/20 rounded-full blur-3xl pointer-events-none" />

                  <div className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-4">
                    Our Mission
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-3 tracking-tight">
                    Equitable, Transparent Guidance for Every Karnataka Student
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium mb-6">
                    We believe career clarity should not depend on urban location or expensive private coaching. Udaan AI provides structured, trustworthy navigation accessible to students and coordinators across all 31 districts of Karnataka.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                      <span className="block text-lg font-extrabold text-teal-400">31</span>
                      <span className="text-[11px] text-slate-300 font-medium">Districts statewide</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                      <span className="block text-lg font-extrabold text-amber-400">3</span>
                      <span className="text-[11px] text-slate-300 font-medium">Core education streams</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* ========================================================= */}
        {/* HOW UDAAN AI HELPS */}
        {/* ========================================================= */}
        <section className="py-12 sm:py-16 bg-white border-b border-slate-100">
          <Container size="xl">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <Badge variant="primary" size="md" className="mb-2">
                Core Capabilities
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                How Udaan AI Helps
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
                Four structured steps built specifically around the Karnataka education curriculum.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#004D4E] flex items-center justify-center font-bold mb-4">
                    <Compass className="w-5 h-5 text-[#005F60]" />
                  </div>
                  <span className="text-[10px] font-mono text-[#005F60] font-bold uppercase tracking-wider block mb-1">
                    Step 01
                  </span>
                  <h3 className="text-base font-extrabold text-slate-950 mb-2">
                    Discover
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Understand your interests, academic strengths, and preferences through a stage-aware assessment designed for your education stage.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/60 text-[11px] font-bold text-[#005F60]">
                  Self-Discovery
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold mb-4">
                    <RouteIcon className="w-5 h-5 text-sky-700" />
                  </div>
                  <span className="text-[10px] font-mono text-sky-700 font-bold uppercase tracking-wider block mb-1">
                    Step 02
                  </span>
                  <h3 className="text-base font-extrabold text-slate-950 mb-2">
                    Explore
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Explore Karnataka education pathways on an interactive map showing how PUC, Polytechnic Diploma, and ITI trades connect to degree programs.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/60 text-[11px] font-bold text-sky-700">
                  Pathway Graph
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-4">
                    <Layers className="w-5 h-5 text-amber-700" />
                  </div>
                  <span className="text-[10px] font-mono text-amber-700 font-bold uppercase tracking-wider block mb-1">
                    Step 03
                  </span>
                  <h3 className="text-base font-extrabold text-slate-950 mb-2">
                    Compare
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Understand concrete differences between PUC Science, Commerce, Arts, Polytechnic Diplomas, and ITI trades to choose with confidence.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/60 text-[11px] font-bold text-amber-700">
                  Route Analysis
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-4">
                    <MapIcon className="w-5 h-5 text-emerald-700" />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider block mb-1">
                    Step 04
                  </span>
                  <h3 className="text-base font-extrabold text-slate-950 mb-2">
                    Plan
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Turn your chosen direction into sequential milestones from board exams to entrance exams like KCET, NEET, and DCET lateral entry.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/60 text-[11px] font-bold text-emerald-700">
                  Action Roadmap
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* ========================================================= */}
        {/* MEET THE FOUNDERS */}
        {/* ========================================================= */}
        <section className="py-12 sm:py-16 bg-slate-50/60 border-b border-slate-200/60">
          <Container size="xl">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <Badge variant="primary" size="md" className="mb-2">
                Core Team
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Meet the Founders
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
                The four-member team building Udaan AI to empower students across Karnataka with clear educational direction.
              </p>
            </div>

            {/* Responsive Founder Cards Grid: 4 columns on wide desktop, 2 on tablet, 1 on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {founders.map((founder) => (
                <FounderCard key={founder.id} founder={founder} />
              ))}
            </div>
          </Container>
        </section>

        {/* ========================================================= */}
        {/* ABOUT PAGE CTA */}
        {/* ========================================================= */}
        <section className="py-12 sm:py-16 bg-white">
          <Container size="xl">
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-[#004D4E] text-white rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
              <div className="max-w-2xl mx-auto flex flex-col items-center gap-4 relative z-10">
                <Badge variant="primary" size="sm" className="bg-teal-950 text-teal-300 border-teal-800">
                  Start Your Journey
                </Badge>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Ready to Explore Your Educational Options?
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-xl">
                  Explore the full Karnataka pathway map, compare post-10th streams, and talk to Udaan AI. For partnerships or inquiries, write to us at{' '}
                  <a href="mailto:connect.udaanai@gmail.com" className="text-teal-300 underline font-semibold">
                    connect.udaanai@gmail.com
                  </a>.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                  <Link to="/#pathways">
                    <Button
                      variant="primary"
                      size="md"
                      className="bg-[#005F60] hover:bg-[#004D4E] text-white font-bold rounded-xl px-5 h-11 shadow-sm"
                      rightIcon={<ArrowRight className="w-4 h-4 text-white" />}
                    >
                      Explore Karnataka Pathways
                    </Button>
                  </Link>

                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleTalkToAdvisor}
                    className="bg-[#E06D14] hover:bg-[#C2580E] text-white font-bold rounded-xl px-5 h-11 shadow-sm cursor-pointer"
                    rightIcon={<ArrowRight className="w-4 h-4 text-white" />}
                  >
                    Talk to Udaan AI
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default AboutPage;
