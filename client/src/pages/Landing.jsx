import { Link } from 'react-router-dom';
import { Activity, TrendingUp, Bell, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-6">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-bold text-xl">NephroAlert</span>
            </div>
            <div className="flex gap-3">
              <Link to="/login" className="text-white/80 hover:text-white px-4 py-2 rounded-lg transition-colors">
                Login
              </Link>
              <Link to="/register" className="bg-accent hover:bg-accent/90 text-white px-5 py-2 rounded-lg font-medium transition-colors">
                Register
              </Link>
            </div>
          </nav>

          {/* Hero Content */}
          <motion.div 
            className="text-center pb-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Predict Kidney Decline<br />
              <span className="text-accent">Before It's Too Late</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              AI-powered CKD progression monitoring for rural Primary Health Centers. 
              Detect dangerous patterns across multiple visits before they become kidney failure.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/register" className="bg-accent hover:bg-accent/90 text-white px-8 py-3.5 rounded-lg font-semibold text-lg transition-colors shadow-lg shadow-accent/30">
                Get Started
              </Link>
              <Link to="/login" className="bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-lg font-semibold text-lg transition-colors border border-white/20">
                Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 -mt-12 relative z-10">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { stat: '1 in 3', desc: 'diabetics develop kidney disease' },
            { stat: '80%', desc: 'of CKD cases in rural India detected at Stage 4' },
            { stat: '10x', desc: 'survival improvement with early detection' }
          ].map((item, i) => (
            <motion.div 
              key={i}
              className="bg-white rounded-xl shadow-lg p-6 text-center border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <p className="text-3xl font-bold text-primary">{item.stat}</p>
              <p className="text-text-muted mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center text-text-primary mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: TrendingUp, title: 'Enter Blood Tests', desc: 'Record routine blood test results at each patient visit. eGFR auto-calculates instantly.' },
            { icon: Shield, title: 'AI Analyzes Patterns', desc: 'Our ML model analyzes biomarker trajectories across all visits to detect dangerous progression.' },
            { icon: Bell, title: 'Get Early Warning', desc: 'Receive alerts when a patient shows CKD progression patterns — months before clinical threshold.' }
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-text-primary mb-2">{item.title}</h3>
              <p className="text-text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white/60 py-8 text-center text-sm">
        <p>Dr. MGR Educational & Research Institute</p>
        <p className="mt-1">ACS-AMRI Seed Grant Research Project</p>
        <p className="mt-2 text-white/40">NephroAlert v1.0 — CKD Progression Predictor</p>
      </footer>
    </div>
  );
}
