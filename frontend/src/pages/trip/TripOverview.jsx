import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { tripsApi, activitiesApi } from '../../api/trips';
import { MapPin, Calendar, Users, DollarSign, TrendingUp, CheckSquare, FileText } from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { AvatarGroup, Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatRelative } from '../../utils';

export default function TripOverview() {
  const { trip } = useOutletContext();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['trip-stats', trip._id],

    queryFn: () =>
      tripsApi
        .getStats(trip._id)
        .then((r) => r.data.data),
  });

  const { data: logData } = useQuery({
    queryKey: ['trip-log', trip._id],

    queryFn: () =>
      tripsApi
        .getActivityLog(
          trip._id,
          { limit: 8 }
        )
        .then((r) => r.data.data),
  });

  const allMembers = [
    trip.owner,
    ...(trip.collaborators?.map((c) => c.user) || [])
  ];

  const stats = statsData;

  const budgetPct = trip.budget?.total
    ? Math.round(
        (trip.budget.spent / trip.budget.total) * 100
      )
    : 0;

  const statCards = [
    {
      icon: DollarSign,
      label: 'Budget Used',

      value: `${budgetPct}%`,

      sub: stats
        ? formatCurrency(
            stats.expenses.totalSpent,
            trip.budget?.currency
          ) + ' spent'
        : '—',

      color:
        budgetPct > 90
          ? 'terracotta'
          : 'amber'
    },

    {
      icon: CheckSquare,
      label: 'Activities',

      value: Object.values(
        stats?.activities || {}
      ).reduce((a, b) => a + b, 0),

      sub: `${
        stats?.activities?.confirmed || 0
      } confirmed`,

      color: 'sage'
    },

    {
      icon: Users,
      label: 'Travelers',

      value: allMembers.length,

      sub: `${
        trip.collaborators?.length || 0
      } collaborators`,

      color: 'amber'
    },

    {
      icon: FileText,
      label: 'Confirmed Bookings',

      value:
        stats?.confirmedReservations || 0,

      sub: 'Reservations confirmed',

      color: 'sage'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cover + meta */}
      {trip.coverImage?.url && (
        <div className="h-48 rounded-2xl overflow-hidden">
          <img
            src={trip.coverImage.url}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Trip info */}
      <div className="card p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0 space-y-3">
            {trip.description && (
              <p className="text-sand-400 text-sm leading-relaxed">
                {trip.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-sand-400">
              <span className="flex items-center gap-1.5">
                <MapPin
                  size={14}
                  className="text-amber"
                />

                {trip.destination?.name}
              </span>

              <span className="flex items-center gap-1.5">
                <Calendar
                  size={14}
                  className="text-amber"
                />

                {formatDate(trip.startDate)}
                {' – '}
                {formatDate(trip.endDate)}
              </span>

              <span className="flex items-center gap-1.5">
                <Users
                  size={14}
                  className="text-amber"
                />

                {trip.travelers}
                {' '}
                travelers
              </span>
            </div>

            {trip.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {trip.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="ink"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {trip.budget?.total > 0 && (
          <div className="mt-4 pt-4 border-t border-white/6">
            <ProgressBar
              value={trip.budget.spent}
              max={trip.budget.total}

              color={
                budgetPct > 90
                  ? 'terracotta'
                  : 'amber'
              }

              label={`Budget: ${
                formatCurrency(
                  trip.budget.total,
                  trip.budget.currency
                )
              }`}

              showValue
            />
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({
          icon: Icon,
          label,
          value,
          sub,
          color
        }) => (
          <motion.div
            key={label}

            initial={{
              opacity: 0,
              y: 12
            }}

            animate={{
              opacity: 1,
              y: 0
            }}

            className="card p-4"
          >
            <div className={`w-9 h-9 rounded-xl bg-${color}/10 flex items-center justify-center mb-3`}>
              <Icon
                size={18}
                className={`text-${color}`}
              />
            </div>

            <div className="text-2xl font-bold font-display text-sand-100">
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                value
              )}
            </div>

            <div className="text-xs text-sand-500 mt-0.5">
              {label}
            </div>

            <div className="text-xs text-sand-600 mt-1">
              {sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Members + Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Members */}
        <div className="card p-5">
          <h3 className="font-semibold text-sand-100 mb-4 flex items-center gap-2">
            <Users
              size={16}
              className="text-amber"
            />

            Team
          </h3>

          <div className="space-y-3">
            {[
              {
                user: trip.owner,
                role: 'owner'
              },

              ...(trip.collaborators || [])
            ].map(({ user, role }) => (
              <div
                key={user?._id}
                className="flex items-center gap-3"
              >
                <Avatar
                  user={user}
                  size="sm"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sand-200 truncate">
                    {user?.name}
                  </p>

                  <p className="text-xs text-sand-600 truncate">
                    {user?.email}
                  </p>
                </div>

                <Badge
                  variant={
                    role === 'owner'
                      ? 'amber'
                      : role === 'editor'
                      ? 'sage'
                      : 'ink'
                  }
                >
                  {role}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Activity log */}
        <div className="card p-5">
          <h3 className="font-semibold text-sand-100 mb-4 flex items-center gap-2">
            <TrendingUp
              size={16}
              className="text-amber"
            />

            Recent Activity
          </h3>

          {!logData?.length ? (
            <p className="text-sand-500 text-sm">
              No activity yet.
            </p>
          ) : (
            <div className="space-y-3">
              {logData.map((log) => (
                <div
                  key={log._id}
                  className="flex items-start gap-3"
                >
                  <Avatar
                    user={log.user}
                    size="xs"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-sand-300">
                      {log.description}
                    </p>

                    <p className="text-xs text-sand-600 mt-0.5">
                      {formatRelative(
                        log.createdAt
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}