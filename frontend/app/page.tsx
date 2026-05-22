'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, Activity, Calendar, Trophy, QrCode } from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export default function HomePage() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end start']
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 200]);

  // Mouse tracking for interactive background
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isMounted, setIsMounted] = useState(false);

  const springConfig = { damping: 25, stiffness: 200 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    setIsMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX - window.innerWidth / 2;
      const y = e.clientY - window.innerHeight / 2;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 50, rotateX: -45 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.8, type: 'spring' as const, bounce: 0.4 },
    },
  };

  const navItemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 100 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring" as const, bounce: 0.4, duration: 1 }
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 overflow-hidden selection:bg-orange-500/30">
      
      {/* Interactive Cursor Background (Spotlight) */}
      {isMounted && (
        <motion.div
          className="pointer-events-none fixed left-1/2 top-1/2 z-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 mix-blend-screen blur-[120px]"
          style={{
            x: smoothMouseX,
            y: smoothMouseY,
            background: 'radial-gradient(circle, rgba(249,115,22,0.4) 0%, rgba(239,68,68,0.1) 40%, rgba(0,0,0,0) 70%)',
          }}
        />
      )}

      {/* Header */}
      <motion.header 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { y: -100, opacity: 0 },
          visible: { y: 0, opacity: 1, transition: { staggerChildren: 0.1, duration: 0.8, ease: "easeOut" } }
        }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md"
      >
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          
          {/* Logos on the Left */}
          <motion.div variants={navItemVariants} className="flex items-center gap-6">
            <Link href="/">
              <motion.img 
                whileHover={{ scale: 1.05, rotate: -3 }}
                whileTap={{ scale: 0.95 }}
                src="/make%20in%20India.webp" 
                alt="Make in India" 
                className="h-12 w-auto object-contain drop-shadow-md" 
              />
            </Link>
            <Link href="/">
              <motion.img 
                whileHover={{ scale: 1.05, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
                src="/Khelo_India.svg.png" 
                alt="Khelo India" 
                className="h-10 w-auto object-contain drop-shadow-md" 
              />
            </Link>
          </motion.div>
          
          {/* Main Navigation - Centered */}
          <nav className="hidden md:flex items-center gap-6 font-bank text-xs uppercase tracking-widest">
            {['Performance Analytics', 'Event Management', 'Secure Identity'].map((item, i) => (
              <motion.div key={i} variants={navItemVariants} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href={`#${item.split(' ')[0].toLowerCase()}`} className="text-gray-300 transition-colors hover:text-white relative group">
                  {item}
                  <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full"></span>
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Auth Buttons on the Right */}
          <motion.div variants={navItemVariants} className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 font-bank text-xs">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(249,115,22,0.8)] rounded-full px-5 py-2 h-9 border-0 font-bank text-xs">
                  Get Started
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section with Parallax Background */}
      <div ref={targetRef} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-20 perspective-1000">
        {/* Background Image with Parallax */}
        <motion.div 
          style={{ y, scale, opacity }}
          className="absolute inset-0 z-0"
        >
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/hero-bg.jpg')" }}
          />
          {/* Overlays to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-black/80" />
          <div className="absolute inset-0 bg-zinc-950/30 mix-blend-overlay" />
        </motion.div>

        {/* Hero Content */}
        <div className="container relative z-10 mx-auto px-6 pb-24 pt-10">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-4xl text-center"
          >
            <motion.h1 variants={textVariants} className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl font-heading uppercase drop-shadow-xl leading-tight">
              <motion.span 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.5, type: "spring" }}
                className="inline-block"
              >
                Elevating the
              </motion.span>
              <br />
              <motion.span 
                initial={{ opacity: 0, scale: 0.8, filter: "blur(5px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 1.5, delay: 0.8, type: "spring" }}
                className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-red-500 animate-gradient-x"
              >
                Global
              </motion.span>
              {" "}Sports Experience.
            </motion.h1>
            
            <motion.p variants={textVariants} className="mx-auto mt-6 max-w-xl text-base text-gray-300 sm:text-lg leading-relaxed font-bank tracking-wide">
              Your comprehensive sports portal. From performance analytics and event management 
              to privacy-first athlete identity and secure credential verification.
            </motion.p>
            
            <motion.div variants={textVariants} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register" className="w-full sm:w-auto">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="h-12 w-full rounded-full bg-orange-600 border-0 px-8 text-sm text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all hover:bg-orange-500 hover:shadow-[0_0_30px_rgba(249,115,22,0.8)] sm:w-auto z-20 relative font-bank uppercase tracking-widest overflow-hidden group">
                    <span className="relative z-10">Join the Platform</span>
                    <div className="absolute inset-0 h-full w-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/verify-qr" className="w-full sm:w-auto">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="secondary" className="h-12 w-full rounded-full border-white/20 bg-white/5 px-8 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:w-auto text-gray-200 z-20 relative font-bank uppercase tracking-widest hover:border-orange-400/50">
                    <QrCode className="mr-2 h-4 w-4" />
                    Verify Credential
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 z-10 font-bank"
        >
          <span className="text-[10px] uppercase tracking-widest text-gray-400">Scroll</span>
          <motion.div 
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="h-8 w-5 rounded-full border border-gray-600 flex justify-center p-0.5"
          >
            <motion.div 
              animate={{ height: ["20%", "40%", "20%"], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-1 rounded-full bg-orange-400" 
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <section className="relative z-20 -mt-10 bg-black pb-24 pt-16">
        <div className="container mx-auto px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
            }}
            className="grid gap-6 md:grid-cols-3"
          >
            {/* Feature 1 */}
            <motion.div 
              id="performance"
              variants={cardVariants}
              whileHover={{ y: -10, rotateX: 2, rotateY: -2, scale: 1.02 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/40 p-6 backdrop-blur-xl transition-all duration-300 hover:bg-neutral-800/60 shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10">
                <motion.div 
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.8, type: "spring" }}
                  className="mb-5 inline-flex rounded-xl bg-orange-500/20 p-3 text-orange-400 ring-1 ring-inset ring-orange-500/30"
                >
                  <Activity className="h-6 w-6" />
                </motion.div>
                <h3 className="mb-3 text-lg font-bold text-white font-heading tracking-wide">Performance Analytics</h3>
                <p className="text-gray-400 leading-relaxed font-bank text-xs">
                  Track and analyze athlete performance with advanced metrics. Visualize growth, identify strengths, and optimize training routines efficiently.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              id="event"
              variants={cardVariants}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/40 p-6 backdrop-blur-xl transition-all duration-300 hover:bg-neutral-800/60 shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10">
                <motion.div 
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.8, type: "spring" }}
                  className="mb-5 inline-flex rounded-xl bg-amber-500/20 p-3 text-amber-400 ring-1 ring-inset ring-amber-500/30"
                >
                  <Calendar className="h-6 w-6" />
                </motion.div>
                <h3 className="mb-3 text-lg font-bold text-white font-heading tracking-wide">Event Management</h3>
                <p className="text-gray-400 leading-relaxed font-bank text-xs">
                  Seamlessly organize tournaments, manage registrations, and track schedules. Complete tooling for federations to host world-class events.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              id="secure"
              variants={cardVariants}
              whileHover={{ y: -10, rotateX: 2, rotateY: 2, scale: 1.02 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/40 p-6 backdrop-blur-xl transition-all duration-300 hover:bg-neutral-800/60 shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10">
                <motion.div 
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.8, type: "spring" }}
                  className="mb-5 inline-flex rounded-xl bg-red-500/20 p-3 text-red-400 ring-1 ring-inset ring-red-500/30"
                >
                  <Shield className="h-6 w-6" />
                </motion.div>
                <h3 className="mb-3 text-lg font-bold text-white font-heading tracking-wide">Secure Identity</h3>
                <p className="text-gray-400 leading-relaxed font-bank text-xs">
                  Tamper-proof digital credentials and verified reporting mechanisms. Ensuring complete privacy and military-grade encryption for all athletes.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-20 border-t border-white/10 bg-orange-950/30 py-20 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-orange-950/80" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="container relative z-10 mx-auto px-6 text-center"
        >
          <motion.h2 
            whileHover={{ scale: 1.02 }}
            className="text-3xl font-bold text-white sm:text-4xl font-heading uppercase tracking-widest"
          >
            Take your game to the next level
          </motion.h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-orange-200/80 font-bank">
            Join thousands of professional athletes, coaches, and federations already utilizing AthleteShield.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register" className="w-full sm:w-auto">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: [-1, 1, 0] }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="h-12 w-full rounded-full bg-gradient-to-r from-orange-600 to-red-500 px-8 text-sm text-white border-0 shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] sm:w-auto relative z-20 font-bank uppercase tracking-widest group overflow-hidden">
                  <span className="relative z-10">Create Free Account</span>
                  <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/10 bg-black/90 py-8 backdrop-blur-lg font-bank">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-gray-400">
              <motion.div 
                animate={{ rotateY: 360 }} 
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              >
                <Trophy className="h-4 w-4 text-yellow-500" />
              </motion.div>
              <span className="text-xs tracking-widest uppercase">© 2026 Khel Setu. All rights reserved.</span>
            </div>
            <div className="flex gap-6">
              <motion.div whileHover={{ y: -2 }}>
                <Link href="/terms" className="text-xs text-gray-500 transition-colors hover:text-white uppercase tracking-widest">
                  Terms of Service
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }}>
                <Link href="/privacy" className="text-xs text-gray-500 transition-colors hover:text-white uppercase tracking-widest">
                  Privacy Policy
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

