import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Compass, MapPin, Calendar, User, Check, X } from 'lucide-react';
import { inviteApi } from '../api/trips';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { formatDate } from '../utils';
import { PageLoader } from '../components/ui/Skeleton';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => inviteApi.get(token).then(r => r.data.data),
  });

  const acceptMut = useMutation({
    mutationFn: () => inviteApi.accept(token),
    onSuccess: ({ data }) => { toast.success('Welcome to the trip!'); navigate(`/trips/${data.data.tripId}`); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to accept'),
  });

  const declineMut = useMutation({
    mutationFn: () => inviteApi.decline(token),
    onSuccess: () => { toast('Invitation declined'); navigate('/trips'); },
  });

  if (isLoading) return <PageLoader />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-terracotta/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <X size={28} className="text-terracotta" />
          </div>
          <h2 className="font-display text-xl font-semibold text-sand-100 mb-2">Invitation not found</h2>
          <p className="text-sand-500 text-sm mb-6">This invitation may have expired or been revoked.</p>
          <Button onClick={() => navigate('/')} className="mx-auto">Go home</Button>
        </div>
      </div>
    );
  }

  const invite = data;
  const trip = invite.trip;

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-amber rounded-lg flex items-center justify-center">
              <Compass size={18} className="text-ink-900" />
            </div>
            <span className="font-display text-xl font-semibold text-sand-100">WanderSync</span>
          </div>
        </div>

        <div className="card p-6 text-center">
          <Avatar user={invite.invitedBy} size="lg" className="mx-auto mb-3" />
          <p className="text-sand-400 mb-1">
            <span className="text-amber font-semibold">{invite.invitedBy?.name}</span> invited you to join
          </p>
          <h2 className="font-display text-2xl font-bold text-sand-100 mb-1">{trip?.title}</h2>

          <div className="flex items-center justify-center gap-4 text-sm text-sand-500 mt-2 mb-4">
            {trip?.destination?.name && (
              <span className="flex items-center gap-1"><MapPin size={13} />{trip.destination.name}</span>
            )}
            {trip?.startDate && (
              <span className="flex items-center gap-1"><Calendar size={13} />{formatDate(trip.startDate, 'MMM d')} – {formatDate(trip.endDate, 'MMM d')}</span>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 bg-amber/10 border border-amber/20 text-amber text-sm px-3 py-1.5 rounded-full mb-5">
            <User size={13} />
            You'll join as <strong>{invite.role}</strong>
          </div>

          {!user ? (
            <div className="space-y-3">
              <p className="text-sand-500 text-sm">Sign in to accept this invitation</p>
              <Button className="w-full justify-center" onClick={() => navigate(`/login?redirect=/invite/${token}`)}>
                Sign in to accept
              </Button>
              <Button variant="ghost" className="w-full justify-center" onClick={() => navigate(`/register?redirect=/invite/${token}`)}>
                Create account
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 justify-center" icon={X} onClick={() => declineMut.mutate()} loading={declineMut.isPending}>
                Decline
              </Button>
              <Button className="flex-1 justify-center" icon={Check} onClick={() => acceptMut.mutate()} loading={acceptMut.isPending}>
                Accept invite
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}