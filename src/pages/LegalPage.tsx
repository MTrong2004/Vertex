import React, { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, Shield } from 'lucide-react';

interface LegalPageProps {
  onNavigate: (page: string) => void;
  initialTab?: string;
}

const legalTabs = [
  { id: 'terms', label: 'Terms of Service', icon: <Scale size={16} /> },
  { id: 'privacy', label: 'Privacy Policy', icon: <Shield size={16} /> },
];

// ─── Terms Content ──────────────────────────────────────
const TermsContent: React.FC = () => (
  <div className="prose prose-invert max-w-none space-y-8">
    <section>
      <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        By accessing or using Vertex ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. These terms apply to all users, including visitors, registered users, and subscribers.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        Vertex is an AI-powered project management platform designed for student teams and organizations. The Service includes project planning, task management, AI-assisted scheduling, team collaboration, and related features. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">3. User Accounts</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        To use certain features, you must create an account with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must notify us immediately of any unauthorized use. You must be at least 13 years old to create an account.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">4. Acceptable Use</h2>
      <p className="text-slate-400 leading-relaxed text-sm mb-3">You agree not to:</p>
      <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm">
        <li>Use the Service for any illegal or unauthorized purpose</li>
        <li>Attempt to gain unauthorized access to any part of the Service</li>
        <li>Interfere with or disrupt the Service or servers</li>
        <li>Upload malicious content, viruses, or harmful code</li>
        <li>Impersonate any person or entity</li>
        <li>Use the Service to send spam or unsolicited communications</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">5. Intellectual Property</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        All content, features, and functionality of the Service (including design, code, text, graphics, and logos) are owned by Vertex and are protected by intellectual property laws. Your project data remains your property. By using the Service, you grant us a limited license to process your data to provide the Service.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">6. Payment & Subscriptions</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        Paid plans are billed on a recurring basis (monthly or annually). You may cancel at any time, and cancellation takes effect at the end of the current billing period. We do not offer refunds for partial periods. Prices may change with 30 days' notice.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">7. AI-Generated Content</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        The AI assistant provides suggestions and plans based on your input. AI-generated content is provided "as-is" and should be reviewed before implementation. We do not guarantee the accuracy, completeness, or suitability of AI-generated plans. You are responsible for verifying and adapting AI suggestions for your needs.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">8. Limitation of Liability</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        The Service is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">9. Termination</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        We may terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use the Service ceases immediately.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">10. Changes to Terms</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        We may update these Terms from time to time. We will notify users of material changes via email or in-app notification. Continued use after changes constitutes acceptance of the new terms.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">11. Contact</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        If you have questions about these Terms, please contact us at <span className="text-[#22C55E]">legal@projectplanningtool.com</span>.
      </p>
    </section>
  </div>
);

// ─── Privacy Content ────────────────────────────────────
const PrivacyContent: React.FC = () => (
  <div className="prose prose-invert max-w-none space-y-8">
    <section>
      <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
      <p className="text-slate-400 leading-relaxed text-sm mb-3">We collect information in the following ways:</p>
      <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm">
        <li><strong className="text-slate-300">Account Information:</strong> Name, email address, and profile photo when you create an account.</li>
        <li><strong className="text-slate-300">Project Data:</strong> Projects, tasks, team assignments, and other content you create within the Service.</li>
        <li><strong className="text-slate-300">Usage Data:</strong> How you interact with the Service, including features used, pages visited, and session duration.</li>
        <li><strong className="text-slate-300">Device Information:</strong> Browser type, operating system, IP address, and device identifiers.</li>
        <li><strong className="text-slate-300">AI Interactions:</strong> Conversations with the AI assistant to improve your experience and our models.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
      <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm">
        <li>Provide, maintain, and improve the Service</li>
        <li>Process your requests and deliver AI-generated plans</li>
        <li>Send service notifications and updates</li>
        <li>Analyze usage patterns to improve features</li>
        <li>Ensure security and prevent fraud</li>
        <li>Comply with legal obligations</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">3. Data Storage & Security</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        Your data is stored on secure servers with encryption at rest and in transit. We implement industry-standard security measures including TLS 1.3 encryption, regular security audits, and access controls. Project data stored locally in your browser (via localStorage) is not transmitted to our servers unless you use cloud sync features.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">4. Data Sharing</h2>
      <p className="text-slate-400 leading-relaxed text-sm mb-3">We do not sell your personal information. We may share data with:</p>
      <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm">
        <li><strong className="text-slate-300">Service Providers:</strong> Cloud hosting, analytics, and email services that help us operate.</li>
        <li><strong className="text-slate-300">Team Members:</strong> Other members of your project teams can see shared project data.</li>
        <li><strong className="text-slate-300">Legal Requirements:</strong> When required by law, regulation, or legal process.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">5. AI & Machine Learning</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        Our AI features process your project descriptions and requests to generate plans and suggestions. AI conversations may be used in anonymized and aggregated form to improve our models. You can opt out of AI data training in your account settings. Individual conversations are not shared with third parties.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">6. Cookies & Tracking</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        We use essential cookies for authentication and preferences. Analytics cookies help us understand usage patterns. You can disable non-essential cookies in your browser settings. We do not use third-party advertising trackers.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">7. Your Rights</h2>
      <p className="text-slate-400 leading-relaxed text-sm mb-3">You have the right to:</p>
      <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm">
        <li>Access and download your personal data</li>
        <li>Correct inaccurate information</li>
        <li>Delete your account and associated data</li>
        <li>Opt out of marketing communications</li>
        <li>Restrict processing of your data</li>
        <li>Data portability — export your projects in standard formats</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">8. Data Retention</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        We retain your data for as long as your account is active. If you delete your account, we will delete your data within 30 days, except where we are required by law to retain it. Anonymized analytics data may be retained indefinitely.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">9. Children's Privacy</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        The Service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected such information, we will delete it promptly.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">10. Changes to This Policy</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        We may update this Privacy Policy periodically. We will notify you of material changes via email or in-app notification. The "Last updated" date at the top reflects the most recent revision.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-white mb-3">11. Contact Us</h2>
      <p className="text-slate-400 leading-relaxed text-sm">
        For privacy-related questions or to exercise your rights, contact us at <span className="text-[#22C55E]">privacy@projectplanningtool.com</span>.
      </p>
    </section>
  </div>
);

// ─── Main Component ─────────────────────────────────────

export const LegalPage: React.FC<LegalPageProps> = ({ onNavigate, initialTab = 'terms' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F1A]">
      <Header onNavigate={onNavigate} currentPage="legal" />
      <main className="flex-1 pt-28 pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-sm font-medium mb-6">
              {activeTab === 'terms' ? <Scale size={14} /> : <Shield size={14} />}
              Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </h1>
            <p className="text-sm text-slate-500 mb-8">Last updated: February 1, 2026</p>

            {/* Tab navigation */}
            <div className="inline-flex items-center gap-1 p-1 bg-[#0F1A2A]/80 backdrop-blur-xl rounded-xl border border-[#22C55E]/10 mb-12">
              {legalTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'terms' && <TermsContent />}
              {activeTab === 'privacy' && <PrivacyContent />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
