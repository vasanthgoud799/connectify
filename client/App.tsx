import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { MessagingProvider } from "./contexts/MessagingContext";
import { VideoCallProvider } from "./contexts/VideoCallContext";
import { FriendsProvider } from "./contexts/FriendsContext";
import { FileShareProvider } from "./contexts/FileShareContext";
import { AIProvider } from "./contexts/AIContext";
import { SafetyProvider } from "./contexts/SafetyContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import VideoCall from "./pages/VideoCall";
import WaitingRoom from "./pages/WaitingRoom";
import Friends from "./pages/Friends";
import FilesManager from "./pages/FilesManager";
import AIDashboard from "./pages/AIDashboard";
import SafetyDashboard from "./pages/SafetyDashboard";
import Placeholder from "./pages/Placeholder";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <MessagingProvider>
        <VideoCallProvider>
          <FriendsProvider>
            <FileShareProvider>
              <AIProvider>
                <SafetyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/call" element={<VideoCall />} />
              <Route path="/waiting-room" element={<WaitingRoom />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/files" element={<FilesManager />} />
              <Route path="/ai" element={<AIDashboard />} />
              <Route path="/safety" element={<SafetyDashboard />} />
              <Route path="/forgot-password" element={<Placeholder title="Forgot Password" description="Reset your account password" />} />
              <Route path="/demo" element={<Placeholder title="Demo" description="Watch ConnectSphere in action" />} />
              <Route path="/about" element={<Placeholder title="About Us" description="Learn more about ConnectSphere" />} />
              <Route path="/careers" element={<Placeholder title="Careers" description="Join our team" />} />
              <Route path="/contact" element={<Placeholder title="Contact" description="Get in touch with us" />} />
              <Route path="/blog" element={<Placeholder title="Blog" description="Latest news and updates" />} />
              <Route path="/help" element={<Placeholder title="Help Center" description="Find answers and support" />} />
              <Route path="/privacy" element={<Placeholder title="Privacy Policy" description="How we protect your data" />} />
              <Route path="/terms" element={<Placeholder title="Terms of Service" description="Our terms and conditions" />} />
              <Route path="/status" element={<Placeholder title="System Status" description="Check ConnectSphere service status" />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
                </SafetyProvider>
              </AIProvider>
            </FileShareProvider>
          </FriendsProvider>
        </VideoCallProvider>
      </MessagingProvider>
    </UserProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
