import React, { useState, useEffect } from 'react';
import { 
  X, ChevronRight, ChevronLeft, Home, Users, Rocket, BookOpen, 
  MessageCircle, Video, Camera, User, Sparkles, Check
} from 'lucide-react';

const tutorialSteps = [
  {
    id: 1,
    title: "Welcome to Loopync! 🎉",
    description: "Your all-in-one platform to connect, collaborate, and grow. Let's take a quick tour of the amazing features waiting for you!",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    tips: [
      "Connect with like-minded people",
      "Showcase your projects & skills",
      "Access free learning resources"
    ]
  },
  {
    id: 2,
    title: "Home Feed 📱",
    description: "Your personalized feed shows posts from people you follow. Like, comment, and share content that resonates with you.",
    icon: Home,
    color: "from-cyan-500 to-blue-500",
    tips: [
      "Scroll through posts from your network",
      "Create posts with images & videos",
      "Engage with likes and comments"
    ]
  },
  {
    id: 3,
    title: "Tribes 🏛️",
    description: "Join communities based on your interests - Tech, Fitness, Food, Business, and more! Each tribe has unique features.",
    icon: Users,
    color: "from-green-500 to-emerald-500",
    tips: [
      "Join tribes that match your interests",
      "Share projects, resources & jobs",
      "Collaborate with tribe members"
    ]
  },
  {
    id: 4,
    title: "Projects 🚀",
    description: "Showcase your work! Add your GitHub repos and live demos. Let others discover and collaborate on your projects.",
    icon: Rocket,
    color: "from-orange-500 to-red-500",
    tips: [
      "Upload projects with descriptions",
      "Add GitHub & Live Preview links",
      "Get feedback from the community"
    ]
  },
  {
    id: 5,
    title: "Free Resources 📚",
    description: "Access a library of free eBooks, courses, PDFs, and study materials shared by the community. Learn and grow together!",
    icon: BookOpen,
    color: "from-indigo-500 to-purple-500",
    tips: [
      "Browse eBooks, courses & tutorials",
      "Download resources for free",
      "Share your own learning materials"
    ]
  },
  {
    id: 6,
    title: "Messenger 💬",
    description: "Message anyone on Loopync! Start conversations, network, and build meaningful connections.",
    icon: MessageCircle,
    color: "from-pink-500 to-rose-500",
    tips: [
      "Message any user directly",
      "Accept or decline message requests",
      "Build your network"
    ]
  },
  {
    id: 7,
    title: "Stories & Profile ✨",
    description: "Share VibeCapsules (stories) that last 24 hours. Build your profile to showcase who you are!",
    icon: User,
    color: "from-cyan-400 to-purple-500",
    tips: [
      "Post daily stories/VibeCapsules",
      "Customize your profile",
      "Get verified for credibility"
    ]
  }
];

const TutorialModal = ({ onClose, userName }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('loopync_tutorial_seen', 'true');
    onClose();
  };

  const handleFinish = () => {
    localStorage.setItem('loopync_tutorial_seen', 'true');
    onClose();
  };

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gradient-to-b from-[#1a0b2e] to-[#0f021e] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="relative p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {tutorialSteps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep 
                    ? 'w-6 bg-cyan-400' 
                    : idx < currentStep 
                      ? 'w-3 bg-cyan-400/50' 
                      : 'w-3 bg-gray-700'
                }`}
              />
            ))}
          </div>
          <button 
            onClick={handleSkip}
            className="text-gray-500 hover:text-white text-sm transition"
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <div className={`px-6 pb-6 transition-opacity duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          {/* Icon */}
          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
            <Icon size={40} className="text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white text-center mb-3">
            {currentStep === 0 && userName ? `Welcome, ${userName}! 🎉` : step.title}
          </h2>

          {/* Description */}
          <p className="text-gray-400 text-center mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Tips */}
          <div className="space-y-3 mb-8">
            {step.tips.map((tip, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl border border-gray-700/50"
              >
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0`}>
                  <Check size={14} className="text-white" />
                </div>
                <span className="text-gray-300 text-sm">{tip}</span>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                currentStep === 0 
                  ? 'text-gray-600 cursor-not-allowed' 
                  : 'text-white bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <ChevronLeft size={18} />
              Back
            </button>

            {isLastStep ? (
              <button
                onClick={handleFinish}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold rounded-xl hover:opacity-90 transition"
              >
                <Sparkles size={18} />
                Let's Go!
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold rounded-xl hover:opacity-90 transition"
              >
                Next
                <ChevronRight size={18} />
              </button>
            )}
          </div>

          {/* Step counter */}
          <p className="text-center text-gray-600 text-xs mt-4">
            Step {currentStep + 1} of {tutorialSteps.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
