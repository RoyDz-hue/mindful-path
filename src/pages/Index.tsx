import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Shield, Clock, Brain, Heart, ArrowRight, Lock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  const features = [
    { icon: Clock, title: "Controlled Reduction", desc: "7-day program from 60 to 0 minutes" },
    { icon: Brain, title: "AI Guidance", desc: "Personalized support and coaching" },
    { icon: Heart, title: "Wellness Tools", desc: "Journaling, meditation, exercises" },
    { icon: Shield, title: "Secure & Private", desc: "End-to-end encrypted data" },
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-sanctuary-sage/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-sanctuary-teal/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-sanctuary rounded-xl flex items-center justify-center shadow-sanctuary">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">Sanctuary</span>
          </div>
          <Button variant="sanctuary" asChild>
            <Link to="/auth">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-sanctuary-sage-light rounded-full text-sm font-medium text-primary">
            <Shield className="w-4 h-4" />
            <span>18+ Secure Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight">
            Your Path to
            <span className="text-gradient-sanctuary block">Digital Wellness</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            A secure, supportive environment designed to help you gradually reduce 
            dependency and build healthier digital habits through AI-guided rehabilitation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="sanctuary" size="xl" asChild>
              <Link to="/auth">
                Begin Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="glass" size="lg">
              <Lock className="w-4 h-4 mr-2" />
              Learn More
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {features.map((feature) => (
            <Card key={feature.title} variant="glass" className="text-center p-6 hover:shadow-glow transition-shadow">
              <CardContent className="p-0 space-y-4">
                <div className="w-14 h-14 mx-auto bg-sanctuary-sage-light rounded-2xl flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Program Preview */}
        <Card variant="elevated" className="max-w-2xl mx-auto mt-20 overflow-hidden">
          <CardContent className="p-8">
            <h2 className="font-display text-2xl font-semibold text-center mb-6">
              7-Day Reduction Program
            </h2>
            <div className="space-y-3">
              {[60, 40, 20, 10, 5, 2, 0].map((mins, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-sanctuary rounded-full transition-all"
                      style={{ width: `${(mins / 60) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">
                    {mins === 0 ? "Free" : `${mins}m`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-4 py-8 mt-12 border-t border-border/50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>End-to-end encrypted • Privacy-first</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
