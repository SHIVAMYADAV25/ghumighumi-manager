import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Camera, Save, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { authApi } from '../api/auth';
import { Avatar } from '../components/ui/Avatar';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', bio: user?.bio || '', timezone: user?.timezone || 'UTC' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const profileMut = useMutation({
    mutationFn: (d) => authApi.updateMe(d),
    onSuccess: ({ data }) => { updateUser(data.user); toast.success('Profile updated!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const passMut = useMutation({
    mutationFn: (d) => authApi.updatePassword(d),
    onSuccess: () => { setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); toast.success('Password changed!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const avatarMut = useMutation({
    mutationFn: (file) => authApi.uploadAvatar(file),
    onSuccess: ({ data }) => { updateUser(data.user); toast.success('Avatar updated!'); },
  });

  const handlePass = (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (passForm.newPassword.length < 8) { toast.error('Min 8 characters'); return; }
    passMut.mutate({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
  };

  return (
    <div className="max-w-auto">
      <h1 className="section-title mb-8">Profile</h1>

      {/* Avatar */}
      <div className="card p-6 mb-5">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <Avatar user={user} size="xl" />
            <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera size={20} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) avatarMut.mutate(e.target.files[0]); }} />
            </label>
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-sand-100">{user?.name}</p>
            <p className="text-sand-500 text-sm">{user?.email}</p>
            {user?.isEmailVerified
              ? <span className="text-xs text-sage mt-1 block">✓ Email verified</span>
              : <span className="text-xs text-amber mt-1 block">⚠ Email not verified</span>
            }
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="card p-6 mb-5">
        <h2 className="font-semibold text-sand-100 mb-4 flex items-center gap-2"><User size={16} className="text-amber" /> Personal Info</h2>
        <div className="space-y-4">
          <Input label="Full name" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
          <div>
            <label className="label">Bio</label>
            <textarea className="input resize-none" rows={3} placeholder="Tell your travel companions a little about yourself..."
              value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} />
          </div>
          <Input label="Timezone" value={profileForm.timezone} onChange={e => setProfileForm({...profileForm, timezone: e.target.value})} placeholder="UTC" />
          <Button icon={Save} onClick={() => profileMut.mutate(profileForm)} loading={profileMut.isPending}>Save changes</Button>
        </div>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h2 className="font-semibold text-sand-100 mb-4 flex items-center gap-2"><Lock size={16} className="text-amber" /> Change Password</h2>
        <form onSubmit={handlePass} className="space-y-4">
          <Input label="Current password" type="password" value={passForm.currentPassword} onChange={e => setPassForm({...passForm, currentPassword: e.target.value})} required />
          <Input label="New password" type="password" value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} required minLength={8} />
          <Input label="Confirm new password" type="password" value={passForm.confirmPassword} onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})} required />
          <Button type="submit" loading={passMut.isPending} icon={Lock}>Update password</Button>
        </form>
      </div>
    </div>
  );
}
