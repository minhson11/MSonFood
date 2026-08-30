import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* ================= 1. HERO SECTION ================= */}
      <section className="relative h-[400px] md:h-[460px] flex items-center justify-center text-center overflow-hidden">
        {/* Background Image with Dark Vignette Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1920&auto=format&fit=crop')`,
          }}
        >
          {/* Dark gradient overlay matching the photo */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[0.5px]"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container-custom px-4 max-w-3xl mx-auto flex flex-col items-center">
          {/* Orange Badge */}
          <span className="inline-block bg-[#ea580c] text-white text-[11px] md:text-xs font-bold uppercase tracking-wider px-5 py-1.5 rounded-full mb-4 shadow-sm">
            KHÁM PHÁ HÀNH TRÌNH
          </span>

          {/* Heading */}
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-sm">
            Về MSon Food
          </h1>

          {/* Subtitle */}
          <p className="text-gray-200 text-xs md:text-sm leading-relaxed max-w-xl font-normal opacity-95">
            Chúng tôi không chỉ giao đồ ăn, chúng tôi mang đến những trải nghiệm ẩm thực đáng nhớ, kết nối hương vị tinh hoa với từng khoảnh khắc của bạn.
          </p>
        </div>
      </section>

      {/* ================= 2. OUR STORY SECTION ================= */}
      <section className="py-14 md:py-20">
        <div className="container-custom max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Image with floating badge */}
            <div className="lg:col-span-6 relative">
              <div className="rounded-3xl overflow-hidden shadow-xl bg-gray-100 aspect-[4/3] relative">
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop"
                  alt="Đầu bếp MSon Food chế biến món ăn"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating Badge on bottom-right */}
              <div className="absolute -bottom-4 right-4 sm:right-6 bg-[#edf4fb] border border-blue-100/80 rounded-2xl px-5 py-3 shadow-md">
                <div className="text-[#ea580c] font-black text-base leading-tight">2026</div>
                <div className="text-gray-800 font-bold text-[10px] tracking-wider uppercase">
                  KHỞI ĐẦU ĐAM MÊ
                </div>
              </div>
            </div>

            {/* Right Column: Story & Timeline */}
            <div className="lg:col-span-6 space-y-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                Câu chuyện của chúng tôi
              </h2>

              <p className="text-gray-600 text-xs md:text-sm leading-relaxed text-justify">
                Bắt nguồn từ niềm đam mê ẩm thực mãnh liệt và mong muốn chia sẻ những hương vị tuyệt hảo, MSon Food được ra đời với sứ mệnh định hình lại trải nghiệm thưởng thức đồ ăn chất lượng cao tại nhà. Chúng tôi tin rằng mỗi bữa ăn là một tác phẩm nghệ thuật cần được trân trọng.
              </p>

              {/* Timeline */}
              <div className="pt-2 space-y-0 relative">
                {/* Timeline Item 1 */}
                <div className="relative pl-7 pb-6 border-l-2 border-dashed border-gray-200">
                  <div className="absolute -left-[9px] top-0.5 w-4 h-4 bg-[#ea580c] rounded-full border-2 border-white shadow-xs"></div>
                  <h3 className="font-bold text-gray-900 text-sm">Ý tưởng ban đầu</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tháng 1, 2026 - Phác thảo mô hình giao đồ ăn cao cấp
                  </p>
                </div>

                {/* Timeline Item 2 */}
                <div className="relative pl-7 pb-6 border-l-2 border-dashed border-gray-200">
                  <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 border-orange-300 bg-white flex items-center justify-center shadow-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">Hoàn thiện menu</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tháng 6, 2026 - Hợp tác cùng các đầu bếp tài năng
                  </p>
                </div>

                {/* Timeline Item 3 */}
                <div className="relative pl-7">
                  <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center shadow-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">Ra mắt chính thức</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Dự kiến cuối năm 2026
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. QUOTE / MISSION BANNER ================= */}
      <section className="bg-[#a83210] py-14 md:py-18 text-center text-white px-4 relative overflow-hidden">
        <div className="container-custom max-w-4xl mx-auto relative z-10">
          {/* Crossed Fork & Spoon / Knife Icon */}
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center text-white/90">
            <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2v6a3 3 0 0 1-3 3h-1" />
              <path d="M14 2v4a2 2 0 0 1-2 2H8" />
              <path d="M8 2v18" />
              <path d="M18 20v-7" />
              <path d="m2 2 20 20" />
            </svg>
          </div>

          {/* Quote */}
          <blockquote className="text-2xl md:text-3.5xl font-extrabold text-white leading-snug tracking-tight px-4">
            &ldquo;Mang đến trải nghiệm ẩm thực đỉnh cao, kết nối mọi người qua những hương vị tinh tế nhất.&rdquo;
          </blockquote>

          {/* Slogan */}
          <p className="mt-5 text-orange-100 text-xs md:text-xs font-semibold tracking-widest uppercase">
            - SỨ MỆNH CỦA MSON FOOD -
          </p>
        </div>
      </section>

      {/* ================= 4. CORE VALUES SECTION ================= */}
      <section className="py-14 md:py-20 bg-white">
        <div className="container-custom max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
              Giá trị cốt lõi
            </h2>
            <p className="text-gray-500 text-xs md:text-sm">
              Những nguyên tắc định hướng mọi hoạt động và dịch vụ của chúng tôi.
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Chất lượng */}
            <div className="bg-[#edf4fb] border border-blue-100/70 rounded-2xl p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-start">
              <div className="w-10 h-10 rounded-xl bg-red-50/80 text-[#a83210] flex items-center justify-center mb-3.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="5" strokeLinecap="round" strokeLinejoin="round" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 13l-2 8 5-3 5 3-2-8" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-1.5">Chất lượng</h3>
              <p className="text-gray-600 text-xs leading-relaxed">
                Nguyên liệu tươi ngon nhất, chế biến chuẩn vị, giữ trọn vẹn dinh dưỡng.
              </p>
            </div>

            {/* Card 2: Nhanh chóng */}
            <div className="bg-[#edf4fb] border border-blue-100/70 rounded-2xl p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-start">
              <div className="w-10 h-10 rounded-xl bg-red-50/80 text-[#a83210] flex items-center justify-center mb-3.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-1.5">Nhanh chóng</h3>
              <p className="text-gray-600 text-xs leading-relaxed">
                Giao hàng tốc độ, đảm bảo món ăn luôn nóng hổi khi đến tay bạn.
              </p>
            </div>

            {/* Card 3: Minh bạch */}
            <div className="bg-[#edf4fb] border border-blue-100/70 rounded-2xl p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-start">
              <div className="w-10 h-10 rounded-xl bg-red-50/80 text-[#a83210] flex items-center justify-center mb-3.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-1.5">Minh bạch</h3>
              <p className="text-gray-600 text-xs leading-relaxed">
                Rõ ràng về nguồn gốc nguyên liệu và quy trình chuẩn bị khép kín.
              </p>
            </div>

            {/* Card 4: Tận tâm */}
            <div className="bg-[#edf4fb] border border-blue-100/70 rounded-2xl p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-start">
              <div className="w-10 h-10 rounded-xl bg-red-50/80 text-[#a83210] flex items-center justify-center mb-3.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-1.5">Tận tâm</h3>
              <p className="text-gray-600 text-xs leading-relaxed">
                Khách hàng là trung tâm trong mọi quyết định và cải tiến dịch vụ.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 5. HOW IT WORKS (4 STEPS) ================= */}
      <section className="py-12 md:py-18">
        <div className="container-custom max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Đặt món thật đơn giản
            </h2>
          </div>

          {/* 4 Steps Row with Connecting Line */}
          <div className="relative">
            {/* Connecting horizontal line (visible on lg screens) */}
            <div className="hidden lg:block absolute top-7 left-14 right-14 h-[1.5px] bg-red-100/80 -z-0"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center relative z-10">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-white border border-gray-100 text-[#a83210] flex items-center justify-center mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="text-[10px] font-bold text-[#ea580c] tracking-wider uppercase mb-1">
                  BƯỚC 1
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-1">Chọn món</h3>
                <p className="text-[11px] text-gray-500">Khám phá thực đơn đa dạng</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-white border border-gray-100 text-[#a83210] flex items-center justify-center mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="text-[10px] font-bold text-[#ea580c] tracking-wider uppercase mb-1">
                  BƯỚC 2
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-1">Đặt hàng</h3>
                <p className="text-[11px] text-gray-500">Tùy chỉnh và thanh toán</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-white border border-gray-100 text-[#a83210] flex items-center justify-center mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <div className="text-[10px] font-bold text-[#ea580c] tracking-wider uppercase mb-1">
                  BƯỚC 3
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-1">Giao hàng</h3>
                <p className="text-[11px] text-gray-500">Theo dõi đơn hỏa tốc</p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-white border border-gray-100 text-[#a83210] flex items-center justify-center mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth={2.5} strokeLinecap="round" />
                    <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth={2.5} strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-[10px] font-bold text-[#ea580c] tracking-wider uppercase mb-1">
                  BƯỚC 4
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-1">Thưởng thức</h3>
                <p className="text-[11px] text-gray-500">Trải nghiệm hương vị tuyệt hảo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 6. STATISTICS BLOCKS ================= */}
      <section className="py-6 pb-16">
        <div className="container-custom max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1 */}
            <div className="bg-[#edf4fb] border border-blue-100/70 rounded-2xl py-6 px-4 text-center">
              <div className="text-2xl md:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                10000+
              </div>
              <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                ĐƠN HÀNG
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-[#edf4fb] border border-blue-100/70 rounded-2xl py-6 px-4 text-center">
              <div className="text-2xl md:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                5000+
              </div>
              <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                KHÁCH HÀNG
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-[#edf4fb] border border-blue-100/70 rounded-2xl py-6 px-4 text-center">
              <div className="text-2xl md:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                150
              </div>
              <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                MÓN ĂN
              </div>
            </div>

            {/* Stat 4 */}
            <div className="bg-[#edf4fb] border border-blue-100/70 rounded-2xl py-6 px-4 text-center">
              <div className="text-2xl md:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                4.9
              </div>
              <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                ĐÁNH GIÁ SAO
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 7. CALL TO ACTION SECTION ================= */}
      <section className="relative py-16 md:py-20 px-4 text-center overflow-hidden">
        {/* Background with spices & herbs and translucent overlay matching image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1920&auto=format&fit=crop')`,
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/80 to-white/90"></div>

        <div className="container-custom max-w-2xl mx-auto relative z-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-2.5">
            Sẵn sàng trải nghiệm hương vị mới?
          </h2>
          <p className="text-gray-600 text-xs md:text-sm max-w-lg mx-auto leading-relaxed mb-6">
            Khám phá thực đơn đặc sắc của chúng tôi và đặt món ngay hôm nay để nhận những ưu đãi hấp dẫn.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-3">
            <Link
              to="/menu"
              className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 font-bold px-6 py-2 rounded-full text-xs md:text-sm transition shadow-xs"
            >
              Xem thực đơn
            </Link>

            <Link
              to="/menu"
              className="bg-[#a83210] hover:bg-[#8e2a0d] text-white font-bold px-6 py-2 rounded-full text-xs md:text-sm transition shadow-sm hover:shadow-md"
            >
              Đặt món ngay
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

