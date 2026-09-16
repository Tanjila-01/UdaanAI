import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Badge from '../components/ui/Badge';
import { ShieldCheck, Lock, EyeOff, ArrowLeft, Mail } from 'lucide-react';

export const PrivacyPolicyPage = () => {
  useEffect(() => {
    document.title = 'Privacy Policy | Udaan AI';
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
              Data Protection &amp; Privacy
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">
              Last Updated: September 2026 • Effective for all students, educators, and institutions in Karnataka
            </p>
          </div>

          {/* Core Guarantees Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/70 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#005F60] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-bold text-slate-900">Student First</h2>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  We never sell student data or run third-party behavioral advertisements.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/70 flex items-start gap-3">
              <Lock className="w-5 h-5 text-[#005F60] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-bold text-slate-900">Data Minimization</h2>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  We collect only the details needed to recommend educational pathways.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/70 flex items-start gap-3">
              <EyeOff className="w-5 h-5 text-[#005F60] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-bold text-slate-900">Safe Communication</h2>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Contact messages are used solely to respond to inquiries and requests.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Content */}
          <div className="prose prose-slate max-w-none space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-950">1. Introduction</h2>
              <p>
                Udaan AI (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides structured career guidance, Karnataka pathway exploration, and AI-driven advisory support to students, schools, and colleges. We are committed to safeguarding the privacy of young learners and complying with applicable Indian digital data protection standards, including the Digital Personal Data Protection (DPDP) framework.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-950">2. Information We Collect</h2>
              <p>We only collect information necessary to personalize your educational guidance:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li><strong>Account Details:</strong> Basic profile credentials such as name, email address, academic stage (e.g., SSLC, 10th Standard, PUC, Diploma), and district in Karnataka.</li>
                <li><strong>Career Assessments:</strong> Answers provided in interest reflections and self-discovery assessments used strictly to compute pathway affinities.</li>
                <li><strong>Advisory Interactions:</strong> Question prompts submitted to the Udaan AI advisor to deliver educational answers and roadmaps.</li>
                <li><strong>Institutional Inquiries:</strong> School names, coordinator contact details, and workshop requests submitted by educational authorities.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-950">3. How We Use Information</h2>
              <p>Your information is used strictly to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>Present customized education roadmaps (PUC vs Polytechnic vs ITI).</li>
                <li>Generate contextual career suggestions based on verified Karnataka state options.</li>
                <li>Coordinate and schedule requested school or college guidance workshops.</li>
                <li>Respond to messages submitted via our contact forms or direct email inquiries.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-950">4. Third-Party Sharing &amp; Advertising</h2>
              <p>
                Udaan AI has a strict no-monetization policy on personal data. We do not sell, rent, or trade your personal data to commercial marketing companies. We do not display third-party tracking banner advertisements on student dashboards.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-950">5. Student Rights &amp; Retention</h2>
              <p>
                Students have the right to review their profile data, update their academic preferences, or request account closure at any time through their dashboard settings or by writing to our team.
              </p>
            </section>

            <section className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#005F60]" />
                6. Contact &amp; Grievances
              </h2>
              <p className="text-xs text-slate-600">
                For questions regarding this policy, data privacy inquiries, or deletion requests, please contact our team directly at:
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

export default PrivacyPolicyPage;
