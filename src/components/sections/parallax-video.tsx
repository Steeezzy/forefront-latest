"use client";

import React, { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function ParallaxVideo() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Scroll-linked parallax: translate only (no scale — much cheaper on GPU) */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.7, 0.35, 0.35, 0.7]);

  /* Play/pause based on visibility */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (videoRef.current) {
            videoRef.current.playbackRate = 0.75;
            videoRef.current.play().catch(() => { });
          }
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ height: "80vh", minHeight: 500 }}
    >
      {/* Parallax video container — GPU-composited translate only */}
      <motion.div
        className="absolute inset-0"
        style={{
          y: videoY,
          top: "-8%",
          height: "116%",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src="/parallax-video.mp4"
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            (e.currentTarget as HTMLVideoElement).playbackRate = 0.75;
          }}
          style={{ transform: "translateZ(0)" }}
        />
      </motion.div>

      {/* Dark gradient overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: overlayOpacity, willChange: "opacity" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-transparent to-[#050508]" />
      </motion.div>

      {/* Side vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(5,5,8,0.5) 0%, transparent 20%, transparent 80%, rgba(5,5,8,0.5) 100%)",
        }}
      />

      {/* Optional center text */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <motion.div
          className="text-center px-6"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2
            className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-4"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, #ffffff 20%, #888888 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            See It in Action
          </h2>
          <p className="max-w-lg mx-auto text-white/40 text-lg leading-relaxed">
            Watch how our platform transforms customer experiences with
            intelligent automation and real-time engagement.
          </p>
        </motion.div>
      </div>

      {/* Top & bottom seamless blend lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </section>
  );
}
