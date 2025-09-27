import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      <div className="flex items-center justify-center px-6 py-16">
        <div className="max-w-3xl w-full backdrop-blur-md rounded-2xl shadow-xl border p-10 text-center">
          <div
            className="mx-auto mb-6 h-14 w-14 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #1c01fe 0%, #1cdc77 100%)",
            }}
          >
            <span className="text-white font-bold text-xl">CB</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#141e41]">
            Contract Book
          </h1>
          <p className="mt-3 text-[#6b7280]">
            A clean and simple way to manage your contracts with privacy-first
            onboarding.
          </p>
          <div className="mt-8">
            <button
              onClick={() => navigate("/onboarding")}
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-white font-medium shadow-lg transition-transform hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #1c01fe 0%, #1cdc77 100%)",
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
