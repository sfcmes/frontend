// [MES] FormQRCodeReader — QR scanner (camera on mobile) + image upload reader.
// Scan/decode logic (react-qr-reader + jsQR) identical to previous implementation.
// UI rebuilt Thai-first (previous version was English inside a Thai app).
import { useState, useEffect, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
import jsQR from 'jsqr';
import PageContainer from '../../components/container/PageContainer';
import { Icon } from 'src/components/mes/Icon';
import { Modal, useToast, CardHeader } from 'src/components/mes/ui';

const FormQRCodeReader = () => {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadedQrCode, setUploadedQrCode] = useState(null);
  const [uploadedQrCodeData, setUploadedQrCodeData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const fileInputRef = useRef(null);
  const { showToast, toastNode } = useToast();

  useEffect(() => {
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);
  }, []);

  const handleScan = (result) => {
    if (result) {
      const scannedData = result.text;
      setQrCodeData(scannedData);
      setIsScanning(false);
      setModalData(scannedData);
      setShowModal(true);
      showToast('สแกน QR Code สำเร็จ');
    }
  };

  const handleError = (err) => {
    setIsScanning(false);
    showToast(`เกิดข้อผิดพลาด: ${err.message}`, 'error');
  };

  const readQrCodeData = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            resolve(code.data);
          } else {
            reject(new Error('ไม่พบ QR Code ในรูปภาพ'));
          }
        };
        img.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพได้'));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      reader.readAsDataURL(file);
    });

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    setUploadedQrCode(file);
    try {
      const data = await readQrCodeData(file);
      setUploadedQrCodeData(data);
      setModalData(data);
      setShowModal(true);
      showToast('อ่าน QR Code จากรูปสำเร็จ');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const isJsonString = (str) => {
    try {
      JSON.parse(str);
    } catch {
      return false;
    }
    return true;
  };

  const formatData = (data) => {
    if (isJsonString(data)) {
      return JSON.stringify(JSON.parse(data), null, 2);
    }
    return data;
  };

  const isAppLink = modalData && modalData.startsWith(window.location.origin);

  return (
    <PageContainer title="โปรแกรมอ่าน QR Code" description="QR code reader">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mes-card">
          <CardHeader title="โปรแกรมอ่าน QR Code" />
          <div className="flex flex-col gap-4 p-4 md:p-5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                className="mes-btn mes-btn-primary"
                onClick={() => setIsScanning(true)}
                disabled={!isMobile}
                title={!isMobile ? 'ใช้กล้องสแกนได้บนอุปกรณ์พกพาเท่านั้น' : undefined}
              >
                <Icon name="scan" size={16} /> สแกน QR Code
              </button>
              <button className="mes-btn mes-btn-ghost" onClick={() => fileInputRef.current.click()}>
                <Icon name="upload" size={16} /> อัปโหลดรูป QR Code
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUpload} className="hidden" />
            </div>
            {!isMobile && (
              <div className="rounded-sm border border-mes-border bg-mes-surface-2 px-3 py-2 text-xs text-mes-muted">
                การสแกนด้วยกล้องใช้ได้บนโทรศัพท์/แท็บเล็ต — บนเดสก์ท็อปให้ใช้การอัปโหลดรูปแทน
              </div>
            )}

            {isMobile && isScanning && (
              <div className="overflow-hidden rounded-md border border-mes-border">
                <QrReader
                  delay={300}
                  onResult={handleScan}
                  onError={handleError}
                  style={{ width: '100%' }}
                  constraints={{
                    facingMode: 'environment',
                    aspectRatio: 1,
                    width: { min: 360, ideal: 640, max: 1920 },
                    height: { min: 360, ideal: 640, max: 1080 },
                  }}
                />
                <button className="mes-btn mes-btn-ghost m-3 w-[calc(100%-24px)]" onClick={() => setIsScanning(false)}>
                  หยุดสแกน
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-3 rounded-sm border border-mes-border px-3 py-2.5">
                <span className="mt-0.5 text-mes-accent"><Icon name="scan" size={18} /></span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">ข้อมูลจากการสแกน</div>
                  <div className="break-all text-xs text-mes-muted">{qrCodeData || 'ยังไม่มีข้อมูล'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-sm border border-mes-border px-3 py-2.5">
                <span className="mt-0.5 text-mes-accent"><Icon name="upload" size={18} /></span>
                <div className="min-w-0 grow">
                  <div className="text-sm font-semibold">ข้อมูลจากรูปที่อัปโหลด</div>
                  <div className="break-all text-xs text-mes-muted">{uploadedQrCodeData || 'ยังไม่มีข้อมูล'}</div>
                  {uploadedQrCode && (
                    <img
                      src={URL.createObjectURL(uploadedQrCode)}
                      alt="รูป QR Code ที่อัปโหลด"
                      className="mt-2 max-h-48 w-auto max-w-full rounded-sm"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="ข้อมูล QR Code"
        footer={
          <>
            <button
              className="mes-btn mes-btn-ghost"
              onClick={() => {
                setQrCodeData(null);
                setUploadedQrCodeData(null);
                setShowModal(false);
              }}
            >
              ยกเลิก
            </button>
            {isAppLink && (
              <a className="mes-btn mes-btn-primary" href={modalData}>
                เปิดหน้าชิ้นงาน <Icon name="arrow-up-right" size={14} />
              </a>
            )}
            <button className="mes-btn mes-btn-primary" onClick={() => setShowModal(false)}>ตกลง</button>
          </>
        }
      >
        <div className="text-xs font-semibold text-mes-muted">ข้อมูลดิบ</div>
        <p className="mt-1 break-all text-sm">{modalData || 'ไม่มีข้อมูล'}</p>
        <div className="mt-3 text-xs font-semibold text-mes-muted">ข้อมูลที่จัดรูปแบบแล้ว</div>
        <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded-sm bg-mes-surface-2 p-3 font-mono text-xs">
          {modalData ? formatData(modalData) : 'ไม่มีข้อมูล'}
        </pre>
      </Modal>
      {toastNode}
    </PageContainer>
  );
};

export default FormQRCodeReader;
