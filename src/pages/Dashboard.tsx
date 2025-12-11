import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Fish, LogOut, Upload, Camera, ImageIcon, Settings as SettingsIcon } from "lucide-react";
import UploadImages from "@/components/UploadImages";
import CameraCapture from "@/components/CameraCapture";
import ImageGallery from "@/components/ImageGallery";
import Settings from "@/components/Settings";
import LanguageSelector from "@/components/LanguageSelector";

type ViewType = "upload" | "camera" | "gallery" | "settings";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<ViewType>("upload");

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        variant: "destructive",
        title: t("auth.errorSigningOut"),
        description: error.message,
      });
    } else {
      toast({
        title: t("auth.signedOut"),
        description: t("auth.signedOutDesc"),
      });
      navigate("/auth");
    }
  };

  const menuItems = [
    {
      id: "upload" as ViewType,
      label: t("nav.upload"),
      icon: Upload,
      description: t("nav.upload.desc"),
    },
    {
      id: "camera" as ViewType,
      label: t("nav.camera"),
      icon: Camera,
      description: t("nav.camera.desc"),
    },
    {
      id: "gallery" as ViewType,
      label: t("nav.gallery"),
      icon: ImageIcon,
      description: t("nav.gallery.desc"),
    },
    {
      id: "settings" as ViewType,
      label: t("nav.settings"),
      icon: SettingsIcon,
      description: "Configure app preferences",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - 30% */}
      <aside className="w-[30%] min-w-[300px] bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Fish className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t("app.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("app.subtitle")}</p>
            </div>
          </div>
          {/* Language Selector */}
          <LanguageSelector />
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full text-left p-4 rounded-lg transition-smooth flex items-start gap-3 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 ${isActive ? "" : "text-muted-foreground"}`} />
                  <div>
                    <div className={`font-medium ${isActive ? "" : "text-foreground"}`}>
                      {item.label}
                    </div>
                    <div
                      className={`text-sm mt-0.5 ${
                        isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t("nav.signOut")}
          </Button>
        </div>
      </aside>

      {/* Main Content - 70% */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {currentView === "upload" && <UploadImages />}
          {currentView === "camera" && <CameraCapture />}
          {currentView === "gallery" && <ImageGallery />}
          {currentView === "settings" && <Settings />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
