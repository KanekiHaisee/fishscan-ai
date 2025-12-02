import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Fish, ArrowRight, Upload, Camera, ImageIcon } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const features = [
    {
      icon: Upload,
      title: "Upload Images",
      description: "Upload fish images from local storage or cloud services",
    },
    {
      icon: Camera,
      title: "Camera Capture",
      description: "Capture real-time images using USB-connected cameras",
    },
    {
      icon: ImageIcon,
      title: "Image Management",
      description: "View, organize, and delete your uploaded images",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Fish className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Parasite Detector</span>
          </div>
          <Button onClick={() => navigate("/auth")}>
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Fish className="w-4 h-4" />
            AI-Powered Detection System
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Fish Parasite Detection
            <span className="block text-primary mt-2">Using Advanced AI</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Detect Anisaki parasites in fish images with our professional AI-powered
            analysis system. Upload images or capture them in real-time for instant results.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
              Start Analyzing
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Learn More
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-16">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-smooth"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>

          <div className="pt-16 pb-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border">
              <h2 className="text-2xl font-bold mb-4">Ready for Stage 2?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Stage 2 will introduce AI model training using your uploaded datasets with
                annotations to automatically detect parasites in new images. The complete
                analysis pipeline will be integrated into this software.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-sm">
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse"></span>
                Coming Soon: AI Training & Detection
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;