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
      // Calculate position relative to viewport center
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
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-hidden selection:bg-blue-500/30">
      
      {/* Interactive Cursor Background (Spotlight) */}
      {isMounted && (
        <motion.div
          className="pointer-events-none fixed left-1/2 top-1/2 z-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 mix-blend-screen blur-[120px]"
          style={{
            x: smoothMouseX,
            y: smoothMouseY,
            background: 'radial-gradient(circle, rgba(37,99,235,0.4) 0%, rgba(14,165,233,0.1) 40%, rgba(0,0,0,0) 70%)',
          }}
        />
      )}

      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md"
      >
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-500 transition-colors group-hover:bg-blue-600/30 group-hover:text-blue-400">
              <Trophy className="h-6 w-6" />
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-blue-500/20" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              AthleteShield
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] rounded-full px-6 border-0">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section with Parallax Background */}
      <div ref={targetRef} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-20">
        {/* Background Image with Parallax */}
        <motion.div 
          style={{ y, scale, opacity }}
          className="absolute inset-0 z-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/hero-bg.jpg')" }}
          />
          {/* Overlays to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950/70 to-black/80" />
          <div className="absolute inset-0 bg-blue-950/20 mix-blend-overlay" />
        </motion.div>

        {/* Hero Content */}
        <div className="container relative z-10 mx-auto px-6">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-5xl text-center"
          >
            <motion.div variants={itemVariants} className="mb-6 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-300 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                </span>
                The Ultimate Sports Ecosystem
              </span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl lg:text-8xl">
              Elevating the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Global</span><br /> Sports Experience.
            </motion.h1>
            
            <motion.p variants={itemVariants} className="mx-auto mt-8 max-w-2xl text-lg text-gray-300 sm:text-xl leading-relaxed">
              Your comprehensive sports portal. From performance analytics and event management 
              to privacy-first athlete identity and secure credential verification.
            </motion.p>
            
            <motion.div variants={itemVariants} className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="h-14 w-full rounded-full bg-blue-600 border-0 px-8 text-lg font-medium text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-500 hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] sm:w-auto z-20 relative">
                  Join the Platform
                </Button>
              </Link>
              <Link href="/verify-qr" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-14 w-full rounded-full border-white/20 bg-white/5 px-8 text-lg font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/10 sm:w-auto text-gray-200 z-20 relative">
                  <QrCode className="mr-2 h-5 w-5" />
                  Verify Credential
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 z-10"
        >
          <span className="text-xs font-medium uppercase tracking-widest text-gray-400">Scroll to explore</span>
          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="h-10 w-6 rounded-full border border-gray-600 flex justify-center p-1"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <section className="relative z-20 -mt-10 bg-gray-950 pb-32 pt-20">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="grid gap-8 md:grid-cols-3"
          >
            {/* Feature 1 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gray-900/50 p-8 backdrop-blur-xl transition-colors hover:bg-gray-800/80"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="mb-6 inline-flex rounded-2xl bg-blue-500/20 p-4 text-blue-400 ring-1 ring-inset ring-blue-500/30">
                  <Activity className="h-8 w-8" />
                </div>
                <h3 className="mb-4 text-2xl font-bold text-white">Performance Analytics</h3>
                <p className="text-gray-400 leading-relaxed">
                  Track and analyze athlete performance with advanced metrics. Visualize growth, identify strengths, and optimize training routines efficiently.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gray-900/50 p-8 backdrop-blur-xl transition-colors hover:bg-gray-800/80"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="mb-6 inline-flex rounded-2xl bg-cyan-500/20 p-4 text-cyan-400 ring-1 ring-inset ring-cyan-500/30">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="mb-4 text-2xl font-bold text-white">Event Management</h3>
                <p className="text-gray-400 leading-relaxed">
                  Seamlessly organize tournaments, manage registrations, and track schedules. Complete tooling for federations to host world-class events.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gray-900/50 p-8 backdrop-blur-xl transition-colors hover:bg-gray-800/80"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="mb-6 inline-flex rounded-2xl bg-indigo-500/20 p-4 text-indigo-400 ring-1 ring-inset ring-indigo-500/30">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="mb-4 text-2xl font-bold text-white">Secure Identity</h3>
                <p className="text-gray-400 leading-relaxed">
                  Tamper-proof digital credentials and verified reporting mechanisms. Ensuring complete privacy and military-grade encryption for all athletes.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-20 border-t border-white/10 bg-blue-950/30 py-24 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-950/80" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container relative z-10 mx-auto px-6 text-center"
        >
          <h2 className="text-4xl font-extrabold text-white sm:text-5xl">Take your game to the next level</h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-blue-200/80">
            Join thousands of professional athletes, coaches, and federations already utilizing AthleteShield.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="h-14 w-full rounded-full bg-blue-500 px-8 text-lg font-medium text-white border-0 shadow-lg transition-all hover:bg-blue-400 sm:w-auto relative z-20">
                Create Free Account
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/10 bg-black/80 py-12 backdrop-blur-lg">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2 text-gray-400">
              <Trophy className="h-5 w-5" />
              <span className="text-sm font-medium">© 2024 AthleteShield. All rights reserved.</span>
            </div>
            <div className="flex gap-8">
              <Link href="/terms" className="text-sm font-medium text-gray-500 transition-colors hover:text-white">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-sm font-medium text-gray-500 transition-colors hover:text-white">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

