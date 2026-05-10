import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { budgetApi } from '../../api/trips';
import { Plus, Trash2, Check, DollarSign, TrendingUp, ArrowDownCircle } from 'lucide-react';
import { formatCurrency, formatDate, formatRelative } from '../../utils';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar } from '../../components/ui/Avatar';
import { PageLoader } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const CAT_COLORS = {
  accommodation: '#E8C547', transport: '#7A9E7E', food: '#C4614A',
  activities: '#96B89A', shopping: '#BFB49A', health: '#D4795F',
  visa: '#A04A35', insurance: '#5E8062', other: '#4A4A42',
};

const CATEGORIES = ['accommodation','transport','food','activities','shopping','health','visa','insurance','other'];

export default function BudgetPage() {
  const { trip, userRole } = useOutletContext();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', currency: trip.budget?.currency || 'USD', category: 'food', splitType: 'equal', notes: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['budget', trip._id],
    queryFn: () => budgetApi.getSummary(trip._id).then((r) => r.data.data),
  });

  const addMut = useMutation({
    mutationFn: (d) => budgetApi.addExpense(trip._id, { ...d, paidBy: user._id }),
    onSuccess: () => { qc.invalidateQueries(['budget', trip._id]); setAddModal(false); toast.success('Expense added!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => budgetApi.deleteExpense(trip._id, id),
    onSuccess: () => qc.invalidateQueries(['budget', trip._id]),
  });

  const settleMut = useMutation({
    mutationFn: (id) => budgetApi.settleExpense(trip._id, id),
    onSuccess: () => { qc.invalidateQueries(['budget', trip._id]); toast.success('Marked as settled!'); },
  });

  if (isLoading) return <PageLoader />;

  const { budget, totalSpent, remaining, percentUsed, categoryBreakdown, expenses, balances } = data;
  const pieData = categoryBreakdown.filter((c) => c.total > 0).map((c) => ({
    name: c._id, value: c.total, color: CAT_COLORS[c._id] || '#4A4A42',
  }));

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Budget', value: formatCurrency(budget.total, budget.currency), icon: DollarSign, color: 'amber' },
          { label: 'Total Spent', value: formatCurrency(totalSpent, budget.currency), icon: TrendingUp, color: totalSpent > budget.total ? 'terracotta' : 'sage' },
          { label: 'Remaining', value: formatCurrency(Math.max(0, remaining), budget.currency), icon: ArrowDownCircle, color: remaining < 0 ? 'terracotta' : 'amber' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={"w-8 h-8 rounded-lg bg-/10 flex items-center justify-center mb-3"}>
              <Icon size={16} className={`text-${color}`} />
            </div>
            <div className="text-xl font-bold font-display text-sand-100">{value}</div>
            <div className="text-xs text-sand-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {budget.total > 0 && (
        <div className="card p-4">
          <ProgressBar value={totalSpent} max={budget.total} color={percentUsed > 90 ? 'terracotta' : 'amber'} label="Budget used" showValue />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pie chart */}
        {pieData.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-sand-100 mb-4">By Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v, budget.currency)} contentStyle={{ color: '#F5F3EC' , background: '#26261F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-sand-400">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Balances */}
        {balances?.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-sand-100 mb-4">Who Owes Who</h3>
            <div className="space-y-3">
              {balances.map((b, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-ink-800 rounded-xl">
                  <span className="text-sm text-sand-300">owes</span>
                  <span className="text-amber font-semibold">{formatCurrency(b.amount, budget.currency)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expenses list */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sand-100">Expenses ({expenses?.length || 0})</h3>
          <Button size="sm" icon={Plus} onClick={() => setAddModal(true)}>Add expense</Button>
        </div>

        <div className="space-y-2">
          {(expenses || []).map((exp) => {
            const myBalance = exp.splits?.find((s) => s.user === user._id);
            return (
              <div key={exp._id} className="flex items-start gap-3 p-3 bg-ink-800 rounded-xl group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: (CAT_COLORS[exp.category] || '#4A4A42') + '22' }}>
                  <span className="text-xs">{CAT_COLORS[exp.category] ? '💰' : '📌'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-sand-100">{exp.title}</span>
                    <span className="text-sm font-semibold text-amber">{formatCurrency(exp.amount, exp.currency)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-sand-500">
                    <span>{exp.category}</span>
                    <span>{formatDate(exp.date, 'MMM d')}</span>
                    {exp.paidBy && <span className="flex items-center gap-1"><Avatar user={exp.paidBy} size="xs" />paid by {exp.paidBy?.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {myBalance && !myBalance.isPaid && (
                    <button onClick={() => settleMut.mutate(exp._id)} className="btn-ghost p-1.5 rounded-lg text-sage" title="Mark my share as paid">
                      <Check size={13} />
                    </button>
                  )}
                  <button onClick={() => { if (confirm('Delete?')) deleteMut.mutate(exp._id); }} className="btn-ghost p-1.5 rounded-lg text-terracotta hover:bg-terracotta/10">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
          {!expenses?.length && <p className="text-center py-6 text-sand-600 text-sm">No expenses yet.</p>}
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Expense">
        <div className="space-y-4">
          <Input label="Title *" placeholder="Hotel deposit" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount *" type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Select label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {['USD','EUR','GBP','INR','JPY','AUD'].map((c) => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Select label="Split type" value={form.splitType} onChange={(e) => setForm({ ...form, splitType: e.target.value })}>
            <option value="none">No split</option>
            <option value="equal">Split equally</option>
          </Select>
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button onClick={() => addMut.mutate(form)} loading={addMut.isPending} disabled={!form.title || !form.amount}>Add expense</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
