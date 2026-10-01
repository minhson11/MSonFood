import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function centerAspectCrop(mediaWidth, mediaHeight) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedImageBase64(imageSrc, crop, rotation = 0) {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => { image.onload = resolve; });

  const OUTPUT_SIZE = 400;
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');

  const radians = (rotation * Math.PI) / 180;
  const cropX = (crop.x / 100) * image.naturalWidth;
  const cropY = (crop.y / 100) * image.naturalHeight;
  const cropW = (crop.width / 100) * image.naturalWidth;
  const cropH = (crop.height / 100) * image.naturalHeight;

  ctx.save();
  ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
  ctx.rotate(radians);
  ctx.translate(-OUTPUT_SIZE / 2, -OUTPUT_SIZE / 2);
  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.88);
}

export default function AvatarCropModal({ imageSrc, onSave, onClose, saving = false }) {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const imgRef = useRef(null);

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  useEffect(() => {
    setRotation(0);
    setFlipped(false);
    setCrop(undefined);
    setCompletedCrop(null);
  }, [imageSrc]);

  const handleSave = useCallback(async () => {
    if (!completedCrop || !imageSrc) return;
    try {
      const base64 = await getCroppedImageBase64(imageSrc, completedCrop, rotation);
      onSave(base64);
    } catch (err) {
      console.error('Loi khi cat anh:', err);
    }
  }, [completedCrop, imageSrc, rotation, onSave]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" style={{ animation: 'fadeInUp 0.25s ease' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Chỉnh sửa ảnh đại diện</h3>
              <p className="text-xs text-gray-400">Kéo để cắt • Dùng nút để xoay</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-gray-950 flex items-center justify-center" style={{ minHeight: 320, maxHeight: 380 }}>
          {imageSrc && (
            <div style={{ transform: flipped ? 'scaleX(-1)' : 'none' }}>
              <ReactCrop
                crop={crop}
                onChange={(_, pct) => setCrop(pct)}
                onComplete={(_, pct) => setCompletedCrop(pct)}
                aspect={1}
                circularCrop
                minWidth={30}
                style={{ maxHeight: 360 }}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{ transform: `rotate(${rotation}deg)`, maxHeight: 360, maxWidth: '100%', objectFit: 'contain', transition: 'transform 0.2s ease' }}
                />
              </ReactCrop>
            </div>
          )}
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <button type="button" onClick={() => setRotation(r => r - 90)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            Xoay trái
            </button>
            <button type="button" onClick={() => setRotation(r => r + 90)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
            Xoay phải
            </button>
            <button type="button" onClick={() => setFlipped(f => !f)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            Lật ảnh
            </button>
          </div>

          <p className="text-center text-xs text-gray-400">Kéo vùng chọn để chọn phần ảnh muốn dùng làm avatar</p>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={saving} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
              Hủy
            </button>
            <button type="button" onClick={handleSave} disabled={saving || !completedCrop}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md">
              {saving ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Đang lưu...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Lưu ảnh đại diện</>
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}