// [MES] SitePhotos — project site photo gallery + fullscreen lightbox.
// Data calls identical to the previous implementation (public read, auth write).
import { useState, useEffect, useCallback } from 'react';
import { Icon } from 'src/components/mes/Icon';
import { ImageLightbox } from 'src/components/mes/ImageLightbox';
import { ConfirmDialog, useToast, EmptyState } from 'src/components/mes/ui';
import { publicApi, api, deleteProjectImage } from 'src/utils/api';

export function SitePhotos({ project, userRole }) {
  const [images, setImages] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
        <ImageLightbox
          images={images.map((im, i) => ({ id: im.id, src: im.image_url, alt: `รูปไซต์งาน ${i + 1}` }))}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNav={(d) => setLightbox((i) => (i + d + images.length) % images.length)}
          actions={
            canManage ? (
              <button
                className="mes-btn mes-btn-danger !min-h-touch max-md:!min-w-touch max-md:!px-2"
                onClick={() => setConfirmOpen(true)}
                aria-label="ลบรูป"
              >
                <Icon name="trash" size={16} /> <span className="max-md:hidden">ลบรูป</span>
              </button>
            ) : null
          }
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); handleDelete(images[lightbox]); }}
        title="ลบรูป"
        message="คุณแน่ใจว่าต้องการลบรูปนี้หรือไม่?"
        confirmLabel="ลบรูป"
        danger
      />
      {toastNode}
    </div>
  );
}
