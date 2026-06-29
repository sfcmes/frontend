import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Primitives';
import { publicApi, api, deleteProjectImage } from 'src/utils/api';

/* ---- Premium Lightbox ---- */
function Lightbox({ images, index, onClose, onNav, canDelete, projectId, onDelete }) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const boxRef = useRef(null);
  const isDragging = useRef(false);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });

  // Reset zoom + pan when navigating to a new image
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [index]);

  // Keyboard: Esc close, arrow keys navigate
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNav(-1);
      if (e.key === 'ArrowRight') onNav(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNav]);

  // Wheel zoom — must be non-passive to call preventDefault
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      setScale((s) => {
        const next = Math.max(1, Math.min(5, s - e.deltaY * 0.002));
        if (next <= 1) setPan({ x: 0, y: 0 });
        return next;
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (scale <= 1) return;
    isDragging.current = true;
    dragOrigin.current = { x: e.clientX, y: e.clientY };
    panOrigin.current = { ...pan };
    e.preventDefault();
  }, [scale, pan]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    setPan({
      x: panOrigin.current.x + e.clientX - dragOrigin.current.x,
      y: panOrigin.current.y + e.clientY - dragOrigin.current.y,
    });
  }, []);

  const stopDrag = useCallback(() => { isDragging.current = false; }, []);

  const adjustZoom = (delta) => {
    setScale((s) => {
      const next = Math.max(1, Math.min(5, s + delta));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const img = images[index];

  return createPortal(
    <div className="lb-scrim" onClick={onClose}>
      {/* Image box — captures wheel + drag */}
      <div
        ref={boxRef}
        className="lb-box"
        data-zoomed={scale > 1}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        <img
          key={img.id}
          className="lb-img"
          src={img.image_url}
          alt=""
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
          draggable={false}
        />
      </div>

      {/* Close button */}
      <button className="lb-close" onClick={onClose}>
        <Icon name="x" size={20} />
      </button>

      {/* Prev / Next */}
      {images.length > 1 && (
        <>
          <button className="lb-nav lb-prev" onClick={(e) => { e.stopPropagation(); onNav(-1); }}>
            <Icon name="chevron-left" size={26} />
          </button>
          <button className="lb-nav lb-next" onClick={(e) => { e.stopPropagation(); onNav(1); }}>
            <Icon name="chevron-right" size={26} />
          </button>
        </>
      )}

      {/* Footer: counter + zoom controls + delete */}
      <div className="lb-footer" onClick={(e) => e.stopPropagation()}>
        <span className="lb-counter">{index + 1} / {images.length}</span>
        <div className="lb-zoom-ctrl">
          <button className="lb-zoom-btn" onClick={() => adjustZoom(-0.5)}>
            <Icon name="zoom-out" size={16} />
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button className="lb-zoom-btn" onClick={() => adjustZoom(0.5)}>
            <Icon name="zoom-in" size={16} />
          </button>
        </div>
        {canDelete && (
          <button className="lb-del-btn" onClick={() => onDelete(img.id)}>
            <Icon name="trash" size={15} /> ลบรูป
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ---- Site Photo Gallery ---- */
export function SitePhotos({ project, userRole }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef(null);
  const toastTimer = useRef(null);

  const canManage = userRole === 'Admin' || userRole === 'Site User';

  useEffect(() => {
    if (!project?.id) { setImages([]); return; }
    setLoading(true);
    setActiveIdx(0);
    publicApi.get(`/projects/${project.id}/images`)
      .then((res) => setImages(Array.isArray(res.data) ? res.data : []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, [project?.id]);

  const showToast = useCallback((msg, type = 'ok') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/projects/${project.id}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages((prev) => [...prev, res.data]);
      showToast('อัปโหลดสำเร็จ');
    } catch {
      showToast('อัปโหลดไม่สำเร็จ', 'err');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [project?.id, showToast]);

  const handleDelete = useCallback(async (imageId) => {
    try {
      await deleteProjectImage(project.id, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      setActiveIdx((i) => Math.max(0, i - 1));
      setLightboxOpen(false);
      showToast('ลบรูปแล้ว');
    } catch {
      showToast('ลบไม่สำเร็จ', 'err');
    }
  }, [project?.id, showToast]);

  const navigate = useCallback((delta) => {
    setActiveIdx((i) => (i + delta + images.length) % images.length);
  }, [images.length]);

  const active = images[activeIdx];

  return (
    <div className="rp-photos">
      {/* Main featured image */}
      <div
        className="rp-photo-main"
        onClick={() => active && setLightboxOpen(true)}
      >
        {/* Placeholder — shown when loading or no images */}
        {(loading || !active) && (
          <div className="rp-photo-ph">
            {loading
              ? <Icon name="refresh" size={22} style={{ opacity: 0.35 }} />
              : <><Icon name="photo" size={30} /><span>ยังไม่มีรูปไซต์งาน</span></>
            }
          </div>
        )}

        {/* Live image */}
        {!loading && active && (
          <>
            <img className="rp-photo-img" src={active.image_url} alt="" />

            {images.length > 1 && (
              <>
                <button
                  className="rp-photo-nav rp-photo-prev"
                  onClick={(e) => { e.stopPropagation(); navigate(-1); }}
                >
                  <Icon name="chevron-left" size={18} />
                </button>
                <button
                  className="rp-photo-nav rp-photo-next"
                  onClick={(e) => { e.stopPropagation(); navigate(1); }}
                >
                  <Icon name="chevron-right" size={18} />
                </button>
              </>
            )}

            <div className="rp-photo-counter">{activeIdx + 1} / {images.length}</div>

            <div className="rp-image-cap">
              <div className="rp-image-code">{project.code}</div>
              <div className="rp-image-name">{project.name}</div>
            </div>
          </>
        )}

        {/* Upload trigger — always visible for permitted roles */}
        {canManage && !loading && (
          <button
            className="rp-photo-upload-btn"
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
            disabled={uploading}
          >
            <Icon name="upload" size={13} />
            {uploading ? '…' : 'อัปโหลด'}
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 0 && (
        <div className="rp-thumbs-live">
          {images.map((img, i) => (
            <button
              key={img.id}
              className={'rp-thumb-live' + (i === activeIdx ? ' is-active' : '')}
              onClick={() => setActiveIdx(i)}
            >
              <img src={img.image_url} alt="" />
            </button>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleUpload}
      />

      {/* Toast */}
      {toast && (
        <div className={'rp-toast' + (toast.type === 'err' ? ' is-err' : '')}>
          {toast.msg}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && active && (
        <Lightbox
          images={images}
          index={activeIdx}
          onClose={() => setLightboxOpen(false)}
          onNav={navigate}
          canDelete={canManage}
          projectId={project.id}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
