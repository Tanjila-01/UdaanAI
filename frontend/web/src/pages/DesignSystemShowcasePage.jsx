import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import SectionHeader from '../components/layout/SectionHeader';
import SectionContainer from '../components/ui/SectionContainer';
import Divider from '../components/layout/Divider';
import Breadcrumb from '../components/layout/Breadcrumb';
import CTABanner from '../components/layout/CTABanner';

// UI Components
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Tag from '../components/ui/Tag';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import Stat from '../components/ui/Stat';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import ProgressBar from '../components/ui/ProgressBar';
import ProgressRing from '../components/ui/ProgressRing';
import EmptyState from '../components/ui/EmptyState';

// Product Components
import WorkshopCard from '../components/product/WorkshopCard';
import CareerNode from '../components/product/CareerNode';
import CareerPathCard from '../components/product/CareerPathCard';
import JourneyStep from '../components/product/JourneyStep';
import RoadmapTimeline from '../components/product/RoadmapTimeline';
import PathwayVisualizer from '../components/product/PathwayVisualizer';

import { 
  Send, 
  Search, 
  Mail, 
  Lock, 
  Eye, 
  CheckCircle2, 
  ArrowRight, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Briefcase, 
  TrendingUp, 
  ShieldCheck, 
  Calendar,
  Clock,
  Layers,
  Inbox,
  AlertTriangle,
  Info,
  XCircle,
  Sparkles
} from 'lucide-react';

const DesignSystemShowcasePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTag, setActiveTag] = useState('Computer Science');

  const sampleRoadmapSteps = [
    {
      stepNumber: 1,
      title: 'Class 10 (SSLC) Completion',
      description: 'Achieve 75%+ in Karnataka SSLC state board examination with focus on Science & Math foundation.',
      status: 'completed',
      tags: ['KSEEB Board', 'Math & Science', 'Core Foundation']
    },
    {
      stepNumber: 2,
      title: 'PUC Science (PCMC Stream)',
      description: 'Physics, Chemistry, Math, and Computer Science 2-year pre-university program.',
      status: 'active',
      tags: ['Physics', 'Chemistry', 'Mathematics', 'Computer Science']
    },
    {
      stepNumber: 3,
      title: 'KCET Entrance Examination',
      description: 'Prepare for Karnataka Common Entrance Test for Merit Engineering seats.',
      status: 'upcoming',
      tags: ['KCET Entrance', 'Engineering Seat', 'Rank Top 5000']
    },
    {
      stepNumber: 4,
      title: 'B.E. / B.Tech Computer Science',
      description: '4-year degree in Computer Science & Artificial Intelligence specialization.',
      status: 'upcoming',
      tags: ['Software Engineering', 'AI & ML', 'Internships']
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* SECTION 17: Navbar */}
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <Container size="xl">
          
          {/* Header Banner */}
          <div className="mb-14 bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-xs">
            <Breadcrumb items={[{ label: 'Internal Design System Showcase' }]} className="mb-4" />
            <div className="flex items-center gap-3 mb-3">
              <span className="p-2.5 bg-teal-50 text-[#005F60] rounded-xl font-bold">
                <Layers className="w-6 h-6" />
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Udaan AI Design System Specimen Gallery
              </h1>
            </div>
            <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              Internal component playground to validate consistency, spacing, responsive behavior, accessibility, and interactive states across all 19 Design System primitives using realistic Karnataka student education dataset.
            </p>
          </div>

          {/* SECTION 1: Colors */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="Design Tokens"
              title="1. Color System Palette"
              description="Primary brand teal, secondary warm amber, semantic feedback colors, and 11-step neutral slate scale."
            />

            <div className="space-y-8">
              {/* Brand Colors */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Brand Colors</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[#005F60] text-white shadow-xs">
                    <span className="text-xs font-bold block">Primary Deep Teal</span>
                    <span className="text-[11px] opacity-80 font-mono">#005F60</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#004D4E] text-white shadow-xs">
                    <span className="text-xs font-bold block">Primary Hover</span>
                    <span className="text-[11px] opacity-80 font-mono">#004D4E</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#E06D14] text-white shadow-xs">
                    <span className="text-xs font-bold block">Secondary Amber</span>
                    <span className="text-[11px] opacity-80 font-mono">#E06D14</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#C2580E] text-white shadow-xs">
                    <span className="text-xs font-bold block">Secondary Hover</span>
                    <span className="text-[11px] opacity-80 font-mono">#C2580E</span>
                  </div>
                </div>
              </div>

              {/* Semantic Colors */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Semantic Feedback Colors</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-500 text-white shadow-xs">
                    <span className="text-xs font-bold block">Success</span>
                    <span className="text-[11px] opacity-90 font-mono">#10B981</span>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500 text-white shadow-xs">
                    <span className="text-xs font-bold block">Warning</span>
                    <span className="text-[11px] opacity-90 font-mono">#F59E0B</span>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-500 text-white shadow-xs">
                    <span className="text-xs font-bold block">Error</span>
                    <span className="text-[11px] opacity-90 font-mono">#EF4444</span>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500 text-white shadow-xs">
                    <span className="text-xs font-bold block">Info</span>
                    <span className="text-[11px] opacity-90 font-mono">#3B82F6</span>
                  </div>
                </div>
              </div>

              {/* Slate Neutrals */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Neutral Slate Scale</h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-11 gap-2 text-center text-[10px] font-bold">
                  <div className="p-3 rounded-lg bg-slate-950 text-white">950</div>
                  <div className="p-3 rounded-lg bg-slate-900 text-white">900</div>
                  <div className="p-3 rounded-lg bg-slate-800 text-white">800</div>
                  <div className="p-3 rounded-lg bg-slate-700 text-white">700</div>
                  <div className="p-3 rounded-lg bg-slate-600 text-white">600</div>
                  <div className="p-3 rounded-lg bg-slate-500 text-white">500</div>
                  <div className="p-3 rounded-lg bg-slate-400 text-slate-900">400</div>
                  <div className="p-3 rounded-lg bg-slate-300 text-slate-900">300</div>
                  <div className="p-3 rounded-lg bg-slate-200 text-slate-900">200</div>
                  <div className="p-3 rounded-lg bg-slate-100 text-slate-900">100</div>
                  <div className="p-3 rounded-lg bg-slate-50 text-slate-900 border border-slate-200">50</div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Typography */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="Design Tokens"
              title="2. Typography Hierarchy"
              description="Headings H1-H6, body sizes, captional text, and field labels."
            />

            <div className="space-y-6">
              <div className="space-y-3 pb-6 border-b border-slate-100">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  H1 Heading (36px / 48px) — Discover Your Education Pathway
                </h1>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  H2 Heading (30px) — Karnataka State Board & Diploma Streams
                </h2>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  H3 Heading (24px) — Pre-University Science & Commerce
                </h3>
                <h4 className="text-lg font-bold text-slate-900">
                  H4 Heading (20px) — ITI Vocational Trades Certification
                </h4>
                <h5 className="text-base font-bold text-slate-900">
                  H5 Heading (18px) — KCET Engineering Rank Predictor
                </h5>
                <h6 className="text-sm font-bold text-slate-900">
                  H6 Heading (16px) — Class 10 SSLC Merit Guidance
                </h6>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Body Large (18px)</span>
                  <p className="text-lg text-slate-700 leading-relaxed">
                    Udaan AI provides verified step-by-step career direction for Class 8–10, PUC, Diploma, and ITI students across Karnataka.
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Body Default (16px)</span>
                  <p className="text-base text-slate-600 leading-relaxed">
                    Career clarity is built through structured skill roadmaps, regional orientation workshops, and merit entrance examination guidance.
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Body Small & Caption</span>
                  <p className="text-sm text-slate-600 leading-relaxed mb-2">
                    Body Small (14px): Aligned with KSEEB, DTE Karnataka, and NCVT standards.
                  </p>
                  <p className="text-xs text-slate-500">
                    Caption (12px): Updated August 2026 • Verified Academic Data
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: Buttons */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="UI Component"
              title="3. Button System"
              description="Primary, secondary, outline, ghost, danger variants, sizes, and states."
            />

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Variants</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="danger">Danger Button</Button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Sizes</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" size="sm">Small (sm)</Button>
                  <Button variant="primary" size="md">Medium (md)</Button>
                  <Button variant="primary" size="lg">Large (lg)</Button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">States & Icons</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" leftIcon={<Send className="w-4 h-4" />}>
                    Left Icon
                  </Button>
                  <Button variant="secondary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Right Icon
                  </Button>
                  <Button variant="primary" isLoading>
                    Loading...
                  </Button>
                  <Button variant="primary" disabled>
                    Disabled Button
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: Inputs */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="UI Component"
              title="4. Form Inputs & Select"
              description="Text, email, password, select dropdowns, error, success, and helper text states."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Input
                label="Full Name (Text Input)"
                placeholder="e.g. Ramesh Kumar"
                helperText="Enter your name as registered in SSLC records."
              />
              <Input
                label="Email Address (Email Input)"
                type="email"
                placeholder="student@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                helperText="We will send session confirmations here."
              />
              <Input
                label="Account Password (Password Input)"
                type="password"
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={<Eye className="w-4 h-4 cursor-pointer" />}
              />
              <Input
                label="SSLC Marks Percentage (Error State)"
                placeholder="105%"
                error="Please enter a valid percentage between 0 and 100%"
              />
              <Input
                label="Student Registration Code (Success State)"
                defaultValue="UD-KA-2026-889"
                success="Registration code verified successfully"
              />
              <Select
                label="Current Education Stream (Select)"
                helperText="Select your active educational stream"
                options={[
                  { value: 'class10', label: 'Class 10 (KSEEB SSLC)' },
                  { value: 'puc_science', label: 'PUC Science (11th / 12th)' },
                  { value: 'puc_commerce', label: 'PUC Commerce (CEBA)' },
                  { value: 'diploma', label: 'Polytechnic Diploma (Technical)' },
                  { value: 'iti', label: 'ITI Vocational Trade' },
                ]}
              />
            </div>
          </section>

          {/* SECTION 5: Badges & Tags */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="UI Component"
              title="5. Badges & Tags"
              description="Status badges, category indicators, and interactive skill chips."
            />

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Badges</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary" dot>Primary</Badge>
                  <Badge variant="secondary" dot>Secondary</Badge>
                  <Badge variant="success" dot>Verified Success</Badge>
                  <Badge variant="warning" dot>Pending Warning</Badge>
                  <Badge variant="error" dot>Action Required</Badge>
                  <Badge variant="info" dot>Information</Badge>
                  <Badge variant="neutral">Neutral Stream</Badge>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Tags & Chips</h4>
                <div className="flex flex-wrap gap-2">
                  {['Computer Science', 'Robotics & Automation', 'Electronics (IoT)', 'CA & Finance'].map((tag) => (
                    <Tag
                      key={tag}
                      interactive
                      active={activeTag === tag}
                      onClick={() => setActiveTag(tag)}
                    >
                      {tag}
                    </Tag>
                  ))}
                  <Tag onRemove={() => alert('Tag removed')}>Removable Tag</Tag>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 6: Cards */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="UI Component"
              title="6. Surface Cards"
              description="Minimal surface containers with modular headers, content, and footers."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card hoverable>
                <CardHeader>
                  <Badge variant="primary" size="sm" className="w-fit">Featured Stream</Badge>
                  <CardTitle>Polytechnic Diploma in Computer Science</CardTitle>
                  <CardDescription>
                    3-year practical technical education with direct 2nd-year lateral entry to B.Tech degree programs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ideal for students completing 10th SSLC who prefer hands-on coding, hardware networking, and practical software engineering.
                  </p>
                </CardContent>
                <CardFooter>
                  <span className="text-xs font-bold text-slate-500">Duration: 3 Years</span>
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Explore Details
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <Badge variant="secondary" size="sm" className="w-fit">Vocational Trade</Badge>
                  <CardTitle>ITI Electrician & Renewable Energy Trade</CardTitle>
                  <CardDescription>
                    NCVT-certified 2-year industrial trade training program for early career entry.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Focuses on electrical wiring, motor maintenance, solar panel installations, and industrial automation equipment.
                  </p>
                </CardContent>
                <CardFooter>
                  <span className="text-xs font-bold text-slate-500">Certification: NCVT</span>
                  <Button variant="secondary" size="sm">
                    View Trade
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </section>

          {/* SECTION 7: Stats */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="UI Component"
              title="7. Platform Metric Stats"
              description="Key analytics metrics displaying platform progress and student outreach."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat
                label="Karnataka Students Guided"
                value="24,500+"
                subtitle="Class 8-10, PUC, Diploma & ITI"
                trend="+18%"
                icon={<Users className="w-5 h-5" />}
              />
              <Stat
                label="Verified Career Pathways"
                value="140+"
                subtitle="Mapped to Karnataka DTE & Universities"
                trend="Verified"
                icon={<GraduationCap className="w-5 h-5" />}
              />
              <Stat
                label="Regional Workshops"
                value="85"
                subtitle="Conducted across 31 districts"
                trend="Live"
                icon={<Calendar className="w-5 h-5" />}
              />
              <Stat
                label="Career Clarity Score"
                value="94.2%"
                subtitle="Student confidence rating"
                trend="+12.4%"
                icon={<TrendingUp className="w-5 h-5" />}
              />
            </div>
          </section>

          {/* SECTION 8: Progress Components */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="UI Component"
              title="8. Progress Components"
              description="Linear ProgressBar and circular ProgressRing components."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col gap-6">
                <ProgressBar value={35} label="Career Roadmap Discovery" showPercentage variant="primary" />
                <ProgressBar value={70} label="SSLC Mathematics Preparation" showPercentage variant="secondary" />
                <ProgressBar value={100} label="Profile Verification" showPercentage variant="success" />
              </div>

              <div className="flex items-center justify-around">
                <div className="flex flex-col items-center gap-2">
                  <ProgressRing value={35} size={72} strokeWidth={8} />
                  <span className="text-xs font-bold text-slate-600">Exploration</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <ProgressRing value={70} size={72} strokeWidth={8} />
                  <span className="text-xs font-bold text-slate-600">Skill Readiness</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <ProgressRing value={100} size={72} strokeWidth={8} />
                  <span className="text-xs font-bold text-slate-600">Verified</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 9: Skeleton Loading */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="UI Component"
              title="9. Skeleton Loaders"
              description="Shimmer placeholder presets for asynchronous data fetching."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="text" className="w-1/2" />
                <Skeleton variant="text" className="w-5/6" />
                <div className="flex items-center gap-3 pt-2">
                  <Skeleton variant="avatar" />
                  <Skeleton variant="button" />
                </div>
              </div>
              <Skeleton variant="card" />
            </div>
          </section>

          {/* SECTION 10: Empty States */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="UI Component"
              title="10. Empty State Placeholders"
              description="Zero-state graphic callout with title, description, and action CTA."
            />

            <EmptyState
              icon={<Inbox className="w-6 h-6" />}
              title="No Saved Career Roadmaps Yet"
              description="Start exploring Karnataka education pathways to bookmark your personalized career milestones."
              actionLabel="Explore Pathways Now"
              onAction={() => alert('Navigating to pathways...')}
            />
          </section>

          {/* SECTION 11: WorkshopCard */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="Product Component"
              title="11. Workshop Cards"
              description="Karnataka regional orientation webinar and skill bootcamp cards."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <WorkshopCard
                title="Polytechnic vs PUC Science Orientation"
                topic="Discovering practical technical diploma vs 2-year pre-university degrees for Class 10 SSLC students."
                date="August 18, 2026"
                time="10:30 AM - 12:00 PM IST"
                location="Virtual Zoom & Mysuru DTE Hall"
                speakerName="Dr. K. Srinivas"
                speakerRole="Former Director, DTE Karnataka"
                seatsLeft={14}
                onRegister={() => alert('Registered for workshop')}
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
                onRegister={() => alert('Registered for workshop')}
              />
            </div>
          </section>

          {/* SECTION 12: CareerNode */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="Product Component"
              title="12. Career Node Cards"
              description="Interactive cards representing education stream branches."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CareerNode
                id="puc_science"
                title="Pre-University College (PUC Science)"
                duration="2 Years (11th & 12th)"
                description="Academic stream preparation for university degrees in Engineering (KCET), Medicine (NEET), and Pure Sciences."
                subTracks={['Physics', 'Chemistry', 'Mathematics', 'Computer Science']}
                skills={['Analytical Math', 'Physics Mechanics', 'Problem Solving']}
                isSelected={true}
              />
              <CareerNode
                id="diploma_cs"
                title="Polytechnic Diploma in CSE"
                duration="3 Years (Technical)"
                description="Practical technical engineering education with direct 2nd-year lateral entry to B.Tech programs."
                subTracks={['Web Development', 'Computer Hardware', 'Networking']}
                skills={['JavaScript', 'Linux Systems', 'C++ Programming']}
                isSelected={false}
              />
            </div>
          </section>

          {/* SECTION 13: CareerPathCard */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="Product Component"
              title="13. Career Path Summary Cards"
              description="Career profile summary cards detailing salary ranges, growth rates, and required skills."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CareerPathCard
                title="Software & AI Application Engineer"
                category="Technology"
                salaryRange="₹4.5 LPA - ₹14.0 LPA"
                growthRate="High Growth (+24%)"
                description="Develop web applications, AI models, and cloud software systems for global and Indian technology enterprises."
                topSkills={['Python', 'JavaScript', 'React', 'Database Systems']}
                onExplore={() => alert('Exploring AI Engineer path')}
              />
              <CareerPathCard
                title="Industrial Automation Technician"
                category="Polytechnic / ITI"
                salaryRange="₹3.2 LPA - ₹8.5 LPA"
                growthRate="Steady Demand (+16%)"
                description="Maintain PLC controllers, industrial robotics, motor drives, and solar power equipment in manufacturing hubs."
                topSkills={['Electrical Wiring', 'PLC Systems', 'Circuit Testing', 'CAD']}
                onExplore={() => alert('Exploring Technician path')}
              />
              <CareerPathCard
                title="Financial Analyst & CA Associate"
                category="Commerce"
                salaryRange="₹4.0 LPA - ₹12.0 LPA"
                growthRate="High Growth (+20%)"
                description="Manage corporate taxation, financial auditing, investment planning, and business accounting."
                topSkills={['Tally Prime', 'Corporate Law', 'Auditing', 'Excel']}
                onExplore={() => alert('Exploring Finance path')}
              />
            </div>
          </section>

          {/* SECTION 14: JourneyStep */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="Product Component"
              title="14. Single Journey Step Indicators"
              description="Individual step milestones displaying completed, active, and upcoming statuses."
            />

            <div className="flex flex-col gap-3 max-w-2xl">
              <JourneyStep
                title="Step 1: SSLC State Board Exam"
                subtitle="Completed with 88.4% overall distinction in KSEEB Board"
                status="completed"
              />
              <JourneyStep
                title="Step 2: PUC Science Enrollment"
                subtitle="Active stream: Physics, Chemistry, Math, Computer Science"
                status="active"
              />
              <JourneyStep
                title="Step 3: Engineering Entrance Preparation"
                subtitle="Target exam: KCET 2027 Rank < 5000"
                status="upcoming"
              />
            </div>
          </section>

          {/* SECTION 15: RoadmapTimeline */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="Product Component"
              title="15. Multi-Step Roadmap Timeline"
              description="Vertical step visualizer linking Class 10/PUC/Diploma to higher education and industry roles."
            />

            <div className="max-w-3xl">
              <RoadmapTimeline steps={sampleRoadmapSteps} />
            </div>
          </section>

          {/* SECTION 16: PathwayVisualizer */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="Product Component"
              title="16. Interactive Pathway Visualizer"
              description="Tabbed stream explorer component connecting 10th SSLC to PUC, Diploma, and ITI Trades."
            />

            <PathwayVisualizer />
          </section>

          {/* SECTION 19: Modal */}
          <section className="mb-16 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-xs">
            <SectionHeader
              badge="UI Component"
              title="19. Accessible Modal Dialog"
              description="Popup dialog with backdrop blur, keyboard listeners, and close actions."
            />

            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center gap-4 max-w-md mx-auto">
              <h4 className="text-base font-bold text-slate-900">Modal Dialog Demonstration</h4>
              <p className="text-xs text-slate-500">
                Click below to open the interactive modal window.
              </p>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Open Modal Window
              </Button>

              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Karnataka Career Counselling Booking"
                size="md"
              >
                <div className="space-y-4 text-left">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Reserve a 1-on-1 career guidance session with certified Karnataka educational advisors.
                  </p>
                  <Input label="Student Name" placeholder="Ramesh Kumar" />
                  <Select
                    label="Preferred Session Time"
                    options={[
                      { value: 'morning', label: 'Saturday Morning (10:00 AM)' },
                      { value: 'afternoon', label: 'Sunday Afternoon (2:00 PM)' },
                    ]}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={() => { alert('Session booked!'); setIsModalOpen(false); }}>
                      Confirm Booking
                    </Button>
                  </div>
                </div>
              </Modal>
            </div>
          </section>

        </Container>
      </main>

      {/* SECTION 18: Footer */}
      <Footer />
    </div>
  );
};

export default DesignSystemShowcasePage;
