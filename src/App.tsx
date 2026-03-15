import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OnboardingPage from "./pages/OnboardingPage";
import AppLayout from "./layouts/AppLayout";
import FocusView from "./pages/app/FocusView";
import ProjectsPage from "./pages/app/ProjectsPage";
import ProjectDetailPage from "./pages/app/ProjectDetailPage";
import CaptureStage from "./pages/app/stages/CaptureStage";
import ScoreStage from "./pages/app/stages/ScoreStage";
import EvaluateStage from "./pages/app/stages/EvaluateStage";
import DecideStage from "./pages/app/stages/DecideStage";
import ExecuteStage from "./pages/app/stages/ExecuteStage";
import InboxPage from "./pages/app/InboxPage";
import SettingsPage from "./pages/app/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/focus" replace />} />
              <Route path="focus" element={<FocusView />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="project/:id" element={<ProjectDetailPage />}>
                <Route index element={<Navigate to="capture" replace />} />
                <Route path="capture" element={<CaptureStage />} />
                <Route path="score" element={<ScoreStage />} />
                <Route path="evaluate" element={<EvaluateStage />} />
                <Route path="decide" element={<DecideStage />} />
                <Route path="execute" element={<ExecuteStage />} />
              </Route>
              <Route path="inbox" element={<InboxPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
