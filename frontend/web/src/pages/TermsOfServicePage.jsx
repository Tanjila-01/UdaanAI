import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Badge from '../components/ui/Badge';
import { BookOpen, AlertCircle, Compass, ArrowLeft, Mail } from 'lucide-react';

export const TermsOfServicePage = () => {
  useEffect(() => {
    document.title = 'Terms of Service | Udaan AI';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#005F60] selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 sm:pt-32 sm:pb-24">
        <Container size="lg">
          {/* Back button */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#005F60] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Header */}
          <div className="border-b border-slate-200/80 pb-8 mb-10">
            <Badge variant="primary" size="sm" className="bg-teal-50 text-[#005F60] border-teal-200 mb-3">
              Platform Terms &amp; Conditions
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">
              Last Updated: September 2026 • Standards and guidelines for using the Udaan AI platform
            </p>
          </div>

          {/* Core Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/70 flex items-start gap-3">
              <Compass className="w-5 h-5 text-[#005F60] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-bold text-slate-900">Advisory Support</h2>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Information is provided to inform educational choices, alongside parent and teacher advice.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/70 flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-[#005F60] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-bold text-slate-900">State Curriculum</h2>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Pathways reflect official Karnataka secondary and technical education structures.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/70 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#005F60] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-bold text-slate-900">Respectful Usage</h2>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Accounts must be used honestly without automated abuse or harmful prompts.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Content */}
          <div className="prose prose-slate max-w-none space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-950">1. Acceptance of Terms</h2>
              <p>
                By accessing or registering on Udaan AI, you agree to these Terms of Service. If you are under 18 years of age, we encourage using this platform under the guidance of a parent, guardian, or school career coordinator.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-950">2. Nature of Guidance &amp; Disclaimer</h2>
              <p>
                Udaan AI provides informational career maps, comparative stream matrices (PUC vs Polytechnic vs ITI), and AI-driven conversational guidance. While we strive to reflect current admission criteria and board notifications accurately, our recommendations do not guarantee college admissions or employment outcomes. Official board circulars from KSEAB, DTE Karnataka, and universities should always be verified during admission cycles.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-950">3. User Responsibilities</h2>
              <p>When interacting with Udaan AI, users agree to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>Provide accurate academic stage and interest details during onboarding.</li>
                <li>Refrain from submitting abusive, hateful, or inappropriate content to the career advisor.</li>
                <li>Not attempt to disrupt or reverse-engineer the underlying service architecture.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-950">4. School &amp; Workshop Coordination</h2>
              <p>
                Institutional representatives requesting group workshops for secondary schools or colleges must provide genuine institutional credentials. Workshop schedules are confirmed based on coordinator availability and logistical feasibility across Karnataka districts.
              </p>
            </section>

            <section className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#005F60]" />
                5. Questions &amp; Inquiries
              </h2>
              <p className="text-xs text-slate-600">
                For questions regarding platform terms or institutional agreements, please contact us at:
              </p>
              <a
                href="mailto:connect.udaanai@gmail.com"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005F60] hover:underline"
              >
                connect.udaanai@gmail.com
              </a>
            </section>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
