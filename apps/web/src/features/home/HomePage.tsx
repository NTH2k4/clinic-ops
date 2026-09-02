import {
  Activity,
  Baby,
  CalendarCheck,
  ChevronRight,
  HeartPulse,
  LogIn,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  UserRoundCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

const specialties = [
  {
    icon: Stethoscope,
    name: "Tổng quát",
    description: "Khám ban đầu, tư vấn sức khỏe và theo dõi triệu chứng thường gặp.",
    tone: "bg-teal-50 text-primary",
  },
  {
    icon: HeartPulse,
    name: "Tim mạch",
    description: "Tầm soát huyết áp, nhịp tim và các dấu hiệu cần theo dõi sớm.",
    tone: "bg-red-50 text-danger",
  },
  {
    icon: Baby,
    name: "Nhi khoa",
    description: "Chăm sóc trẻ nhỏ, theo dõi phát triển và tư vấn cho gia đình.",
    tone: "bg-blue-50 text-accent",
  },
  {
    icon: Syringe,
    name: "Tiêm chủng",
    description: "Tư vấn lịch tiêm, nhắc lịch và chuẩn bị hồ sơ trước khi đến khám.",
    tone: "bg-emerald-50 text-success",
  },
  {
    icon: CalendarCheck,
    name: "Tái khám",
    description: "Theo dõi điều trị, kiểm tra kết quả và đặt lịch quay lại đúng hẹn.",
    tone: "bg-amber-50 text-warning",
  },
  {
    icon: Activity,
    name: "Điện tâm đồ",
    description: "Ghi nhận chỉ số tim mạch cơ bản để bác sĩ đánh giá nhanh hơn.",
    tone: "bg-indigo-50 text-info",
  },
];

const doctors = [
  {
    name: "BS. Trần Quang Huy",
    specialty: "Tim mạch",
    experience: "12 năm kinh nghiệm",
    schedule: "Lịch khám gần nhất: Thứ 2, Thứ 4",
    initials: "TH",
    tone: "bg-blue-50 text-accent",
  },
  {
    name: "BS. Nguyễn Minh Châu",
    specialty: "Nhi khoa",
    experience: "9 năm kinh nghiệm",
    schedule: "Lịch khám gần nhất: Thứ 3, Thứ 6",
    initials: "NC",
    tone: "bg-emerald-50 text-success",
  },
  {
    name: "ThS.BS. Lê Hoàng An",
    specialty: "Khám tổng quát",
    experience: "15 năm kinh nghiệm",
    schedule: "Lịch khám gần nhất: Thứ 5, Thứ 7",
    initials: "LA",
    tone: "bg-amber-50 text-warning",
  },
];

const steps = [
  {
    title: "Chọn dịch vụ",
    description: "Tìm chuyên khoa phù hợp và chọn bác sĩ hoặc khung giờ còn trống.",
  },
  {
    title: "Gửi yêu cầu",
    description: "Điền thông tin cần thiết, hệ thống ghi nhận trạng thái chờ xác nhận.",
  },
  {
    title: "Nhận lịch khám",
    description: "Theo dõi lịch hẹn, thông báo và chuẩn bị đến phòng khám đúng giờ.",
  },
];

export function HomePage() {
  return (
    <main className="min-h-screen bg-bg text-text">
      <section
        className="relative flex min-h-[82vh] flex-col overflow-hidden bg-slate-950 text-white"
        id="top"
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#07111f_0%,#07111f_55%,rgba(7,17,31,0.68)_70%,rgba(7,17,31,0.12)_100%)]" />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden bg-[#eaf5f2] lg:block">
          <div className="absolute inset-x-0 top-0 h-24 bg-white/80" />
          <div className="absolute left-16 top-24 h-64 w-48 rounded-md border border-slate-200 bg-white shadow-panel">
            <div className="mx-auto mt-8 h-14 w-14 rounded-md bg-primary/12 text-primary">
              <HeartPulse className="m-auto pt-3" size={34} />
            </div>
            <div className="mx-8 mt-8 h-3 rounded-full bg-slate-200" />
            <div className="mx-8 mt-3 h-3 w-24 rounded-full bg-slate-200" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-[#d6ebe4]" />
          <div className="absolute bottom-24 right-20 h-64 w-[28rem] rounded-t-lg bg-white shadow-2xl">
            <div className="mx-8 mt-8 h-4 w-40 rounded-full bg-slate-200" />
            <div className="mx-8 mt-4 grid grid-cols-3 gap-3">
              <div className="h-24 rounded-md bg-primary/12" />
              <div className="h-24 rounded-md bg-accent/12" />
              <div className="h-24 rounded-md bg-success/12" />
            </div>
          </div>
          <div className="absolute bottom-36 right-[26rem] h-52 w-24 rounded-t-full bg-[#1f3a5f] shadow-xl">
            <div className="absolute -top-14 left-4 size-16 rounded-full bg-[#f1c6a8]" />
            <div className="absolute left-6 top-28 h-24 w-4 rotate-12 rounded-full bg-[#f1c6a8]" />
          </div>
          <div className="absolute bottom-36 right-40 h-44 w-24 rounded-t-full bg-primary shadow-xl">
            <div className="absolute -top-14 left-4 size-16 rounded-full bg-[#e7b894]" />
            <div className="absolute left-8 top-20 h-28 w-4 -rotate-45 rounded-full bg-[#e7b894]" />
          </div>
          <div className="absolute right-28 top-36 h-36 w-56 rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-primary/12 text-primary">
                <CalendarCheck size={20} />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-28 rounded-full bg-slate-200" />
                <div className="h-3 w-20 rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="mt-5 h-3 rounded-full bg-success/35" />
            <div className="mt-3 h-3 w-32 rounded-full bg-slate-200" />
          </div>
        </div>
        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <a className="inline-flex items-center gap-3 text-white" href="#top" aria-label="CareFlow Clinic">
            <span className="flex size-10 items-center justify-center rounded-md bg-white/15 ring-1 ring-white/25">
              <Stethoscope aria-hidden="true" size={21} />
            </span>
            <span className="text-base font-semibold">CareFlow</span>
          </a>
          <nav aria-label="Điều hướng trang chủ" className="hidden items-center gap-5 rounded-md bg-slate-950/45 px-4 py-2 text-sm font-medium text-white/90 ring-1 ring-white/10 md:flex">
            <a className="hover:text-white" href="#specialties">
              Chuyên khoa
            </a>
            <a className="hover:text-white" href="#doctors">
              Bác sĩ
            </a>
            <a className="hover:text-white" href="#booking-flow">
              Quy trình
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/35 bg-slate-950/55 px-3 text-sm font-semibold text-white transition-colors hover:bg-slate-950/70"
              to="/login"
            >
              <LogIn aria-hidden="true" size={17} />
              Đăng nhập
            </Link>
            <Link
              className="hidden h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-text shadow-panel transition-colors hover:bg-slate-100 sm:inline-flex"
              to="/register"
            >
              Đặt lịch
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 pb-14 pt-10 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20">
              <ShieldCheck aria-hidden="true" size={16} />
              Đặt lịch rõ ràng, theo dõi trạng thái minh bạch
            </p>
            <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              CareFlow Clinic
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
              Trang đặt lịch khám online dành cho người dùng Việt Nam, giúp chọn chuyên khoa, xem bác sĩ tiêu biểu và theo dõi lịch hẹn trước khi đến phòng khám.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-white shadow-panel transition-colors hover:bg-primary-hover"
                to="/register"
              >
                Đặt lịch khám
                <ChevronRight aria-hidden="true" size={18} />
              </Link>
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/35 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                href="#doctors"
              >
                Xem bác sĩ
              </a>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["6+", "chuyên khoa nổi bật"],
                ["3 bước", "để gửi yêu cầu khám"],
                ["24/7", "theo dõi lịch hẹn online"],
              ].map(([value, label]) => (
                <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur" key={label}>
                  <dt className="text-sm text-white/72">{label}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-surface py-14 sm:py-16" id="specialties">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">Dịch vụ phòng khám</p>
            <h2 className="mt-2 text-2xl font-semibold text-text sm:text-3xl">Chuyên khoa nổi bật</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Các chuyên khoa được chọn cho nhu cầu đặt lịch phổ biến, trình bày ngắn gọn để người dùng tìm nhanh đúng hướng khám.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {specialties.map((specialty) => {
              const Icon = specialty.icon;
              return (
                <article className="rounded-lg border border-border bg-white p-5 shadow-panel" key={specialty.name}>
                  <div className={`flex size-11 items-center justify-center rounded-md ${specialty.tone}`}>
                    <Icon aria-hidden="true" size={21} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-text">{specialty.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{specialty.description}</p>
                  <Link className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover" to="/register">
                    Đặt lịch chuyên khoa
                    <ChevronRight aria-hidden="true" size={16} />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-bg py-14 sm:py-16" id="doctors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-accent">Đội ngũ y tế</p>
              <h2 className="mt-2 text-2xl font-semibold text-text sm:text-3xl">Bác sĩ tiêu biểu</h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">
                Hồ sơ ngắn giúp người dùng có thêm niềm tin trước khi chọn chuyên khoa và gửi yêu cầu đặt lịch.
              </p>
            </div>
            <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-primary shadow-panel hover:border-primary hover:bg-teal-50" to="/register">
              Chọn lịch khám
              <ChevronRight aria-hidden="true" size={17} />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <article className="rounded-lg border border-border bg-surface p-5 shadow-panel" key={doctor.name}>
                <div className="flex items-start gap-4">
                  <div className={`flex size-14 shrink-0 items-center justify-center rounded-lg text-base font-semibold ${doctor.tone}`}>
                    {doctor.initials}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text">{doctor.name}</h3>
                    <p className="mt-1 text-sm font-medium text-primary">{doctor.specialty}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 text-sm text-text-muted">
                  <p className="inline-flex items-center gap-2">
                    <UserRoundCheck aria-hidden="true" className="text-success" size={17} />
                    {doctor.experience}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <CalendarCheck aria-hidden="true" className="text-accent" size={17} />
                    {doctor.schedule}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-14 sm:py-16" id="booking-flow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-success">Quy trình</p>
            <h2 className="mt-2 text-2xl font-semibold text-text sm:text-3xl">Đặt lịch trong 3 bước</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <article className="rounded-lg border border-border bg-white p-5 shadow-panel" key={step.title}>
                <div className="flex size-10 items-center justify-center rounded-md bg-surface-muted text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-muted">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-text px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-white/72">
              <Sparkles aria-hidden="true" size={16} />
              Sẵn sàng cho lần khám tiếp theo
            </p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Bắt đầu với CareFlow Clinic</h2>
            <p className="mt-3 text-sm leading-6 text-white/72">Tạo tài khoản để gửi yêu cầu đặt lịch và theo dõi trạng thái khám ngay trên web.</p>
          </div>
          <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-text shadow-panel hover:bg-slate-100" to="/register">
            Bắt đầu đặt lịch
            <ChevronRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
