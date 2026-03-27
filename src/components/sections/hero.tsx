"use client";

import React, { useEffect, useRef, useMemo, Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  MessageSquare,
  Bot,
  Ticket,
  Workflow,
  BookOpen,
  BarChart3,
} from "lucide-react";

/* ══════════════════════════════════════════════
   Shared mutable state (per-frame, NOT React)
   ══════════════════════════════════════════════ */
const shared = { scroll: 0, mouseX: 0, mouseY: 0 };

/* ══════════════════════════════════════════════
   Service data
   ══════════════════════════════════════════════ */
const services = [
  {
    number: "01",
    title: "Live Chat",
    icon: MessageSquare,
    description:
      "Real-time customer communication with a powerful inbox that keeps every conversation organized across channels.",
    subServices: ["Real-Time Messaging", "Multi-Channel Inbox", "Visitor Tracking", "Pre-Chat Forms"],
    toolIcons: ["💬", "📧", "🌐", "📱"],
  },
  {
    number: "02",
    title: "AI Chatbot",
    icon: Bot,
    description:
      "Intelligent AI agents that handle customer queries 24/7, learn from your knowledge base, and hand off to humans when needed.",
    subServices: ["Natural Language AI", "Knowledge Base RAG", "Smart Handoff", "Personality Tuning"],
    toolIcons: ["🤖", "🧠", "⚡", "🔗"],
  },
  {
    number: "03",
    title: "Ticketing System",
    icon: Ticket,
    description:
      "A complete help desk built for speed. Manage, prioritize, and resolve customer issues with structured workflows.",
    subServices: ["Priority Management", "SLA Tracking", "Team Assignment", "Status Workflows"],
    toolIcons: ["🎫", "📋", "👥", "⏱️"],
  },
  {
    number: "04",
    title: "Automation & Flows",
    icon: Workflow,
    description:
      "Build visual automation flows that trigger based on customer behavior, route conversations, and execute actions.",
    subServices: ["Visual Flow Builder", "Event Triggers", "Conditional Logic", "Auto-Routing"],
    toolIcons: ["⚙️", "🔄", "📊", "🚀"],
  },
  {
    number: "05",
    title: "Knowledge Base",
    icon: BookOpen,
    description:
      "Create and manage a centralized knowledge hub that powers your AI, self-service portals, and agent assist.",
    subServices: ["Article Management", "AI-Powered Search", "Web Scraping Import", "Vector Embeddings"],
    toolIcons: ["📚", "🔍", "📝", "💡"],
  },
  {
    number: "06",
    title: "Analytics & Insights",
    icon: BarChart3,
    description:
      "Deep insights into customer satisfaction, agent performance, AI accuracy, and conversation trends in real time.",
    subServices: ["Real-Time Dashboards", "AI Performance Metrics", "Agent Analytics", "Custom Reports"],
    toolIcons: ["📈", "🎯", "📉", "🏆"],
  },
];

/* Service images — local images for each service */
const serviceImages = [
  "/services/live-chat.jpg",       // Live Chat
  "/services/ai-chatbot.png",      // AI Chatbot
  "/services/ticketing.jpg",       // Ticketing
  "/services/automation.jpg",      // Automation & Flows
  "/services/knowledge-base.jpg",  // Knowledge Base
  "",                              // Analytics — no image yet
];

/* ══════════════════════════════════════════════
   MORPH TARGET BUILDERS (CPU → buffer attrs)
   ══════════════════════════════════════════════ */
const COUNT = 12000;

function buildSphere(): Float32Array {
  const p = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 2.0 + (Math.random() - 0.5) * 0.1;
    p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    p[i * 3 + 2] = r * Math.cos(phi);
  }
  return p;
}

/* 1 — Chat bubble: rounded rect + tail */
function buildChatBubble(): Float32Array {
  const p = new Float32Array(COUNT * 3);
  const S = 1.5; // scale factor
  const W = 2.4 * S, H = 1.8 * S, D = 0.55 * S, R = 0.4 * S;
  const tailN = Math.floor(COUNT * 0.08);
  const bodyN = COUNT - tailN;
  for (let i = 0; i < bodyN; i++) {
    let x = (Math.random() - 0.5) * W;
    let y = (Math.random() - 0.5) * H;
    const z = (Math.random() - 0.5) * D;
    const cx = Math.max(0, Math.abs(x) - W / 2 + R);
    const cy = Math.max(0, Math.abs(y) - H / 2 + R);
    if (cx * cx + cy * cy > R * R) {
      const a = Math.atan2(cy, cx);
      x = Math.sign(x) * (W / 2 - R + R * Math.cos(a));
      y = Math.sign(y) * (H / 2 - R + R * Math.sin(a));
    }
    if (Math.random() > 0.4) {
      const f = Math.floor(Math.random() * 6);
      if (f < 2) x = f === 0 ? W / 2 : -W / 2;
      else if (f < 4) y = f === 2 ? H / 2 : -H / 2;
    }
    p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z;
  }
  for (let i = bodyN; i < COUNT; i++) {
    const t = (i - bodyN) / tailN;
    p[i * 3] = -0.6 * 1.5 - t * 0.8 * 1.5 + (Math.random() - 0.5) * 0.15;
    p[i * 3 + 1] = -H / 2 - t * 0.7 * 1.5 + (Math.random() - 0.5) * 0.15;
    p[i * 3 + 2] = (Math.random() - 0.5) * D * 0.4;
  }
  return p;
}

/* 2 — Robot head: box + antenna + eyes */
function buildRobotHead(): Float32Array {
  const p = new Float32Array(COUNT * 3);
  const headN = Math.floor(COUNT * 0.7);
  const eyeN = Math.floor(COUNT * 0.12);
  const antN = COUNT - headN - eyeN;
  const S = 1.4;
  for (let i = 0; i < headN; i++) {
    let x = (Math.random() - 0.5) * 2.2 * S;
    let y = (Math.random() - 0.5) * 2.2 * S;
    let z = (Math.random() - 0.5) * 1.4 * S;
    if (Math.random() > 0.5) {
      const f = Math.floor(Math.random() * 6);
      if (f === 0) x = 1.1 * S; else if (f === 1) x = -1.1 * S;
      else if (f === 2) y = 1.1 * S; else if (f === 3) y = -1.1 * S;
      else if (f === 4) z = 0.7 * S; else z = -0.7 * S;
    }
    p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z;
  }
  for (let i = headN; i < headN + eyeN; i++) {
    const side = i % 2 === 0 ? -0.55 * S : 0.55 * S;
    const a = Math.random() * Math.PI * 2;
    const b = Math.acos(2 * Math.random() - 1);
    p[i * 3] = side + 0.35 * S * Math.sin(b) * Math.cos(a);
    p[i * 3 + 1] = 0.2 * S + 0.35 * S * Math.sin(b) * Math.sin(a);
    p[i * 3 + 2] = 0.7 * S + 0.35 * S * Math.cos(b) * 0.3;
  }
  for (let i = headN + eyeN; i < COUNT; i++) {
    const t = (i - headN - eyeN) / antN;
    if (t > 0.85) {
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      p[i * 3] = 0.25 * S * Math.sin(b) * Math.cos(a);
      p[i * 3 + 1] = 2.0 * S + 0.25 * S * Math.sin(b) * Math.sin(a);
      p[i * 3 + 2] = 0.25 * S * Math.cos(b);
    } else {
      p[i * 3] = (Math.random() - 0.5) * 0.1;
      p[i * 3 + 1] = 1.1 * S + t * 1.0 * S;
      p[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
  }
  return p;
}

/* 3 — Ticket: rectangle with notches */
function buildTicket(): Float32Array {
  const p = new Float32Array(COUNT * 3);
  const W = 2.8 * 1.4, H = 1.6 * 1.4, D = 0.35 * 1.4, stubX = 0.7 * 1.4;
  for (let i = 0; i < COUNT; i++) {
    let x = (Math.random() - 0.5) * W;
    let y = (Math.random() - 0.5) * H;
    const z = (Math.random() - 0.5) * D;
    if (Math.random() > 0.45) {
      const f = Math.floor(Math.random() * 4);
      if (f === 0) x = W / 2; else if (f === 1) x = -W / 2;
      else if (f === 2) y = H / 2; else y = -H / 2;
    }
    if (Math.abs(x - stubX) < 0.15) {
      const nr = 0.15;
      if (Math.abs(y - H / 2) < nr || Math.abs(y + H / 2) < nr) {
        const angle = Math.random() * Math.PI;
        const top = y > 0;
        x = stubX + nr * Math.cos(angle);
        y = (top ? H / 2 : -H / 2) + nr * Math.sin(angle) * (top ? -1 : 1);
      }
    }
    p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z;
  }
  return p;
}

/* 4 — Gear/cog */
function buildGear(): Float32Array {
  const p = new Float32Array(COUNT * 3);
  const R = 1.8 * 1.3, rInner = 1.2 * 1.3, teeth = 10, D = 0.5 * 1.3, holeR = 0.5 * 1.3;
  for (let i = 0; i < COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rad = rInner + Math.random() * (R - rInner);
    const z = (Math.random() - 0.5) * D;
    const tp = ((angle / (Math.PI * 2)) * teeth) % 1;
    let outerR = R;
    if (tp > 0.3 && tp < 0.7) outerR = R + 0.45 * 1.3;
    const fr = Math.max(Math.min(rad, outerR), holeR);
    let fx: number, fy: number;
    if (Math.random() > 0.5) {
      const eR = tp > 0.3 && tp < 0.7 ? outerR : R;
      fx = eR * Math.cos(angle); fy = eR * Math.sin(angle);
    } else {
      fx = fr * Math.cos(angle); fy = fr * Math.sin(angle);
    }
    p[i * 3] = fx; p[i * 3 + 1] = fy; p[i * 3 + 2] = z;
  }
  return p;
}

/* 5 — Open book */
function buildBook(): Float32Array {
  const p = new Float32Array(COUNT * 3);
  const spineN = Math.floor(COUNT * 0.08);
  const pageN = Math.floor((COUNT - spineN) / 2);
  const W = 1.8 * 1.4, H = 2.2 * 1.4, D = 0.1, ang = 0.35;
  for (let i = 0; i < COUNT; i++) {
    if (i < spineN) {
      p[i * 3] = (Math.random() - 0.5) * 0.08;
      p[i * 3 + 1] = (Math.random() - 0.5) * H;
      p[i * 3 + 2] = (Math.random() - 0.5) * D;
    } else {
      const side = i < spineN + pageN ? 1 : -1;
      const t = Math.random();
      const px = t * W;
      const py = (Math.random() - 0.5) * H;
      const pz = (Math.random() - 0.5) * D;
      const rx = px * Math.cos(ang * side);
      const rz = pz + px * Math.sin(ang * side);
      const curl = Math.sin(t * Math.PI) * 0.12;
      p[i * 3] = side * rx;
      p[i * 3 + 1] = py;
      p[i * 3 + 2] = rz + curl;
      if (Math.random() > 0.6) {
        const e = Math.floor(Math.random() * 3);
        if (e === 0) p[i * 3 + 1] = H / 2;
        else if (e === 1) p[i * 3 + 1] = -H / 2;
        else p[i * 3] = side * W * Math.cos(ang * side);
      }
    }
  }
  return p;
}

/* 6 — Dashboard: bar chart + line */
function buildDashboard(): Float32Array {
  const p = new Float32Array(COUNT * 3);
  const bh = [1.4, 2.0, 1.1, 2.4, 1.7, 2.1, 0.9].map(h => h * 1.3);
  const barW = 0.28 * 1.3, gap = 0.12 * 1.3, D = 0.35 * 1.3;
  const totalW = bh.length * (barW + gap);
  const barN = Math.floor(COUNT * 0.7);
  const lineN = COUNT - barN;
  for (let i = 0; i < barN; i++) {
    const bi = Math.floor(Math.random() * bh.length);
    const bx = -totalW / 2 + bi * (barW + gap) + barW / 2;
    let x = bx + (Math.random() - 0.5) * barW;
    let y = -1.2 + Math.random() * bh[bi];
    const z = (Math.random() - 0.5) * D;
    if (Math.random() > 0.5) {
      const f = Math.floor(Math.random() * 4);
      if (f === 0) x = bx + barW / 2;
      else if (f === 1) x = bx - barW / 2;
      else if (f === 2) y = -1.2 + bh[bi];
      else y = -1.2;
    }
    p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z;
  }
  for (let i = barN; i < COUNT; i++) {
    const t = (i - barN) / lineN;
    const x = -totalW / 2 + t * totalW;
    const ly = 0.3 + Math.sin(t * Math.PI * 2.5) * 0.6 + Math.sin(t * Math.PI * 1.2) * 0.3;
    p[i * 3] = x;
    p[i * 3 + 1] = ly + (Math.random() - 0.5) * 0.08;
    p[i * 3 + 2] = 0.2 + (Math.random() - 0.5) * 0.06;
  }
  return p;
}

/* ══════════════════════════════════════════════
   PARTICLE SYSTEM — morphs between 7 targets
   ══════════════════════════════════════════════ */
function ParticleSphere() {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const data = useMemo(() => {
    const base = buildSphere();
    const c = new Float32Array(COUNT * 3);
    const s = new Float32Array(COUNT);
    const r = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const d = Math.sqrt(base[i*3]**2 + base[i*3+1]**2 + base[i*3+2]**2) / 2.15;
      const core = 1 - d;
      c[i*3]   = 0.65 + core * 0.25 + Math.random() * 0.1;
      c[i*3+1] = 0.45 + core * 0.2  + Math.random() * 0.08;
      c[i*3+2] = 0.92 + Math.random() * 0.08;
      s[i] = 0.35 + Math.random() * 0.7;
      r[i] = Math.random();
    }
    return {
      base, colors: c, sizes: s, randoms: r,
      t1: buildChatBubble(), t2: buildRobotHead(),
      t3: buildTicket(), t4: buildGear(),
      t5: buildBook(), t6: buildDashboard(),
    };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current || !matRef.current) return;
    const t = state.clock.elapsedTime;
    const sc = shared.scroll;
    const seg = sc * 8;
    const mInf = Math.max(0.08, 1 - sc * 1.5);

    /* Smooth transition factor: 0 in hero, 1 in services */
    const inService = Math.min(1, Math.max(0, (seg - 0.5) * 2));

    /* Initial offset to the right, shift left during services */
    const heroX = 2.5;
    /* Mouse-driven position — sphere follows the cursor */
    const mousePosX = shared.mouseX * 1.2 * (1 - inService);
    const mousePosY = shared.mouseY * 0.8 * (1 - inService);
    const targetX = heroX + mousePosX - (heroX + 2.5) * inService;
    const targetY = mousePosY;
    const heroScale = 0.45;
    const targetScale = heroScale - 0.2 * inService; // 0.45 → 0.25
    pointsRef.current.position.x += (targetX - pointsRef.current.position.x) * 0.06;
    pointsRef.current.position.y += (targetY - pointsRef.current.position.y) * 0.06;
    const curScale = pointsRef.current.scale.x;
    pointsRef.current.scale.setScalar(curScale + (targetScale - curScale) * 0.06);

    /* Rotation: full in hero, frozen during services */
    const heroRotY = t * 0.06 + shared.mouseX * 0.2 * mInf;
    const heroRotX = Math.sin(t * 0.04) * 0.06 + shared.mouseY * 0.1 * mInf;
    const heroRotZ = Math.sin(t * 0.025) * 0.03;
    pointsRef.current.rotation.y += ((1 - inService) * heroRotY + inService * pointsRef.current.rotation.y * 0.98 - pointsRef.current.rotation.y) * 0.08;
    pointsRef.current.rotation.x += ((1 - inService) * heroRotX - pointsRef.current.rotation.x) * 0.08 * (1 - inService * 0.95);
    pointsRef.current.rotation.z += ((1 - inService) * heroRotZ - pointsRef.current.rotation.z) * 0.08 * (1 - inService * 0.95);
    matRef.current.uniforms.uTime.value = t;
    matRef.current.uniforms.uScroll.value = sc;
    matRef.current.uniforms.uMouse.value.set(shared.mouseX, shared.mouseY);
  });

  /* Scroll 0→1 maps through 8 segments:
     0=hero(sphere), 1-6=services, 7=hold last */
  const vert = `
    attribute float size;
    attribute float random;
    attribute vec3 target1;
    attribute vec3 target2;
    attribute vec3 target3;
    attribute vec3 target4;
    attribute vec3 target5;
    attribute vec3 target6;

    uniform float uTime;
    uniform float uScroll;
    uniform vec2  uMouse;

    varying vec3  vColor;
    varying float vAlpha;

    float ease(float t) { return t * t * (3.0 - 2.0 * t); }

    void main() {
      float seg = uScroll * 8.0;
      float idx = floor(seg);
      float frac = ease(fract(seg));

      vec3 curr, nxt;
      if      (idx < 1.0) { curr = position; nxt = target1; }
      else if (idx < 2.0) { curr = target1;  nxt = target2; }
      else if (idx < 3.0) { curr = target2;  nxt = target3; }
      else if (idx < 4.0) { curr = target3;  nxt = target4; }
      else if (idx < 5.0) { curr = target4;  nxt = target5; }
      else if (idx < 6.0) { curr = target5;  nxt = target6; }
      else                 { curr = target6;  nxt = target6; }

      vec3 pos = mix(curr, nxt, frac);

      /* Mouse bulge */
      float mInf = max(0.08, 1.0 - uScroll * 1.5);
      vec3 mDir = normalize(vec3(uMouse * 1.2, 1.0));
      float al = dot(normalize(pos + 0.001), mDir);
      pos += normalize(pos + 0.001) * smoothstep(0.5, 1.0, al) * 0.3 * mInf;

      /* Gentle bob — reduced during morphs */
      float morphFactor = step(1.0, idx); // 0 for sphere, 1 for morphs
      float bobScale = mix(0.04, 0.015, morphFactor);
      float noiseScale = mix(0.08, 0.02, morphFactor);
      float pid = random;
      pos += normalize(pos + 0.001) * sin(uTime * 0.6 + pid * 6.2832) * bobScale;

      /* Noise — reduced during morphs */
      float n = sin(pos.x * 1.3 + uTime * 0.2) * sin(pos.z * 0.8 + uTime * 0.15);
      pos += normalize(pos + 0.001) * n * noiseScale;

      vColor = color;
      vAlpha = 1.0;

      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      float sizeMult = mix(50.0, 65.0, morphFactor);
      gl_PointSize = size * (sizeMult / -mv.z);
      gl_Position = projectionMatrix * mv;
    }
  `;

  const frag = `
    varying vec3  vColor;
    varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float a = smoothstep(0.5, 0.08, d);
      float g = exp(-d * 6.0) * 0.12;
      vec3 col = vColor + g * vec3(0.12, 0.08, 0.4);
      gl_FragColor = vec4(col, a * 0.45 * vAlpha);
    }
  `;

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uScroll: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
  }), []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.base, 3]} />
        <bufferAttribute attach="attributes-color"    args={[data.colors, 3]} />
        <bufferAttribute attach="attributes-size"     args={[data.sizes, 1]} />
        <bufferAttribute attach="attributes-random"   args={[data.randoms, 1]} />
        <bufferAttribute attach="attributes-target1"  args={[data.t1, 3]} />
        <bufferAttribute attach="attributes-target2"  args={[data.t2, 3]} />
        <bufferAttribute attach="attributes-target3"  args={[data.t3, 3]} />
        <bufferAttribute attach="attributes-target4"  args={[data.t4, 3]} />
        <bufferAttribute attach="attributes-target5"  args={[data.t5, 3]} />
        <bufferAttribute attach="attributes-target6"  args={[data.t6, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
      />
    </points>
  );
}

function HeroCanvas() {
  return (
    <Canvas
      camera={{ position: [1.5, 0, 5.5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ pointerEvents: "auto" }}
    >
      <Suspense fallback={null}>
        <ParticleSphere />
      </Suspense>
    </Canvas>
  );
}

/* ══════════════════════════════════════════════
   SERVICE CARD — square style
   ══════════════════════════════════════════════ */
function ServiceCard({ service, variant }: { service: (typeof services)[0]; variant: "active" | "next" | "peek" }) {
  const isActive = variant === "active";
  const isPeek = variant === "peek";

  return (
    <div
      className="rounded-2xl flex flex-col justify-between flex-shrink-0"
      style={{
        width: isActive ? 420 : isPeek ? 240 : 300,
        aspectRatio: "1 / 1",
        padding: isActive ? 32 : isPeek ? 20 : 24,
        background: isActive
          ? "linear-gradient(155deg, rgba(70,45,150,0.7) 0%, rgba(30,25,70,0.85) 100%)"
          : "linear-gradient(180deg, rgba(25,22,50,0.85) 0%, rgba(18,16,40,0.92) 100%)",
        border: `1px solid rgba(255,255,255,${isActive ? 0.1 : 0.06})`,
        boxShadow: isActive ? "0 6px 30px rgba(60,30,140,0.2)" : "none",
        opacity: isPeek ? 0.5 : 1,
      }}
    >
      {/* Top */}
      <div className="flex items-start justify-between">
        {isActive ? (
          <h3 className="text-2xl font-semibold text-gray-900 tracking-tight leading-snug">{service.title}</h3>
        ) : (
          <span className={`${isPeek ? "text-3xl" : "text-4xl"} font-light text-gray-900/50`}>{service.number}</span>
        )}
        <svg width={isActive ? 14 : 11} height={isActive ? 14 : 11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-900/${isActive ? 40 : 20} flex-shrink-0`}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
      </div>

      {/* Description — active only */}
      {isActive && (
        <p className="text-gray-900/40 text-[15px] leading-[1.7] -mt-1">{service.description}</p>
      )}

      {/* Bottom */}
      <div>
        {isActive ? (
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-gray-900/25 text-[11px] font-semibold tracking-[0.15em] uppercase mb-2">Services</p>
              <ul className="space-y-1">
                {service.subServices.map((s) => (
                  <li key={s} className="text-gray-900/50 text-[14px] truncate">{s}</li>
                ))}
              </ul>
            </div>
            <div className="flex-shrink-0">
              <p className="text-gray-900/25 text-[11px] font-semibold tracking-[0.15em] uppercase mb-2">Tools</p>
              <div className="grid grid-cols-2 gap-1.5">
                {service.toolIcons.map((ic, idx) => (
                  <div key={idx} className="w-8 h-8 rounded-lg bg-white/[0.07] flex items-center justify-center text-sm">{ic}</div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <h3 className={`${isPeek ? "text-base" : "text-xl"} font-medium text-gray-900/60 leading-snug`}>{service.title}</h3>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CORE GLOW — follows sphere position
   ══════════════════════════════════════════════ */
function CoreGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (!ref.current) { raf = requestAnimationFrame(tick); return; }
      const seg = shared.scroll * 8;
      const inService = Math.min(1, Math.max(0, (seg - 0.5) * 2));
      /* Mirror the sphere's left shift: 50% → ~25% */
      const leftPct = 50 - 25 * inService;
      ref.current.style.left = `${leftPct}%`;
      ref.current.style.transform = `translate(-50%, -50%) scale(${1 - 0.35 * inService})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div
      ref={ref}
      className="absolute top-1/2 w-[300px] h-[300px] rounded-full pointer-events-none z-[5]"
      style={{
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(circle,rgba(100,60,200,0.15) 0%,rgba(60,40,180,0.05) 40%,transparent 70%)",
      }}
    />
  );
}


/* ══════════════════════════════════════════════
   COMBINED HERO + SERVICES
   500vh sticky scroll section
   ══════════════════════════════════════════════ */
export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const scrollable = sectionRef.current.offsetHeight - window.innerHeight;
      if (scrollable <= 0) { shared.scroll = 0; return; }
      shared.scroll = Math.max(0, Math.min(1, -rect.top / scrollable));
    };
    const onMouse = (e: MouseEvent) => {
      shared.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      shared.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <section ref={sectionRef} id="hero" className="relative w-full" style={{ height: "500vh" }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#ffffff]">

        {/* BG overlays — very light so videos stay highly visible */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2, background: "linear-gradient(180deg, rgba(10,10,15,0.2) 0%, rgba(18,18,42,0.15) 50%, rgba(10,10,15,0.2) 100%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2, opacity: 0.02, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2, background: "radial-gradient(ellipse at center,transparent 60%,rgba(10,10,15,0.3) 100%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
          <div className="absolute top-[15%] left-[5%] w-[550px] h-[550px] rounded-full" style={{ background: "radial-gradient(circle,rgba(100,60,200,0.04) 0%,transparent 60%)" }} />
          <div className="absolute top-[20%] left-[15%] w-[350px] h-[350px] rounded-full" style={{ background: "radial-gradient(circle,rgba(139,92,246,0.06) 0%,transparent 50%)" }} />
        </div>

        {/* 3D Canvas — full screen */}
        <div className="absolute inset-0 z-10"><HeroCanvas /></div>

        {/* Core glow — follows sphere */}
        <CoreGlow />

        {/* Overlay content */}
        <HeroOverlay />

        {/* Bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-30" />
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   OVERLAY — hero text then service cards
   ══════════════════════════════════════════════ */
function HeroOverlay() {
  const [scrollState, setScrollState] = React.useState({ segment: 0, segFrac: 0 });

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const seg = shared.scroll * 8;
      setScrollState({ segment: Math.floor(seg), segFrac: seg - Math.floor(seg) });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { segment, segFrac } = scrollState;
  const heroOp = segment === 0 ? 1 - Math.min(1, segFrac * 2) : 0;
  const activeService = segment >= 1 && segment <= 6 ? segment - 1 : -1;
  /* Quick fade-in (first 15%), stay visible, quick fade-out (last 15%) */
  const svcIn = activeService >= 0 ? Math.min(1, segFrac * 6) : 0;
  const svcOut = activeService >= 0 ? Math.min(1, (1 - segFrac) * 6) : 0;
  const svcOp = Math.min(svcIn, svcOut);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {/* Hero text */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: heroOp, transition: "opacity 0.1s" }}>
        <div className="w-full max-w-[1400px] mx-auto px-6 flex flex-col items-center text-center">
          <motion.span
            className="text-[15px] font-medium tracking-[0.15em] text-gray-900/40 uppercase mb-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >Building Digital</motion.span>

          <motion.h1 className="mb-8" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4 }}>
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-[100px] font-bold tracking-[-0.03em] leading-[1.05]" style={{ backgroundImage: "linear-gradient(to bottom,#ffffff 20%,#888888 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Solutions That</span>
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-[100px] tracking-[-0.03em] leading-[1.05] mt-1 italic font-light" style={{ backgroundImage: "linear-gradient(135deg,#ffffff 0%,#c4b5fd 40%,#8b5cf6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontFamily: "Georgia,'Times New Roman',serif" }}>Matter</span>
          </motion.h1>

          <motion.p className="max-w-xl mb-10 text-lg md:text-xl text-gray-900/35 leading-relaxed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }}>
            with AI that turns complex challenges into seamless customer experiences — live chat, tickets, and intelligent automation.
          </motion.p>

          <motion.div className="flex items-center gap-4 pointer-events-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.75 }}>
            <Link href="/sign-up" className="group relative flex items-center gap-2.5 h-14 px-12 rounded-full bg-white text-[#ffffff] font-semibold text-lg transition-all duration-300 hover:scale-[1.03] shadow-[0_0_40px_rgba(139,92,246,0.15)] overflow-hidden">
              <span className="relative z-10">Start Your Project</span>
              <svg className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            </Link>
          </motion.div>

          <motion.div className="mt-12 flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1 }}>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.03]">
              <span className="text-2xl font-bold text-gray-900">50+</span>
              <span className="text-xs text-gray-900/40 leading-tight">Projects<br/>Delivered</span>
            </div>
            <div className="w-[1px] h-8 bg-white/[0.08]" />
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.03]">
              <span className="text-2xl font-bold text-gray-900">100%</span>
              <span className="text-xs text-gray-900/40 leading-tight">Client<br/>Satisfaction</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* "Our Services" heading — centered */}
      {segment >= 1 && segment <= 6 && (
        <div
          className="absolute left-0 right-0 flex flex-col items-center text-center"
          style={{ top: "8%", opacity: Math.min(1, svcOp * 2) }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3" style={{ backgroundImage: "linear-gradient(to right,#ffffff,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Our Services</h2>
          <p className="max-w-md text-gray-900/35 text-[15px] leading-relaxed">
            Comprehensive digital solutions that transform your business and drive innovation.
          </p>
        </div>
      )}



      {/* Service cards — active + next cards visible */}
      {activeService >= 0 && activeService < services.length && (
        <div
          className="absolute flex items-center gap-3"
          style={{
            top: "50%",
            transform: `translateY(-50%) translateX(${(1 - svcOp) * 30}px)`,
            left: "36%",
            right: "40px",
            opacity: svcOp,
            transition: "opacity 0.1s, transform 0.1s",
          }}
        >
          <ServiceCard service={services[activeService]} variant="active" />
          {activeService + 1 < services.length && (
            <ServiceCard service={services[activeService + 1]} variant="next" />
          )}
          {activeService + 2 < services.length && (
            <ServiceCard service={services[activeService + 2]} variant="peek" />
          )}
        </div>
      )}

      {/* Progress dots */}
      {segment >= 0 && segment <= 7 && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-30">
          {[0,1,2,3,4,5,6,7].map((i) => (
            <div key={i} className="transition-all duration-300" style={{ width: 3, height: segment === i ? 20 : 8, borderRadius: 2, background: segment === i ? "rgba(139,92,246,0.8)" : "rgba(255,255,255,0.12)" }} />
          ))}
        </div>
      )}

      {/* Scroll hint — visible on hero AND service sections */}
      {((segment === 0 && heroOp > 0.5) || (segment >= 1 && segment <= 5)) && (
        <div className="absolute bottom-10 flex flex-col items-center gap-2" style={{ left: segment >= 1 ? "25%" : "50%", transform: "translateX(-50%)", opacity: segment === 0 ? heroOp : Math.min(1, svcOp * 2) }}>
          <motion.div className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center bg-white/5" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900/40"><path d="M7 13l5 5 5-5" /></svg>
          </motion.div>
          <span className="text-[11px] text-gray-900/25 tracking-widest uppercase">{segment === 0 ? "Scroll to explore" : "Keep scrolling"}</span>
        </div>
      )}
    </div>
  );
}
