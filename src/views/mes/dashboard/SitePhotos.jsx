// [MES] SitePhotos — project site photo gallery + fullscreen lightbox.
// Data calls identical to the previous implementation (public read, auth write).
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from 'src/components/mes/Icon';
import { ConfirmDialog, useToast, EmptyState } from 'src/components/mes/ui';
import { publicApi, api, deleteProjectImage } from 'src/utils/api';

function Lightbox({ images, index, onClose, onNav, canManage, onDelete }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNav(-1);
      if (e.key === 'ArrowRight') onNav(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNav]);

  const img = images[index];
  if (!img) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/90" onClick={onClose}>
      <div className="flex items-center gap-2 p-3" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs text-mes-muted tabular-nums">{index + 1} / {images.length}</span>
        <span className="grow" />
        {canManage && (
          <button className="mes-btn mes-btn-danger !min-h-touch" onClick={() => setConfirmOpen(true)}>
            <Icon name="trash" size={16} /> ลบรูป
          </button>
        )}
        <button className="mes-btn mes-btn-ghost !min-h-touch" onClick={onClose} aria-label="ปิด">
          <Icon name="x" size={18} />
        </button>
      </div>
      <div className="relative flex min-h-0 grow items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute left-2 z-10 flex min-h-touch min-w-touch items-center justify-center rounded-full bg-mes-surface/70 text-mes-text"
          onClick={() => onNav(-1)} aria-label="รูปก่อนหน้า"
        >
          <Icon name="chevron-left" size={22} />
        </button>
        <img
          src={img.image_url}
          alt={`รูปไซต์งาน ${index + 1}`}
          className="max-h-full max-w-full object-contain"
        />
        <button
          className="absolute right-2 z-10 flex min-h-touch min-w-touch items-center justify-center rounded-full bg-mes-surface/70 text-mes-text"
          onClick={() => onNav(1)} aria-label="รูปถัดไป"
        >
          <Icon name="chevron-right" size={22} />
        </button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); onDelete(img); }}
        title="ลบรูป"
        message="คุณแน่ใจว่าต้องการลบรูปนี้หรือไม่?"
        confirmLabel="ลบรูป"
        danger
      />
    </div>,
    document.body,
  );
}

export function SitePhotos({ project, userRole }) {
  const [images, setImages] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { showToast, toastNode } = useToast();

  const canManage = userRole === 'Admin' || userRole === 'Site User';

  const load = useCallback(() => {
    if (!project?.id) return;
    publicApi
      .get(`/projects/${project.id}/images`)
      .then((res) => setImages(Array.isArray(res.data) ? res.data : []))
      .catch(() => setImages([]));
  }, [project?.id]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !project?.id) return;
    const form = new FormData();
    form.append('image', file);
    setUploading(true);
    try {
      await api.post(`/projects/${project.id}/images`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('อัปโหลดสำเร็จ');
      load();
    } catch {
      showToast('อัปโหลดไม่สำเร็จ', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (img) => {
    try {
      await deleteProjectImage(project.id, img.id);
      showToast('ลบรูปแล้ว');
      setLightbox(null);
      load();
    } catch {
      showToast('ลบไม่สำเร็จ', 'error');
    }
  };

  return (
    <div>
      {images.length === 0 ? (
        <EmptyState icon="photo" title="ยังไม่มีรูปไซต์งาน" />
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {images.slice(0, 6).map((img, i) => (
            <button
              key={img.id}
              className="relative aspect-square overflow-hidden rounded-sm border border-mes-border"
              onClick={() => setLightbox(i)}
            >
              <img src={img.image_url} alt={`รูปไซต์งาน ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
              {i === 5 && images.length > 6 && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-bold text-mes-text">
                  +{images.length - 6}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {canManage && (
        <label className={`mes-btn mes-btn-ghost mt-2 w-full cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Icon name="upload" size={16} /> {uploading ? 'กำลังอัปโหลด…' : 'อัปโหลด'}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      )}

      {lightbox !== null && (
        <Lightbox
          images={images}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNav={(d) => setLightbox((i) => (i + d + images.length) % images.length)}
          canManage={canManage}
          onDelete={handleDelete}
        />
      )}
      {toastNode}
    </div>
  );
}
