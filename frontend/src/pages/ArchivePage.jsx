import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { usersApi, tripsApi } from '../api/trips';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate, formatCurrency } from '../utils';
import { Badge } from '../components/ui/Badge';
import toast from 'react-hot-toast';

export default function ArchivePage() {
  const qc = useQueryClient();

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['archived-trips'],
    queryFn: () => usersApi.getArchivedTrips().then(r => r.data.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => tripsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries(['archived-trips']); toast.success('Trip deleted permanently'); },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-title">Archive</h1>
        <p className="text-sand-500 text-sm mt-1">Archived trips are hidden from your main dashboard.</p>
      </div>

      {trips.length === 0 ? (
        <EmptyState icon={Archive} title="Nothing archived" description="When you archive trips, they'll appear here." />
      ) : (
        <div className="space-y-3">
          {trips.map(trip => (
            <motion.div key={trip._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="card p-4 flex items-center gap-4 opacity-70 hover:opacity-100 transition-opacity group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sand-200">{trip.title}</span>
                  <Badge variant="ink">{trip.status}</Badge>
                </div>
                <p className="text-xs text-sand-500 mt-0.5">
                  {trip.destination?.name} · {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                </p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { if (confirm('Delete permanently? This cannot be undone.')) deleteMut.mutate(trip._id); }}
                  className="btn-ghost p-2 rounded-lg text-terracotta hover:bg-terracotta/10"
                  title="Delete permanently"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
