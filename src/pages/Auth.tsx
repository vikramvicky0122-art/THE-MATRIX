import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";



// Zod schema for enforcing validation rules on the administrator login form.
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * Authentication Page Component
 * This page acts as a secure entryway for Administrators, presenting them with
 * a standard email/password login form. It also includes an alternative view 
 * promoting a "Premium Plan" for interested users.
 */
const Auth = () => {
  const navigate = useNavigate();

  // State indicating whether we are showing the Login form or the Premium Plan promo.
  // Defaults to "true" (showing login).
  const [isLogin, setIsLogin] = useState(true);

  // State representing whether the application is currently communicating with the backend (logging in).
  const [loading, setLoading] = useState(false);

  // State keeping track of the user's keystrokes in the login form fields.
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  /**
   * Catches the submission of the login form, validates user inputs against the Zod schema,
   * communicates with the Supabase authentication API to sign the user in, and navigates
   * them to the secure Admin page upon success.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop the page from performing a full reload
    setLoading(true);

    try {
      if (isLogin) {
        // Step 1: Ensure the provided information is fundamentally valid (e.g., looks like an email)
        const validatedData = loginSchema.parse(formData);

        // Step 2: Attempt standard sign-in through Supabase using the provided credentials
        const { error } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });

        // Step 3: Handle outcomes (errors and successes)
        if (error) throw error;
        toast.success("Logged in successfully");
        navigate("/admin");
      }
    } catch (error) {
      // Intelligently parse and display the most relevant error message to the user
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message); // Field validation error
      } else {
        const message = error instanceof Error ? error.message : "An error occurred";
        toast.error(message); // Backend/Network error
      }
    } finally {
      setLoading(false); // Make sure the loading spinner goes away, pass or fail
    }
  };

  /**
   * Directly redirects the user to interact via WhatsApp to inquire about purchasing Premium features.
   */
  const handlePremiumClick = () => {
    const message = encodeURIComponent("Hey i whould like to continue the premium plan could you please share the details");
    window.open(`https://wa.me/919042427828?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">

        {/* Navigation control to quickly return to the main landing page */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        {/* Dynamic header that changes based on whether the user is trying to log in or buy premium */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {isLogin ? "Admin Login" : "Premium Plan"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? "Sign in to manage exams" : "Unlock exclusive features"}
          </p>
        </div>

        {/* Conditional rendering block: Shows either the LoginForm or the Premium Promo Card */}
        {isLogin ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@college.edu"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : "Login"}
            </Button>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            {/* Premium Pricing presentation logic */}
            <div className="p-6 bg-primary/5 rounded-lg border border-primary/10">
              <h3 className="text-2xl font-bold text-primary mb-2">$50 / month</h3>
              <p className="text-muted-foreground mb-4">
                Get unlimited access to exam management, seat allocation, and advanced reporting features.
              </p>
              <ul className="text-sm text-left space-y-2 mb-6 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Unlimited Exams
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Smart Seat Allocation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Priority Support
                </li>
              </ul>
              <Button
                onClick={handlePremiumClick}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                CONTINUE WITH PREMIUM
              </Button>
            </div>
          </div>
        )}

        {/* Action toggle link between viewing Login form and Premium view */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin ? "Don't have an account? Get Premium" : "Already have an account? Login"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
