import { type FormEvent, useState } from "react";
import {
  Activity,
  Baby,
  HeartPulse,
  Menu,
  RefreshCcw,
  Stethoscope,
  Syringe,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

const heroImageUrl = "/home/clinic-hero.jpg";

const specialties = [
  {
    icon: Stethoscope,
    name: "Khám tổng quát",
    description: "Đánh giá sức khỏe ban đầu, tư vấn hướng điều trị và theo dõi định kỳ.",
    action: "Đặt lịch",
  },
  {
    icon: HeartPulse,
    name: "Tim mạch",
    description: "Tư vấn các vấn đề huyết áp, nhịp tim, đau ngực và nguy cơ tim mạch.",
    action: "Xem khung giờ",
  },
  {
    icon: Baby,
    name: "Nhi khoa",
    description: "Khám bệnh thường gặp ở trẻ em, theo dõi phát triển và tư vấn chăm sóc.",
    action: "Chọn bác sĩ",
  },
  {
    icon: Syringe,
    name: "Tiêm chủng",
    description: "Quản lý lịch tiêm, nhắc lịch và theo dõi sau tiêm rõ ràng.",
    action: "Tư vấn lịch tiêm",
  },
  {
    icon: RefreshCcw,
    name: "Tái khám",
    description: "Đặt lịch tái khám theo hồ sơ điều trị và lịch làm việc của bác sĩ.",
    action: "Đặt tái khám",
  },
  {
    icon: Activity,
    name: "Điện tâm đồ",
    description: "Hỗ trợ kiểm tra nhanh hoạt động tim mạch trong các buổi khám cần thiết.",
    action: "Kiểm tra lịch",
  },
];

const doctors = [
  {
    name: "BS. Nguyễn Minh An",
    description: "Chuyên khoa Tim mạch, tư vấn bệnh lý huyết áp và rối loạn nhịp.",
    experience: "12 năm kinh nghiệm",
    schedule: "Lịch gần nhất: Thứ 3",
    action: "Xem lịch khám",
    photoUrl: "/home/doctor-cardiology.jpg",
    photoLabel: "Bác sĩ chuyên khoa tim mạch",
  },
  {
    name: "BS. Trần Hoàng Linh",
    description: "Khám tổng quát, tư vấn sức khỏe định kỳ và sàng lọc bệnh thường gặp.",
    experience: "10 năm kinh nghiệm",
    schedule: "Lịch gần nhất: Hôm nay",
    action: "Chọn bác sĩ",
    photoUrl: "/home/doctor-general.jpg",
    photoLabel: "Bác sĩ khám tổng quát",
  },
  {
    name: "BS. Phạm Thu Hà",
    description: "Nhi khoa, theo dõi phát triển và xử lý các bệnh hô hấp thường gặp ở trẻ.",
    experience: "9 năm kinh nghiệm",
    schedule: "Lịch gần nhất: Thứ 5",
    action: "Xem lịch khám",
    photoUrl: "/home/doctor-pediatrics.jpg",
    photoLabel: "Bác sĩ nhi khoa",
  },
];

const steps = [
  {
    title: "Chọn dịch vụ",
    description: "Người bệnh chọn chuyên khoa, dịch vụ hoặc bác sĩ phù hợp với nhu cầu khám.",
  },
  {
    title: "Chọn khung giờ",
    description: "Hệ thống hiển thị lịch còn trống theo bác sĩ và ngày khám mong muốn.",
  },
  {
    title: "Nhận xác nhận",
    description: "Lịch hẹn được ghi nhận, đội ngũ phòng khám xác nhận và theo dõi trạng thái.",
  },
];

const trustItems = [
  ["15 phút", "Đặt lịch và nhận xác nhận nhanh"],
  ["8 chuyên khoa", "Phù hợp nhu cầu khám phổ biến"],
  ["24/7", "Theo dõi lịch hẹn trực tuyến"],
];

export function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function handleConsultationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.assign("/register");
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8fbfd] text-[#10202f]">
      <header className="sticky top-0 z-30 border-b border-[#d9e3ee]/80 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex min-h-[72px] w-[calc(100%-40px)] max-w-[1160px] items-center justify-between gap-6">
          <a className="inline-flex items-center gap-3 font-extrabold tracking-normal" href="#top" aria-label="CareFlow Clinic">
            <span className="grid size-[42px] place-items-center rounded-lg bg-[linear-gradient(135deg,#0f766e,#2563eb)] text-xl text-white shadow-[0_12px_30px_rgba(15,118,110,0.25)]">
              <Stethoscope aria-hidden="true" size={22} />
            </span>
            <span>CareFlow Clinic</span>
          </a>

          <nav aria-label="Điều hướng chính" className="hidden items-center gap-6 text-[15px] font-semibold text-[#455466] md:flex">
            <a className="hover:text-primary" href="#specialties">
              Chuyên khoa
            </a>
            <a className="hover:text-primary" href="#doctors">
              Bác sĩ
            </a>
            <a className="hover:text-primary" href="#process">
              Quy trình
            </a>
            <a className="hover:text-primary" href="#booking">
              Đặt lịch
            </a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#d9e3ee] bg-white px-4 font-bold text-[#1f3448] transition hover:-translate-y-0.5" to="/login">
              Đăng nhập
            </Link>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 font-bold text-white shadow-[0_14px_28px_rgba(15,118,110,0.24)] transition hover:-translate-y-0.5 hover:bg-primary-hover" to="/register">
              Đặt lịch khám
            </Link>
          </div>

          <button
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
            className="grid size-[42px] place-items-center rounded-lg bg-[#eef5f6] text-[#10202f] md:hidden"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            type="button"
          >
            {isMobileMenuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
          </button>
        </div>

        {isMobileMenuOpen ? (
          <nav aria-label="Điều hướng di động trang chủ" className="border-t border-[#d9e3ee] bg-white md:hidden">
            {[
              ["Chuyên khoa", "#specialties"],
              ["Bác sĩ", "#doctors"],
              ["Quy trình", "#process"],
              ["Đặt lịch", "#booking"],
              ["Đăng nhập", "/login"],
            ].map(([label, href]) => (
              <a className="block border-b border-[#edf2f7] px-5 py-4 font-bold text-[#304559]" href={href} key={href} onClick={closeMobileMenu}>
                {label}
              </a>
            ))}
          </nav>
        ) : null}
      </header>

      <main id="top">
        <section
          aria-label="CareFlow Clinic"
          className="relative grid min-h-[690px] items-center bg-cover bg-center text-white"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(7, 21, 33, 0.76) 0%, rgba(7, 21, 33, 0.58) 42%, rgba(7, 21, 33, 0.18) 100%), url("${heroImageUrl}")`,
          }}
        >
          <div className="absolute inset-x-0 bottom-[-1px] h-[90px] bg-[linear-gradient(180deg,rgba(248,251,253,0),#f8fbfd)]" />
          <div className="relative z-10 mx-auto w-[calc(100%-40px)] max-w-[1160px] py-24 pb-32">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-bold text-white/90 backdrop-blur">
              Phòng khám hiện đại cho lịch khám rõ ràng
            </span>
            <h1 className="mt-7 max-w-[700px] text-5xl font-extrabold leading-none tracking-normal sm:text-6xl lg:text-[78px]">
              CareFlow Clinic
            </h1>
            <p className="mt-5 max-w-[650px] text-lg leading-8 text-white/90 sm:text-xl">
              Đặt lịch khám nhanh, chọn chuyên khoa phù hợp và theo dõi lịch hẹn minh bạch với đội ngũ bác sĩ giàu kinh nghiệm.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-primary px-6 font-bold text-white shadow-[0_14px_28px_rgba(15,118,110,0.24)] transition hover:-translate-y-0.5 hover:bg-primary-hover" href="#booking">
                Đặt lịch khám
              </a>
              <a className="inline-flex min-h-[52px] items-center justify-center rounded-lg border border-[#d9e3ee] bg-white px-6 font-bold text-[#1f3448] transition hover:-translate-y-0.5" href="#doctors">
                Xem bác sĩ tiêu biểu
              </a>
            </div>

            <dl aria-label="Thông tin nổi bật" className="mt-12 grid w-full max-w-[840px] grid-cols-1 gap-3 sm:grid-cols-3">
              {trustItems.map(([value, label]) => (
                <div className="rounded-lg border border-white/20 bg-white/15 p-4 backdrop-blur" key={value}>
                  <dt className="mb-1 text-lg font-bold text-white">{value}</dt>
                  <dd className="text-sm text-white/80">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="py-14 sm:py-[76px]" id="specialties">
          <div className="mx-auto w-[calc(100%-40px)] max-w-[1160px]">
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <h2 className="m-0 max-w-[600px] text-3xl font-extrabold leading-tight tracking-normal sm:text-[38px]">Chuyên khoa nổi bật</h2>
              <p className="m-0 max-w-[480px] leading-7 text-[#637083]">
                Thiết kế để người bệnh tìm đúng nhu cầu khám ngay từ trang chủ, giảm thời gian gọi điện và hỏi lại thông tin cơ bản.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {specialties.map((specialty) => {
                const Icon = specialty.icon;
                return (
                  <article className="grid min-h-[178px] grid-cols-[auto_1fr] gap-3 rounded-lg border border-[#d9e3ee] bg-white p-6 shadow-[0_14px_44px_rgba(16,32,47,0.08)]" key={specialty.name}>
                    <div className="grid size-[46px] place-items-center rounded-lg bg-[#e8f5f3] text-primary">
                      <Icon aria-hidden="true" size={23} />
                    </div>
                    <div>
                      <h3 className="m-0 text-[19px] font-bold tracking-normal">{specialty.name}</h3>
                      <p className="mt-2 leading-6 text-[#637083]">{specialty.description}</p>
                      <a className="mt-4 inline-flex text-sm font-extrabold text-primary hover:text-primary-hover" href="#booking">
                        {specialty.action}
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#edf5f7] py-14 sm:py-[76px]" id="doctors">
          <div className="mx-auto w-[calc(100%-40px)] max-w-[1160px]">
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <h2 className="m-0 max-w-[600px] text-3xl font-extrabold leading-tight tracking-normal sm:text-[38px]">Bác sĩ tiêu biểu</h2>
              <p className="m-0 max-w-[480px] leading-7 text-[#637083]">
                Nhấn mạnh chuyên môn, kinh nghiệm và lịch khám gần nhất để người bệnh tự tin hơn trước khi đặt lịch.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {doctors.map((doctor) => (
                <article className="overflow-hidden rounded-lg border border-[#d9e3ee] bg-white shadow-[0_14px_44px_rgba(16,32,47,0.08)]" key={doctor.name}>
                  <div
                    aria-label={doctor.photoLabel}
                    className="h-[220px] bg-cover bg-center"
                    role="img"
                    style={{ backgroundImage: `url("${doctor.photoUrl}")` }}
                  />
                  <div className="p-5">
                    <h3 className="m-0 text-[19px] font-bold tracking-normal">{doctor.name}</h3>
                    <p className="mt-2 leading-6 text-[#637083]">{doctor.description}</p>
                    <div className="my-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#fff5dc] px-3 py-2 text-[13px] font-bold text-[#b7791f]">{doctor.experience}</span>
                      <span className="rounded-full bg-[#eaf0ff] px-3 py-2 text-[13px] font-bold text-[#2563eb]">{doctor.schedule}</span>
                    </div>
                    <a className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#d9e3ee] bg-white px-4 font-bold text-[#1f3448] transition hover:-translate-y-0.5" href="#booking">
                      {doctor.action}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-[76px]" id="process">
          <div className="mx-auto w-[calc(100%-40px)] max-w-[1160px]">
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <h2 className="m-0 max-w-[600px] text-3xl font-extrabold leading-tight tracking-normal sm:text-[38px]">Quy trình đặt lịch</h2>
              <p className="m-0 max-w-[480px] leading-7 text-[#637083]">
                Một luồng ngắn, dễ hiểu cho người dùng mới truy cập từ tìm kiếm hoặc mạng xã hội.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <article className="rounded-lg border border-[#d9e3ee] bg-white p-6 shadow-[0_14px_44px_rgba(16,32,47,0.08)]" key={step.title}>
                  <div className="mb-5 grid size-[42px] place-items-center rounded-full bg-[#10202f] font-extrabold text-white">{index + 1}</div>
                  <h3 className="m-0 text-[19px] font-bold tracking-normal">{step.title}</h3>
                  <p className="mt-2 leading-6 text-[#637083]">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[linear-gradient(90deg,#10202f_0%,#15364b_100%)] py-14 text-white sm:py-[76px]" id="booking">
          <div className="mx-auto grid w-[calc(100%-40px)] max-w-[1160px] items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="m-0 text-3xl font-extrabold leading-tight tracking-normal sm:text-[40px]">Sẵn sàng đặt lịch khám?</h2>
              <p className="mt-5 text-lg leading-8 text-white/80">
                Chọn thông tin tư vấn nhanh, sau đó CareFlow sẽ đưa người dùng tới luồng tạo tài khoản, đăng nhập và đặt lịch hiện có.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 font-bold text-white shadow-[0_14px_28px_rgba(15,118,110,0.24)] transition hover:-translate-y-0.5 hover:bg-primary-hover" to="/register">
                  Tạo tài khoản
                </Link>
                <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#d9e3ee] bg-white px-5 font-bold text-[#1f3448] transition hover:-translate-y-0.5" to="/login">
                  Đăng nhập
                </Link>
              </div>
            </div>

            <form className="rounded-lg border border-[#d9e3ee] bg-white p-6 text-[#10202f] shadow-[0_14px_44px_rgba(16,32,47,0.08)]" onSubmit={handleConsultationSubmit}>
              <label className="mb-4 grid gap-2 text-sm font-bold text-[#304559]">
                Họ và tên
                <input className="min-h-11 rounded-lg border border-[#d9e3ee] px-3 font-normal text-[#10202f] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" name="name" placeholder="Nguyễn Văn A" />
              </label>
              <label className="mb-4 grid gap-2 text-sm font-bold text-[#304559]">
                Chuyên khoa
                <select className="min-h-11 rounded-lg border border-[#d9e3ee] px-3 font-normal text-[#10202f] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" name="specialty">
                  <option>Khám tổng quát</option>
                  <option>Tim mạch</option>
                  <option>Nhi khoa</option>
                  <option>Tiêm chủng</option>
                </select>
              </label>
              <label className="mb-4 grid gap-2 text-sm font-bold text-[#304559]">
                Số điện thoại
                <input className="min-h-11 rounded-lg border border-[#d9e3ee] px-3 font-normal text-[#10202f] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" name="phone" placeholder="09xx xxx xxx" />
              </label>
              <button className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-5 font-bold text-white shadow-[0_14px_28px_rgba(15,118,110,0.24)] transition hover:-translate-y-0.5 hover:bg-primary-hover" type="submit">
                Gửi yêu cầu tư vấn
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-[#071521] py-9 text-white/80">
        <div className="mx-auto flex w-[calc(100%-40px)] max-w-[1160px] flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <strong className="text-white">CareFlow Clinic</strong>
          <span>Nền tảng đặt lịch và vận hành phòng khám cho người dùng Việt Nam.</span>
        </div>
      </footer>
    </div>
  );
}
