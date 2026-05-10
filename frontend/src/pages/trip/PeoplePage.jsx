import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { collaboratorsApi } from '../../api/trips';
import { UserPlus, Mail, Shield, Trash2, LogOut, Clock, X } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatRelative } from '../../utils';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function PeoplePage() {
  const { trip, userRole } = useOutletContext();
  const isOwner = userRole === 'owner';
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [inviteModal, setInviteModal] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'viewer', message: '' });

  const { data: collaborators = [], isLoading } = useQuery({
    queryKey: ['collaborators', trip._id],
    queryFn: () => collaboratorsApi.getAll(trip._id).then(r => r.data.data),
  });

  const { data: pendingInvites = [] } = useQuery({
    queryKey: ['invites', trip._id],
    queryFn: () => collaboratorsApi.getPendingInvites(trip._id).then(r => r.data.data),
    enabled: isOwner || userRole === 'editor',
  });

  const inviteMut = useMutation({
    mutationFn: (d) => collaboratorsApi.invite(trip._id, d),
    onSuccess: () => { qc.invalidateQueries(['invites', trip._id]); setInviteModal(false); setForm({ email: '', role: 'viewer', message: '' }); toast.success('Invitation sent!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to send invite'),
  });

  const roleMut = useMutation({
    mutationFn: ({ userId, role }) => collaboratorsApi.updateRole(trip._id, userId, role),
    onSuccess: () => { qc.invalidateQueries(['collaborators', trip._id]); toast.success('Role updated'); },
  });

  const removeMut = useMutation({
    mutationFn: (userId) => collaboratorsApi.remove(trip._id, userId),
    onSuccess: () => qc.invalidateQueries(['collaborators', trip._id]),
  });

  const leaveMut = useMutation({
    mutationFn: () => collaboratorsApi.leave(trip._id),
    onSuccess: () => { toast.success('Left trip'); navigate('/trips'); },
  });

  const revokeMut = useMutation({
    mutationFn: (id) => collaboratorsApi.revokeInvite(trip._id, id),
    onSuccess: () => qc.invalidateQueries(['invites', trip._id]),
  });

  const ROLE_BADGE = { owner: 'amber', editor: 'sage', viewer: 'ink' };

  return (
    <div className="max-w-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-semibold text-sand-100">People ({collaborators.length})</h2>
        <div className="flex gap-2">
          {userRole !== 'owner' && (
            <Button variant="secondary" size="sm" icon={LogOut} onClick={() => { if (confirm('Leave this trip?')) leaveMut.mutate(); }}>
              Leave trip
            </Button>
          )}
          {(isOwner || userRole === 'editor') && (
            <Button size="sm" icon={UserPlus} onClick={() => setInviteModal(true)}>Invite</Button>
          )}
        </div>
      </div>

      {/* Collaborators */}
      <div className="card divide-y divide-white/5 overflow-hidden mb-5">
        {collaborators.map(({ user: u, role, joinedAt, lastViewed }) => (
          <div key={u?._id} className="flex items-center gap-4 p-4 hover:bg-white/2 transition-colors group">
            <Avatar user={u} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sand-100">{u?.name}</p>
                {u?._id === user?._id && <span className="text-xs text-sand-600">(you)</span>}
              </div>
              <p className="text-xs text-sand-500 truncate">{u?.email}</p>
              {lastViewed && <p className="text-xs text-sand-600 mt-0.5">Last viewed {formatRelative(lastViewed)}</p>}
            </div>
            <div className="flex items-center gap-2">
              {isOwner && role !== 'owner' ? (
                <select
                  value={role}
                  onChange={e => roleMut.mutate({ userId: u._id, role: e.target.value })}
                  className="text-xs bg-ink-800 border border-white/10 text-sand-300 rounded-lg px-2 py-1 focus:outline-none focus:border-amber/40"
                >
                  <option value="editor">editor</option>
                  <option value="viewer">viewer</option>
                </select>
              ) : (
                <Badge variant={ROLE_BADGE[role] || 'ink'}>{role}</Badge>
              )}
              {isOwner && role !== 'owner' && (
                <button
                  onClick={() => { if (confirm(`Remove ${u?.name}?`)) removeMut.mutate(u._id); }}
                  className="btn-ghost p-1.5 rounded-lg text-terracotta opacity-0 group-hover:opacity-100 transition-opacity hover:bg-terracotta/10"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-sand-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock size={14} /> Pending invitations
          </h3>
          <div className="card divide-y divide-white/5 overflow-hidden">
            {pendingInvites.map(inv => (
              <div key={inv._id} className="flex items-center gap-3 p-3 group">
                <div className="w-8 h-8 rounded-full bg-amber/10 flex items-center justify-center flex-shrink-0">
                  <Mail size={14} className="text-amber" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-sand-200">{inv.email}</p>
                  <p className="text-xs text-sand-500">Invited as <span className="text-amber">{inv.role}</span></p>
                </div>
                <button onClick={() => revokeMut.mutate(inv._id)} className="btn-ghost p-1 rounded-lg text-sand-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite modal */}
      <Modal isOpen={inviteModal} onClose={() => setInviteModal(false)} title="Invite a collaborator" size="sm">
        <div className="space-y-4">
          <Input label="Email address *" type="email" icon={Mail} placeholder="friend@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <Select label="Role" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            <option value="viewer">Viewer — can see everything, comment</option>
            <option value="editor">Editor — can add/edit activities, expenses</option>
          </Select>
          <div>
            <label className="label">Personal message (optional)</label>
            <textarea className="input resize-none" rows={2} placeholder="Hey! Join our Tokyo trip planning..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setInviteModal(false)}>Cancel</Button>
            <Button onClick={() => inviteMut.mutate(form)} loading={inviteMut.isPending} disabled={!form.email} icon={Mail}>
              Send invite
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}