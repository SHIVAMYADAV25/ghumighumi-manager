import { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { attachmentsApi } from '../../api/trips';
import { Upload, Trash2, Download, Paperclip, FileText, Image, File } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatRelative } from '../../utils';
import toast from 'react-hot-toast';

const CATEGORIES = ['ticket','passport','insurance','hotel','transport','map','photo','document','other'];
const FILE_ICON = (mime) => {
  if (mime?.startsWith('image')) return Image;
  if (mime?.includes('pdf') || mime?.includes('document')) return FileText;
  return File;
};
const formatSize = (bytes) => bytes < 1024*1024 ? `${(bytes/1024).toFixed(1)} KB` : `${(bytes/1024/1024).toFixed(1)} MB`;

export default function FilesPage() {
  const { trip, userRole } = useOutletContext();
  const canEdit = ['owner', 'editor'].includes(userRole);
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [catFilter, setCatFilter] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['attachments', trip._id, catFilter],
    queryFn: () => attachmentsApi.getAll(trip._id, catFilter ? { category: catFilter } : {}).then(r => r.data.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => attachmentsApi.delete(trip._id, id),
    onSuccess: () => { qc.invalidateQueries(['attachments', trip._id]); toast.success('Deleted'); },
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', 'other');
    try {
      await attachmentsApi.upload(trip._id, fd);
      qc.invalidateQueries(['attachments', trip._id]);
      toast.success('File uploaded!');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-semibold text-sand-100">Files & Attachments</h2>
          <span className="text-sm text-sand-500">{files.length} files</span>
        </div>
        <div className="flex items-center gap-3">
          <Select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="w-36 text-xs">
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          {canEdit && (
            <>
              <input ref={fileRef} type="file" className="hidden" onChange={handleUpload}
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt" />
              <Button size="sm" icon={Upload} loading={uploading} onClick={() => fileRef.current?.click()}>Upload</Button>
            </>
          )}
        </div>
      </div>

      {files.length === 0 ? (
        <EmptyState icon={Paperclip} title="No files yet" description="Upload tickets, passports, maps, insurance docs — all in one place."
          action={canEdit && <Button icon={Upload} size="sm" onClick={() => fileRef.current?.click()}>Upload file</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map(file => {
            const Icon = FILE_ICON(file.mimeType);
            const isImage = file.mimeType?.startsWith('image');
            return (
              <motion.div key={file._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="card group hover:border-white/12 transition-all overflow-hidden">
                {isImage ? (
                  <div className="h-36 overflow-hidden bg-ink-800">
                    <img src={file.url} alt={file.name} className="w-full h-full object-scale-down group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-20 bg-ink-800 flex items-center justify-center">
                    <Icon size={32} className="text-sand-600" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-sand-100 truncate mb-1">{file.name || file.originalName}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="ink">{file.category}</Badge>
                    <span className="text-xs text-sand-600">{formatSize(file.size)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Avatar user={file.uploadedBy} size="xs" />
                      <span className="text-xs text-sand-600">{formatDate(file.createdAt, 'MMM d')}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={file.url} target="_blank" rel="noreferrer" className="btn-ghost p-1.5 rounded-lg" title="Download">
                        <Download size={13} />
                      </a>
                      {canEdit && (
                        <button onClick={() => { if (confirm('Delete file?')) deleteMut.mutate(file._id); }}
                          className="btn-ghost p-1.5 rounded-lg text-terracotta hover:bg-terracotta/10">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}