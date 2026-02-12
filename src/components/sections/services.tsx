"use client";

import React, { useMemo } from 'react';
import { Layers, Zap, Search, BrainCircuit, MessageSquare, CheckCircle2, RotateCcw, Box, Mail, Share2, Chrome, FileText, Code2, Terminal, Blocks, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }
  }
};

const orbitIcons: { Icon: LucideIcon; angle: number }[] = [
  { Icon: Mail, angle: 0 },
  { Icon: Box, angle: 45 },
  { Icon: Blocks, angle: 90 },
  { Icon: Share2, angle: 135 },
  { Icon: Chrome, angle: 180 },
  { Icon: FileText, angle: 225 },
  { Icon: MessageSquare, angle: 270 },
  { Icon: Layers, angle: 315 },
];

function OrbitingIcons() {
  const radius = 100;
  return (
    <div className="relative w-[260px] h-[260px]">
      {/* Center icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full bg-white flex items-center justify-center">
        <Zap className="w-8 h-8 text-black fill-black" />
      </div>

      {/* Orbit ring */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(255,255,255,0.06)]"
        style={{ width: radius * 2, height: radius * 2 }}
      />

      {/* Rotating wrapper */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {orbitIcons.map(({ Icon, angle }, i) => {
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              <div className="p-2.5 rounded-xl bg-[#16171D] border border-[rgba(255,255,255,0.08)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]">
                <Icon className="w-5 h-5 text-white/60" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

const codeLines = [
  { indent: 0, tokens: [{ text: 'class ', color: 'text-blue-400' }, { text: 'AgentCore', color: 'text-yellow-400' }, { text: ':', color: 'text-zinc-400' }] },
  { indent: 1, tokens: [{ text: 'def ', color: 'text-blue-400' }, { text: 'initialize', color: 'text-purple-400' }, { text: '(self, config):', color: 'text-zinc-500' }] },
  { indent: 2, tokens: [{ text: 'self.model = ', color: 'text-zinc-500' }, { text: '"gpt-4-turbo"', color: 'text-green-400' }] },
  { indent: 2, tokens: [{ text: 'self.memory = ', color: 'text-zinc-500' }, { text: 'VectorStore', color: 'text-yellow-400' }, { text: '()', color: 'text-zinc-500' }] },
  { indent: 1, tokens: [{ text: 'def ', color: 'text-blue-400' }, { text: 'execute', color: 'text-purple-400' }, { text: '(self, task):', color: 'text-zinc-500' }] },
  { indent: 2, tokens: [{ text: 'plan = self.', color: 'text-zinc-500' }, { text: 'reason', color: 'text-purple-400' }, { text: '(task)', color: 'text-zinc-500' }] },
  { indent: 2, tokens: [{ text: 'return ', color: 'text-blue-400' }, { text: 'self.act(plan)', color: 'text-zinc-500' }] },
  { indent: 0, tokens: [{ text: '', color: 'text-zinc-600' }] },
  { indent: 0, tokens: [{ text: 'async ', color: 'text-blue-400' }, { text: 'def ', color: 'text-blue-400' }, { text: 'run_pipeline', color: 'text-purple-400' }, { text: '():', color: 'text-zinc-500' }] },
  { indent: 1, tokens: [{ text: 'agent = ', color: 'text-zinc-500' }, { text: 'AgentCore', color: 'text-yellow-400' }, { text: '(cfg)', color: 'text-zinc-500' }] },
  { indent: 1, tokens: [{ text: 'await ', color: 'text-blue-400' }, { text: 'agent.connect()', color: 'text-zinc-500' }] },
  { indent: 1, tokens: [{ text: 'result = ', color: 'text-zinc-500' }, { text: 'await ', color: 'text-blue-400' }, { text: 'agent.execute(', color: 'text-zinc-500' }, { text: '"analyze"', color: 'text-green-400' }, { text: ')', color: 'text-zinc-500' }] },
  { indent: 0, tokens: [{ text: '', color: 'text-zinc-600' }] },
  { indent: 0, tokens: [{ text: '# ', color: 'text-zinc-600' }, { text: 'tool integration layer', color: 'text-zinc-600' }] },
  { indent: 0, tokens: [{ text: 'tools = ', color: 'text-zinc-500' }, { text: '[', color: 'text-zinc-400' }, { text: '"search"', color: 'text-green-400' }, { text: ', ', color: 'text-zinc-400' }, { text: '"code"', color: 'text-green-400' }, { text: ', ', color: 'text-zinc-400' }, { text: '"deploy"', color: 'text-green-400' }, { text: ']', color: 'text-zinc-400' }] },
  { indent: 0, tokens: [{ text: 'for ', color: 'text-blue-400' }, { text: 't ', color: 'text-zinc-500' }, { text: 'in ', color: 'text-blue-400' }, { text: 'tools:', color: 'text-zinc-500' }] },
  { indent: 1, tokens: [{ text: 'agent.', color: 'text-zinc-500' }, { text: 'register', color: 'text-purple-400' }, { text: '(t)', color: 'text-zinc-500' }] },
  { indent: 0, tokens: [{ text: '', color: 'text-zinc-600' }] },
  { indent: 0, tokens: [{ text: 'class ', color: 'text-blue-400' }, { text: 'MemoryGraph', color: 'text-yellow-400' }, { text: ':', color: 'text-zinc-400' }] },
  { indent: 1, tokens: [{ text: 'nodes = ', color: 'text-zinc-500' }, { text: '{}', color: 'text-zinc-400' }] },
  { indent: 1, tokens: [{ text: 'def ', color: 'text-blue-400' }, { text: 'store', color: 'text-purple-400' }, { text: '(self, key, val):', color: 'text-zinc-500' }] },
  { indent: 2, tokens: [{ text: 'self.nodes[key] = ', color: 'text-zinc-500' }, { text: 'embed', color: 'text-purple-400' }, { text: '(val)', color: 'text-zinc-500' }] },
];

function ScrollingCode() {
  const doubled = useMemo(() => [...codeLines, ...codeLines], []);
  return (
    <div
      className="p-3 font-mono text-[11px] leading-[1.7] text-zinc-400 overflow-hidden h-full"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
      }}
    >
      <div className="animate-scroll-code">
        {doubled.map((line, i) => (
          <div key={i} style={{ paddingLeft: `${line.indent * 16}px` }}>
            {line.tokens.map((token, j) => (
              <span key={j} className={token.color}>{token.text}</span>
            ))}
            {line.tokens.length === 1 && line.tokens[0].text === '' && <span>&nbsp;</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

const Services = () => {
  return (
    <section className="py-[120px] bg-[#050508]" id="services">
      <div className="container px-6 mx-auto max-w-[1200px]">
        {/* Header Section */}
        <motion.div 
          className="flex flex-col items-center text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border border-[rgba(255,255,255,0.1)] bg-secondary/50 backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5 text-white" />
            <span className="text-[12px] font-semibold tracking-wider text-white uppercase">SERVICES</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
            Smarter Services, <span className="font-serif italic font-normal text-muted-foreground">Built with AI</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Everything you need to automate operations, boost productivity
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(380px,auto)]"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* Card 1: Automate repetitive tasks */}
          <motion.div 
            className="md:col-span-5 glass-card rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden group"
            variants={cardVariants}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
          >
            <div className="relative h-48 mb-8 flex items-center justify-center overflow-hidden">
              <div className="w-full max-w-[280px] relative h-full" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)' }}>
                <div className="flex flex-col gap-3 animate-scroll-up absolute w-full">
                  {[
                    { icon: Share2, label: 'Social media post', status: 'done' },
                    { icon: Layers, label: 'Employee Tracking', status: 'pending' },
                    { icon: FileText, label: 'Payment reminder', status: 'done' },
                    { icon: Mail, label: 'Email campaign', status: 'pending' },
                    { icon: MessageSquare, label: 'Client follow-up', status: 'done' },
                    { icon: Blocks, label: 'Invoice generation', status: 'pending' },
                    { icon: Share2, label: 'Social media post', status: 'done' },
                    { icon: Layers, label: 'Employee Tracking', status: 'pending' },
                    { icon: FileText, label: 'Payment reminder', status: 'done' },
                    { icon: Mail, label: 'Email campaign', status: 'pending' },
                    { icon: MessageSquare, label: 'Client follow-up', status: 'done' },
                    { icon: Blocks, label: 'Invoice generation', status: 'pending' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#16171D] border border-border/50">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      {item.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-zinc-500" />
                      ) : (
                        <RotateCcw className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">Automate repetitive tasks</h3>
              <p className="text-muted-foreground text-[15px] leading-relaxed">
                We help you streamline internal operations by automating manual workflows
              </p>
            </div>
          </motion.div>

            {/* Card 2: Automated Workflows */}
            <motion.div 
              className="md:col-span-7 glass-card rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden group"
              variants={cardVariants}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
              <div className="relative h-48 mb-8 flex items-center justify-center">
                <OrbitingIcons />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Automated Workflows</h3>
                <p className="text-muted-foreground text-[15px] leading-relaxed">
                  Boost efficiency across teams with smart automation Build intelligent workflows that automate multi-step processes across tools and platforms
                </p>
              </div>
            </motion.div>

          {/* Card 3: Real-Time Intelligence */}
          <motion.div 
            className="md:col-span-4 glass-card rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden group"
            variants={cardVariants}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
          >
            <div className="relative h-44 mb-8">
              <div className="absolute inset-0 flex flex-col gap-2 p-4 bg-[#0D0E12] rounded-xl border border-border mt-4 group-hover:-translate-y-2 transition-transform duration-500">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#16171D] border border-border/50">
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  <div className="h-2 w-24 bg-zinc-700 rounded" />
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/50">
                  <Box className="w-4 h-4 text-zinc-400" />
                  <div className="h-2 w-32 bg-zinc-600 rounded" />
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/30">
                  <Layers className="w-4 h-4 text-zinc-500" />
                  <div className="h-2 w-28 bg-zinc-700 rounded" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">Real-Time Intelligence</h3>
              <p className="text-muted-foreground text-[15px] leading-relaxed">
                Make smarter decisions with live data insights. Tap into real-time data
              </p>
            </div>
          </motion.div>

          {/* Card 4: Custom AI Agent development */}
          <motion.div 
            className="md:col-span-4 glass-card rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden group"
            variants={cardVariants}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
          >
            <div className="relative h-44 mb-8">
                <div className="absolute inset-0 bg-[#0D0E12] rounded-xl border border-border overflow-hidden group-hover:-translate-y-2 transition-transform duration-500">
                  <div className="flex items-center justify-between px-3 py-2 bg-[#16171D] border-b border-border">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500/50" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                      <div className="w-2 h-2 rounded-full bg-green-500/50" />
                    </div>
                    <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono">
                      <Code2 className="w-3 h-3" />
                      agent.py
                    </div>
                  </div>
                  <ScrollingCode />
                </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">Custom AI Agent development</h3>
              <p className="text-muted-foreground text-[15px] leading-relaxed">
                We develop custom AI agents that integrate seamlessly with your tools
              </p>
            </div>
          </motion.div>

          {/* Card 5: AI Strategy Consulting */}
          <motion.div 
            className="md:col-span-4 glass-card rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden group"
            variants={cardVariants}
            whileHover={{ y: -5, transition: { duration: 0.3 } }}
          >
            <div className="relative h-44 mb-8 flex items-center justify-center">
              <div className="relative">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                  <BrainCircuit className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 p-2 rounded-lg bg-zinc-800 border border-border group-hover:translate-x-2 transition-transform duration-500">
                  <Terminal className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">AI Strategy Consulting</h3>
              <p className="text-muted-foreground text-[15px] leading-relaxed">
                Get expert guidance to implement AI solutions that drive business growth
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Services;
