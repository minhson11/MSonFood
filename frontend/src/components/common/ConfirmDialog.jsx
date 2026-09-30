const ConfirmDialog = ({
  isOpen = true,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'danger',
  loading = false
}) => {
  if (isOpen === false) return null;

  const handleClose = () => {
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
  };

  const colors = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          onClick={handleClose}
        ></div>

        {/* Dialog */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors ${colors[type]} cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm`}
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
