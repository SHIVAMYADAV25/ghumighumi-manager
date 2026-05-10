import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Compass, Users, Map, DollarSign, CheckSquare, ArrowRight, Sparkles, Globe2 } from 'lucide-react';

const features = [
  { icon: Map, title: 'Day-by-Day Itinerary', desc: 'Drag-and-drop activities across days. Reorder in real time with your team.' },
  { icon: Users, title: 'Real-Time Collaboration', desc: 'See who\'s editing, commenting, and planning — together, live.' },
  { icon: DollarSign, title: 'Smart Budget Splitting', desc: 'Track expenses, split costs equally or custom, settle debts in one tap.' },
  { icon: CheckSquare, title: 'Packing & To-Do Lists', desc: 'Shared checklists with assignments, priorities, and progress tracking.' },
  { icon: Globe2, title: 'Weather Integration', desc: 'Live forecasts for each day of your trip pulled automatically.' },
  { icon: Sparkles, title: 'Activity Voting', desc: 'Propose ideas, upvote favorites. Democracy in travel planning.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink-900 text-sand-100 overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-ink-900/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber rounded-lg flex items-center justify-center">
            <Compass size={18} className="text-ink-900" />
          </div>
          <span className="font-display text-xl font-semibold">WanderSync</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="btn-ghost">Log in</button>
          <button onClick={() => navigate('/register')} className="btn-primary">Get started free</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6">
        {/* Background texture */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber/4 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sage/4 rounded-full blur-3xl" />
        </div>

        <div className="relative text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber/10 border border-amber/20 text-amber text-sm font-medium mb-8">
              <Sparkles size={14} />
              Collaborative trip planning, reimagined
            </span>

            <h1 className="font-display text-6xl md:text-7xl font-bold text-sand-50 leading-tight mb-6 text-balance">
              Plan together.
              <br />
              <span className="text-amber">Travel better.</span>
            </h1>

            <p className="text-xl text-sand-400 mb-10 max-w-xl mx-auto leading-relaxed text-balance">
              WanderSync brings your group onto one canvas — itineraries, budgets, checklists, bookings, and real-time collaboration.
            </p>

            <div className="flex items-center justify-center gap-4">
              <motion.button
                onClick={() => navigate('/register')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary text-base px-7 py-3.5 rounded-xl shadow-amber flex items-center gap-2"
              >
                Start planning free <ArrowRight size={18} />
              </motion.button>

              <button
                onClick={() => navigate('/login')}
                className="btn-ghost text-base px-6 py-3.5"
              >
                Sign in
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center justify-center gap-10 mt-16 pt-12 border-t border-white/6"
          >
            {[['Multi-role', 'RBAC'], ['Real-time', 'Collaboration'], ['Weather', 'Forecasts'], ['Split', 'Budgets']].map(([top, bot]) => (
              <div key={top} className="text-center">
                <div className="text-amber font-display text-xl font-bold">{top}</div>
                <div className="text-sand-500 text-xs mt-0.5">{bot}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold text-sand-100 mb-4">Everything your group needs</h2>
          <p className="text-sand-500 text-lg">Built for real trips, with real teams.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card p-6 hover:border-amber/20 transition-all duration-300"
            >
              <div className="w-10 h-10 bg-amber/10 rounded-xl flex items-center justify-center mb-4">
                <Icon size={20} className="text-amber" />
              </div>

              <h3 className="font-semibold text-sand-100 mb-2">
                {title}
              </h3>

              <p className="text-sand-500 text-sm leading-relaxed">
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-xl mx-auto card p-12 border-amber/15">
          <h2 className="font-display text-3xl font-bold text-sand-100 mb-4">
            Ready to go?
          </h2>

          <p className="text-sand-400 mb-8">
            Create your first trip in 30 seconds. No credit card needed.
          </p>

          <button
            onClick={() => navigate('/register')}
            className="btn-primary text-base px-8 py-3.5 mx-auto"
          >
            Create free account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/6 px-8 py-6 flex items-center justify-between text-sand-600 text-sm">
        <div className="flex items-center gap-2">
          <Compass size={16} className="text-amber" />
          <span>WanderSync © 2025</span>
        </div>

        <span>Built for Cohort 26 Buildathon</span>
      </footer>
    </div>
  );
}
