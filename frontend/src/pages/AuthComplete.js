import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, CheckCircle, ArrowLeft, Phone, ChevronRight, ChevronLeft, GraduationCap, Briefcase, Palette, Star, Rocket, Laptop, Brain, Search, BookOpen, Loader } from "lucide-react";
import { toast } from "sonner";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const AuthComplete = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [mode, setMode] = useState("login"); // login, signup, verify, forgot, reset
  const [signupStep, setSignupStep] = useState(1); // 1: Basic info, 2: Category, 3: Interests
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Multi-step signup states
  const [userCategory, setUserCategory] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [constants, setConstants] = useState({ categories: [], interests: [] });
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [handleAvailable, setHandleAvailable] = useState(null);
  
  // Verification
  const [verificationCode, setVerificationCode] = useState("");
  const [serverCode, setServerCode] = useState(""); // For testing
  
  // Password reset
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Category icons mapping
  const categoryIcons = {
    student: GraduationCap,
    graduate: BookOpen,
    working_professional: Briefcase,
    creator: Palette,
    influencer: Star,
    entrepreneur: Rocket,
    freelancer: Laptop,
    mentor: Brain,
    recruiter: Search,
    other: User
  };

  // Fetch constants for categories and interests
  useEffect(() => {
    const fetchConstants = async () => {
      try {
        const res = await axios.get(`${API}/student/constants`);
        setConstants(res.data);
      } catch (error) {
        console.error("Failed to fetch constants:", error);
      }
    };
    fetchConstants();
  }, []);

  // Debounced handle availability check
  useEffect(() => {
    if (mode === "signup" && signupStep === 1 && handle.length >= 3) {
      const timer = setTimeout(() => {
        checkHandleAvailability(handle);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setHandleAvailable(null);
    }
  }, [handle, mode, signupStep]);

  const checkHandleAvailability = async (handleToCheck) => {
    setCheckingHandle(true);
    try {
      const res = await axios.get(`${API}/auth/check-handle/${handleToCheck}`);
      setHandleAvailable(res.data.available);
    } catch (error) {
      console.error("Failed to check handle:", error);
    } finally {
      setCheckingHandle(false);
    }
  };

  const handleInterestToggle = (interestId) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(i => i !== interestId)
        : [...prev, interestId]
    );
  };

  const canProceedStep1 = () => {
    return handle.length >= 3 && handleAvailable && name.trim() && email.includes("@") && phone && phone.length >= 10 && password.length >= 8;
  };

  const canProceedStep2 = () => {
    return userCategory !== "";
  };

  const canProceedStep3 = () => {
    return selectedInterests.length >= 3;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      console.log("Attempting login with:", { email });
      const res = await axios.post(`${API}/auth/login`, { email, password });
      console.log("Login response:", res.data);
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      // Safely extract error message - handle object/array validation errors
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail?.msg || detail?.[0]?.msg || "Invalid email or password");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupStep1 = (e) => {
    e.preventDefault();
    if (canProceedStep1()) {
      setSignupStep(2);
    } else {
      if (!handle || handle.length < 3) toast.error("Username must be at least 3 characters");
      else if (!handleAvailable) toast.error("Username is not available");
      else if (!name.trim()) toast.error("Please enter your name");
      else if (!email.includes("@")) toast.error("Please enter a valid email");
      else if (!phone || phone.length < 10) toast.error("Please enter a valid phone number");
      else if (password.length < 8) toast.error("Password must be at least 8 characters");
    }
  };

  const handleSignupFinal = async () => {
    if (!canProceedStep3()) {
      toast.error("Please select at least 3 interests");
      return;
    }

    setLoading(true);
    try {
      // Create user account
      const res = await axios.post(`${API}/auth/signup`, {
        name,
        handle,
        email,
        phone,
        password
      });
      
      // Create student profile with selected category and interests
      try {
        await axios.post(`${API}/student/profile?userId=${res.data.user.id}`, {
          userCategory,
          interests: selectedInterests,
          skills: [],
          isPublic: true
        });
      } catch (profileError) {
        console.error("Failed to create student profile:", profileError);
        // Don't block signup if profile creation fails
      }
      
      // Login immediately with returned token
      login(res.data.token, res.data.user);
      toast.success(`Welcome to Loopync, ${res.data.user.name}! 🎉`);
      navigate("/");
      
    } catch (error) {
      // Safely extract error message
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail?.msg || detail?.[0]?.msg || "Signup failed");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/verify-email`, {
        email,
        code: verificationCode
      });
      
      toast.success("Email verified! Logging you in...");
      
      // Auto-login after verification
      const loginRes = await axios.post(`${API}/auth/login`, { email, password });
      login(loginRes.data.token, loginRes.data.user);
      navigate("/");
    } catch (error) {
      // Safely extract error message
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail?.msg || detail?.[0]?.msg || "Invalid code");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/resend-verification`, { email });
      setServerCode(res.data.code);
      toast.success("New code sent!");
      toast.info(`Code: ${res.data.code}`, { duration: 10000 });
    } catch (error) {
      toast.error("Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/forgot-password`, { email });
      if (res.data.code) {
        toast.success("Reset code sent to your email!");
        toast.info(`Code: ${res.data.code}`, { duration: 10000 });
        setResetCode("");
        setMode("reset");
      }
    } catch (error) {
      toast.error("Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!resetCode || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      // Verify code first
      await axios.post(`${API}/auth/verify-reset-code`, {
        email,
        code: resetCode
      });

      // Reset password
      await axios.post(`${API}/auth/reset-password`, {
        email,
        code: resetCode,
        newPassword
      });
      
      toast.success("Password reset successfully!");
      setMode("login");
      setPassword("");
    } catch (error) {
      // Safely extract error message
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail?.msg || detail?.[0]?.msg || "Failed to reset password");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold neon-text mb-2">Loopync</h1>
          <p className="text-gray-400">India's Social Superapp</p>
        </div>

        {/* Main Card */}
        <div className="glass-card p-8 mb-4">
          {/* Login Form */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <div className="relative">
                  <Mail size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Log In"}
              </button>

              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="w-full text-sm text-cyan-400 hover:text-cyan-300"
              >
                Forgot password?
              </button>
            </form>
          )}

          {/* Signup Form - Multi Step */}
          {mode === "signup" && (
            <div className="space-y-4">
              {/* Progress indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {[1, 2, 3].map(step => (
                    <div
                      key={step}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        step <= signupStep ? 'bg-cyan-400' : 'bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-center text-xs text-gray-500">
                  Step {signupStep} of 3: {signupStep === 1 ? 'Account Info' : signupStep === 2 ? 'Who are you?' : 'Your Interests'}
                </p>
              </div>

              {/* Step 1: Basic Info */}
              {signupStep === 1 && (
                <form onSubmit={handleSignupStep1} className="space-y-4">
                  <div>
                    <div className="relative">
                      <User size={20} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-400">@</span>
                      <input
                        type="text"
                        placeholder="username"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        className="w-full pl-12 pr-12 py-3 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {checkingHandle && <Loader size={18} className="text-gray-400 animate-spin" />}
                        {!checkingHandle && handleAvailable === true && handle.length >= 3 && (
                          <CheckCircle size={18} className="text-green-400" />
                        )}
                        {!checkingHandle && handleAvailable === false && (
                          <span className="text-red-400 text-xs">Taken</span>
                        )}
                      </div>
                    </div>
                    {handle.length >= 3 && handleAvailable === true && (
                      <p className="text-green-400 text-xs mt-1">@{handle} is available!</p>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <Mail size={20} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <PhoneInput
                      international
                      defaultCountry="IN"
                      placeholder="Phone Number"
                      value={phone}
                      onChange={setPhone}
                      className="phone-input-auth w-full py-3 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="relative">
                      <Lock size={20} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password (min 8 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {password.length > 0 && password.length < 8 && (
                      <p className="text-red-400 text-xs mt-1">Password must be at least 8 characters</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <ChevronRight size={20} />
                  </button>
                </form>
              )}

              {/* Step 2: Category Selection */}
              {signupStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-white mb-1">Who are you?</h2>
                    <p className="text-gray-400 text-sm">Select the category that best describes you</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto px-1">
                    {constants.categories?.map(category => {
                      const IconComponent = categoryIcons[category.id] || User;
                      const isSelected = userCategory === category.id;
                      
                      return (
                        <button
                          key={category.id}
                          onClick={() => setUserCategory(category.id)}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-400/10'
                              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-cyan-400/20' : 'bg-gray-700'
                            }`}>
                              <IconComponent size={16} className={isSelected ? 'text-cyan-400' : 'text-gray-400'} />
                            </div>
                            <div>
                              <p className={`font-semibold text-sm ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                                {category.icon} {category.label}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setSignupStep(1)}
                      className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronLeft size={20} />
                      Back
                    </button>
                    <button
                      onClick={() => setSignupStep(3)}
                      disabled={!canProceedStep2()}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Continue
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Interest Selection */}
              {signupStep === 3 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-white mb-1">What are your interests?</h2>
                    <p className="text-gray-400 text-sm">Select at least 3 interests ({selectedInterests.length} selected)</p>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-[280px] overflow-y-auto p-1">
                    {constants.interests?.map(interest => {
                      const isSelected = selectedInterests.includes(interest.id);
                      return (
                        <button
                          key={interest.id}
                          onClick={() => handleInterestToggle(interest.id)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-cyan-400 text-black'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {interest.icon} {interest.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setSignupStep(2)}
                      className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronLeft size={20} />
                      Back
                    </button>
                    <button
                      onClick={handleSignupFinal}
                      disabled={!canProceedStep3() || loading}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Account
                          <CheckCircle size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Verification */}
          {mode === "verify" && (
            <form onSubmit={handleVerifyEmail} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-400/20 flex items-center justify-center">
                  <Mail size={32} className="text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                <p className="text-gray-400">We sent a code to</p>
                <p className="text-cyan-400 font-medium">{email}</p>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-700 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-cyan-400"
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="w-full text-sm text-cyan-400 hover:text-cyan-300"
              >
                Resend code
              </button>

              <button
                type="button"
                onClick={() => setMode("signup")}
                className="w-full text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to signup
              </button>
            </form>
          )}

          {/* Forgot Password */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-gray-400">Enter your email to receive a reset code</p>
              </div>

              <div>
                <div className="relative">
                  <Mail size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </button>

              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to login
              </button>
            </form>
          )}

          {/* Reset Password */}
          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Create New Password</h2>
                <p className="text-gray-400">Enter the code from your email</p>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-700 text-white text-center text-xl tracking-widest focus:outline-none focus:border-cyan-400"
                  maxLength={6}
                />
              </div>

              <div>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>

        {/* Toggle Login/Signup */}
        {(mode === "login" || mode === "signup") && (
          <div className="glass-card p-4 text-center">
            <span className="text-gray-400">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            </span>
            {" "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-cyan-400 font-semibold hover:text-cyan-300"
            >
              {mode === "login" ? "Sign Up" : "Log In"}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 Loopync. Made with ❤️ in India</p>
        </div>
      </div>
    </div>
  );
};

export default AuthComplete;
