import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MapPin, Calendar, Users, DollarSign } from 'lucide-react';
import { tripsApi } from '../api/trips';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const STEPS = [
  'Details',
  'Dates & Travelers',
  'Budget'
];

export default function NewTripPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    title: '',
    description: '',

    destination: {
      name: '',
      country: ''
    },

    startDate: '',
    endDate: '',

    travelers: 1,

    budget: {
      total: 0,
      currency: 'USD'
    },

    visibility: 'private',
    tags: '',
  });

  const set = (key, val) =>
    setForm((f) => ({
      ...f,
      [key]: val
    }));

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      tripsApi.create({
        ...form,

        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }),

    onSuccess: ({ data }) => {
      qc.invalidateQueries(['trips']);

      toast.success('Trip created!');

      navigate(
        /trips/
      );
    },

    onError: (err) =>
      toast.error(
        err.response?.data?.message ||
        'Failed to create trip'
      ),
  });

  const steps = [
    <div key={0} className="space-y-4">
      <Input
        label="Trip title *"
        placeholder="Tokyo Adventure 2025"
        value={form.title}
        onChange={(e) =>
          set('title', e.target.value)
        }
        required
      />

      <Textarea
        label="Description"
        placeholder="What's this trip about?"
        rows={3}
        value={form.description}
        onChange={(e) =>
          set('description', e.target.value)
        }
      />

      <Input
        label="Destination *"
        icon={MapPin}
        placeholder="Tokyo, Japan"
        value={form.destination.name}
        onChange={(e) =>
          set(
            'destination',
            {
              ...form.destination,
              name: e.target.value
            }
          )
        }
      />

      <div>
        <label className="label">
          Tags (comma separated)
        </label>

        <input
          className="input"
          placeholder="japan, culture, food"
          value={form.tags}
          onChange={(e) =>
            set('tags', e.target.value)
          }
        />
      </div>
    </div>,

    <div key={1} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Start date *"
          icon={Calendar}
          value={form.startDate}
          onChange={(e) =>
            set('startDate', e.target.value)
          }
        />

        <Input
          type="date"
          label="End date *"
          icon={Calendar}
          value={form.endDate}
          min={form.startDate}
          onChange={(e) =>
            set('endDate', e.target.value)
          }
        />
      </div>

      <Input
        type="number"
        label="Number of travelers"
        icon={Users}
        min={1}
        max={50}
        value={form.travelers}
        onChange={(e) =>
          set(
            'travelers',
            parseInt(e.target.value)
          )
        }
      />

      <Select
        label="Visibility"
        value={form.visibility}
        onChange={(e) =>
          set(
            'visibility',
            e.target.value
          )
        }
      >
        <option value="private">
          Private
        </option>

        <option value="invite_only">
          Invite only
        </option>

        <option value="public">
          Public
        </option>
      </Select>
    </div>,

    <div key={2} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          label="Total budget"
          icon={DollarSign}
          min={0}
          placeholder="5000"
          value={form.budget.total || ''}

          onChange={(e) =>
            set(
              'budget',
              {
                ...form.budget,
                total:
                  parseFloat(
                    e.target.value
                  ) || 0
              }
            )
          }
        />

        <Select
          label="Currency"
          value={form.budget.currency}

          onChange={(e) =>
            set(
              'budget',
              {
                ...form.budget,
                currency: e.target.value
              }
            )
          }
        >
          {[
            'USD',
            'EUR',
            'GBP',
            'INR',
            'JPY',
            'AUD',
            'CAD',
            'SGD'
          ].map((c) => (
            <option
              key={c}
              value={c}
            >
              {c}
            </option>
          ))}
        </Select>
      </div>

      <div className="card p-4 border-amber/15">
        <p className="text-sm text-sand-400">
          You can leave the budget at 0 and
          add expenses later. Your budget is
          shared with all collaborators.
        </p>
      </div>
    </div>,
  ];

  const canNext = () => {
    if (step === 0) {
      return (
        form.title &&
        form.destination.name
      );
    }

    if (step === 1) {
      return (
        form.startDate &&
        form.endDate &&
        new Date(form.endDate) >=
          new Date(form.startDate)
      );
    }

    return true;
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="section-title mb-2">
          Create new trip
        </h1>

        <p className="text-sand-500 text-sm">
          Step
          {' '}
          {step + 1}
          {' '}
          of
          {' '}
          {STEPS.length}
          :
          {' '}
          {STEPS[step]}
        </p>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={"flex-1 h-1 rounded-full transition-all duration-300"}
          />
        ))}
      </div>

      <motion.div
        key={step}

        initial={{
          opacity: 0,
          x: 20
        }}

        animate={{
          opacity: 1,
          x: 0
        }}

        className="card p-6"
      >
        {steps[step]}

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/6">
          <Button
            variant="ghost"

            onClick={() =>
              step > 0
                ? setStep((s) => s - 1)
                : navigate('/trips')
            }

            disabled={isPending}
          >
            {step === 0
              ? 'Cancel'
              : 'Back'}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() =>
                setStep((s) => s + 1)
              }
              disabled={!canNext()}
            >
              Next →
            </Button>
          ) : (
            <Button
              onClick={() => mutate()}
              loading={isPending}
              disabled={!canNext()}
            >
              Create trip
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
