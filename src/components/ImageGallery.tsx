import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Trash2, Image as ImageIcon, AlertCircle, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";

interface FishImage {
  id: string;
  file_name: string;
  file_path: string;
  upload_type: string;
  created_at: string;
}

const ImageGallery = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [images, setImages] = useState<FishImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expandedImage, setExpandedImage] = useState<FishImage | null>(null);
  const [expandOnClick, setExpandOnClick] = useState(() => {
    return localStorage.getItem("app-expand-on-click") !== "false";
  });

  // Listen for storage changes to sync settings
  useEffect(() => {
    const handleStorageChange = () => {
      setExpandOnClick(localStorage.getItem("app-expand-on-click") !== "false");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from("fish_images")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setImages(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to load images",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from("fish-images")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const toggleImageSelection = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const selectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map((img) => img.id)));
    }
  };

  const handleImageClick = (image: FishImage, e: React.MouseEvent) => {
    // Check if clicking on checkbox
    const target = e.target as HTMLElement;
    if (target.closest('[role="checkbox"]')) return;
    
    if (expandOnClick) {
      setExpandedImage(image);
    } else {
      toggleImageSelection(image.id);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) return;

    setDeleting(true);
    setShowDeleteDialog(false);

    try {
      const imagesToDelete = images.filter((img) => selectedImages.has(img.id));

      // Delete from storage
      const storageDeletePromises = imagesToDelete.map((img) =>
        supabase.storage.from("fish-images").remove([img.file_path])
      );

      await Promise.all(storageDeletePromises);

      // Delete from database
      const { error } = await supabase
        .from("fish_images")
        .delete()
        .in("id", Array.from(selectedImages));

      if (error) throw error;

      toast({
        title: "Images deleted",
        description: `${selectedImages.size} image(s) deleted successfully`,
      });

      setSelectedImages(new Set());
      loadImages();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">{t("gallery.title")}</h2>
          <p className="text-muted-foreground">
            {t("gallery.subtitle")}
          </p>
        </div>
        {images.length > 0 && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={selectAll}>
              {selectedImages.size === images.length ? t("gallery.deselectAll") : t("gallery.selectAll")}
            </Button>
            {selectedImages.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("gallery.deleting")}
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("gallery.delete")} ({selectedImages.size})
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {images.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">{t("gallery.empty")}</h3>
            <p className="text-muted-foreground mb-6">
              {t("gallery.emptyDesc")}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card
              key={image.id}
              className={`overflow-hidden transition-smooth cursor-pointer hover:shadow-lg ${
                selectedImages.has(image.id) ? "ring-2 ring-primary" : ""
              }`}
              onClick={(e) => handleImageClick(image, e)}
            >
              <div className="relative aspect-square bg-muted">
                <img
                  src={getImageUrl(image.file_path)}
                  alt={image.file_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Checkbox
                    checked={selectedImages.has(image.id)}
                    onCheckedChange={() => toggleImageSelection(image.id)}
                    className="bg-background"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-sm font-medium truncate">
                    {image.file_name}
                  </p>
                  <p className="text-white/80 text-xs">
                    {image.upload_type === "camera" ? "Camera" : "Upload"} •{" "}
                    {new Date(image.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Image Lightbox Dialog */}
      <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
        <DialogContent className="max-w-4xl w-full p-0 bg-background/95 backdrop-blur-sm border-border">
          <DialogClose className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-2 hover:bg-background">
            <X className="h-5 w-5" />
            <span className="sr-only">{t("common.cancel")}</span>
          </DialogClose>
          {expandedImage && (
            <div className="relative">
              <img
                src={getImageUrl(expandedImage.file_path)}
                alt={expandedImage.file_name}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="p-4 border-t border-border">
                <p className="font-medium">{expandedImage.file_name}</p>
                <p className="text-sm text-muted-foreground">
                  {expandedImage.upload_type === "camera" ? "Camera" : "Upload"} •{" "}
                  {new Date(expandedImage.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              {t("gallery.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("gallery.deleteConfirm").replace("{count}", String(selectedImages.size))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("gallery.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ImageGallery;