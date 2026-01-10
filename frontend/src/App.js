import React, { useState, useEffect, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import axios from "axios";
import { Toaster } from "sonner";

// Core pages - loaded immediately
import Home from "./pages/Home";
import Auth from "./pages/Auth";

// Lazy loaded pages - loaded on demand for better performance
const VibeZone = lazy(() => import("./pages/VibeZone"));
const Tribes = lazy(() => import("./pages/Tribes"));
const TribeDetail = lazy(() => import("./pages/TribeDetail"));
const CreateTribe = lazy(() => import("./pages/CreateTribe"));
const Discover = lazy(() => import("./pages/Discover"));
const Venues = lazy(() => import("./pages/Venues"));
const VenueDetail = lazy(() => import("./pages/VenueDetail"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Payment = lazy(() => import("./pages/Payment"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const MessengerNew = lazy(() => import("./pages/MessengerNew"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/ProfileVibe"));
const InstagramProfile = lazy(() => import("./pages/InstagramProfile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const People = lazy(() => import("./pages/People"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminVerificationDashboard = lazy(() => import("./pages/AdminVerificationDashboard"));
const VerificationRequest = lazy(() => import("./pages/VerificationRequest"));
const PageView = lazy(() => import("./pages/PageView"));
const Resources = lazy(() => import("./pages/Resources"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AuthComplete = lazy(() => import("./pages/AuthComplete"));

// Marketplace Pages - lazy loaded
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));

// Video Platform Pages - lazy loaded
const Videos = lazy(() => import("./pages/Videos"));
const VideoPlayer = lazy(() => import("./pages/VideoPlayer"));
const VideoUpload = lazy(() => import("./pages/VideoUpload"));

// Digital Products Pages - lazy loaded
const DigitalProducts = lazy(() => import("./pages/DigitalProducts"));
const DigitalProductDetail = lazy(() => import("./pages/DigitalProductDetail"));
const UploadDigitalProduct = lazy(() => import("./pages/UploadDigitalProduct"));

// Student Features Pages - lazy loaded
const StudentOnboarding = lazy(() => import("./pages/StudentOnboarding"));
const Projects = lazy(() => import("./pages/Projects"));
const CreateProject = lazy(() => import("./pages/CreateProject"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Certifications = lazy(() => import("./pages/Certifications"));
const CreateCertification = lazy(() => import("./pages/CreateCertification"));
const TeamPosts = lazy(() => import("./pages/TeamPosts"));
const CreateTeamPost = lazy(() => import("./pages/CreateTeamPost"));
const CompanyDiscovery = lazy(() => import("./pages/CompanyDiscovery"));
const CreateInternship = lazy(() => import("./pages/CreateInternship"));

// Context providers
import { WebSocketProvider } from "./context/WebSocketContext";
import CallManager from "./components/CallManager";

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
    <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
  </div>
);

// Tutorial Component
import TutorialModal from "./components/TutorialModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const AuthContext = React.createContext();

// Helper component to handle @username routes
const UsernameRouter = () => {
  const { username } = useParams();
  
  // If the username starts with @, strip it and render InstagramProfile
  if (username && username.startsWith('@')) {
    return <InstagramProfile />;
  }
  
  // Otherwise, just render InstagramProfile with the username as-is
  // This handles cases where users navigate to /@handle or /handle
  return <InstagramProfile />;
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("loopync_token");
    const user = localStorage.getItem("loopync_user");
    if (token && user) {
      const parsed = JSON.parse(user);
      setCurrentUser(parsed);
      setIsAuthenticated(true);
      // Treat as authenticated unless onboarding explicitly incomplete
      checkOnboardingStatus(parsed.id).finally(() => setAuthLoaded(true));
    } else {
      setAuthLoaded(true);
    }
  }, []);

  const checkOnboardingStatus = async (userId) => {
    try {
      const res = await axios.get(`${API}/users/${userId}/interests`);
      if (!res.data.onboardingComplete) {
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(false);
      }
    } catch (error) {
      // If interests endpoint fails, skip onboarding (user already exists)
      setNeedsOnboarding(false);
    }
  };

  const login = (token, user) => {
    localStorage.setItem("loopync_token", token);
    localStorage.setItem("loopync_user", JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    checkOnboardingStatus(user.id);
    
    // Show tutorial for new users (check if they've seen it before)
    const tutorialSeen = localStorage.getItem('loopync_tutorial_seen');
    if (!tutorialSeen) {
      setTimeout(() => setShowTutorial(true), 1000); // Show after 1 second
    }
  };

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem("loopync_token");
      if (!token) return;
      
      const res = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedUser = res.data;
      localStorage.setItem("loopync_user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("loopync_token");
    localStorage.removeItem("loopync_user");
    setCurrentUser(null);
    setIsAuthenticated(false);
    setNeedsOnboarding(false);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, needsOnboarding, setNeedsOnboarding, login, logout, refreshUserData }}>
      <WebSocketProvider>
        <div className="App">
          {/* Tutorial Modal for new users */}
          {showTutorial && (
            <TutorialModal 
              onClose={() => setShowTutorial(false)} 
              userName={currentUser?.name?.split(' ')[0]} 
            />
          )}
          
          {/* Global Call Manager - handles incoming calls */}
          {isAuthenticated && currentUser && <CallManager currentUser={currentUser} />}
          
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthComplete />} />
              <Route
                path="/onboarding"
                element={isAuthenticated ? <Onboarding /> : <Navigate to="/auth" />}
              />
            <Route
              path="/"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  needsOnboarding ? <Navigate to="/onboarding" /> : <Home />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/vibezone"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <VibeZone />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/tribes"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <Tribes />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/tribes/create"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <CreateTribe />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/tribes/:tribeId"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <TribeDetail />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/discover"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <Discover />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/digital-products"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <DigitalProducts />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/digital-products/upload"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <UploadDigitalProduct />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/digital-products/:productId"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <DigitalProductDetail />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/admin/verifications"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <AdminVerificationDashboard />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/page/:pageId"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <PageView />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/marketplace"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <Marketplace />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/venues"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <Venues />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/venues/:venueId"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <VenueDetail />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/events"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <Events />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/events/:eventId"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <EventDetail />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/payment"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <Payment />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/messenger"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <MessengerNew />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/notifications"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <Notifications />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/profile"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <InstagramProfile />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/u/:username"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <InstagramProfile />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/profile-old"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <Profile />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/profile/:userId"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <UserProfile />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/people"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <People />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />

            <Route
              path="/resources"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : (
                  <Resources />
                )
              }
            />
            <Route
              path="/analytics"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <Analytics />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/settings"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <Settings />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/verification"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <VerificationRequest />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/admin/verification"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <AdminVerificationDashboard />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            
            {/* Student Features Routes */}
            <Route
              path="/student-onboarding"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <StudentOnboarding />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/projects"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <Projects />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/projects/create"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <CreateProject />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/projects/:id"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : (
                  <ProjectDetail currentUser={currentUser} />
                )
              }
            />
            <Route
              path="/certifications"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <Certifications />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/certifications/create"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <CreateCertification />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/team-posts"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <TeamPosts />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/team-posts/create"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <CreateTeamPost />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/talent-discovery"
              element={<CompanyDiscovery />}
            />
            <Route
              path="/internships/create"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <CreateInternship />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/tribes/create"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <CreateTribe />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            
            {/* Catch-all route for @username - MUST be last! */}
            <Route
              path="/:username"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <UsernameRouter />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />

          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </div>
      </WebSocketProvider>
    </AuthContext.Provider>
  );
}

export default App;