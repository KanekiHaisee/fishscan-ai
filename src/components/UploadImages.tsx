import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, Cloud, HardDrive } from 'lucide-react';

const UploadImages = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const { data, error } = await supabase.auth.getUser();
      console.log('DEBUG getUser():', data, error);

      const user = data?.user;
      console.log('DEBUG extracted user:', user);

      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Authentication required',
          description: 'Please sign in to upload images',
        });
        return;
      }

      // ... rest of your upload code

      const uploadPromises = Array.from(files).map(async (file) => {
        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from('fish-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save metadata to database
        const { error: dbError } = await supabase.from('fish_images').insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          upload_type: 'upload',
        });

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);

      toast({
        title: 'Upload successful',
        description: `${files.length} image(s) uploaded successfully`,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
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
        <h2 className="text-3xl font-bold mb-2">Upload Images</h2>
        <p className="text-muted-foreground">
          Upload fish images from your local storage or cloud to analyze for
          Anisaki parasites
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card
          className="hover:shadow-lg transition-smooth cursor-pointer"
          onClick={triggerFileInput}
        >
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <HardDrive className="w-6 h-6 text-accent" />
            </div>
            <CardTitle>Local Storage</CardTitle>
            <CardDescription>Upload images from your computer</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Select one or multiple fish images from your local device to
              upload for analysis.
            </p>
            <Button className="w-full" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Files
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-smooth opacity-75">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Cloud className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Cloud Storage</CardTitle>
            <CardDescription>Upload from cloud services</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Connect to cloud storage services like Google Drive or Dropbox.
            </p>
            <Button className="w-full" variant="outline" disabled>
              Coming Soon
            </Button>
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
          <CardTitle className="text-lg">Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Supported formats: JPG, PNG, WEBP</p>
          <p>• Maximum file size: 10MB per image</p>
          <p>• For best results, ensure images are clear and well-lit</p>
          <p>• Multiple images can be uploaded at once</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadImages;
