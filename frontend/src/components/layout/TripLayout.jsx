import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '../../api/trips';
import { ArrowLeft, Map, DollarSign, CheckSquare, Paperclip, Users, CalendarDays, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import { Badge } from '../ui/Badge';
import { AvatarGroup } from '../ui/Avatar';
import { formatDate } from '../../utils';
import { PageLoader } from '../ui/Skeleton';
import { useTripSocket } from '../../hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';

export function TripLayout() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripsApi.getOne(tripId).then((r) => r.data.data),
  });

  useTripSocket(tripId, {
    'trip:updated': ({ trip }) => qc.setQueryData(['trip', tripId], trip),
    'collaborator:joined': () => qc.invalidateQueries(['trip', tripId]),
  });

  if (isLoading) return <PageLoader />;
  if (!data) return <div className="text-center py-20 text-sand-500">Trip not found.</div>;

  const trip = data;

  const tabs = [
    { to: '', label: 'Overview', icon: Map, exact: true },
    { to: 'itinerary', label: 'Itinerary', icon: CalendarDays },
    { to: 'budget', label: 'Budget', icon: DollarSign },
    { to: 'checklists', label: 'Checklists', icon: CheckSquare },
    { to: 'reservations', label: 'Reservations', icon: BookOpen },
    { to: 'files', label: 'Files', icon: Paperclip },
    { to: 'people', label: 'People', icon: Users },
  ];

  const allMembers = [
    trip.owner,
    ...(trip.collaborators?.map((c) => c.user) || [])
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/trips')}
          className="btn-ghost flex items-center gap-2 mb-4 -ml-2"
        >
          <ArrowLeft size={16} />
          Back to trips
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-3xl font-semibold text-sand-100 truncate">
                {trip.title}
              </h1>

              <Badge
                variant={
                  trip.status === 'planning'
                    ? 'amber'
                    : trip.status === 'completed'
                    ? 'sand'
                    : 'sage'
                }
              >
                {trip.status}
              </Badge>
            </div>

            <p className="text-sand-500 text-sm">
              {trip.destination?.name} · {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
              {trip.duration ? ` · ${trip.duration} days` : ''}
            </p>
          </div>

          <AvatarGroup
            users={allMembers}
            size="sm"
          />
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 border-b border-white/6 pb-0 overflow-x-auto scrollbar-none">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={
              to === ''
                ? `/trips/${tripId}`
                : `/trips/${tripId}/${to}`
            }
            end={to === ''}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all -mb-px',
                isActive
                  ? 'border-amber text-amber'
                  : 'border-transparent text-sand-500 hover:text-sand-200'
              )
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </div>

      <Outlet
        context={{
          trip,
          userRole: trip.userRole
        }}
      />
    </div>
  );
}