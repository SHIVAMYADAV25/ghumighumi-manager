import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(form);
      navigate('/trips');
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Login failed'
      );
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 mb-6"
          >
            <div className="w-10 h-10 bg-amber rounded-xl flex items-center justify-center">
              <Compass
                size={22}
                className="text-ink-900"
              />
            </div>

            <span className="font-display text-2xl font-semibold text-sand-100">
              WanderSync
            </span>
          </Link>

          <h1 className="font-display text-2xl font-semibold text-sand-100">
            Welcome back
          </h1>

          <p className="text-sand-500 text-sm mt-1">
            Sign in to continue planning
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card p-6 space-y-4"
        >
          <Input
            label="Email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value
              })
            }
            required
          />

          <div>
            <label className="label">
              Password
            </label>

            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-500 pointer-events-none"
              />

              <input
                type={
                  showPass
                    ? 'text'
                    : 'password'
                }
                className="input pl-9 pr-10"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value
                  })
                }
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPass(!showPass)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-500 hover:text-sand-300"
              >
                {showPass
                  ? <EyeOff size={16} />
                  : <Eye size={16} />
                }
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs text-amber hover:text-amber-300"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full justify-center"
            loading={isLoading}
          >
            Sign in
          </Button>
        </form>

        <p className="text-center text-sand-500 text-sm mt-4">
          No account?{' '}

          <Link
            to="/register"
            className="text-amber hover:text-amber-300 font-medium"
          >
            Create one free
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
