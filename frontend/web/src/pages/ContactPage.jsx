import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import WorkshopRequestModal from '../components/product/WorkshopRequestModal';
import { submitContactInquiryApi } from '../api/client';
import {
  Mail,
  Building,
  School,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export const ContactPage = () => {
  useEffect(() => {
    document.title = 'Contact Us | Udaan AI - Karnataka Student Guidance';
    window.scrollTo(0, 0);
  }, []);

  // Workshop Request Modal state for institutional partners
  const [workshopModalOpen, setWorkshopModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = 'Name is required.';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    } else if (trimmedName.length > 100) {
      newErrors.name = 'Name must not exceed 100 characters.';
    }

    const trimmedEmail = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      newErrors.email = 'Email is required.';
    } else if (trimmedEmail.length > 254) {
      newErrors.email = 'Email must not exceed 254 characters.';
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = 'Please provide a valid email address.';
    }

    const trimmedSubject = formData.subject.trim();
    if (!trimmedSubject) {
      newErrors.subject = 'Subject is required.';
    } else if (trimmedSubject.length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters.';
    } else if (trimmedSubject.length > 150) {
      newErrors.subject = 'Subject must not exceed 150 characters.';
    }

    const trimmedMessage = formData.message.trim();
    if (!trimmedMessage) {
      newErrors.message = 'Message is required.';
    } else if (trimmedMessage.length < 10) {
      newErrors.message = 'Message must be at least 10 characters.';
    } else if (trimmedMessage.length > 2000) {
      newErrors.message = 'Message must not exceed 2000 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await submitContactInquiryApi({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      const detailMsg =
        err.response?.data?.detail ||
        (Array.isArray(err.response?.data?.detail)
          ? err.response.data.detail[0]?.msg
          : null) ||
        'Unable to submit your message. Please try again or reach out later.';
      setSubmitError(detailMsg);
    } finally {
      setSubmitting(false);
    }
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
                Contact Udaan AI
              </Badge>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
                Get in Touch
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium max-w-2xl">
                Have questions about educational pathways, career options, or guidance sessions? We welcome students, parents, educators, schools, and institutional coordinators across Karnataka. Reach us at{' '}
                <a
                  href="mailto:connect.udaanai@gmail.com"
                  className="font-bold text-[#005F60] hover:underline"
                >
                  connect.udaanai@gmail.com
                </a>{' '}
                or use the contact form below.
              </p>
            </div>
          </Container>
        </section>

        {/* ========================================================= */}
        {/* CONTACT MAIN CONTAINER: TWO CLEAR PATHWAYS */}
        {/* ========================================================= */}
        <section className="py-12 sm:py-16 bg-slate-50/60 border-b border-slate-200/60">
          <Container size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* LEFT COLUMN: INSTITUTIONAL REQUESTS HIGHLIGHT */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#005F60]/20 rounded-full blur-3xl pointer-events-none" />

                  <Badge variant="primary" size="sm" className="bg-teal-950 text-teal-300 border-teal-800 mb-4">
                    For Schools & Colleges
                  </Badge>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-3 tracking-tight">
                    Request an Institutional Workshop
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium mb-6">
                    If you are a principal, headmaster, or career coordinator looking to arrange an in-person or virtual workshop for your student batch, use our structured institutional booking workflow.
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-xs text-slate-200 bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <School className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>PUC vs Polytechnic Diploma decision sessions</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-200 bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <Building className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Future skills and technical vocational trades</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setWorkshopModalOpen(true)}
                    className="w-full bg-[#005F60] hover:bg-[#004D4E] text-white font-bold h-11 rounded-xl shadow-xs cursor-pointer justify-center"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Request a School Workshop
                  </Button>
                </div>

                {/* TRUST & PROCESS CARD */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-sm">
                    <ShieldCheck className="w-5 h-5 text-[#005F60]" />
                    <span>Statewide Karnataka Reach</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Udaan AI works directly with schools and colleges across all 31 Karnataka districts. We map official state pathways aligned with Karnataka Secondary and Technical Education Boards.
                  </p>
                </div>

                {/* DIRECT EMAIL / INQUIRIES CARD */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-sm">
                    <Mail className="w-5 h-5 text-[#005F60]" />
                    <span>Direct Inquiries</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    For questions, partnership inquiries, or feedback related to this website, write to us directly:
                  </p>
                  <a
                    href="mailto:connect.udaanai@gmail.com"
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#005F60] hover:text-[#004D4E] hover:underline break-all"
                  >
                    <Mail className="w-4 h-4 shrink-0" />
                    connect.udaanai@gmail.com
                  </a>
                </div>
              </div>

              {/* RIGHT COLUMN: GENERAL CONTACT FORM */}
              <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
                <div className="mb-6">
                  <Badge variant="primary" size="sm" className="mb-2 bg-teal-50 text-[#005F60] border-teal-200">
                    General Inquiries
                  </Badge>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                    Send Us a Message
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                    Have a question, feedback, or suggestion? Fill out the form below or write to us directly at{' '}
                    <a
                      href="mailto:connect.udaanai@gmail.com"
                      className="font-bold text-[#005F60] hover:underline"
                    >
                      connect.udaanai@gmail.com
                    </a>.
                  </p>
                </div>

                {/* SUCCESS CONFIRMATION BANNER */}
                {submitSuccess && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold">Message Received!</h4>
                      <p className="text-xs text-emerald-800 mt-0.5 font-medium leading-relaxed">
                        Thank you for reaching out. Your enquiry has been received and safely stored. Our team will review it shortly.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSubmitSuccess(false)}
                        className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                      >
                        Send another message
                      </button>
                    </div>
                  </div>
                )}

                {/* ERROR BANNER */}
                {submitError && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold">Submission Failed</h4>
                      <p className="text-xs text-rose-800 mt-0.5 font-medium leading-relaxed">
                        {submitError}
                      </p>
                      <div className="mt-3 pt-3 border-t border-rose-200/80 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-rose-800">You can also email us directly:</span>
                        <a
                          href={`mailto:connect.udaanai@gmail.com?subject=${encodeURIComponent(formData.subject || 'Website Inquiry')}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-900 bg-white px-2.5 py-1 rounded-lg border border-rose-300 hover:bg-rose-100 transition-colors shadow-2xs"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Send via connect.udaanai@gmail.com
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* THE FORM */}
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-bold text-slate-800 mb-1.5">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g. Anand Kumar"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'contact-name-error' : undefined}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                        errors.name
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                          : 'border-slate-200 focus:border-[#005F60] focus:ring-teal-100'
                      }`}
                    />
                    {errors.name && (
                      <p id="contact-name-error" className="text-xs text-rose-600 font-medium mt-1">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-bold text-slate-800 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      maxLength={254}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="e.g. anand@example.com"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'contact-email-error' : undefined}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                        errors.email
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                          : 'border-slate-200 focus:border-[#005F60] focus:ring-teal-100'
                      }`}
                    />
                    {errors.email && (
                      <p id="contact-email-error" className="text-xs text-rose-600 font-medium mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Subject Field */}
                  <div>
                    <label htmlFor="contact-subject" className="block text-xs font-bold text-slate-800 mb-1.5">
                      Subject <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      required
                      minLength={3}
                      maxLength={150}
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="e.g. Question about ITI trade eligibility"
                      aria-invalid={Boolean(errors.subject)}
                      aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                        errors.subject
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                          : 'border-slate-200 focus:border-[#005F60] focus:ring-teal-100'
                      }`}
                    />
                    {errors.subject && (
                      <p id="contact-subject-error" className="text-xs text-rose-600 font-medium mt-1">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  {/* Message Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="contact-message" className="block text-xs font-bold text-slate-800">
                        Message <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formData.message.length}/2000
                      </span>
                    </div>
                    <textarea
                      id="contact-message"
                      required
                      minLength={10}
                      maxLength={2000}
                      rows={5}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Write your message here with as much detail as needed..."
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? 'contact-message-error' : 'contact-privacy-note'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                        errors.message
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                          : 'border-slate-200 focus:border-[#005F60] focus:ring-teal-100'
                      }`}
                    />
                    {errors.message && (
                      <p id="contact-message-error" className="text-xs text-rose-600 font-medium mt-1">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Privacy Statement */}
                  <p id="contact-privacy-note" className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Your details are used only to respond to your enquiry.
                  </p>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={submitting}
                      className="w-full sm:w-auto min-w-[160px] bg-[#005F60] hover:bg-[#004D4E] text-white font-bold h-11 rounded-xl shadow-xs cursor-pointer justify-center"
                      rightIcon={!submitting && <Send className="w-4 h-4" />}
                    >
                      {submitting ? 'Sending Message...' : 'Send Message'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </Container>
        </section>
      </main>

      {/* Global Footer */}
      <Footer onRequestWorkshop={() => setWorkshopModalOpen(true)} />

      {/* Workshop Request Modal for School Coordinators */}
      <WorkshopRequestModal
        isOpen={workshopModalOpen}
        onClose={() => setWorkshopModalOpen(false)}
        initialTopic="career_guidance"
      />
    </div>
  );
};

export default ContactPage;
