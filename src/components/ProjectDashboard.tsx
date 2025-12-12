import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Fish, Upload, Camera, ImageIcon, Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadImages from "@/components/UploadImages";
import CameraCapture from "@/components/CameraCapture";
import ImageGallery from "@/components/ImageGallery";
import Settings from "@/components/Settings";
import LanguageSelector from "@/components/LanguageSelector";
import { Project } from "@/types/project";

type ViewType = "upload" | "camera" | "gallery" | "settings";

interface ProjectDashboardProps {
  project: Project;
  onBack: () => void;
}

const ProjectDashboard = ({ project, onBack }: ProjectDashboardProps) => {
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<ViewType>("upload");

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
      description: t("settings.subtitle"),
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - 30% */}
      <aside className="w-[30%] min-w-[300px] bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("project.backToProjects")}
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Fish className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {project.description || t("app.subtitle")}
              </p>
            </div>
          </div>
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
      </aside>

      {/* Main Content - 70% */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {currentView === "upload" && <UploadImages projectId={project.id} />}
          {currentView === "camera" && <CameraCapture projectId={project.id} />}
          {currentView === "gallery" && <ImageGallery projectId={project.id} />}
          {currentView === "settings" && <Settings />}
        </div>
      </main>
    </div>
  );
};

export default ProjectDashboard;
