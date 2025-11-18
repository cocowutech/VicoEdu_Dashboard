"use client";

import { useState, useEffect } from "react";
import { ExtractedPreferences, MerchantOption } from "@/types/booking";
import { fetchMatchingResults, handleApiError } from "@/services/bookingApi";

interface SearchResultsProps {
  preferences: ExtractedPreferences;
  onComplete: (options: MerchantOption[]) => void;
}

type SearchStep = {
  step: number;
  message: string;
  progress: number;
};

const SEARCH_STEPS: SearchStep[] = [
  { step: 1, message: "Matching merchants...", progress: 33 },
  { step: 2, message: "Checking availability...", progress: 66 },
  { step: 3, message: "Ranking options...", progress: 99 },
];

export default function SearchResults({
  preferences,
  onComplete,
}: SearchResultsProps) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<SearchStep>(SEARCH_STEPS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const animateProgress = async (from: number, to: number) => {
      const duration = 800;
      const steps = 20;
      const increment = (to - from) / steps;

      for (let i = 0; i <= steps; i++) {
        if (isCancelled) return;
        await new Promise((resolve) => setTimeout(resolve, duration / steps));
        setProgress(Math.min(from + increment * i, to));
      }
    };

    const simulateProgress = async () => {
      let lastProgress = 0;
      for (const step of SEARCH_STEPS) {
        if (isCancelled) return;
        setCurrentStep(step);
        await animateProgress(lastProgress, step.progress);
        lastProgress = step.progress;
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    };

    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);
        setProgress(0);

        const [data] = await Promise.all([
          fetchMatchingResults(preferences),
          simulateProgress(),
        ]);

        if (isCancelled) return;

        setProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 300));

        onComplete(data.ranked_options);
        setLoading(false);
      } catch (err) {
        if (isCancelled) return;
        const apiError = handleApiError(err);
        setError(apiError.message);
        setLoading(false);
      }
    };

    fetchMatches();
    return () => {
      isCancelled = true;
    };
  }, [preferences, onComplete]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
        <div className="bg-[#FECACA] text-[#3D3D3D] rounded-lg p-6 max-w-md text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Search Failed</h3>
          <p className="text-sm text-[#757575]">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#FAD4D8] hover:bg-[#F5C0C6] text-[#3D3D3D] font-semibold px-6 py-2 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] px-4"
      aria-busy={loading}
      aria-live="polite"
    >
      <div className="text-center max-w-md">
        {/* Spinner */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-[#F7F7F7] rounded-full"></div>
          <div
            className="absolute inset-0 border-4 border-[#FAD4D8] rounded-full animate-spin"
            style={{
              borderTopColor: "transparent",
              borderRightColor: "transparent",
            }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-[#FAD4D8]">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Main Message */}
        <h2 className="text-2xl font-bold text-[#3D3D3D] mb-3">
          Finding perfect matches...
        </h2>

        {/* Current Step */}
        <div className="space-y-2">
          <p className="text-lg text-[#757575]">
            Step {currentStep.step}/3: {currentStep.message}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-[#F7F7F7] rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#FAD4D8] to-[#F5C0C6] h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Service Info */}
        {preferences.service_type && (
          <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-[#757575] mb-1">Searching for:</p>
            <p className="text-base font-semibold text-[#3D3D3D]">
              {preferences.service_type}
              {preferences.budget_max && ` • Up to $${preferences.budget_max}`}
              {preferences.time_urgency && ` • ${preferences.time_urgency}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
