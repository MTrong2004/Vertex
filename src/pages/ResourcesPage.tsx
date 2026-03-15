import React, { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Search, ChevronRight, Zap, Users, Bot, LayoutDashboard, Settings, FileText,
  Clock, ArrowRight, Sparkles, Calendar, PenLine, Tag,
  MessageSquare, Github, Globe, Heart, Star, ExternalLink,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

interface ResourcesPageProps {
  onNavigate: (page: string) => void;
  initialTab?: string;
}

// ─── Documentation Data ─────────────────────────────────
const docSections = [
  {
    id: 'getting-started',
    icon: <Zap size={20} className="text-[#22C55E]" />,
    title: 'Getting Started',
    description: 'Learn the basics and set up your first project.',
    articles: [
      { title: 'Quick Start Guide', description: 'Create your first project in under 2 minutes.' },
      { title: 'Account Setup', description: 'Configure your profile, preferences, and team settings.' },
      { title: 'Creating a Project', description: 'Step-by-step guide to creating and organizing projects.' },
      { title: 'Inviting Team Members', description: 'Add team members and assign roles.' },
    ],
  },
  {
    id: 'ai-assistant',
    icon: <Bot size={20} className="text-[#EAB308]" />,
    title: 'AI Assistant',
    description: 'Unlock the full power of AI-driven planning.',
    articles: [
      { title: 'Using the AI Chatbot', description: 'How to interact with the AI to create plans and get suggestions.' },
      { title: 'AI Task Breakdown', description: 'Let AI automatically divide work into actionable tasks.' },
      { title: 'Smart Scheduling', description: 'AI-optimized deadlines based on team capacity.' },
      { title: 'AI Templates', description: 'Use pre-built templates for common project types.' },
    ],
  },
  {
    id: 'project-management',
    icon: <LayoutDashboard size={20} className="text-[#22C55E]" />,
    title: 'Project Management',
    description: 'Master the Kanban board, timeline, and task management.',
    articles: [
      { title: 'Kanban Board', description: 'Drag-and-drop tasks between status columns.' },
      { title: 'Timeline View', description: 'Visualize your project schedule in a Gantt-style chart.' },
      { title: 'Task Details', description: 'Add descriptions, assignees, priorities, and due dates.' },
      { title: 'Filtering & Search', description: 'Find tasks quickly using search and filters.' },
    ],
  },
  {
    id: 'team-collaboration',
    icon: <Users size={20} className="text-[#EAB308]" />,
    title: 'Team & Collaboration',
    description: 'Work together in real-time with your team.',
    articles: [
      { title: 'Team Management', description: 'Add members, manage roles, and set permissions.' },
      { title: 'Real-time Collaboration', description: 'Multiple users editing and viewing projects simultaneously.' },
      { title: 'Notifications', description: 'Stay updated on task changes and team activity.' },
      { title: 'Activity Log', description: 'Track all changes and actions in your project.' },
    ],
  },
  {
    id: 'integrations',
    icon: <Settings size={20} className="text-[#22C55E]" />,
    title: 'Integrations & Settings',
    description: 'Connect tools and customize your workspace.',
    articles: [
      { title: 'Google Calendar Sync', description: 'Sync project deadlines with your calendar.' },
      { title: 'Slack Integration', description: 'Receive project updates directly in Slack channels.' },
      { title: 'Export & Reports', description: 'Generate and export PDF reports.' },
      { title: 'Account Settings', description: 'Theme, language, and notification preferences.' },
    ],
  },
  {
    id: 'api',
    icon: <FileText size={20} className="text-[#EAB308]" />,
    title: 'API Reference',
    description: 'Build on top of our platform with the REST API.',
    articles: [
      { title: 'Authentication', description: 'API keys, OAuth, and token management.' },
      { title: 'Projects API', description: 'CRUD operations for projects and tasks.' },
      { title: 'Users & Teams API', description: 'Manage team members programmatically.' },
      { title: 'Webhooks', description: 'Real-time event notifications via webhooks.' },
    ],
  },
];

// ─── Guide Data ─────────────────────────────────────────
const guides = [
  {
    icon: <Sparkles size={20} className="text-[#22C55E]" />,
    title: 'Create Your First AI Plan',
    description: 'Learn how to describe your project and let AI generate a complete plan with tasks, deadlines, and team assignments.',
    duration: '5 min read',
    difficulty: 'Beginner',
    difficultyColor: 'text-[#22C55E] bg-[#22C55E]/10',
  },
  {
    icon: <LayoutDashboard size={20} className="text-[#EAB308]" />,
    title: 'Mastering the Kanban Board',
    description: 'Organize tasks with drag-and-drop, customize columns, and use filters to manage your workflow efficiently.',
    duration: '8 min read',
    difficulty: 'Beginner',
    difficultyColor: 'text-[#22C55E] bg-[#22C55E]/10',
  },
  {
    icon: <Users size={20} className="text-[#22C55E]" />,
    title: 'Team Collaboration Best Practices',
    description: 'Set up roles, manage permissions, and establish communication workflows for your student team.',
    duration: '10 min read',
    difficulty: 'Intermediate',
    difficultyColor: 'text-[#EAB308] bg-[#EAB308]/10',
  },
  {
    icon: <Bot size={20} className="text-[#EAB308]" />,
    title: 'Advanced AI Prompting',
    description: 'Write better prompts for the AI chatbot to get more accurate plans, schedules, and task breakdowns.',
    duration: '7 min read',
    difficulty: 'Intermediate',
    difficultyColor: 'text-[#EAB308] bg-[#EAB308]/10',
  },
  {
    icon: <Calendar size={20} className="text-[#22C55E]" />,
    title: 'Timeline Planning for Capstone Projects',
    description: 'A step-by-step guide to planning a semester-long capstone project with milestones and deliverables.',
    duration: '12 min read',
    difficulty: 'Advanced',
    difficultyColor: 'text-red-400 bg-red-400/10',
  },
  {
    icon: <FileText size={20} className="text-[#EAB308]" />,
    title: 'Generating Reports for Professors',
    description: 'Export professional progress reports showing task completion, team contributions, and project health.',
    duration: '6 min read',
    difficulty: 'Intermediate',
    difficultyColor: 'text-[#EAB308] bg-[#EAB308]/10',
  },
];

// ─── Blog Data ──────────────────────────────────────────
const posts = [
  {
    title: 'How AI is Transforming Project Planning for Students',
    excerpt: 'Explore how artificial intelligence helps student teams plan faster, avoid missed deadlines, and distribute work more fairly.',
    date: 'Feb 18, 2026',
    readTime: '6 min read',
    tag: 'AI & Planning',
    tagColor: 'text-[#22C55E] bg-[#22C55E]/10',
    image: 'from-[#22C55E]/20 to-[#06B6D4]/20',
  },
  {
    title: '5 Common Mistakes Teams Make with Task Division',
    excerpt: 'Learn from the top pitfalls that lead to unbalanced workloads and how to fix them with smart planning strategies.',
    date: 'Feb 10, 2026',
    readTime: '5 min read',
    tag: 'Best Practices',
    tagColor: 'text-[#EAB308] bg-[#EAB308]/10',
    image: 'from-[#EAB308]/20 to-[#22C55E]/20',
  },
  {
    title: 'Kanban vs. Timeline: Which View is Right for Your Team?',
    excerpt: 'A practical comparison of Kanban boards and timeline views to help you choose the best workflow for your project type.',
    date: 'Feb 3, 2026',
    readTime: '7 min read',
    tag: 'Workflow',
    tagColor: 'text-[#06B6D4] bg-[#06B6D4]/10',
    image: 'from-[#06B6D4]/20 to-[#22C55E]/20',
  },
  {
    title: 'Building a Capstone Project Plan in 10 Minutes',
    excerpt: 'Step-by-step walkthrough of using AI to create a complete capstone project plan with milestones and team assignments.',
    date: 'Jan 25, 2026',
    readTime: '8 min read',
    tag: 'Tutorial',
    tagColor: 'text-purple-400 bg-purple-400/10',
    image: 'from-purple-500/20 to-[#22C55E]/20',
  },
  {
    title: 'The Psychology of Deadlines: Why Students Miss Them',
    excerpt: 'Research-backed insights into deadline psychology and practical tools to help your team stay on track.',
    date: 'Jan 18, 2026',
    readTime: '5 min read',
    tag: 'Productivity',
    tagColor: 'text-[#22C55E] bg-[#22C55E]/10',
    image: 'from-[#22C55E]/20 to-[#EAB308]/20',
  },
  {
    title: "What's New: February 2026 Product Update",
    excerpt: 'A roundup of the latest features including enhanced AI chatbot, new integrations, and UI improvements.',
    date: 'Jan 10, 2026',
    readTime: '4 min read',
    tag: 'Product Update',
    tagColor: 'text-[#EAB308] bg-[#EAB308]/10',
    image: 'from-[#EAB308]/20 to-[#06B6D4]/20',
  },
];

// ─── Community Data ─────────────────────────────────────
const channels = [
  {
    icon: <MessageSquare size={24} className="text-[#22C55E]" />,
    name: 'Discord Community',
    description: 'Join 2,000+ members discussing project planning, AI tools, and team management.',
    members: '2,147',
    cta: 'Join Discord',
  },
  {
    icon: <Github size={24} className="text-white" />,
    name: 'GitHub Discussions',
    description: 'Report bugs, request features, and contribute to the open-source ecosystem.',
    members: '890',
    cta: 'View on GitHub',
  },
  {
    icon: <Globe size={24} className="text-[#06B6D4]" />,
    name: 'Forum',
    description: 'Long-form discussions, guides, and Q&A with the community and team.',
    members: '1,230',
    cta: 'Browse Forum',
  },
];

const communityStats = [
  { value: '5,000+', label: 'Community members' },
  { value: '300+', label: 'Templates shared' },
  { value: '1,200+', label: 'Questions answered' },
  { value: '50+', label: 'Contributors' },
];

const showcaseProjects = [
  {
    name: 'Capstone Dashboard — UIT Team',
    description: 'A graduation project management system for 8 team members using AI planning.',
    stars: 42, likes: 128,
  },
  {
    name: 'Hackathon Sprint Planner',
    description: 'Template for organizing 48-hour hackathon sprints with automatic task assignment.',
    stars: 67, likes: 203,
  },
  {
    name: 'Design Team Weekly Planner',
    description: 'Recurring weekly project template for design teams with review checkpoints.',
    stars: 35, likes: 96,
  },
];

// ─── Tabs Config ────────────────────────────────────────
const tabs = [
  { id: 'docs', label: 'Documentation', icon: <BookOpen size={16} /> },
  { id: 'guide', label: 'Guides', icon: <FileText size={16} /> },
  { id: 'blog', label: 'Blog', icon: <PenLine size={16} /> },
  { id: 'community', label: 'Community', icon: <Users size={16} /> },
];

// ─── Tab Content Components ─────────────────────────────

const DocumentationTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = searchQuery.trim()
    ? docSections.map(s => ({
        ...s,
        articles: s.articles.filter(
          a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               a.description.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(s => s.articles.length > 0)
    : docSections;

  return (
    <div>
      {/* Search */}
      <div className="max-w-lg mx-auto relative mb-10">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#22C55E]/10 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 outline-none text-sm bg-[#0F1A2A]/80 backdrop-blur-xl text-white placeholder-slate-500 transition-all"
        />
      </div>

      {/* Sections grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSections.map((section, idx) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            className="bg-[#0F1A2A]/70 backdrop-blur-xl rounded-2xl border border-[#22C55E]/10 p-6 hover:border-[#22C55E]/25 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#162032] flex items-center justify-center border border-[#22C55E]/10">
                {section.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{section.title}</h3>
                <p className="text-xs text-slate-500">{section.articles.length} articles</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-4">{section.description}</p>
            <div className="space-y-2">
              {section.articles.map((article) => (
                <button
                  key={article.title}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-[#162032] transition-colors group/item"
                >
                  <div>
                    <span className="text-sm text-slate-300 group-hover/item:text-white transition-colors">{article.title}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{article.description}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-600 group-hover/item:text-[#22C55E] flex-shrink-0 ml-2 transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const GuidesTab: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
    {guides.map((guide, idx) => (
      <motion.div
        key={guide.title}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: idx * 0.05 }}
        className="group cursor-pointer"
      >
        <div className="h-full bg-[#0F1A2A]/70 backdrop-blur-xl rounded-2xl border border-[#22C55E]/10 p-6 hover:border-[#22C55E]/30 hover:shadow-lg hover:shadow-green-500/5 transition-all flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#162032] flex items-center justify-center border border-[#22C55E]/10">
              {guide.icon}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${guide.difficultyColor}`}>
              {guide.difficulty}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#22C55E] transition-colors">{guide.title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-1">{guide.description}</p>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock size={12} />
              {guide.duration}
            </span>
            <span className="flex items-center gap-1 text-xs text-[#22C55E] opacity-0 group-hover:opacity-100 transition-opacity">
              Read guide <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

const BlogTab: React.FC = () => (
  <div>
    {/* Featured post */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-10 cursor-pointer group"
    >
      <div className="bg-[#0F1A2A]/70 backdrop-blur-xl rounded-2xl border border-[#22C55E]/10 overflow-hidden hover:border-[#22C55E]/30 transition-all flex flex-col md:flex-row">
        <div className={`w-full md:w-80 h-48 md:h-auto bg-gradient-to-br ${posts[0].image} flex-shrink-0`}></div>
        <div className="p-8 flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${posts[0].tagColor}`}>{posts[0].tag}</span>
            <span className="text-xs text-slate-500">{posts[0].date}</span>
            <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={10} />{posts[0].readTime}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-[#22C55E] transition-colors">{posts[0].title}</h2>
          <p className="text-slate-400 leading-relaxed mb-4">{posts[0].excerpt}</p>
          <span className="flex items-center gap-1.5 text-sm text-[#22C55E] font-medium">
            Read article <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </motion.div>

    {/* Posts grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.slice(1).map((post, idx) => (
        <motion.div
          key={post.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: idx * 0.05 }}
          className="cursor-pointer group"
        >
          <div className="h-full bg-[#0F1A2A]/70 backdrop-blur-xl rounded-2xl border border-[#22C55E]/10 overflow-hidden hover:border-[#22C55E]/30 hover:shadow-lg hover:shadow-green-500/5 transition-all flex flex-col">
            <div className={`h-32 bg-gradient-to-br ${post.image}`}></div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${post.tagColor}`}>{post.tag}</span>
                <span className="text-xs text-slate-500">{post.date}</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#22C55E] transition-colors">{post.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed flex-1 mb-3">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={10} />{post.readTime}</span>
                <ArrowRight size={14} className="text-slate-600 group-hover:text-[#22C55E] transition-colors" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const CommunityTab: React.FC = () => (
  <div>
    {/* Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-3xl mx-auto">
      {communityStats.map((stat) => (
        <div key={stat.label} className="text-center p-4 bg-[#0F1A2A]/50 backdrop-blur-xl rounded-xl border border-[#22C55E]/10">
          <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
          <div className="text-xs text-slate-500">{stat.label}</div>
        </div>
      ))}
    </div>

    {/* Channels */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {channels.map((channel, idx) => (
        <motion.div
          key={channel.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
        >
          <div className="h-full bg-[#0F1A2A]/70 backdrop-blur-xl rounded-2xl border border-[#22C55E]/10 p-6 hover:border-[#22C55E]/25 transition-colors flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-[#162032] flex items-center justify-center border border-[#22C55E]/10 mb-4">
              {channel.icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{channel.name}</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-1">{channel.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{channel.members} members</span>
              <button className="flex items-center gap-1.5 text-sm text-[#22C55E] font-medium hover:underline">
                {channel.cta} <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>

    {/* Community Showcase */}
    <h2 className="text-2xl font-bold text-white text-center mb-8">Community Showcase</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {showcaseProjects.map((project) => (
        <div key={project.name} className="bg-[#0F1A2A]/70 backdrop-blur-xl rounded-2xl border border-[#22C55E]/10 p-6 hover:border-[#22C55E]/25 transition-colors cursor-pointer group">
          <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#22C55E] transition-colors">{project.name}</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">{project.description}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Star size={12} className="text-[#EAB308]" />{project.stars}</span>
            <span className="flex items-center gap-1"><Heart size={12} className="text-red-400" />{project.likes}</span>
          </div>
        </div>
      ))}
    </div>

    {/* CTA */}
    <div className="text-center">
      <div className="bg-gradient-to-r from-[#22C55E]/10 to-[#EAB308]/10 rounded-3xl border border-[#22C55E]/15 p-12 backdrop-blur-xl max-w-3xl mx-auto">
        <h2 className="text-3xl font-display font-bold text-white mb-4">
          Join the community
        </h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          Share your projects, get feedback, and help shape the future of the tool.
        </p>
        <Button size="lg" icon={<ArrowRight size={20} />}>
          Get Started
        </Button>
      </div>
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────

export const ResourcesPage: React.FC<ResourcesPageProps> = ({ onNavigate, initialTab = 'docs' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabDescriptions: Record<string, { title: React.ReactNode; subtitle: string }> = {
    docs: {
      title: <>Learn <span className="text-gradient">everything</span></>,
      subtitle: 'Comprehensive guides and references to help you get the most from Vertex.',
    },
    guide: {
      title: <>Step-by-step <span className="text-gradient">guides</span></>,
      subtitle: 'Practical tutorials to help you and your team get the most from every feature.',
    },
    blog: {
      title: <>Insights & <span className="text-gradient">updates</span></>,
      subtitle: 'Tips, tutorials, and product news to help your team work smarter.',
    },
    community: {
      title: <>Built by the <span className="text-gradient">community</span></>,
      subtitle: 'Connect with other teams, share templates, and learn from each other.',
    },
  };

  const current = tabDescriptions[activeTab];

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F1A]">
      <Header onNavigate={onNavigate} currentPage="resources" />
      <main className="flex-1 pt-28 pb-20">
        <div className="container relative mx-auto overflow-hidden px-4 md:px-6">
          {/* Ambient moving gradient blobs */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-[#22C55E]/16 blur-3xl"
            animate={{ x: [0, 20, -8, 0], y: [0, -12, 8, 0], scale: [1, 1.07, 0.96, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-[#EAB308]/13 blur-3xl"
            animate={{ x: [0, -16, 12, 0], y: [0, 12, -10, 0], scale: [1, 0.95, 1.05, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-[34%] top-[26rem] h-64 w-64 rounded-full bg-[#84CC16]/10 blur-3xl"
            animate={{ x: [0, 16, -14, 0], y: [0, 10, -8, 0], scale: [1, 1.05, 0.95, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative z-10">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-sm font-medium mb-6">
                <BookOpen size={14} />
                Resources
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                {current.title}
              </h1>
              <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10">
                {current.subtitle}
              </p>

              {/* Tab navigation */}
              <div className="inline-flex items-center gap-1 p-1 bg-[#0F1A2A]/80 backdrop-blur-xl rounded-xl border border-[#22C55E]/10">
                {tabs.map((tab) => (
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
                    <span className="hidden sm:inline">{tab.label}</span>
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
                {activeTab === 'docs' && <DocumentationTab />}
                {activeTab === 'guide' && <GuidesTab />}
                {activeTab === 'blog' && <BlogTab />}
                {activeTab === 'community' && <CommunityTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
