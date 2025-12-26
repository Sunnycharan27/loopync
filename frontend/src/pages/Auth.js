import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader, ChevronLeft, ChevronRight, GraduationCap, Briefcase, Palette, Star, Rocket, Laptop, Brain, Search, User, BookOpen } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [signupStep, setSignupStep] = useState(1); // 1: Basic info, 2: Category, 3: Interests
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [userCategory, setUserCategory] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [handleAvailable, setHandleAvailable] = useState(null);
  const [constants, setConstants] = useState({ categories: [], interests: [] });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch constants for categories and interests
  useEffect(() => {
    const fetchConstants = async () => {
      try {
        const res = await axios.get(`${API}/student/constants`);
        setConstants(res.data);
      } catch (error) {
        console.error("Failed to fetch constants");
      }
    };
    fetchConstants();
  }, []);

  // Debounced handle check
  useEffect(() => {
    if (!isLogin && handle.length >= 3) {
      const timer = setTimeout(() => {
        checkHandleAvailability(handle);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setHandleAvailable(null);
    }
  }, [handle, isLogin]);

  const checkHandleAvailability = async (handleToCheck) => {
    setCheckingHandle(true);
    try {
      const res = await axios.get(`${API}/auth/check-handle/${handleToCheck}`);
      setHandleAvailable(res.data.available);
    } catch (error) {
      console.error("Failed to check handle");
    } finally {
      setCheckingHandle(false);
    }
  };

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

  const handleInterestToggle = (interestId) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(i => i !== interestId)
        : [...prev, interestId]
    );
  };

  const canProceedStep1 = () => {
    return handle.length >= 3 && handleAvailable && name.trim() && email.trim() && password.length >= 8;
  };

  const canProceedStep2 = () => {
    return userCategory !== "";
  };

  const canProceedStep3 = () => {
    return selectedInterests.length >= 3;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLogin) {
      setLoading(true);
      try {
        const res = await axios.post(`${API}/auth/login`, { email, password });
        login(res.data.token, res.data.user);
        toast.success("Welcome back!");
        navigate("/");
      } catch (error) {
        const detail = error.response?.data?.detail;
        let errorMsg = "Authentication failed";
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (Array.isArray(detail) && detail[0]?.msg) {
          errorMsg = detail[0].msg;
        } else if (detail?.msg) {
          errorMsg = detail.msg;
        }
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSignupSubmit = async () => {
    setLoading(true);
    try {
      // Create user account
      const res = await axios.post(`${API}/auth/signup`, { 
        handle, 
        name, 
        email, 
        phone, 
        password,
        category: userCategory 
      });
      
      // Create student profile with selected data
      await axios.post(`${API}/student/profile?userId=${res.data.user.id}`, {
        userCategory,
        interests: selectedInterests,
        skills: [],
        isPublic: true
      });
      
      login(res.data.token, res.data.user);
      toast.success("Welcome to Loopync! 🎉");
      navigate("/");
    } catch (error) {
      const detail = error.response?.data?.detail;
      let errorMsg = "Signup failed";
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        errorMsg = detail[0].msg;
      } else if (detail?.msg) {
        errorMsg = detail.msg;
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-white">Email</label>
        <input
          data-testid="auth-email-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border-2 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-white">Password</label>
        <input
          data-testid="auth-password-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border-2 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
          required
        />
      </div>

      <button
        data-testid="auth-submit-btn"
        type="submit"
        className="w-full py-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50"
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
            Logging in...
          </div>
        ) : (
          "Login"
        )}
      </button>
    </form>
  );

  const renderSignupStep1 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-white">Username</label>
        <div className="relative">
          <input
            data-testid="auth-handle-input"
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="yourhandle"
            className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border-2 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none pr-10"
            required
            minLength={3}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {checkingHandle && (
              <Loader size={20} className="text-gray-400 animate-spin" />
            )}
            {!checkingHandle && handleAvailable === true && handle.length >= 3 && (
              <CheckCircle size={20} className="text-green-400" />
            )}
            {!checkingHandle && handleAvailable === false && (
              <XCircle size={20} className="text-red-400" />
            )}
          </div>
        </div>
        {handle.length >= 3 && handleAvailable === false && (
          <p className="text-red-400 text-xs mt-1">@{handle} is already taken</p>
        )}
        {handle.length >= 3 && handleAvailable === true && (
          <p className="text-green-400 text-xs mt-1">@{handle} is available!</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-white">Name</label>
        <input
          data-testid="auth-name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border-2 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-white">Phone Number</label>
        <PhoneInput
          international
          defaultCountry="IN"
          value={phone}
          onChange={setPhone}
          placeholder="Enter phone number"
          className="phone-input-custom w-full px-4 py-3 rounded-xl bg-gray-800/50 border-2 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-white">Email</label>
        <input
          data-testid="auth-email-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border-2 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-white">Password</label>
        <input
          data-testid="auth-password-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border-2 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
          required
          minLength={8}
        />
        {password.length > 0 && password.length < 8 && (
          <p className="text-red-400 text-xs mt-1">Password must be at least 8 characters</p>
        )}
      </div>

      <button
        onClick={() => setSignupStep(2)}
        disabled={!canProceedStep1() || checkingHandle}
        className="w-full py-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        Continue
        <ChevronRight size={20} />
      </button>
    </div>
  );

  const renderSignupStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white mb-1">Who are you?</h2>
        <p className="text-gray-400 text-sm">Select the category that best describes you</p>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
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
          className="flex-1 py-3 rounded-full bg-gray-700 text-white font-bold hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft size={20} />
          Back
        </button>
        <button
          onClick={() => setSignupStep(3)}
          disabled={!canProceedStep2()}
          className="flex-1 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Continue
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderSignupStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white mb-1">What are your interests?</h2>
        <p className="text-gray-400 text-sm">Select at least 3 interests ({selectedInterests.length} selected)</p>
      </div>

      <div className="flex flex-wrap gap-2 max-h-[350px] overflow-y-auto p-1">
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
          className="flex-1 py-3 rounded-full bg-gray-700 text-white font-bold hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft size={20} />
          Back
        </button>
        <button
          onClick={handleSignupSubmit}
          disabled={!canProceedStep3() || loading}
          className="flex-1 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
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
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      <div className="glass-card p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <img 
            src="/loopync-logo.jpg" 
            alt="Loopync" 
            className="w-24 h-24 mx-auto mb-3 rounded-2xl"
          />
          <h1 className="text-4xl font-bold neon-text mb-1">Loopync</h1>
          <p className="text-gray-400 text-sm">Where your vibes find their tribes</p>
        </div>

        {/* Progress indicator for signup */}
        {!isLogin && (
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
              Step {signupStep} of 3: {signupStep === 1 ? 'Account Info' : signupStep === 2 ? 'Category' : 'Interests'}
            </p>
          </div>
        )}

        {isLogin ? renderLoginForm() : (
          <>
            {signupStep === 1 && renderSignupStep1()}
            {signupStep === 2 && renderSignupStep2()}
            {signupStep === 3 && renderSignupStep3()}
          </>
        )}

        <div className="mt-4 text-center">
          <button
            data-testid="auth-toggle-btn"
            onClick={() => {
              setIsLogin(!isLogin);
              setSignupStep(1);
            }}
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
