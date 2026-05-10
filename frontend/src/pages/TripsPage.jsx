import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Map } from 'lucide-react';

import { tripsApi } from '../api/trips';

import { TripCard } from '../components/trip/TripCard';
import { TripCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Input, Select } from '../components/ui/Input';

import useAuthStore from '../store/authStore';
import { useDebounce } from '../hooks/useDebounce';

export default function TripsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Debounce search input
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['trips', debouncedSearch, status],

    queryFn: () =>
      tripsApi
        .getAll({
          search: debouncedSearch,
          status,
          limit: 20,
        })
        .then((r) => r.data),

    keepPreviousData: true,
  });

  const trips = data?.data || [];

  const greeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';

    return 'Good evening';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sand-500 text-sm mb-1">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </p>

          <h1 className="section-title">
            My Trips
          </h1>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/trips/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          New Trip
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-5">
          <Input
            icon={Search}
            placeholder="Search trips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-44"
        >
          <option value="">
            All status
          </option>

          <option value="planning">
            Planning
          </option>

          <option value="upcoming">
            Upcoming
          </option>

          <option value="ongoing">
            Ongoing
          </option>

          <option value="completed">
            Completed
          </option>

          <option value="cancelled">
            Cancelled
          </option>
        </Select>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <TripCardSkeleton key={index} />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No trips found"
          description="Create your first trip and start planning your adventure."
          action={
            <button
              onClick={() => navigate('/trips/new')}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <Plus size={16} />
              Create first trip
            </button>
          }
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"

          initial="hidden"
          animate="show"

          variants={{
            show: {
              transition: {
                staggerChildren: 0.06,
              },
            },
          }}
        >
          {trips.map((trip) => (
            <motion.div
              key={trip._id}

              variants={{
                hidden: {
                  opacity: 0,
                  y: 16,
                },

                show: {
                  opacity: 1,
                  y: 0,
                },
              }}
            >
              <TripCard
                trip={trip}
                onClick={() => navigate(`/trips/${trip._id}`)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}