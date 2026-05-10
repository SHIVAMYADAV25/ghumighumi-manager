import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { reservationsApi } from '../../api/trips';
import { Plus, Plane, Hotel, Car, Train, Ship, Utensils, MapPin, Trash2, Edit2, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate, formatCurrency } from '../../utils';
import toast from 'react-hot-toast';

const TYPE_ICONS = { flight: Plane, hotel: Hotel, car_rental: Car, train: Train, ferry: Ship, restaurant: Utensils, other: MapPin };
const TYPE_COLORS = { flight: 'amber', hotel: 'sage', car_rental: 'sand', train: 'amber', ferry: 'sage', restaurant: 'terracotta', other: 'ink' };
const STATUS_COLORS = { pending: 'amber', confirmed: 'sage', cancelled: 'terracotta', completed: 'sand' };
const TYPES = ['flight','hotel','car_rental','train','bus','ferry','tour','restaurant','other'];

const EMPTY_FORM = { type: 'flight', title: '', provider: '', confirmationNumber: '', from: '', to: '', checkIn: '', checkOut: '', departureTime: '', arrivalTime: '', totalCost: 0, currency: 'USD', isPaid: false, status: 'pending', notes: '' };

export default function ReservationsPage() {
  const { trip, userRole } = useOutletContext();
  const canEdit = ['owner', 'editor'].includes(userRole);
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [typeFilter, setTypeFilter] = useState('');

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations', trip._id, typeFilter],
    queryFn: () => reservationsApi.getAll(trip._id, typeFilter ? { type: typeFilter } : {}).then(r => r.data.data),
  });

  const createMut = useMutation({
    mutationFn: (d) => reservationsApi.create(trip._id, d),
    onSuccess: () => { qc.invalidateQueries(['reservations', trip._id]); setModal(false); setForm(EMPTY_FORM); toast.success('Reservation added!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => reservationsApi.update(trip._id, id, data),
    onSuccess: () => { qc.invalidateQueries(['reservations', trip._id]); setEditing(null); toast.success('Updated!'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => reservationsApi.delete(trip._id, id),
    onSuccess: () => { qc.invalidateQueries(['reservations', trip._id]); toast.success('Deleted'); },
  });

  const openEdit = (r) => { setEditing(r); setForm({ ...r, checkIn: r.checkIn?.slice(0,10)||'', checkOut: r.checkOut?.slice(0,10)||'', departureTime: r.departureTime?.slice(0,16)||'', arrivalTime: r.arrivalTime?.slice(0,16)||'' }); };

  const isTransport = ['flight','train','bus','ferry'].includes(form.type);
  const isAccom = ['hotel'].includes(form.type);

  const groupedByType = TYPES.reduce((acc, t) => {
    const items = reservations.filter(r => r.type === t);
    if (items.length) acc[t] = items;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-semibold text-sand-100">Reservations</h2>
          <span className="text-sm text-sand-500">{reservations.length} total</span>
        </div>
        <div className="flex items-center gap-3">
          <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-36 text-xs">
            <option value="">All types</option>
            {TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
          </Select>
          {canEdit && <Button size="sm" icon={Plus} onClick={() => { setEditing(null); setForm(EMPTY_FORM); setModal(true); }}>Add</Button>}
        </div>
      </div>

      {reservations.length === 0 ? (
        <EmptyState icon={Plane} title="No reservations yet" description="Add flights, hotels, and more to keep everything in one place."
          action={canEdit && <Button icon={Plus} size="sm" onClick={() => setModal(true)}>Add reservation</Button>} />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByType).map(([type, items]) => {
            const Icon = TYPE_ICONS[type] || MapPin;
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={16} className="text-amber" />
                  <h3 className="text-sm font-semibold text-sand-300 uppercase tracking-wider">{type.replace('_',' ')}</h3>
                  <div className="flex-1 h-px bg-white/6" />
                </div>
                <div className="space-y-2">
                  {items.map(r => {
                    const Icon2 = TYPE_ICONS[r.type] || MapPin;
                    return (
                      <motion.div key={r._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="card p-4 group hover:border-white/10 transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-xl bg-${TYPE_COLORS[r.type]}/10 flex items-center justify-center flex-shrink-0`}>
                              <Icon2 size={18} className={`text-${TYPE_COLORS[r.type]}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sand-100">{r.title}</span>
                                <Badge variant={STATUS_COLORS[r.status] || 'ink'}>{r.status}</Badge>
                                {r.isPaid && <Badge variant="sage">Paid</Badge>}
                              </div>
                              {r.provider && <p className="text-xs text-sand-500 mt-0.5">{r.provider}</p>}
                              <div className="flex items-center gap-4 mt-1.5 text-xs text-sand-500 flex-wrap">
                                {r.from && r.to && <span>{r.from} → {r.to}</span>}
                                {r.departureTime && <span>Departs: {formatDate(r.departureTime, 'MMM d, HH:mm')}</span>}
                                {r.checkIn && <span>Check-in: {formatDate(r.checkIn, 'MMM d')}</span>}
                                {r.checkOut && <span>Check-out: {formatDate(r.checkOut, 'MMM d')}</span>}
                                {r.confirmationNumber && <span className="font-mono bg-ink-800 px-1.5 py-0.5 rounded text-amber">{r.confirmationNumber}</span>}
                                {r.totalCost > 0 && <span className="text-amber font-medium">{formatCurrency(r.totalCost, r.currency)}</span>}
                              </div>
                              {r.notes && <p className="text-xs text-sand-600 mt-1 italic">{r.notes}</p>}
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button onClick={() => openEdit(r)} className="btn-ghost p-1.5 rounded-lg"><Edit2 size={14} /></button>
                              <button onClick={() => { if (confirm('Delete?')) deleteMut.mutate(r._id); }} className="btn-ghost p-1.5 rounded-lg text-terracotta hover:bg-terracotta/10"><Trash2 size={14} /></button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modal || !!editing} onClose={() => { setModal(false); setEditing(null); }} title={editing ? 'Edit Reservation' : 'Add Reservation'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Select label="Type" value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="col-span-2">
            {TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
          </Select>
          <Input label="Title *" placeholder="Flight to Tokyo" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="col-span-2" />
          <Input label="Provider" placeholder="Japan Airlines" value={form.provider||''} onChange={e => setForm({...form, provider: e.target.value})} />
          <Input label="Confirmation #" placeholder="ABC123" value={form.confirmationNumber||''} onChange={e => setForm({...form, confirmationNumber: e.target.value})} />

          {isTransport && (<>
            <Input label="From" placeholder="Mumbai (BOM)" value={form.from||''} onChange={e => setForm({...form, from: e.target.value})} />
            <Input label="To" placeholder="Tokyo (NRT)" value={form.to||''} onChange={e => setForm({...form, to: e.target.value})} />
            <Input type="datetime-local" label="Departure" value={form.departureTime||''} onChange={e => setForm({...form, departureTime: e.target.value})} />
            <Input type="datetime-local" label="Arrival" value={form.arrivalTime||''} onChange={e => setForm({...form, arrivalTime: e.target.value})} />
          </>)}

          {isAccom && (<>
            <Input type="date" label="Check-in" value={form.checkIn||''} onChange={e => setForm({...form, checkIn: e.target.value})} />
            <Input type="date" label="Check-out" value={form.checkOut||''} onChange={e => setForm({...form, checkOut: e.target.value})} />
          </>)}

          <Input type="number" label="Total cost" min={0} value={form.totalCost||''} onChange={e => setForm({...form, totalCost: parseFloat(e.target.value)||0})} />
          <Select label="Currency" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
            {['USD','EUR','GBP','INR','JPY','AUD'].map(c => <option key={c}>{c}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            {['pending','confirmed','cancelled','completed'].map(s => <option key={s}>{s}</option>)}
          </Select>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" id="isPaid" checked={form.isPaid} onChange={e => setForm({...form, isPaid: e.target.checked})} className="w-4 h-4 accent-amber" />
            <label htmlFor="isPaid" className="text-sm text-sand-300">Paid</label>
          </div>
          <Textarea label="Notes" value={form.notes||''} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="col-span-2" />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/6">
          <Button variant="ghost" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Button>
          <Button
            onClick={() => editing ? updateMut.mutate({ id: editing._id, data: form }) : createMut.mutate(form)}
            loading={createMut.isPending || updateMut.isPending}
            disabled={!form.title}
          >
            {editing ? 'Save changes' : 'Add reservation'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}