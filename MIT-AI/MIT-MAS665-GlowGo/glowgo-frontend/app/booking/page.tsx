"use client";

import { useState } from "react";
import ChatInterface from "../components/booking/ChatInterface";
import SearchResults from "../components/booking/SearchResults";
import RankingCards from "../components/booking/RankingCards";
import { ExtractedPreferences, MerchantOption, BookingStep } from "@/types/booking";

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState<BookingStep>("chat");
  const [preferences, setPreferences] = useState<ExtractedPreferences>({});
  const [rankedOptions, setRankedOptions] = useState<MerchantOption[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantOption | null>(
    null
  );

  const handleContinueFromChat = (prefs: ExtractedPreferences) => {
    setPreferences(prefs);
    setCurrentStep("searching");
  };

  const handleSearchComplete = (options: MerchantOption[]) => {
    setRankedOptions(options);
    setCurrentStep("results");
  };

  const handleSelectMerchant = (merchant: MerchantOption) => {
    setSelectedMerchant(merchant);
    // TODO: Navigate to booking confirmation page
    alert(
      `Booking ${merchant.merchant_name} for $${merchant.price}!\n\nThis would navigate to the booking confirmation page.`
    );
  };

  const handleBack = () => {
    if (currentStep === "searching") {
      setCurrentStep("chat");
    } else if (currentStep === "results") {
      setCurrentStep("searching");
    }
  };

  const getStepNumber = (): number => {
    switch (currentStep) {
      case "chat":
        return 1;
      case "searching":
        return 2;
      case "results":
        return 3;
      default:
        return 1;
    }
  };

  const getStepTitle = (): string => {
    switch (currentStep) {
      case "chat":
        return "Tell us what you need";
      case "searching":
        return "Finding your matches";
      case "results":
        return "Choose your provider";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Title */}
            <div className="flex items-center gap-3">
              {currentStep !== "chat" && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-[#F7F7F7] rounded-lg transition-colors duration-200"
                  aria-label="Go back"
                >
                  <svg
                    className="w-6 h-6 text-[#3D3D3D]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-[#3D3D3D]">GlowGo Booking</h1>
                <p className="text-sm text-[#757575]">{getStepTitle()}</p>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-200 ${
                      step === getStepNumber()
                        ? "bg-[#FAD4D8] text-[#3D3D3D]"
                        : step < getStepNumber()
                        ? "bg-[#C4EBD8] text-[#3D3D3D]"
                        : "bg-[#F7F7F7] text-[#757575]"
                    }`}
                  >
                    {step < getStepNumber() ? (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      step
                    )}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-8 h-1 mx-1 ${
                        step < getStepNumber() ? "bg-[#C4EBD8]" : "bg-[#F7F7F7]"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-[#F7F7F7] rounded-full h-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#FAD4D8] to-[#F5C0C6] h-full transition-all duration-500"
                style={{ width: `${(getStepNumber() / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentStep === "chat" && (
          <div className="h-[calc(100vh-120px)]">
            <ChatInterface onContinue={handleContinueFromChat} />
          </div>
        )}

        {currentStep === "searching" && (
          <div className="h-[calc(100vh-120px)] overflow-y-auto">
            <SearchResults
              preferences={preferences}
              onComplete={handleSearchComplete}
            />
          </div>
        )}

        {currentStep === "results" && (
          <div className="h-[calc(100vh-120px)] overflow-y-auto">
            <RankingCards options={rankedOptions} onSelect={handleSelectMerchant} />
          </div>
        )}
      </main>
    </div>
  );
}
