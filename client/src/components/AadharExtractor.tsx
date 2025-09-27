import {
  LogInWithAnonAadhaar,
  useAnonAadhaar,
  useProver,
} from "@anon-aadhaar/react";
import { useEffect } from "react";
import { useAnonAadhaarStore } from "../store/useAnonAadhaarStore";

function AadhaarExtractor() {
  const [anonAadhaar] = useAnonAadhaar();
  const [, latestProof] = useProver();
  const setStatus = useAnonAadhaarStore((s) => s.setStatus);
  const setLatestProof = useAnonAadhaarStore((s) => s.setLatestProof);

  useEffect(() => {
    if (anonAadhaar?.status) {
      setStatus(anonAadhaar.status);
    }
  }, [anonAadhaar?.status, setStatus]);

  useEffect(() => {
    if (latestProof) {
      setLatestProof(latestProof);
    }
  }, [latestProof, setLatestProof]);
  return (
    <div className="rounded-2xl border border-[#e5e7eb] p-4 bg-white">
      <div>
        <LogInWithAnonAadhaar
          nullifierSeed={1234567890}
          fieldsToReveal={[
            "revealAgeAbove18",
            "revealGender",
            "revealPinCode",
            "revealState",
          ]}
        />
      </div>
      <div className="mt-4">
        <div className="text-sm text-[#6b7280]">Verification Status</div>
        <div
          className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${anonAadhaar.status === "logged-in" ? "bg-green-50 text-green-700" : anonAadhaar.status === "logging-in" ? "bg-yellow-50 text-yellow-700" : "bg-gray-100 text-gray-600"}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${anonAadhaar.status === "logged-in" ? "bg-[#1cdc77]" : anonAadhaar.status === "logging-in" ? "bg-yellow-500" : "bg-gray-400"}`}
          />
          <span>
            {anonAadhaar.status === "logged-out" && "Not verified"}
            {anonAadhaar.status === "logging-in" && "Verifying..."}
            {anonAadhaar.status === "logged-in" && "Verified ✅"}
          </span>
        </div>
      </div>
      {latestProof && (
        <div className="mt-4">
          <div className="text-sm font-medium text-[#141e41]">
            PublicKeyHash
          </div>
          <pre className="mt-2 rounded-lg bg-[#f9fafb] p-3 text-xs text-[#141e41] overflow-auto">
            {JSON.stringify(latestProof?.proof.pubkeyHash || {}, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default AadhaarExtractor;
