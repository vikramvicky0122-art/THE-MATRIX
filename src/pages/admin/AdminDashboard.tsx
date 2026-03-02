import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { PlusCircle, LogOut } from "lucide-react";
import ExamList from "@/components/admin/ExamList";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Admin Panel Component
 * This component serves as the main dashboard for administrative users.
 * It ensures the user is securely logged in before showing the UI and
 * provides access to create new exams and view the existing exam list.
 */
const Admin = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // State to hold the currently logged-in user's information
  const [user, setUser] = useState<any>(null);

  // State to manage the loading screen while checking authentication status
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial check: Verify if there is currently an active user session.
    // If no session exists, forcefully redirect to the authentication page.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false); // Stop loading once the initial check is complete
    });

    // 2. Continuous listener: Watch for any ongoing changes in authentication state
    // (e.g., if a user signs in or out in another tab or the session expires).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    // Cleanup function to remove the listener when the component is unmounted
    return () => subscription.unsubscribe();
  }, [navigate]);

  /**
   * Logs the current user out of the application using Supabase auth,
   * shows a success toast notification, and navigates them back to the home page.
   */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t("logged.out"));
    navigate("/");
  };

  // Render a simple loading spinner while we check the auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section: Title, User Greeting, and Logout Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t("admin.dashboard")}</h1>
            <p className="text-muted-foreground">{t("welcome.back")}, {user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("logout")}
          </Button>
        </div>

        {/* Action Card: Button to navigate to the exam creation page */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-2">{t("create.new.exam")}</h2>
              <p className="text-muted-foreground">{t("setup.exam")}</p>
            </div>
            <Button size="lg" onClick={() => navigate("/admin/create")}>
              <PlusCircle className="mr-2 h-5 w-5" />
              {t("create.exam")}
            </Button>
          </div>
        </Card>

        {/* List of currently active exams managed by the admin */}
        <ExamList />
      </div>
    </div>
  );
};

export default Admin;
