import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl font-extrabold text-indigo-600 mb-4">404</div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#141e41] mb-2">Page Not Found</h1>
        <p className="text-[#9695a7] mb-6">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-block px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
        >
          Go to Dashboard
        </button>
        <div className="mt-4">
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:underline text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;