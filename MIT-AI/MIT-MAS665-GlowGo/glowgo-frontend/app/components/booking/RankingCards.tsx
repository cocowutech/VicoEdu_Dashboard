"use client";

import { MerchantOption } from "@/types/booking";

interface RankingCardsProps {
  options: MerchantOption[];
  onSelect: (merchant: MerchantOption) => void;
}

export default function RankingCards({ options, onSelect }: RankingCardsProps) {
  if (!options || options.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
        <div className="text-center max-w-md">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-[#757575]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-[#3D3D3D] mb-2">
            No Matches Found
          </h3>
          <p className="text-[#757575]">
            We couldn't find any providers matching your criteria. Try adjusting your
            preferences.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-[#3D3D3D] mb-2">
            Your Perfect Matches
          </h2>
          <p className="text-[#757575]">
            We found {options.length} excellent {options.length === 1 ? "option" : "options"}{" "}
            for you
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {options.map((merchant) => (
            <MerchantCard
              key={merchant.merchant_id || merchant.rank}
              merchant={merchant}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface MerchantCardProps {
  merchant: MerchantOption;
  onSelect: (merchant: MerchantOption) => void;
}

function MerchantCard({ merchant, onSelect }: MerchantCardProps) {
  const relevancePercentage = Math.round(merchant.relevance_score * 100);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] overflow-hidden">
      {/* Card Content */}
      <div className="p-6">
        {/* Rank Badge */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-full bg-[#FAD4D8] flex items-center justify-center"
            aria-label={`Rank ${merchant.rank}`}
          >
            <span className="text-lg font-bold text-[#3D3D3D]">{merchant.rank}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <svg
              className="w-5 h-5 text-yellow-400 fill-current"
              viewBox="0 0 20 20"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <span className="text-sm font-semibold text-[#3D3D3D]">
              {merchant.rating.toFixed(1)}
            </span>
            <span className="text-xs text-[#757575]">({merchant.reviews})</span>
          </div>
        </div>

        {/* Merchant Name */}
        <h3 className="text-xl font-bold text-[#3D3D3D] mb-1">
          {merchant.merchant_name}
        </h3>

        {/* Service Type */}
        {merchant.service_name && (
          <p className="text-sm text-[#757575] mb-3">{merchant.service_name}</p>
        )}

        {/* Distance */}
        {merchant.distance !== undefined && merchant.distance !== null && (
          <div className="flex items-center gap-2 text-sm text-[#757575] mb-3">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{merchant.distance.toFixed(1)} miles away</span>
          </div>
        )}

        {/* Price */}
        <div className="mb-4">
          <span className="text-3xl font-bold" style={{ color: "#FAD4D8" }}>
            ${merchant.price.toFixed(0)}
          </span>
        </div>

        {/* Available Times */}
        {merchant.available_times && merchant.available_times.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-[#757575] mb-2">Available times:</p>
            <div className="flex flex-wrap gap-2">
              {merchant.available_times.slice(0, 3).map((time, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-[#F7F7F7] text-[#3D3D3D] text-xs rounded-full"
                >
                  {time}
                </span>
              ))}
              {merchant.available_times.length > 3 && (
                <span className="px-3 py-1 bg-[#F7F7F7] text-[#757575] text-xs rounded-full">
                  +{merchant.available_times.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Why Recommended */}
        <p className="text-sm italic text-[#757575] mb-4">
          {merchant.why_recommended}
        </p>

        {/* Relevance Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#757575]">Match Score</span>
            <span className="text-xs font-semibold text-[#3D3D3D]">
              {relevancePercentage}%
            </span>
          </div>
          <div className="w-full bg-[#F7F7F7] rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C4EBD8] to-[#A8E5C5] transition-all duration-500"
              style={{ width: `${relevancePercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Book Now Button */}
        <button
          onClick={() => onSelect(merchant)}
          className="w-full bg-[#FAD4D8] hover:bg-[#F5C0C6] text-[#3D3D3D] font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          aria-label={`Book ${merchant.merchant_name}`}
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
