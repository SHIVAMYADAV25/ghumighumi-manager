import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (_) {
      setSent(true); // Show success anyway to prevent enumeration
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-amber rounded-xl flex items-center justify-center">
              <Compass size={22} className="text-ink-900" />
            </div>
            <span className="font-display text-2xl font-semibold text-sand-100">WanderSync</span>
          </Link>
          <h1 className="font-display text-2xl font-semibold text-sand-100">Forgot password?</h1>
          <p className="text-sand-500 text-sm mt-1">We'll send a reset link to your email</p>
        </div>

        {sent ? (
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mail size={22} className="text-sage" />
            </div>
            <h3 className="font-semibold text-sand-100 mb-2">Check your inbox</h3>
            <p className="text-sand-500 text-sm mb-4">If that email exists, a reset link has been sent.</p>
            <Link to="/login" className="text-amber hover:text-amber-300 text-sm">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <Input label="Email" type="email" icon={Mail} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <Button type="submit" className="w-full justify-center" loading={loading}>Send reset link</Button>
            <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-sand-500 hover:text-sand-300 transition-colors">
              <ArrowLeft size={14} /> Back to login
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  );
}
