import React, { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import axios from "axios";
import Home from "./pages/Home";
import VibeZone from "./pages/VibeZone";
import Tribes from "./pages/Tribes";
import TribeDetail from "./pages/TribeDetail";
import CreateTribe from "./pages/CreateTribe";
import Discover from "./pages/Discover";
import Venues from "./pages/Venues";
import VenueDetail from "./pages/VenueDetail";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Payment from "./pages/Payment";
import Marketplace from "./pages/Marketplace";
import Onboarding from "./pages/Onboarding";
import MessengerNew from "./pages/MessengerNew";
import Notifications from "./pages/Notifications";
import Profile from "./pages/ProfileVibe";
import InstagramProfile from "./pages/InstagramProfile";
import UserProfile from "./pages/UserProfile";
import People from "./pages/People";
import Settings from "./pages/Settings";
import AdminVerificationDashboard from "./pages/AdminVerificationDashboard";
import VerificationRequest from "./pages/VerificationRequest";
import PageView from "./pages/PageView";
import Resources from "./pages/Resources";
import Analytics from "./pages/Analytics";
import Auth from "./pages/Auth";
import AuthComplete from "./pages/AuthComplete";
import { Toaster } from "sonner";

// Marketplace Pages
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import SellerDashboard from "./pages/SellerDashboard";

// Video Platform Pages
import Videos from "./pages/Videos";
import VideoPlayer from "./pages/VideoPlayer";
import VideoUpload from "./pages/VideoUpload";
import { WebSocketProvider } from "./context/WebSocketContext";
import CallManager from "./components/CallManager";

// Digital Products Pages
import DigitalProducts from "./pages/DigitalProducts";
import DigitalProductDetail from "./pages/DigitalProductDetail";
import UploadDigitalProduct from "./pages/UploadDigitalProduct";

// Student Features Pages
import StudentOnboarding from "./pages/StudentOnboarding";
import Projects from "./pages/Projects";
import CreateProject from "./pages/CreateProject";
import ProjectDetail from "./pages/ProjectDetail";
import Certifications from "./pages/Certifications";
import CreateCertification from "./pages/CreateCertification";
import TeamPosts from "./pages/TeamPosts";
import CreateTeamPost from "./pages/CreateTeamPost";
import CompanyDiscovery from "./pages/CompanyDiscovery";
import CreateInternship from "./pages/CreateInternship";

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
              path="/viberooms"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <Rooms />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/viberooms/:roomId"
              element={
                !authLoaded ? (
                  <div className="min-h-screen grid place-items-center text-gray-400">Loading…</div>
                ) : isAuthenticated ? (
                  <RoomDetailClubhouse />
                ) : (
                  <Navigate to="/auth" />
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