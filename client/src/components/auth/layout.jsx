import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full bg-[#041b3a] text-blue-50">
      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-[#0a274d] via-[#072040] to-[#041b3a] w-1/2 px-16 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-16 -left-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-12 h-60 w-60 rounded-full bg-indigo-400/20 blur-3xl"
        />
        <div className="relative max-w-md space-y-6 text-center text-blue-100">
          <img
            src="/buksu_bukidnon_state_university_logo.jpg"
            alt="BukSU Logo"
            className="mx-auto -mt-36 h-28 w-28 rounded-full border border-blue-200/40 bg-white/10 shadow-xl shadow-blue-900/60 backdrop-blur-sm"
          />
          <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg text-blue-50">
            Welcome to <span className="text-blue-200">BukSu EEU</span>
          </h1>
          <p className="text-lg text-blue-200">
            Your trusted marketplace for excellence
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center bg-[#041b3a] px-4 py-8 sm:px-6 lg:px-8">
        {/* Mobile Welcome Section */}
        <div className="lg:hidden w-full max-w-md mb-8 space-y-4 text-center">
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-40 w-40 mx-auto rounded-full bg-blue-500/20 blur-3xl"
            />
            <img
              src="/buksu_bukidnon_state_university_logo.jpg"
              alt="BukSU Logo"
              className="relative mx-auto h-20 w-20 rounded-full border border-blue-200/40 bg-white/10 shadow-xl shadow-blue-900/60 backdrop-blur-sm"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-lg text-blue-50">
              Welcome to <span className="text-blue-200">BukSu EEU</span>
            </h1>
            <p className="text-sm sm:text-base text-blue-200">
              Your trusted marketplace for excellence
            </p>
          </div>
        </div>

        <div className="relative w-full max-w-md">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-[28px] bg-blue-900/30 blur-3xl"
          />
          <div className="relative rounded-[28px] border border-blue-900/60 bg-[#0a1f3f]/95 p-8 sm:p-10 shadow-[0_40px_80px_-20px_rgba(5,15,32,0.85)] backdrop-blur">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
