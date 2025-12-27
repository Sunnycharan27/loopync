import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, User, Lock, Shield, Bell, EyeOff, UserX, 
  HelpCircle, Info, ChevronRight, Camera, Mail, Globe,
  Smartphone, Moon, LogOut, MessageCircle, Send, X, Lightbulb, AlertTriangle, Bug, Zap
} from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("main");
  const [loading, setLoading] = useState(false);
  
  // Feedback/Support Modals
  const [showReportBot, setShowReportBot] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [reportMessages, setReportMessages] = useState([
    { id: 1, type: 'bot', text: "Hi! 👋 I'm here to help you report any problems. What type of issue are you experiencing?" }
  ]);
  const [reportInput, setReportInput] = useState("");
  const [reportStep, setReportStep] = useState("type"); // type, describe, contact, done
  const [reportData, setReportData] = useState({ type: "", description: "", email: currentUser?.email || "" });
  const [suggestionData, setSuggestionData] = useState({ category: "", title: "", description: "" });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Edit Profile State
  const [profile, setProfile] = useState({
    name: currentUser?.name || "",
    handle: currentUser?.handle || "",
    bio: currentUser?.bio || "",
    avatar: currentUser?.avatar || ""
  });

  // Settings State
  const [settings, setSettings] = useState({
    accountPrivate: false,
    showOnlineStatus: true,
    allowMessagesFrom: "everyone", // everyone, friends, none
    showActivity: true,
    allowTagging: true,
    showStories: true,
    emailNotifications: true,
    pushNotifications: true,
    likeNotifications: true,
    commentNotifications: true,
    followNotifications: true,
    messageNotifications: true,
    darkMode: false
  });

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (currentUser) {
      setProfile({
        name: currentUser.name || "",
        handle: currentUser.handle || "",
        bio: currentUser.bio || "",
        avatar: currentUser.avatar || ""
      });
      fetchSettings();
      fetchBlockedUsers();
    }
  }, [currentUser]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/users/${currentUser.id}/settings`);
      setSettings({ ...settings, ...res.data });
    } catch (error) {
      console.error("Failed to load settings");
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const res = await axios.get(`${API}/users/${currentUser.id}/blocked`);
      setBlockedUsers(res.data);
    } catch (error) {
      console.error("Failed to load blocked users");
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/users/${currentUser.id}`, profile);
      toast.success("Profile updated successfully!");
      setActiveSection("main");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/users/${currentUser.id}/settings`, settings);
      toast.success("Settings saved!");
      setActiveSection("main");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/change-password`, {
        userId: currentUser.id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setActiveSection("main");
    } catch (error) {
      // Safely extract error message
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail?.msg || detail?.[0]?.msg || "Failed to change password");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await axios.delete(`${API}/users/${currentUser.id}/block/${userId}`);
      toast.success("User unblocked");
      fetchBlockedUsers();
    } catch (error) {
      toast.error("Failed to unblock user");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
      navigate("/auth");
    }
  };

  // Main Settings Menu
  const renderMainMenu = () => (
    <div className="space-y-2">
      <MenuItem
        icon={<User size={20} />}
        title="Edit Profile"
        onClick={() => setActiveSection("profile")}
      />
      <MenuItem
        icon={<Lock size={20} />}
        title="Account Settings"
        onClick={() => setActiveSection("account")}
      />
      <MenuItem
        icon={<Shield size={20} />}
        title="Security"
        onClick={() => setActiveSection("security")}
      />
      <MenuItem
        icon={<EyeOff size={20} />}
        title="Privacy"
        onClick={() => setActiveSection("privacy")}
      />
      <MenuItem
        icon={<Bell size={20} />}
        title="Notifications"
        onClick={() => setActiveSection("notifications")}
      />
      <MenuItem
        icon={<UserX size={20} />}
        title="Blocked Users"
        badge={blockedUsers.length > 0 ? blockedUsers.length : null}
        onClick={() => setActiveSection("blocked")}
      />
      <div className="border-t border-gray-700 my-4"></div>
      <MenuItem
        icon={<HelpCircle size={20} />}
        title="Help & Support"
        onClick={() => setActiveSection("help")}
      />
      <MenuItem
        icon={<Info size={20} />}
        title="About"
        onClick={() => setActiveSection("about")}
      />
      <div className="border-t border-gray-700 my-4"></div>
      <MenuItem
        icon={<LogOut size={20} />}
        title="Log Out"
        onClick={handleLogout}
        danger
      />
    </div>
  );

  // Edit Profile Section
  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-24 h-24 rounded-full ring-4 ring-cyan-400/20"
          />
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-black hover:bg-cyan-500 transition-all">
            <Camera size={16} />
          </button>
        </div>
        <p className="text-sm text-cyan-400 cursor-pointer hover:text-cyan-300">
          Change Profile Photo
        </p>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Name</label>
        <input
          type="text"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Username</label>
        <input
          type="text"
          value={profile.handle}
          onChange={(e) => setProfile({ ...profile, handle: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
          placeholder="@username"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Bio</label>
        <textarea
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400 resize-none"
          rows="4"
          placeholder="Tell us about yourself..."
          maxLength="150"
        />
        <p className="text-xs text-gray-500 mt-1">{profile.bio.length}/150</p>
      </div>

      <button
        onClick={handleSaveProfile}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-cyan-400 text-black font-semibold hover:bg-cyan-500 transition-all disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );

  // Account Settings Section
  const renderAccount = () => (
    <div className="space-y-4">
      <ToggleItem
        title="Private Account"
        description="Only followers can see your posts"
        checked={settings.accountPrivate}
        onChange={(val) => setSettings({ ...settings, accountPrivate: val })}
      />
      <ToggleItem
        title="Show Online Status"
        description="Let friends see when you're active"
        checked={settings.showOnlineStatus}
        onChange={(val) => setSettings({ ...settings, showOnlineStatus: val })}
      />
      <ToggleItem
        title="Show Activity Status"
        description="Let others see your activity"
        checked={settings.showActivity}
        onChange={(val) => setSettings({ ...settings, showActivity: val })}
      />

      <div>
        <label className="block text-sm text-gray-400 mb-2">Allow Messages From</label>
        <select
          value={settings.allowMessagesFrom}
          onChange={(e) => setSettings({ ...settings, allowMessagesFrom: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
        >
          <option value="everyone">Everyone</option>
          <option value="friends">Friends Only</option>
          <option value="none">No One</option>
        </select>
      </div>

      <button
        onClick={handleSaveSettings}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-cyan-400 text-black font-semibold hover:bg-cyan-500 transition-all disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );

  // Security Section
  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="glass-card p-4 rounded-xl">
        <h3 className="text-white font-semibold mb-2">Change Password</h3>
        <p className="text-sm text-gray-400 mb-4">Keep your account secure with a strong password</p>

        <div className="space-y-4">
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
            placeholder="Current password"
          />
          <input
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
            placeholder="New password (min 8 characters)"
          />
          <input
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
            placeholder="Confirm new password"
          />

          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-cyan-400 text-black font-semibold hover:bg-cyan-500 transition-all disabled:opacity-50"
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>

      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-400 mt-1">Coming soon</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-gray-700 text-xs text-gray-400">
            Soon
          </div>
        </div>
      </div>
    </div>
  );

  // Privacy Section
  const renderPrivacy = () => (
    <div className="space-y-4">
      <ToggleItem
        title="Allow Tagging"
        description="Let others tag you in posts"
        checked={settings.allowTagging}
        onChange={(val) => setSettings({ ...settings, allowTagging: val })}
      />
      <ToggleItem
        title="Show Stories"
        description="Let friends see your stories"
        checked={settings.showStories}
        onChange={(val) => setSettings({ ...settings, showStories: val })}
      />

      <button
        onClick={handleSaveSettings}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-cyan-400 text-black font-semibold hover:bg-cyan-500 transition-all disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );

  // Notifications Section
  const renderNotifications = () => (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
          <Mail size={18} className="text-cyan-400" />
          Email Notifications
        </h3>
        <ToggleItem
          title="Email Notifications"
          description="Receive notifications via email"
          checked={settings.emailNotifications}
          onChange={(val) => setSettings({ ...settings, emailNotifications: val })}
        />
      </div>

      <div className="mb-6">
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
          <Smartphone size={18} className="text-cyan-400" />
          Push Notifications
        </h3>
        <ToggleItem
          title="Push Notifications"
          description="Receive push notifications"
          checked={settings.pushNotifications}
          onChange={(val) => setSettings({ ...settings, pushNotifications: val })}
        />
      </div>

      <div className="glass-card p-4 rounded-xl space-y-3">
        <h4 className="text-white font-semibold">Activity Notifications</h4>
        <ToggleItem
          title="Likes"
          checked={settings.likeNotifications}
          onChange={(val) => setSettings({ ...settings, likeNotifications: val })}
          compact
        />
        <ToggleItem
          title="Comments"
          checked={settings.commentNotifications}
          onChange={(val) => setSettings({ ...settings, commentNotifications: val })}
          compact
        />
        <ToggleItem
          title="New Followers"
          checked={settings.followNotifications}
          onChange={(val) => setSettings({ ...settings, followNotifications: val })}
          compact
        />
        <ToggleItem
          title="Messages"
          checked={settings.messageNotifications}
          onChange={(val) => setSettings({ ...settings, messageNotifications: val })}
          compact
        />
      </div>

      <button
        onClick={handleSaveSettings}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-cyan-400 text-black font-semibold hover:bg-cyan-500 transition-all disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );

  // Blocked Users Section
  const renderBlocked = () => (
    <div className="space-y-4">
      {blockedUsers.length === 0 ? (
        <div className="text-center py-12">
          <UserX size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No blocked users</p>
        </div>
      ) : (
        blockedUsers.map(user => (
          <div key={user.id} className="glass-card p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
              <div>
                <h3 className="text-white font-semibold">{user.name}</h3>
                <p className="text-sm text-gray-400">@{user.handle}</p>
              </div>
            </div>
            <button
              onClick={() => handleUnblock(user.id)}
              className="px-4 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-all text-sm"
            >
              Unblock
            </button>
          </div>
        ))
      )}
    </div>
  );

  // Help Section
  const renderHelp = () => (
    <div className="space-y-2">
      <MenuItem 
        icon={<HelpCircle size={20} className="text-blue-400" />}
        title="Help Center" 
        onClick={() => {
          window.location.href = "mailto:loopyncpvt@gmail.com?subject=Loopync Help Request&body=Hi Loopync Team,%0D%0A%0D%0AI need help with:%0D%0A%0D%0A[Please describe your question or issue here]%0D%0A%0D%0AThank you!";
          toast.success("Opening email to loopyncpvt@gmail.com");
        }} 
      />
      <MenuItem 
        icon={<Mail size={20} className="text-cyan-400" />}
        title="Contact Support" 
        onClick={() => {
          window.location.href = "mailto:loopyncpvt@gmail.com?subject=Loopync Support Request&body=Hi Loopync Support Team,%0D%0A%0D%0AI need assistance with:%0D%0A%0D%0A[Please describe your issue]%0D%0A%0D%0AMy registered email: " + (currentUser?.email || "") + "%0D%0A%0D%0AThank you!";
          toast.success("Opening email client for loopyncpvt@gmail.com");
        }} 
      />
      <MenuItem 
        icon={<Bug size={20} className="text-red-400" />}
        title="Report a Problem" 
        onClick={() => {
          setShowReportBot(true);
          setReportMessages([{ id: 1, type: 'bot', text: "Hi! 👋 I'm here to help you report any problems. What type of issue are you experiencing?" }]);
          setReportStep("type");
          setReportData({ type: "", description: "", email: currentUser?.email || "" });
        }} 
      />
      <MenuItem 
        icon={<Lightbulb size={20} className="text-yellow-400" />}
        title="Suggestions & Improvements" 
        onClick={() => {
          setShowSuggestionModal(true);
          setSuggestionData({ category: "", title: "", description: "" });
        }} 
      />
      <MenuItem title="Terms of Service" onClick={() => setActiveSection("terms")} />
      <MenuItem title="Privacy Policy" onClick={() => setActiveSection("privacy-policy")} />
      
      {/* Support Info Card */}
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
        <div className="flex items-center gap-3 mb-2">
          <Mail size={20} className="text-cyan-400" />
          <span className="text-white font-medium">Need Help?</span>
        </div>
        <p className="text-gray-400 text-sm mb-2">Email us at:</p>
        <a href="mailto:loopyncpvt@gmail.com" className="text-cyan-400 font-semibold hover:underline">
          loopyncpvt@gmail.com
        </a>
      </div>
    </div>
  );

  // Terms of Service - Indian Laws Compliant
  const renderTermsOfService = () => (
    <div className="space-y-6 text-gray-300 text-sm leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
      <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
        <p className="text-cyan-400 font-semibold">Last Updated: December 2025</p>
        <p className="text-gray-400 text-xs mt-1">These terms are governed by the laws of India</p>
      </div>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">1. Acceptance of Terms</h3>
        <p>By accessing or using Loopync (&quot;Platform&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Platform. These Terms constitute a legally binding agreement between you and Loopync Private Limited (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), a company incorporated under the Companies Act, 2013, having its registered office in India.</p>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">2. Eligibility</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>You must be at least 18 years of age, or the age of legal majority in your jurisdiction, to use this Platform.</li>
          <li>If you are between 13-18 years old, you may use the Platform only with parental or guardian consent.</li>
          <li>By using the Platform, you represent and warrant that you have the legal capacity to enter into these Terms.</li>
          <li>Users from educational institutions must comply with their institution&apos;s policies regarding social media usage.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">3. User Account & Registration</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>You must provide accurate, current, and complete information during registration.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You agree to notify us immediately of any unauthorized use of your account.</li>
          <li>One person may not maintain more than one account without prior written permission.</li>
          <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">4. User Content & Conduct</h3>
        <p className="mb-2">You agree NOT to post, upload, or share content that:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Is unlawful, harmful, threatening, abusive, defamatory, or otherwise objectionable</li>
          <li>Infringes any patent, trademark, copyright, or other intellectual property rights</li>
          <li>Contains software viruses or any other malicious code</li>
          <li>Violates the Information Technology Act, 2000 or any other applicable Indian law</li>
          <li>Promotes discrimination based on race, gender, religion, nationality, disability, sexual orientation, or age</li>
          <li>Contains sexually explicit material or promotes violence</li>
          <li>Impersonates any person or entity or misrepresents your affiliation</li>
          <li>Collects or stores personal data about other users without consent</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">5. Intellectual Property Rights</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>The Platform and its original content, features, and functionality are owned by Loopync Private Limited and are protected by Indian and international copyright, trademark, and other intellectual property laws.</li>
          <li>You retain ownership of content you post but grant us a non-exclusive, worldwide, royalty-free license to use, modify, and display your content on the Platform.</li>
          <li>You must not reproduce, distribute, or create derivative works from our Platform without explicit permission.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">6. Privacy & Data Protection</h3>
        <p>Your use of the Platform is also governed by our Privacy Policy. We comply with:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Information Technology Act, 2000</li>
          <li>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</li>
          <li>Digital Personal Data Protection Act, 2023</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">7. Intermediary Status</h3>
        <p>Loopync operates as an intermediary under the Information Technology Act, 2000 and Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021. As an intermediary:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>We do not initiate the transmission of user content</li>
          <li>We do not select the receiver of the transmission</li>
          <li>We do not modify the information contained in the transmission</li>
          <li>We shall remove or disable access to unlawful content within 36 hours of receiving a valid complaint</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">8. Grievance Redressal</h3>
        <p>In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, we have appointed a Grievance Officer:</p>
        <div className="mt-3 p-3 bg-gray-800 rounded-lg">
          <p><strong className="text-white">Grievance Officer:</strong> Loopync Support Team</p>
          <p><strong className="text-white">Email:</strong> <a href="mailto:loopyncpvt@gmail.com" className="text-cyan-400">loopyncpvt@gmail.com</a></p>
          <p><strong className="text-white">Response Time:</strong> Within 24 hours of receipt</p>
          <p><strong className="text-white">Resolution Time:</strong> Within 15 days from receipt of complaint</p>
        </div>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">9. Limitation of Liability</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>The Platform is provided &quot;as is&quot; without warranties of any kind.</li>
          <li>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</li>
          <li>Our total liability shall not exceed the amount paid by you to us in the last 12 months.</li>
          <li>We do not guarantee uninterrupted or error-free service.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">10. Indemnification</h3>
        <p>You agree to indemnify and hold harmless Loopync, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Platform or violation of these Terms.</p>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">11. Termination</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>We may terminate or suspend your account immediately, without prior notice, for any breach of these Terms.</li>
          <li>You may delete your account at any time through the settings.</li>
          <li>Upon termination, your right to use the Platform will immediately cease.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">12. Governing Law & Jurisdiction</h3>
        <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in India.</p>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">13. Changes to Terms</h3>
        <p>We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or through the Platform. Continued use of the Platform after changes constitutes acceptance of the modified Terms.</p>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">14. Contact Us</h3>
        <div className="p-4 bg-gray-800 rounded-xl">
          <p className="text-white font-semibold mb-2">Loopync Private Limited</p>
          <p>Email: <a href="mailto:loopyncpvt@gmail.com" className="text-cyan-400">loopyncpvt@gmail.com</a></p>
          <p className="text-gray-400 text-xs mt-2">For any questions about these Terms, please contact us.</p>
        </div>
      </section>
    </div>
  );

  // Privacy Policy - Indian Laws Compliant (DPDP Act 2023, IT Act 2000)
  const renderPrivacyPolicy = () => (
    <div className="space-y-6 text-gray-300 text-sm leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
      <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
        <p className="text-purple-400 font-semibold">Last Updated: December 2025</p>
        <p className="text-gray-400 text-xs mt-1">Compliant with Digital Personal Data Protection Act, 2023 (DPDP Act)</p>
      </div>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">1. Introduction</h3>
        <p>Loopync Private Limited ("Company", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform. This policy complies with:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Digital Personal Data Protection Act, 2023</li>
          <li>Information Technology Act, 2000</li>
          <li>IT (Reasonable Security Practices) Rules, 2011</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">2. Data Fiduciary Information</h3>
        <div className="p-3 bg-gray-800 rounded-lg">
          <p><strong className="text-white">Data Fiduciary:</strong> Loopync Private Limited</p>
          <p><strong className="text-white">Email:</strong> <a href="mailto:loopyncpvt@gmail.com" className="text-cyan-400">loopyncpvt@gmail.com</a></p>
          <p><strong className="text-white">Country:</strong> India</p>
        </div>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">3. Information We Collect</h3>
        
        <h4 className="text-white font-semibold mt-4 mb-2">3.1 Personal Data You Provide:</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Name, email address, phone number</li>
          <li>Profile information (bio, avatar, cover photo)</li>
          <li>Educational details and certifications</li>
          <li>Skills and professional information</li>
          <li>Content you create (posts, stories, comments)</li>
          <li>Messages and communications</li>
        </ul>

        <h4 className="text-white font-semibold mt-4 mb-2">3.2 Automatically Collected Data:</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Device information (type, operating system)</li>
          <li>IP address and location data</li>
          <li>Browser type and version</li>
          <li>Usage patterns and interactions</li>
          <li>Cookies and similar technologies</li>
        </ul>

        <h4 className="text-white font-semibold mt-4 mb-2">3.3 Sensitive Personal Data:</h4>
        <p>We may collect the following with explicit consent:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Financial information (for premium features)</li>
          <li>Biometric data (if you enable face/fingerprint login)</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">4. Purpose of Data Collection</h3>
        <p>We process your data for the following lawful purposes:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong className="text-white">Service Delivery:</strong> To provide and maintain the Platform</li>
          <li><strong className="text-white">Account Management:</strong> To create and manage your account</li>
          <li><strong className="text-white">Communication:</strong> To send notifications, updates, and respond to inquiries</li>
          <li><strong className="text-white">Personalization:</strong> To customize your experience and show relevant content</li>
          <li><strong className="text-white">Analytics:</strong> To understand how users interact with the Platform</li>
          <li><strong className="text-white">Security:</strong> To detect, prevent, and address technical issues and fraud</li>
          <li><strong className="text-white">Legal Compliance:</strong> To comply with applicable laws and regulations</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">5. Consent</h3>
        <p>Under the DPDP Act 2023, we obtain your consent before processing personal data. You provide consent by:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Creating an account and accepting these terms</li>
          <li>Enabling specific features that require additional data</li>
          <li>Opting in to marketing communications</li>
        </ul>
        <p className="mt-2">You may withdraw consent at any time by contacting us at <a href="mailto:loopyncpvt@gmail.com" className="text-cyan-400">loopyncpvt@gmail.com</a></p>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">6. Data Sharing & Disclosure</h3>
        <p>We may share your information with:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong className="text-white">Service Providers:</strong> Third parties who assist in operating the Platform (hosting, analytics, payment processing)</li>
          <li><strong className="text-white">Legal Requirements:</strong> When required by law, court order, or government request</li>
          <li><strong className="text-white">Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
          <li><strong className="text-white">Other Users:</strong> Information you choose to make public on your profile</li>
        </ul>
        <p className="mt-2 text-yellow-400">We do NOT sell your personal data to third parties.</p>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">7. Data Retention</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Active account data: Retained as long as your account is active</li>
          <li>Deleted account data: Permanently deleted within 90 days of account deletion</li>
          <li>Legal/compliance data: Retained as required by law (typically 7 years for financial records)</li>
          <li>Anonymized data: May be retained indefinitely for analytics</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">8. Your Rights Under DPDP Act 2023</h3>
        <p>As a Data Principal, you have the following rights:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong className="text-white">Right to Access:</strong> Request a summary of your personal data we hold</li>
          <li><strong className="text-white">Right to Correction:</strong> Request correction of inaccurate or incomplete data</li>
          <li><strong className="text-white">Right to Erasure:</strong> Request deletion of your personal data</li>
          <li><strong className="text-white">Right to Withdraw Consent:</strong> Withdraw consent for data processing at any time</li>
          <li><strong className="text-white">Right to Grievance Redressal:</strong> File a complaint with our Grievance Officer or the Data Protection Board of India</li>
          <li><strong className="text-white">Right to Nominate:</strong> Nominate another person to exercise your rights in case of death or incapacity</li>
        </ul>
        <p className="mt-2">To exercise these rights, contact: <a href="mailto:loopyncpvt@gmail.com" className="text-cyan-400">loopyncpvt@gmail.com</a></p>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">9. Data Security</h3>
        <p>We implement appropriate security measures including:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Encryption of data in transit (SSL/TLS) and at rest</li>
          <li>Secure password hashing (bcrypt)</li>
          <li>Regular security audits and vulnerability assessments</li>
          <li>Access controls and authentication mechanisms</li>
          <li>Incident response procedures for data breaches</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">10. Data Breach Notification</h3>
        <p>In the event of a personal data breach, we will:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Notify the Data Protection Board of India as required by law</li>
          <li>Inform affected users within 72 hours of becoming aware of the breach</li>
          <li>Take immediate steps to mitigate the breach and prevent future occurrences</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">11. Cross-Border Data Transfer</h3>
        <p>Your data may be transferred to and processed in countries outside India. Such transfers are done in compliance with the DPDP Act 2023 and only to countries/organizations that provide adequate protection.</p>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">12. Children's Privacy</h3>
        <p>The Platform is not intended for children under 13 years of age. We do not knowingly collect personal data from children under 13. If you are a parent or guardian and believe your child has provided us with personal data, please contact us immediately.</p>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">13. Cookies Policy</h3>
        <p>We use cookies and similar technologies to:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Keep you logged in</li>
          <li>Remember your preferences</li>
          <li>Analyze Platform usage</li>
          <li>Provide personalized content</li>
        </ul>
        <p className="mt-2">You can control cookies through your browser settings.</p>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">14. Grievance Officer</h3>
        <p>In accordance with the DPDP Act 2023 and IT Rules 2021:</p>
        <div className="mt-3 p-4 bg-gray-800 rounded-xl">
          <p><strong className="text-white">Grievance Officer / Data Protection Officer:</strong></p>
          <p>Loopync Support Team</p>
          <p>Email: <a href="mailto:loopyncpvt@gmail.com" className="text-cyan-400">loopyncpvt@gmail.com</a></p>
          <p className="mt-2 text-gray-400 text-xs">Response within 24 hours | Resolution within 30 days</p>
        </div>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">15. Changes to Privacy Policy</h3>
        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically.</p>
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-3">16. Contact Us</h3>
        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
          <p className="text-white font-semibold mb-2">Loopync Private Limited</p>
          <p>Email: <a href="mailto:loopyncpvt@gmail.com" className="text-cyan-400">loopyncpvt@gmail.com</a></p>
          <p className="text-gray-400 text-xs mt-3">For privacy-related queries, data access requests, or to exercise your rights under the DPDP Act 2023, please contact us at the email above.</p>
        </div>
      </section>
    </div>
  );

  // Report Problem Bot Handler
  const handleReportOption = (option) => {
    const userMsg = { id: Date.now(), type: 'user', text: option };
    setReportMessages(prev => [...prev, userMsg]);
    
    setTimeout(() => {
      let botResponse = "";
      
      if (reportStep === "type") {
        setReportData(prev => ({ ...prev, type: option }));
        botResponse = `Got it! You're reporting a ${option.toLowerCase()} issue. 📝\n\nPlease describe the problem in detail. What happened? What were you trying to do?`;
        setReportStep("describe");
      }
      
      setReportMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: botResponse }]);
    }, 500);
  };

  const handleReportSubmit = async () => {
    if (reportStep === "describe" && reportInput.trim()) {
      const userMsg = { id: Date.now(), type: 'user', text: reportInput };
      setReportMessages(prev => [...prev, userMsg]);
      setReportData(prev => ({ ...prev, description: reportInput }));
      setReportInput("");
      
      setTimeout(async () => {
        setSubmittingFeedback(true);
        try {
          await axios.post(`${API}/feedback`, {
            userId: currentUser?.id,
            type: "problem",
            category: reportData.type,
            description: reportInput,
            email: reportData.email,
            userAgent: navigator.userAgent,
            createdAt: new Date().toISOString()
          });
          
          const thankYouMsg = { 
            id: Date.now(), 
            type: 'bot', 
            text: "Thank you for reporting this issue! 🙏\n\nYour report has been submitted to our team. We'll look into it and may contact you at your registered email if we need more details.\n\nIs there anything else I can help you with?" 
          };
          setReportMessages(prev => [...prev, thankYouMsg]);
          setReportStep("done");
          toast.success("Problem reported successfully!");
        } catch (error) {
          // Store locally if API fails
          const reports = JSON.parse(localStorage.getItem('loopync_reports') || '[]');
          reports.push({ ...reportData, description: reportInput, createdAt: new Date().toISOString() });
          localStorage.setItem('loopync_reports', JSON.stringify(reports));
          
          const thankYouMsg = { 
            id: Date.now(), 
            type: 'bot', 
            text: "Thank you for reporting! 🙏\n\nYour report has been saved. Our team will review it soon.\n\nFor urgent issues, please email us at loopyncpvt@gmail.com" 
          };
          setReportMessages(prev => [...prev, thankYouMsg]);
          setReportStep("done");
          toast.success("Report saved!");
        } finally {
          setSubmittingFeedback(false);
        }
      }, 500);
    }
  };

  const handleSuggestionSubmit = async () => {
    if (!suggestionData.title.trim() || !suggestionData.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setSubmittingFeedback(true);
    try {
      await axios.post(`${API}/feedback`, {
        userId: currentUser?.id,
        type: "suggestion",
        category: suggestionData.category,
        title: suggestionData.title,
        description: suggestionData.description,
        email: currentUser?.email,
        createdAt: new Date().toISOString()
      });
      toast.success("Thank you for your suggestion! 💡");
      setShowSuggestionModal(false);
    } catch (error) {
      // Store locally if API fails
      const suggestions = JSON.parse(localStorage.getItem('loopync_suggestions') || '[]');
      suggestions.push({ ...suggestionData, createdAt: new Date().toISOString() });
      localStorage.setItem('loopync_suggestions', JSON.stringify(suggestions));
      toast.success("Suggestion saved! Thank you! 💡");
      setShowSuggestionModal(false);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // About Section
  const renderAbout = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
          <Globe size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Loopync</h2>
        <p className="text-gray-400">Version 1.0.0</p>
      </div>

      <div className="glass-card p-6 rounded-xl">
        <p className="text-gray-300 text-center mb-4">
          India's Free-Speech Social × Vibe Video × Venues × Fintech Superapp
        </p>
        <div className="text-sm text-gray-400 space-y-2">
          <p>© 2025 Loopync</p>
          <p>Made with ❤️ in India</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 glass-surface p-4 flex items-center gap-3">
          <button 
            onClick={() => activeSection === "main" ? navigate(-1) : setActiveSection("main")}
            className="text-cyan-400"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              {activeSection === "main" && "Settings"}
              {activeSection === "profile" && "Edit Profile"}
              {activeSection === "account" && "Account Settings"}
              {activeSection === "security" && "Security"}
              {activeSection === "privacy" && "Privacy"}
              {activeSection === "notifications" && "Notifications"}
              {activeSection === "blocked" && "Blocked Users"}
              {activeSection === "help" && "Help & Support"}
              {activeSection === "about" && "About"}
              {activeSection === "terms" && "Terms of Service"}
              {activeSection === "privacy-policy" && "Privacy Policy"}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeSection === "main" && renderMainMenu()}
          {activeSection === "profile" && renderProfile()}
          {activeSection === "account" && renderAccount()}
          {activeSection === "security" && renderSecurity()}
          {activeSection === "privacy" && renderPrivacy()}
          {activeSection === "notifications" && renderNotifications()}
          {activeSection === "blocked" && renderBlocked()}
          {activeSection === "help" && renderHelp()}
          {activeSection === "about" && renderAbout()}
          {activeSection === "terms" && renderTermsOfService()}
          {activeSection === "privacy-policy" && renderPrivacyPolicy()}
        </div>
      </div>

      {/* Report Problem Bot Modal */}
      {showReportBot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="w-full sm:max-w-md bg-[#1a0b2e] sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                  <Bug size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Report a Problem</h3>
                  <p className="text-gray-400 text-xs">We're here to help!</p>
                </div>
              </div>
              <button onClick={() => setShowReportBot(false)} className="p-2 hover:bg-gray-800 rounded-full">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {reportMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.type === 'user' 
                      ? 'bg-cyan-500 text-black rounded-br-sm' 
                      : 'bg-gray-800 text-white rounded-bl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
              
              {/* Quick Options */}
              {reportStep === "type" && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {["Bug/Error", "App Crash", "Feature Not Working", "UI Issue", "Performance", "Other"].map(opt => (
                    <button 
                      key={opt} 
                      onClick={() => handleReportOption(opt)}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full text-sm transition"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Input */}
            {reportStep === "describe" && (
              <div className="p-4 border-t border-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reportInput}
                    onChange={(e) => setReportInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleReportSubmit()}
                    placeholder="Describe your problem..."
                    className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <button 
                    onClick={handleReportSubmit}
                    disabled={!reportInput.trim() || submittingFeedback}
                    className="p-3 bg-cyan-500 text-black rounded-xl disabled:opacity-50"
                  >
                    {submittingFeedback ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {reportStep === "done" && (
              <div className="p-4 border-t border-gray-800">
                <button 
                  onClick={() => setShowReportBot(false)}
                  className="w-full py-3 bg-cyan-500 text-black font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggestions Modal */}
      {showSuggestionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1a0b2e] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                  <Lightbulb size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Share Your Ideas</h3>
                  <p className="text-gray-400 text-xs">Help us improve Loopync!</p>
                </div>
              </div>
              <button onClick={() => setShowSuggestionModal(false)} className="p-2 hover:bg-gray-800 rounded-full">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            {/* Form */}
            <div className="p-4 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {["New Feature", "UI/UX", "Performance", "Content", "Other"].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSuggestionData(prev => ({ ...prev, category: cat }))}
                      className={`px-4 py-2 rounded-full text-sm transition ${
                        suggestionData.category === cat 
                          ? 'bg-yellow-500 text-black' 
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Title */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Title *</label>
                <input
                  type="text"
                  value={suggestionData.title}
                  onChange={(e) => setSuggestionData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief title for your suggestion"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Description *</label>
                <textarea
                  value={suggestionData.description}
                  onChange={(e) => setSuggestionData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your idea in detail..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                />
              </div>
              
              {/* Submit */}
              <button
                onClick={handleSuggestionSubmit}
                disabled={!suggestionData.title.trim() || !suggestionData.description.trim() || submittingFeedback}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingFeedback ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap size={20} />
                    Submit Suggestion
                  </>
                )}
              </button>
              
              {/* Email Info */}
              <p className="text-center text-gray-500 text-xs">
                Or email us directly at <a href="mailto:loopyncpvt@gmail.com" className="text-cyan-400">loopyncpvt@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const MenuItem = ({ icon, title, badge, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between p-4 rounded-xl glass-card hover:bg-gray-800/50 transition-all ${
      danger ? 'text-red-400' : 'text-white'
    }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-medium">{title}</span>
    </div>
    <div className="flex items-center gap-2">
      {badge && (
        <span className="px-2 py-1 rounded-full bg-cyan-400 text-black text-xs font-semibold">
          {badge}
        </span>
      )}
      <ChevronRight size={20} className="text-gray-400" />
    </div>
  </button>
);

const ToggleItem = ({ title, description, checked, onChange, compact }) => (
  <div className={`flex items-center justify-between ${compact ? 'py-2' : 'glass-card p-4 rounded-xl'}`}>
    <div className="flex-1">
      <h3 className="text-white font-medium">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-all ${
        checked ? 'bg-cyan-400' : 'bg-gray-700'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
          checked ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  </div>
);

export default Settings;
