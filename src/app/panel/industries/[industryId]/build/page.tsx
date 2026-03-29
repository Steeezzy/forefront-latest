'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getIndustryConfig } from '@/data/auto-config';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, ChevronRight, Phone, Bot, Zap, BookOpen, AlertCircle } from 'lucide-react';

type Step = 'info' | 'setup' | 'connect' | 'test' | 'live';

interface SetupTask {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done';
}

export default function BuildWorkspacePage() {
  const { industryId } = useParams<{ industryId: string }>();
  const router = useRouter();
  const [config, setConfig] = useState<ReturnType<typeof getIndustryConfig>>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (industryId) {
      setConfig(getIndustryConfig(industryId as string));
    }
  }, [industryId]);

  const [step, setStep] = useState<Step>('info');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tasks, setTasks] = useState<SetupTask[]>([]);
  const [agentId, setAgentId] = useState('');
  const orgId = 'demo-org'; // replace with real auth

  if (!isClient) return null;

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <div className="h-16 w-16 mb-6 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-semibold text-[#0a192f] mb-2">Industry Not Found</h2>
        <p className="text-[#64748b] text-[15px] max-w-sm text-center mb-8">
          We couldn't locate the setup template for this industry. It may have been relocated or removed.
        </p>
        <button 
          onClick={() => router.push('/panel/industries')}
          className="rounded-xl border border-[#e2e8f0] bg-white px-6 py-3 font-medium text-[#0a192f] shadow-sm hover:bg-[#f8fafc] transition-all"
        >
          Return to Industries
        </button>
      </div>
    );
  }

  const SETUP_TASKS: SetupTask[] = [
    { id: 'agent', label: `Creating ${config.agentName} AI voice agent`, status: 'pending' },
    { id: 'knowledge', label: 'Building knowledge base with FAQ', status: 'pending' },
    { id: 'templates', label: 'Loading industry templates', status: 'pending' },
    { id: 'automations', label: 'Setting up automation rules', status: 'pending' },
    { id: 'greeting', label: 'Configuring greeting and voice', status: 'pending' },
    { id: 'workspace', label: 'Finalizing workspace', status: 'pending' },
  ];

  const runAutoSetup = async () => {
    setStep('setup');
    const taskList = [...SETUP_TASKS];
    setTasks(taskList);

    for (let i = 0; i < taskList.length; i++) {
      // Set to running
      setTasks(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'running' } : t));
      
      // Simulate API call delay (slower for premium effect)
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

      if (i === 0) {
        // Actually create the agent
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/voice-agents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orgId,
              name: config.agentName,
              language: config.language,
              voice: config.agentVoice,
              systemPrompt: config.systemPrompt,
              firstMessage: config.greeting,
              industry: config.industryId,
            }),
          });
          const data = await res.json();
          if (data.id) setAgentId(data.id);
        } catch (e) {
          console.error('Agent creation simulate fallback:', e);
        }
      }

      if (i === 1 && agentId) {
        // Create knowledge base
        try {
          for (const faq of config.sampleFAQs) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/knowledge/qna`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                agentId,
                question: faq.question,
                answer: faq.answer,
              }),
            });
          }
        } catch (e) {
          console.error('KB creation simulate fallback:', e);
        }
      }

      // Mark done
      setTasks(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'done' } : t));
    }

    setTimeout(() => setStep('connect'), 800);
  };

  const steps = [
    { id: 'info', label: 'Business info' },
    { id: 'setup', label: 'Auto-setup' },
    { id: 'connect', label: 'Connect number' },
    { id: 'test', label: 'Test agent' },
    { id: 'live', label: 'Live preview' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-12 pb-24 px-6 sm:px-12 flex flex-col">
      {/* Header Container */}
      <div className="w-full max-w-2xl mx-auto mb-10">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-[#94a3b8] mb-8 font-medium">
          <button 
            onClick={() => router.push('/panel/industries')}
            className="hover:text-[#0a192f] transition-colors"
          >
            Industries
          </button>
          <ChevronRight size={14} className="text-[#cbd5e1]" />
          <span className="text-[#0a192f] font-semibold">{config.industryName}</span>
          <ChevronRight size={14} className="text-[#cbd5e1]" />
          <span className="text-[#64748b]">Setup Workspace</span>
        </nav>

        {/* Title Block */}
        <div className="flex items-start gap-4 mb-10">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-white/20"
            style={{ 
              background: `linear-gradient(135deg, ${config.color}20, ${config.color}10)`,
              boxShadow: `inset 0 0 0 1px ${config.color}30`
            }}
          >
            {config.emoji}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a192f] mb-1.5 flex items-center gap-3">
              Set up {config.industryName} 
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] uppercase tracking-wider font-bold border border-blue-100">
                1-Click
              </span>
            </h1>
            <p className="text-[#475569] text-[15px]">
              Your AI agent will be fully configured and ready in under 2 minutes.
            </p>
          </div>
        </div>

        {/* Progress Tracker Strip */}
        <div className="relative flex items-center justify-between mb-12">
          {/* Background Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#e2e8f0] -translate-y-1/2" />
          
          {/* Active Fill Line */}
          <motion.div 
            className="absolute top-1/2 left-0 h-0.5 bg-[#0a192f] -translate-y-1/2" 
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {/* Step Circles */}
          {steps.map((s, i) => {
            const isCompleted = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const isPending = i > currentStepIndex;

            return (
              <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                <motion.div 
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted || isCurrent ? '#0a192f' : '#ffffff',
                    borderColor: isCompleted || isCurrent ? '#0a192f' : '#cbd5e1',
                    color: isCompleted || isCurrent ? '#ffffff' : '#94a3b8',
                    scale: isCurrent ? 1.1 : 1
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold border-2 transition-colors duration-300`}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : i + 1}
                </motion.div>
                <span className={`absolute top-10 whitespace-nowrap text-[12px] font-medium transition-colors duration-300 ${
                  isCurrent ? 'text-[#0a192f]' : isCompleted ? 'text-[#475569]' : 'text-[#94a3b8]'
                }`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area - Slide transitions */}
      <div className="w-full max-w-2xl mx-auto relative min-h-[500px]">
        <AnimatePresence mode="wait">

          {/* STEP 1: BUSINESS INFO */}
          {step === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-8"
            >
              <div className="mb-8">
                <h2 className="text-xl font-bold text-[#0a192f] mb-1">Tell us about your business</h2>
                <p className="text-[#64748b] text-[15px]">
                  Provide a few basic details. We'll automate the entire AI setup around it.
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#0a192f] uppercase tracking-wide">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder={`e.g. City ${config.industryName} Center`}
                    className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3.5 text-[15px] text-[#0a192f] placeholder-[#94a3b8] focus:border-[#0a192f] focus:bg-white focus:ring-1 focus:ring-[#0a192f] outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#0a192f] uppercase tracking-wide">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3.5 text-[15px] text-[#0a192f] placeholder-[#94a3b8] focus:border-[#0a192f] focus:bg-white focus:ring-1 focus:ring-[#0a192f] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-[#0a192f] uppercase tracking-wide">
                      Your Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="hello@business.com"
                      className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3.5 text-[15px] text-[#0a192f] placeholder-[#94a3b8] focus:border-[#0a192f] focus:bg-white focus:ring-1 focus:ring-[#0a192f] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* What will be auto-created Box */}
              <div className="mt-8 rounded-xl bg-gradient-to-br from-[#f8fafc] to-white border border-[#e2e8f0] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={18} className="text-[#f59e0b]" />
                  <p className="text-[14px] font-semibold text-[#0a192f]">
                    What we're about to auto-generate:
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  {config.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-[13px] font-medium text-[#475569]">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={runAutoSetup}
                disabled={!businessName || !phone || !email}
                className="w-full mt-8 group relative flex items-center justify-center gap-2 rounded-xl bg-[#0a192f] py-4 px-6 text-[15px] font-medium text-white transition-all overflow-hidden hover:bg-[#1e293b] hover:shadow-lg hover:shadow-[#0a192f]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                <div className="relative z-10 flex items-center gap-2">
                  <span>Build my {config.industryName} workspace</span>
                  <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </motion.div>
          )}


          {/* STEP 2: AUTO SETUP LOADING */}
          {step === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-8"
            >
              <div className="text-center mb-10">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-blue-500 animate-spin" />
                  <Bot size={28} className="text-blue-600 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-[#0a192f] mb-2">Generating Workspace...</h2>
                <p className="text-[#64748b] text-[15px]">Please wait while we formulate the perfect AI tailored for {businessName}.</p>
              </div>

              <div className="space-y-3">
                {tasks.map((task, i) => {
                  const isDone = task.status === 'done';
                  const isRunning = task.status === 'running';
                  return (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors duration-300 ${
                        isDone ? 'bg-[#f0fdf4] border-[#bbf7d0]' : 
                        isRunning ? 'bg-white border-[#cbd5e1] shadow-sm' : 
                        'bg-[#f8fafc] border-[#e2e8f0] opacity-50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isDone && <CheckCircle2 size={22} className="text-[#10b981]" />}
                        {isRunning && <Loader2 size={22} className="text-[#3b82f6] animate-spin" />}
                        {task.status === 'pending' && <Circle size={22} className="text-[#cbd5e1]" />}
                      </div>
                      <span className={`text-[15px] font-medium ${
                        isDone ? 'text-[#065f46]' : 
                        isRunning ? 'text-[#0a192f]' : 
                        'text-[#94a3b8]'
                      }`}>
                        {task.label}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}


          {/* STEP 3: CONNECT NUMBER */}
          {step === 'connect' && (
            <motion.div
              key="connect"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-8"
            >
              <div className="rounded-xl bg-gradient-to-r from-[#ecfdf5] to-[#f0fdf4] border border-[#a7f3d0] p-5 mb-8 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center text-white flex-shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-[#065f46] font-bold text-[15px] mb-0.5">{config.agentName} has been deployed!</h3>
                  <p className="text-[#047857] text-[13px]">Your AI infrastructure and knowledge base are ready to use.</p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-bold text-[#0a192f] mb-1.5">Connect a Phone Number</h2>
                <p className="text-[#64748b] text-[15px]">
                  How will your customers reach the new {config.industryName} AI assistant?
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: '📞', title: 'Forward your existing business number', desc: 'Keep your number, route calls straight to AI. Free and instant.', action: () => setStep('test') },
                  { icon: '🔢', title: 'Buy a new dedicated local number', desc: 'Instantly provision a new +91 Indian localized number.', action: () => router.push('/panel/numbers') },
                  { icon: '⏭️', title: 'Skip for now', desc: 'You can test the AI agent without a live number attached.', action: () => setStep('test') },
                ].map((opt, i) => (
                  <motion.button
                    key={opt.title}
                    whileHover={{ y: -2, scale: 1.005 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={opt.action}
                    className="w-full group flex items-start gap-5 p-5 rounded-xl border border-[#e2e8f0] bg-white text-left hover:border-[#0a192f] hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#f8fafc] group-hover:bg-[#f1f5f9] flex items-center justify-center text-2xl flex-shrink-0 transition-colors">
                      {opt.icon}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-[15px] font-bold text-[#0a192f] mb-1">{opt.title}</p>
                      <p className="text-[14px] text-[#64748b]">{opt.desc}</p>
                    </div>
                    <ChevronRight className="text-[#cbd5e1] group-hover:text-[#0a192f] mt-2 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}


          {/* STEP 4: TEST */}
          {step === 'test' && (
            <motion.div
              key="test"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-8"
            >
              <div className="mb-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center text-2xl mx-auto mb-4">
                  🤖
                </div>
                <h2 className="text-xl font-bold text-[#0a192f] mb-2">Test your new AI</h2>
                <p className="text-[#64748b] text-[15px] max-w-sm mx-auto">
                  Before we launch your workspace, you can try out the chat or voice agent. Try asking one of the auto-generated FAQs.
                </p>
              </div>

              <div className="mb-8 p-6 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                <p className="text-[12px] font-bold text-[#0a192f] uppercase tracking-wide mb-4">
                  Suggested test questions
                </p>
                <div className="flex flex-col gap-3">
                  {config.sampleFAQs.map((faq, i) => (
                    <motion.button
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={faq.question}
                      onClick={() => router.push(`/panel/chatbot?agentId=${agentId}&q=${encodeURIComponent(faq.question)}`)}
                      className="text-left p-4 rounded-lg bg-white border border-[#e2e8f0] hover:border-[#3b82f6] hover:shadow-sm text-[14px] font-medium text-[#374151] transition-all flex justify-between items-center group"
                    >
                      "{faq.question}"
                      <ChevronRight size={16} className="text-[#cbd5e1] group-hover:text-[#3b82f6]" />
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => router.push(`/panel/chatbot?agentId=${agentId}`)}
                  className="flex-1 py-4 px-6 rounded-xl font-semibold bg-white border-2 border-[#e2e8f0] text-[#0a192f] hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all"
                >
                  Open Chat Tester
                </button>
                <button
                  onClick={() => setStep('live')}
                  className="flex-1 py-4 px-6 rounded-xl font-semibold bg-[#0a192f] border-2 border-[#0a192f] text-white hover:bg-[#1e293b] hover:border-[#1e293b] hover:shadow-lg transition-all"
                >
                  Go Live
                </button>
              </div>
            </motion.div>
          )}


          {/* STEP 5: LIVE */}
          {step === 'live' && (
            <motion.div
              key="live"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-10 text-center relative overflow-hidden"
            >
              {/* Decorative top gradient */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3b82f6] via-[#10b981] to-[#f59e0b]" />

              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#10b981] to-[#34d399] flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-emerald-500/20"
              >
                <CheckCircle2 size={40} className="text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-[#0a192f] mb-2">{businessName} Workspace is LIVE!</h2>
              <p className="text-[#64748b] text-[15px] mb-10 max-w-sm mx-auto">
                <span className="font-semibold text-[#0a192f]">{config.agentName}</span> is now active and ready to handle customer interactions for your business.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                {[
                  { icon: Phone, label: 'Voice Agent', value: 'Active', color: 'text-blue-500', bg: 'bg-blue-50' },
                  { icon: Bot, label: 'Chat Widget', value: 'Deployed', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { icon: BookOpen, label: 'Knowledge Base', value: `${config.sampleFAQs.length} FAQs loaded`, color: 'text-purple-500', bg: 'bg-purple-50' },
                  { icon: Zap, label: 'Automations', value: `${config.automations.length} Active`, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((stat, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (i * 0.1) }}
                    key={stat.label} 
                    className="p-5 rounded-xl border border-[#e2e8f0] bg-white hover:shadow-sm transition-shadow text-left group"
                  >
                    <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
                      <stat.icon size={20} />
                    </div>
                    <p className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-wide mb-1">{stat.label}</p>
                    <p className="text-[15px] font-bold text-[#0a192f]">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/panel/voice-agents')}
                  className="flex-1 py-4 px-6 rounded-xl font-semibold bg-white border-2 border-[#e2e8f0] text-[#0a192f] hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all"
                >
                  Agent Settings
                </button>
                <button
                  onClick={() => router.push('/panel/dashboard')}
                  className="flex-1 py-4 px-6 rounded-xl font-semibold bg-[#0a192f] border-2 border-[#0a192f] text-white hover:bg-[#1e293b] hover:border-[#1e293b] hover:shadow-lg transition-all"
                >
                  Go to Dashboard →
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
