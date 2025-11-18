"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessage, ExtractedPreferences } from "@/types/booking";
import { postChatMessage, handleApiError, ApiError } from "@/services/bookingApi";

interface ChatInterfaceProps {
  onContinue: (preferences: ExtractedPreferences) => void;
  isLoading?: boolean;
}

export default function ChatInterface({
  onContinue,
  isLoading = false,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content: "Hi! I'm here to help you find the perfect beauty service. What are you looking for today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [readyToContinue, setReadyToContinue] = useState(false);
  const [preferences, setPreferences] = useState<ExtractedPreferences>({});
  const [error, setError] = useState<ApiError | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isWaiting) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: text.trim(),
    };

    // Add user message to chat
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInputValue("");
    setIsWaiting(true);
    setError(null);

    try {
      const data = await postChatMessage(userMessage.content, updatedHistory, preferences);

      const botResponse = [data.response_to_user, data.next_question]
        .filter(Boolean)
        .join("\n");

      const botMessage: ChatMessage = {
        role: "bot",
        content: botResponse,
      };
      setMessages((prev) => [...prev, botMessage]);

      // Update state
      setPreferences(data.extracted_preferences || {});
      setReadyToContinue(Boolean(data.ready_to_match));
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError);
      const errorMessage: ChatMessage = {
        role: "bot",
        content: apiError.message,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsWaiting(false);
    }
  };

  const handleContinue = () => {
    if (readyToContinue && preferences) {
      onContinue(preferences);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F7F7]">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] md:max-w-[60%] rounded-lg px-4 py-3 ${
                message.role === "user"
                  ? "bg-[#FAD4D8] text-[#3D3D3D]"
                  : "bg-white text-[#3D3D3D] shadow-sm"
              }`}
            >
              <p className="text-sm md:text-base">{message.content}</p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isWaiting && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-[#757575] rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-[#757575] rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-[#757575] rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Continue Button (shows when ready) */}
      {readyToContinue && (
        <div className="px-4 pb-4">
          <button
            onClick={handleContinue}
            disabled={isLoading}
            className="w-full bg-[#C4EBD8] hover:bg-[#B0E0C8] text-[#3D3D3D] font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Continue to view options"
          >
            {isLoading ? "Loading..." : "Continue to Options →"}
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-[#7F1D1D]"
          >
            {error.message}
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isWaiting || isLoading}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FAD4D8] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-[#3D3D3D]"
            aria-label="Chat message input"
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isWaiting || isLoading}
            className="bg-[#FAD4D8] hover:bg-[#F5C0C6] text-[#3D3D3D] font-semibold px-6 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
