const ErrorMessage = ({ message, retry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-start">
          <svg
            className="w-6 h-6 text-red-600 mr-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-red-800 font-medium mb-1">Lỗi</h3>
            <p className="text-red-700 text-sm">{message || 'Đã xảy ra lỗi'}</p>
          </div>
        </div>
        {retry && (
          <button
            onClick={retry}
            className="mt-4 w-full btn-primary"
          >
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
