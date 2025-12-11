import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language, languageNames } from "@/i18n/translations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Globe, Moon, Sun, Bell, Zap, Maximize2, Info } from "lucide-react";

type Theme = "light" | "dark" | "system";

const Settings = () => {
  const { language, setLanguage, t } = useLanguage();
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("app-theme") as Theme) || "system";
  });
  const [notifications, setNotifications] = useState(() => {
    return localStorage.getItem("app-notifications") === "true";
  });
  const [autoAnalyze, setAutoAnalyze] = useState(() => {
    return localStorage.getItem("app-auto-analyze") === "true";
  });
  const [expandOnClick, setExpandOnClick] = useState(() => {
    return localStorage.getItem("app-expand-on-click") !== "false"; // default true
  });

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    const root = document.documentElement;
    
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("app-notifications", String(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("app-auto-analyze", String(autoAnalyze));
  }, [autoAnalyze]);

  useEffect(() => {
    localStorage.setItem("app-expand-on-click", String(expandOnClick));
  }, [expandOnClick]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            {t("settings.language")}
          </CardTitle>
          <CardDescription>{t("settings.language.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {(Object.keys(languageNames) as Language[]).map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {languageNames[lang]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="w-5 h-5 text-primary" />
            ) : (
              <Sun className="w-5 h-5 text-primary" />
            )}
            {t("settings.theme")}
          </CardTitle>
          <CardDescription>{t("settings.theme.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={theme} onValueChange={(value) => setTheme(value as Theme)}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="light">{t("settings.theme.light")}</SelectItem>
              <SelectItem value="dark">{t("settings.theme.dark")}</SelectItem>
              <SelectItem value="system">{t("settings.theme.system")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            {t("settings.notifications")}
          </CardTitle>
          <CardDescription>{t("settings.notifications.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">{t("settings.notifications.enable")}</Label>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto-Analyze */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            {t("settings.autoAnalyze")}
          </CardTitle>
          <CardDescription>{t("settings.autoAnalyze.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="autoAnalyze">{t("settings.autoAnalyze.enable")}</Label>
            <Switch
              id="autoAnalyze"
              checked={autoAnalyze}
              onCheckedChange={setAutoAnalyze}
            />
          </div>
        </CardContent>
      </Card>

      {/* Expand on Click */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Maximize2 className="w-5 h-5 text-primary" />
            {t("settings.expandOnClick")}
          </CardTitle>
          <CardDescription>{t("settings.expandOnClick.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="expandOnClick">{t("settings.expandOnClick.enable")}</Label>
            <Switch
              id="expandOnClick"
              checked={expandOnClick}
              onCheckedChange={setExpandOnClick}
            />
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            {t("settings.about")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("settings.version")}</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("settings.application")}</span>
            <span className="font-medium">{t("app.fullName")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
