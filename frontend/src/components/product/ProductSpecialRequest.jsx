const ProductSpecialRequest = ({ note = '', onChange }) => {
  const maxLength = 200;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-2xs">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight flex items-center gap-1.5">
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Yêu cầu đặc biệt
        </h3>
        <span
          className={`text-xs font-semibold ${
            note.length >= maxLength ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          {note.length}/{maxLength}
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        Ghi chú lại sở thích khẩu vị để bếp chuẩn bị tốt nhất cho bạn.
      </p>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={note}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ví dụ: Không hành, ít sốt cay, để riêng nước chấm..."
          rows={3}
          className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition resize-none placeholder:text-gray-400 text-gray-800 bg-gray-50/50 focus:bg-white"
        />
      </div>
    </div>
  );
};

export default ProductSpecialRequest;
