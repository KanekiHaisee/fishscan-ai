import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// These are PUBLIC/publishable keys - safe to include in client code
// Users need to replace these with their own keys from:
// - Google: https://console.cloud.google.com (create a Picker API key)
// - Dropbox: https://www.dropbox.com/developers/apps (create an app)
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const DROPBOX_APP_KEY = import.meta.env.VITE_DROPBOX_APP_KEY || "";

interface CloudStoragePickerProps {
  provider: "google" | "dropbox";
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

const CloudStoragePicker = ({ provider, isOpen, onClose, onUploadComplete }: CloudStoragePickerProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const checkConfiguration = () => {
    if (provider === "google") {
      return Boolean(GOOGLE_API_KEY && GOOGLE_CLIENT_ID);
    }
    return Boolean(DROPBOX_APP_KEY);
  };

  const uploadFileToSupabase = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Authentication required");
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("fish-images")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase
      .from("fish_images")
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        upload_type: provider === "google" ? "google-drive" : "dropbox",
      });

    if (dbError) throw dbError;
  };

  const handleGoogleDrivePicker = async () => {
    if (!checkConfiguration()) {
      toast({
        variant: "destructive",
        title: "Google Drive not configured",
        description: "Please add VITE_GOOGLE_API_KEY and VITE_GOOGLE_CLIENT_ID to your environment.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Load Google API scripts
      await loadGoogleScripts();
      
      // Initialize and show picker
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "https://www.googleapis.com/auth/drive.readonly",
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            throw new Error(tokenResponse.error);
          }

          const picker = new google.picker.PickerBuilder()
            .addView(google.picker.ViewId.DOCS_IMAGES)
            .setOAuthToken(tokenResponse.access_token)
            .setDeveloperKey(GOOGLE_API_KEY)
            .setCallback(async (data: any) => {
              if (data.action === google.picker.Action.PICKED) {
                try {
                  for (const doc of data.docs) {
                    // Download the file
                    const response = await fetch(
                      `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
                      {
                        headers: {
                          Authorization: `Bearer ${tokenResponse.access_token}`,
                        },
                      }
                    );
                    const blob = await response.blob();
                    const file = new File([blob], doc.name, { type: doc.mimeType });
                    await uploadFileToSupabase(file);
                  }

                  toast({
                    title: "Upload successful",
                    description: `${data.docs.length} image(s) uploaded from Google Drive`,
                  });
                  onUploadComplete();
                  onClose();
                } catch (error: any) {
                  toast({
                    variant: "destructive",
                    title: "Upload failed",
                    description: error.message,
                  });
                }
              }
              setIsLoading(false);
            })
            .build();
          
          picker.setVisible(true);
        },
      });

      tokenClient.requestAccessToken();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to open Google Drive",
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  const handleDropboxPicker = () => {
    if (!checkConfiguration()) {
      toast({
        variant: "destructive",
        title: "Dropbox not configured",
        description: "Please add VITE_DROPBOX_APP_KEY to your environment.",
      });
      return;
    }

    setIsLoading(true);

    // Load Dropbox Chooser script
    loadDropboxScript().then(() => {
      Dropbox.choose({
        success: async (files: any[]) => {
          try {
            for (const file of files) {
              // Download the file using the direct link
              const response = await fetch(file.link);
              const blob = await response.blob();
              const fileObj = new File([blob], file.name, { type: blob.type });
              await uploadFileToSupabase(fileObj);
            }

            toast({
              title: "Upload successful",
              description: `${files.length} image(s) uploaded from Dropbox`,
            });
            onUploadComplete();
            onClose();
          } catch (error: any) {
            toast({
              variant: "destructive",
              title: "Upload failed",
              description: error.message,
            });
          }
          setIsLoading(false);
        },
        cancel: () => {
          setIsLoading(false);
        },
        linkType: "direct",
        multiselect: true,
        extensions: ["images"],
        folderselect: false,
      });
    }).catch((error) => {
      toast({
        variant: "destructive",
        title: "Failed to load Dropbox",
        description: error.message,
      });
      setIsLoading(false);
    });
  };

  const loadGoogleScripts = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google?.picker) {
        resolve();
        return;
      }

      const gapiScript = document.createElement("script");
      gapiScript.src = "https://apis.google.com/js/api.js";
      gapiScript.onload = () => {
        gapi.load("picker", () => {
          const gsiScript = document.createElement("script");
          gsiScript.src = "https://accounts.google.com/gsi/client";
          gsiScript.onload = () => resolve();
          gsiScript.onerror = () => reject(new Error("Failed to load Google Sign-In"));
          document.body.appendChild(gsiScript);
        });
      };
      gapiScript.onerror = () => reject(new Error("Failed to load Google API"));
      document.body.appendChild(gapiScript);
    });
  };

  const loadDropboxScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Dropbox) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://www.dropbox.com/static/api/2/dropins.js";
      script.id = "dropboxjs";
      script.setAttribute("data-app-key", DROPBOX_APP_KEY);
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Dropbox SDK"));
      document.body.appendChild(script);
    });
  };

  const handleOpen = () => {
    if (provider === "google") {
      handleGoogleDrivePicker();
    } else {
      handleDropboxPicker();
    }
  };

  const configured = checkConfiguration();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {provider === "google" ? "Google Drive" : "Dropbox"}
          </DialogTitle>
          <DialogDescription>
            {configured
              ? `Select images from your ${provider === "google" ? "Google Drive" : "Dropbox"} to upload.`
              : `${provider === "google" ? "Google Drive" : "Dropbox"} integration needs to be configured.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!configured && (
            <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
              <p className="font-medium">Configuration Required:</p>
              {provider === "google" ? (
                <>
                  <p>Add these to your .env file:</p>
                  <code className="block bg-background p-2 rounded text-xs">
                    VITE_GOOGLE_API_KEY=your_api_key<br />
                    VITE_GOOGLE_CLIENT_ID=your_client_id
                  </code>
                  <p className="text-muted-foreground">
                    Get these from{" "}
                    <a
                      href="https://console.cloud.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Google Cloud Console
                    </a>
                  </p>
                </>
              ) : (
                <>
                  <p>Add this to your .env file:</p>
                  <code className="block bg-background p-2 rounded text-xs">
                    VITE_DROPBOX_APP_KEY=your_app_key
                  </code>
                  <p className="text-muted-foreground">
                    Get this from{" "}
                    <a
                      href="https://www.dropbox.com/developers/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Dropbox Developer Console
                    </a>
                  </p>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleOpen}
              disabled={!configured || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                `Open ${provider === "google" ? "Google Drive" : "Dropbox"}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CloudStoragePicker;

// Type declarations for external SDKs
declare global {
  interface Window {
    google?: any;
    gapi?: any;
    Dropbox?: any;
  }
  const google: any;
  const gapi: any;
  const Dropbox: any;
}
