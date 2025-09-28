export const ShowSuccess = () => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
      <div className="flex items-center">
        <svg
          className="w-5 h-5 text-green-600 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-green-600 text-sm font-medium">
          Contract signed successfully! NFT minted and added to your profile.
        </p>
      </div>
    </div>
  );
};
