import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, DollarSign } from 'lucide-react';
import clsx from 'clsx';
import { formatDate, statusColors } from '../../utils';
import { AvatarGroup } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';

const STATUS_BADGE = {
  planning: 'amber',
  upcoming: 'sage',
  ongoing: 'amber',
  completed: 'sand',
  cancelled: 'terracotta',
};

export function TripCard({ trip, onClick }) {
  const allMembers = [
    trip.owner,
    ...(trip.collaborators?.map((c) => c.user) || [])
  ];

  const budgetPct = trip.budget?.total
    ? Math.round(
        (trip.budget.spent / trip.budget.total) * 100
      )
    : 0;

  const budgetColor =
    budgetPct > 90
      ? 'terracotta'
      : budgetPct > 70
      ? 'amber'
      : 'sage';

  return (
    <motion.div
      whileHover={{ y: -3 }}
      onClick={onClick}
      className="card-hover cursor-pointer overflow-hidden group"
    >
      {/* Cover */}
      <div className="relative h-40 overflow-hidden bg-ink-600">
        {trip.coverImage?.url ? (
          <img
            src={trip.coverImage.url}
            alt={trip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-4xl opacity-20">
              ✈️
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 to-transparent" />

        <div className="absolute bottom-3 left-3">
          <Badge
            variant={
              STATUS_BADGE[trip.status] || 'ink'
            }
          >
            {trip.status}
          </Badge>
        </div>

        {trip.userRole === 'owner' && (
          <div className="absolute top-3 right-3">
            <span className="text-xs bg-amber/20 border border-amber/30 text-amber px-2 py-0.5 rounded-full">
              Owner
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-sand-100 mb-1 truncate">
          {trip.title}
        </h3>

        <div className="flex items-center gap-1.5 text-sand-500 text-xs mb-3">
          <MapPin size={12} />

          <span className="truncate">
            {trip.destination?.name || 'No destination'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-sand-500 mb-3">
          <span className="flex items-center gap-1">
            <Calendar size={12} />

            {formatDate(
              trip.startDate,
              'MMM d'
            )}
            {' – '}
            {formatDate(
              trip.endDate,
              'MMM d'
            )}
          </span>

          <span className="flex items-center gap-1">
            <Users size={12} />
            {allMembers.length}
          </span>
        </div>

        {trip.budget?.total > 0 && (
          <div className="mb-3">
            <ProgressBar
              value={trip.budget.spent}
              max={trip.budget.total}
              color={budgetColor}
            />

            <div className="flex justify-between text-xs text-sand-600 mt-1">
              <span>
                Spent:
                {' '}
                {trip.budget.currency}
                {' '}
                {trip.budget.spent?.toFixed(0)}
              </span>

              <span>
                Budget:
                {' '}
                {trip.budget.currency}
                {' '}
                {trip.budget.total?.toFixed(0)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <AvatarGroup
            users={allMembers}
            size="xs"
            max={4}
          />

          {trip.daysUntilTrip > 0 && (
            <span className="text-xs text-amber">
              {trip.daysUntilTrip}d away
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
