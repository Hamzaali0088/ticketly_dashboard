import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { authAPI } from "../lib/api/auth";
import { getAccessToken, getRefreshToken } from "../lib/api/client";
import { API_BASE_URL } from "../lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Check if already authenticated
  useEffect(() => {
    // Log API configuration for debugging
    if (typeof window !== "undefined") {
      console.log("🔧 Dashboard API Configuration:", {
        apiBaseUrl: API_BASE_URL,
        envVar: process.env.NEXT_PUBLIC_API_BASE_URL,
      });
    }

    const checkAuth = async () => {
      const accessToken = getAccessToken();
      if (accessToken) {
        try {
          const response = await authAPI.getProfile();
          if (response.success && response.user) {
            router.replace("/dashboard");
            return;
          }
        } catch (error) {
          // If access token is expired, try refresh token
          if (error.response?.status === 401) {
            const refreshToken = getRefreshToken();
            if (refreshToken) {
              try {
                const refreshResponse = await authAPI.refreshToken(
                  refreshToken
                );
                if (refreshResponse.success) {
                  const profileResponse = await authAPI.getProfile();
                  if (profileResponse.success && profileResponse.user) {
                    router.replace("/dashboard");
                    return;
                  }
                }
              } catch (refreshError) {
                // Refresh failed - user can stay on login page
                console.log("Token refresh failed");
              }
            }
          }
        }
      }
    };
    checkAuth();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await authAPI.login({ email, password });
      if (response.success && response.tempToken) {
        setTempToken(response.tempToken);
        setOtpSent(true);
        setErrorMessage(""); // Clear any previous errors
      } else {
        setErrorMessage(response.message || "Login failed");
      }
    } catch (error) {
      // Handle network errors
      if (
        error.code === "ERR_NETWORK" ||
        error.message === "Network Error" ||
        error.message?.includes("Cannot connect to backend server")
      ) {
        // Use the full error message which includes helpful instructions
        setErrorMessage(
          error.message ||
            "Cannot connect to server. Please make sure the backend server is running on port 5001."
        );
      } else if (error.response) {
        // Server responded with error
        // Prioritize showing the specific error message over generic "Validation Error"
        const errorMessage =
          error.response.data?.error || error.response.data?.message;
        setErrorMessage(errorMessage || "Login failed. Please try again.");
      } else if (error.request) {
        // Request was made but no response received
        setErrorMessage(
          "No response from server. Please check your connection and try again."
        );
      } else {
        // Something else happened
        setErrorMessage(error.message || "Login failed. Please try again.");
      }
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await authAPI.verifyOtp({ otp, tempToken });
      if (response.success && response.accessToken) {
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        setErrorMessage(response.message || "OTP verification failed");
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">ticketly</h1>
          <p className="text-base text-[#9CA3AF]">
            {otpSent
              ? "Enter the OTP sent to your email"
              : "Login to your account"}
          </p>
        </div>

        {!otpSent ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage("");
                }}
                className={`w-full bg-[#1F1F1F] border rounded-xl py-3.5 px-4 text-white text-base ${
                  errorMessage ? "border-[#EF4444]" : "border-[#374151]"
                } focus:outline-none focus:ring-2 focus:ring-[#9333EA]`}
                placeholder="e.g. admin@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
                className={`w-full bg-[#1F1F1F] border rounded-xl py-3.5 px-4 text-white text-base ${
                  errorMessage ? "border-[#EF4444]" : "border-[#374151]"
                } focus:outline-none focus:ring-2 focus:ring-[#9333EA]`}
                placeholder="Enter your password"
                required
              />
            </div>

            {errorMessage && (
              <p className="text-[#EF4444] text-sm">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#9333EA] py-4 rounded-xl text-white text-base font-semibold hover:bg-[#7C3AED] transition-colors ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Loading..." : "Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setErrorMessage("");
                }}
                className={`w-full bg-[#1F1F1F] border rounded-xl py-3.5 px-4 text-white text-base ${
                  errorMessage ? "border-[#EF4444]" : "border-[#374151]"
                } focus:outline-none focus:ring-2 focus:ring-[#9333EA]`}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
              />
            </div>

            {errorMessage && (
              <p className="text-[#EF4444] text-sm">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#9333EA] py-4 rounded-xl text-white text-base font-semibold hover:bg-[#7C3AED] transition-colors ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setErrorMessage("");
              }}
              className="w-full bg-[#1F1F1F] border border-[#374151] py-4 rounded-xl text-white text-base font-semibold hover:bg-[#2A2A2A] transition-colors"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
