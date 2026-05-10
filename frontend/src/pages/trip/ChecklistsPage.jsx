import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { checklistsApi } from '../../api/trips';
import { Plus, Trash2, Check, CheckSquare } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState } from '../../components/ui/EmptyState';
import { Avatar } from '../../components/ui/Avatar';
import toast from 'react-hot-toast';
import { useTripSocket } from '../../hooks/useSocket';

export default function ChecklistsPage() {
  const { trip, userRole } = useOutletContext();
  const canEdit = ['owner', 'editor'].includes(userRole);
  const qc = useQueryClient();
  const [addModal, setAddModal] = useState(false);
  const [addItemModal, setAddItemModal] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'custom' });
  const [itemText, setItemText] = useState('');

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['checklists', trip._id],
    queryFn: () => checklistsApi.getAll(trip._id).then((r) => r.data.data),
  });

  useTripSocket(trip._id, {
    'checklist:created': () => qc.invalidateQueries(['checklists', trip._id]),
    'checklist:updated': () => qc.invalidateQueries(['checklists', trip._id]),
    'checklist:itemToggled': () => qc.invalidateQueries(['checklists', trip._id]),
    'checklist:itemAdded': () => qc.invalidateQueries(['checklists', trip._id]),
  });

  const createMut = useMutation({
    mutationFn: (d) => checklistsApi.create(trip._id, d),
    onSuccess: () => { qc.invalidateQueries(['checklists', trip._id]); setAddModal(false); toast.success('Checklist created!'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => checklistsApi.delete(trip._id, id),
    onSuccess: () => qc.invalidateQueries(['checklists', trip._id]),
  });

  const toggleMut = useMutation({
    mutationFn: ({ checklistId, itemId }) => checklistsApi.toggleItem(trip._id, checklistId, itemId),
    onSuccess: () => qc.invalidateQueries(['checklists', trip._id]),
  });

  const addItemMut = useMutation({
    mutationFn: ({ id, text }) => checklistsApi.addItem(trip._id, id, { text }),
    onSuccess: () => { qc.invalidateQueries(['checklists', trip._id]); setItemText(''); setAddItemModal(null); },
  });

  const deleteItemMut = useMutation({
    mutationFn: ({ checklistId, itemId }) => checklistsApi.deleteItem(trip._id, checklistId, itemId),
    onSuccess: () => qc.invalidateQueries(['checklists', trip._id]),
  });

  if (isLoading) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-semibold text-sand-100">Checklists</h2>
        {canEdit && <Button size="sm" icon={Plus} onClick={() => setAddModal(true)}>New checklist</Button>}
      </div>

      {checklists.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No checklists yet" description="Create packing lists, to-dos, and more."
          action={canEdit && <Button icon={Plus} onClick={() => setAddModal(true)} size="sm">Create checklist</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {checklists.map((cl) => (
            <motion.div key={cl._id} layout className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sand-100">{cl.title}</h3>
                  <p className="text-xs text-sand-500 mt-0.5">{cl.items?.length || 0} items · {cl.completionRate}% done</p>
                </div>
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <>
                      <button onClick={() => setAddItemModal(cl._id)} className="btn-ghost p-1.5 rounded-lg text-amber">
                        <Plus size={14} />
                      </button>
                      <button onClick={() => { if(confirm('Delete?')) deleteMut.mutate(cl._id); }} className="btn-ghost p-1.5 rounded-lg text-terracotta">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <ProgressBar value={cl.completionRate} max={100} color="sage" />

              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {(cl.items || []).map((item) => (
                  <div key={item._id} className="flex items-center gap-3 group">
                    <button
                      onClick={() => toggleMut.mutate({ checklistId: cl._id, itemId: item._id })}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.isCompleted ? 'bg-sage border-sage' : 'border-sand-600 hover:border-sand-400'}`}
                    >
                      {item.isCompleted && <Check size={11} className="text-white" />}
                    </button>
                    <span className={`flex-1 text-sm transition-all ${item.isCompleted ? 'line-through text-sand-600' : 'text-sand-200'}`}>
                      {item.text}
                    </span>
                    {item.completedBy && <Avatar user={item.completedBy} size="xs" />}
                    {canEdit && (
                      <button
                        onClick={() => deleteItemMut.mutate({ checklistId: cl._id, itemId: item._id })}
                        className="opacity-0 group-hover:opacity-100 btn-ghost p-0.5 rounded text-terracotta"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="New Checklist" size="sm">
        <div className="space-y-4">
          <Input label="Title" placeholder="Packing List" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {['packing','todo','documents','custom'].map((t) => <option key={t}>{t}</option>)}
          </Select>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate(form)} loading={createMut.isPending} disabled={!form.title}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!addItemModal} onClose={() => setAddItemModal(null)} title="Add Item" size="sm">
        <div className="space-y-4">
          <Input label="Item" placeholder="Passport" value={itemText} onChange={(e) => setItemText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addItemMut.mutate({ id: addItemModal, text: itemText }); }} />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAddItemModal(null)}>Cancel</Button>
            <Button onClick={() => addItemMut.mutate({ id: addItemModal, text: itemText })} loading={addItemMut.isPending} disabled={!itemText}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}