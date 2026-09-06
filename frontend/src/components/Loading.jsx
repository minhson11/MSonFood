const Loading = ({ size = 'md', fullScreen = false, text, className = '', color = 'default' }) => {
  const sizeClasses = {
    xs: 'w-4 h-4 border-2',
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-[3px]',
    lg: 'w-14 h-14 border-4',
  };

  const colorClasses = {
    default: 'border-orange-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    current: 'border-current border-t-transparent',
  };

  const isSmall = size === 'sm' || size === 'xs';

  const spinner = (
    <div
      className={`${sizeClasses[size] || sizeClasses.md} ${
        colorClasses[color] || colorClasses.default
      } rounded-full animate-spin flex-shrink-0`}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center z-50">
        <div className="text-center">
          {spinner}
          <p className="mt-4 text-sm font-semibold text-gray-600">{text || 'Đang tải...'}</p>
        </div>
      </div>
    );
  }

  // Inline / Small inside buttons (không bị padding làm phồng nút)
  if (isSmall) {
    return (
      <div className={`inline-flex items-center justify-center gap-2 ${className}`}>
        {spinner}
        {text && <span className="text-sm font-medium leading-none">{text}</span>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col justify-center items-center py-8 ${className}`}>
      {spinner}
      {text && <p className="mt-3 text-sm text-gray-500">{text}</p>}
    </div>
  );
};

export default Loading;
