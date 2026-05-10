import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function RegisterPage() {
  const navigate = useNavigate();

  const {
    register: doRegister,
    isLoading
  } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password.length < 8) {
      toast.error(
        'Password must be at least 8 characters'
      );

      return;
    }

    try {
      await doRegister(form);

      toast.success('Account created!');

      navigate('/trips');
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Registration failed'
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
            Create your account
          </h1>

          <p className="text-sand-500 text-sm mt-1">
            Free forever. No credit card required.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card p-6 space-y-4"
        >
          <Input
            label="Full name"
            icon={User}
            placeholder="Alice Chen"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value
              })
            }
            required
          />

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

          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="Min 8 characters"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value
              })
            }
            required
            minLength={8}
          />

          <Button
            type="submit"
            className="w-full justify-center"
            loading={isLoading}
          >
            Create account
          </Button>
        </form>

        <p className="text-center text-sand-500 text-sm mt-4">
          Already have an account?{' '}

          <Link
            to="/login"
            className="text-amber hover:text-amber-300 font-medium"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
