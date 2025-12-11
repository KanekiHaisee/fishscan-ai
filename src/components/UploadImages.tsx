import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Upload, Loader2, HardDrive } from "lucide-react";
import CloudStoragePicker from "./CloudStoragePicker";

const UploadImages = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cloudProvider, setCloudProvider] = useState<"google" | "dropbox" | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in to upload images",
        });
        return;
      }

      const uploadPromises = Array.from(files).map(async (file) => {
        // Upload to storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from("fish-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save metadata to database
        const { error: dbError } = await supabase
          .from("fish_images")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            upload_type: "upload",
          });

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Upload successful",
        description: `${files.length} image(s) uploaded successfully`,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">{t("upload.title")}</h2>
        <p className="text-muted-foreground">
          {t("upload.subtitle")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-smooth cursor-pointer" onClick={triggerFileInput}>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <HardDrive className="w-6 h-6 text-accent" />
            </div>
            <CardTitle>{t("upload.local")}</CardTitle>
            <CardDescription>{t("upload.local.desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("upload.dragDrop")}
            </p>
            <Button className="w-full" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t("upload.local.button")}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-smooth">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <CardTitle>{t("upload.cloudStorage")}</CardTitle>
            <CardDescription>{t("upload.cloudStorage.desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("upload.cloudStorage.select")}
            </p>
            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={() => setCloudProvider("google")}
                disabled={uploading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google Drive
              </Button>
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={() => setCloudProvider("dropbox")}
                disabled={uploading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#0061FF">
                  <path d="M12 6.134L6.069 9.797 12 13.459l5.931-3.662L12 6.134zM6.069 14.259L12 17.921l5.931-3.662L12 10.597l-5.931 3.662zM12 2L1.5 8.277l4.569 2.82L12 7.435l5.931 3.662 4.569-2.82L12 2zM1.5 14.659l4.569-2.82 5.931 3.662 5.931-3.662 4.569 2.82L12 22 1.5 14.659z"/>
                </svg>
                Dropbox
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">{t("upload.guidelines")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• {t("upload.formats")}</p>
          <p>• {t("upload.maxSize")}</p>
          <p>• {t("upload.quality")}</p>
          <p>• {t("upload.multiple")}</p>
        </CardContent>
      </Card>

      {cloudProvider && (
        <CloudStoragePicker
          provider={cloudProvider}
          isOpen={true}
          onClose={() => setCloudProvider(null)}
          onUploadComplete={() => {
            // Optionally trigger a refresh of the image gallery
          }}
        />
      )}
    </div>
  );
};

export default UploadImages;