import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish, LogOut, FolderPlus, FolderOpen, Settings as SettingsIcon } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";
import CreateProject from "@/components/CreateProject";
import ProjectList from "@/components/ProjectList";
import ProjectDashboard from "@/components/ProjectDashboard";
import Settings from "@/components/Settings";
import { Project } from "@/types/project";

type MainView = "welcome" | "create" | "projects" | "project" | "settings";

const WelcomeDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<MainView>("welcome");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();
      
      setUserName(profile?.full_name || profile?.email?.split("@")[0] || "User");
    }
  };

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

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setCurrentView("project");
  };

  const handleBackFromProject = () => {
    setSelectedProject(null);
    setCurrentView("welcome");
  };

  // If a project is selected, show the project dashboard
  if (currentView === "project" && selectedProject) {
    return <ProjectDashboard project={selectedProject} onBack={handleBackFromProject} />;
  }

  const menuItems = [
    {
      id: "create" as MainView,
      label: t("project.createNew"),
      icon: FolderPlus,
      description: t("project.createDesc"),
    },
    {
      id: "projects" as MainView,
      label: t("project.viewSaved"),
      icon: FolderOpen,
      description: t("project.viewSavedDesc"),
    },
    {
      id: "settings" as MainView,
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Fish className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t("app.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("app.subtitle")}</p>
            </div>
          </div>
          <LanguageSelector />
        </div>

        <nav className="flex-1 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-4">
            {t("project.section")}
          </p>
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
          <Button onClick={handleSignOut} variant="outline" className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            {t("nav.signOut")}
          </Button>
        </div>
      </aside>

      {/* Main Content - 70% */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {currentView === "welcome" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {t("welcome.greeting").replace("{name}", userName)}
                </h2>
                <p className="text-muted-foreground">{t("welcome.subtitle")}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card
                  className="hover:shadow-lg transition-smooth cursor-pointer"
                  onClick={() => setCurrentView("create")}
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <FolderPlus className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{t("project.createNew")}</CardTitle>
                    <CardDescription>{t("project.createDesc")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">{t("project.startNew")}</Button>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-lg transition-smooth cursor-pointer"
                  onClick={() => setCurrentView("projects")}
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                      <FolderOpen className="w-6 h-6 text-accent" />
                    </div>
                    <CardTitle>{t("project.viewSaved")}</CardTitle>
                    <CardDescription>{t("project.viewSavedDesc")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">{t("project.browse")}</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentView === "create" && (
            <CreateProject 
              onProjectCreated={() => setCurrentView("projects")}
              onCancel={() => setCurrentView("welcome")}
            />
          )}

          {currentView === "projects" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">{t("project.savedProjects")}</h2>
                <p className="text-muted-foreground">{t("project.savedProjectsDesc")}</p>
              </div>
              <ProjectList onSelectProject={handleSelectProject} />
            </div>
          )}

          {currentView === "settings" && <Settings />}
        </div>
      </main>
    </div>
  );
};

export default WelcomeDashboard;
