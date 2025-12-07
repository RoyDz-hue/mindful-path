import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, Leaf, Heart, Lock } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    if (isSignUp && !ageConfirmed) {
      toast({
        title: "Age Verification Required",
        description: "You must confirm you are 18 or older to use this platform.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Welcome to Sanctuary",
            description: "Your account has been created. Let's begin your journey.",
          });
          navigate("/dashboard");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Sign In Failed",
            description: "Invalid email or password. Please try again.",
            variant: "destructive",
          });
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-sanctuary-sage/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-sanctuary-teal/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <Card variant="glass" className="w-full max-w-md relative z-10 animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-sanctuary rounded-2xl flex items-center justify-center shadow-glow">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-display">
            {isSignUp ? "Begin Your Journey" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-base">
            {isSignUp 
              ? "Create your sanctuary account to start healing" 
              : "Continue your path to wellness"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name (optional)</Label>
                <Input
                  id="displayName"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-4 pt-2">
                <Card variant="warm" className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-sanctuary-coral mt-0.5 flex-shrink-0" />
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-sanctuary-coral">Age Verification Required</p>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ageConfirmed}
                          onChange={(e) => setAgeConfirmed(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded border-sanctuary-coral text-sanctuary-coral focus:ring-sanctuary-coral"
                        />
                        <span className="text-sm text-muted-foreground">
                          I confirm that I am 18 years of age or older and understand that this platform is designed for adult content rehabilitation.
                        </span>
                      </label>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            <Button
              type="submit"
              variant="sanctuary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Sign In"}
                  <Lock className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2 text-xs">
                <Lock className="w-3.5 h-3.5" />
                <span>End-to-end encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Heart className="w-3.5 h-3.5" />
                <span>Privacy-first</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
