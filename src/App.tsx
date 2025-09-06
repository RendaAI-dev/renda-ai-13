
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { AppProvider } from "@/contexts/AppContext";
import { SupabaseInitializer } from "@/components/common/SupabaseInitializer";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RegisterWithPlanPage from "./pages/RegisterWithPlanPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import TransactionsPage from "./pages/TransactionsPage";
import ExpensesPage from "./pages/ExpensesPage";
import GoalsPage from "./pages/GoalsPage";
import ReportsPage from "./pages/ReportsPage";
import SchedulePage from "./pages/SchedulePage";
import SettingsPage from "./pages/SettingsPage";
import CategoriesPage from "./pages/CategoriesPage";
import PlansPage from "./pages/PlansPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import ThankYouPage from "./pages/ThankYouPage";
import AdminDashboard from "./pages/AdminDashboard";
import AchievementsPage from "./pages/AchievementsPage";
import NotFound from "./pages/NotFound";
import AdminRoute from "./components/admin/AdminRoute";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <BrandingProvider>
            <PreferencesProvider>
              <SubscriptionProvider>
                <AppProvider>
                  <SupabaseInitializer>
                    <BrowserRouter>
                      <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/dashboard" element={<Index />} />
                        <Route path="/landing" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/register/:planType" element={<RegisterWithPlanPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/transactions" element={<TransactionsPage />} />
                        <Route path="/expenses" element={<ExpensesPage />} />
                        <Route path="/goals" element={<GoalsPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/schedule" element={<SchedulePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/categories" element={<CategoriesPage />} />
                        <Route path="/plans" element={<PlansPage />} />
                        <Route path="/checkout/:planType" element={<CheckoutPage />} />
                        <Route path="/payment-success" element={<PaymentSuccessPage />} />
                        <Route path="/thank-you" element={<ThankYouPage />} />
                        <Route path="/achievements" element={<AchievementsPage />} />
                        <Route 
                          path="/admin" 
                          element={
                            <AdminRoute>
                              <AdminDashboard />
                            </AdminRoute>
                          } 
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                    <Toaster />
                    <Sonner />
                  </SupabaseInitializer>
                </AppProvider>
              </SubscriptionProvider>
            </PreferencesProvider>
          </BrandingProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
