import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 text-gray-600 mt-12 sm:mt-16">
      <div className="container-custom py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Cột 1: Logo & Slogan */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/logo-icon.png" 
                alt="MSon Food" 
                className="h-7 w-auto object-contain" 
              />
              <span className="font-extrabold text-lg text-gray-900 tracking-tight">
                <span className="text-[#ea580c]">MSon</span> Food
              </span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs font-normal">
              Mang hương vị tuyệt vời nhất đến tận cửa nhà bạn với tốc độ nhanh nhất.
            </p>
          </div>

          {/* Cột 2: LIÊN HỆ */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
              LIÊN HỆ
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-600 font-medium">
              <li className="flex items-center gap-2 hover:text-[#ea580c] transition-colors">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:19001234">1900 1234</a>
              </li>
              <li className="flex items-center gap-2 hover:text-[#ea580c] transition-colors">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:contact@msonfood.com">contact@msonfood.com</a>
              </li>
            </ul>
          </div>

          {/* Cột 3: CHÍNH SÁCH */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
              CHÍNH SÁCH
            </h4>
            <ul className="space-y-2 text-xs text-gray-600 font-medium">
              <li>
                <Link to="/about" className="hover:text-[#ea580c] transition-colors">
                  Điều khoản dịch vụ
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#ea580c] transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#ea580c] transition-colors">
                  Quy định giao hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: KẾT NỐI */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
              KẾT NỐI
            </h4>
            <div className="flex items-center gap-2.5">
              <a
                href="#share"
                aria-label="Share"
                className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 hover:border-[#ea580c] hover:text-[#ea580c] text-gray-600 flex items-center justify-center text-xs transition shadow-2xs cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/mih.son205?locale=vi_VN"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 hover:border-[#1877f2] hover:text-[#1877f2] hover:bg-[#1877f2]/5 text-gray-600 flex items-center justify-center text-xs transition shadow-2xs cursor-pointer"
                title="Facebook"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Dòng bản quyền dưới cùng */}
        <div className="border-t border-gray-100 mt-8 pt-6 text-center text-[11px] text-gray-400">
          <p>© 2026 MSon Food. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
