import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Circle, XCircle } from "lucide-react";

const CameraCapture = () => {
  const { toast } = useToast();
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup: stop camera when component unmounts
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready before showing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
        };
      }

      toast({
        title: "Camera started",
        description: "USB camera is now active",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Camera access denied",
        description: "Please allow camera access to capture images",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !streamRef.current) return;

    setCapturing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in to capture images",
        });
        return;
      }

      // Create canvas to capture frame
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) throw new Error("Failed to get canvas context");
      
      ctx.drawImage(videoRef.current, 0, 0);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.95);
      });

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}-camera.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from("fish-images")
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from("fish_images")
        .insert({
          user_id: user.id,
          file_name: `camera-${Date.now()}.jpg`,
          file_path: fileName,
          file_size: blob.size,
          upload_type: "camera",
        });

      if (dbError) throw dbError;

      toast({
        title: "Image captured",
        description: "Photo saved successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Capture failed",
        description: error.message,
      });
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Camera Capture</h2>
        <p className="text-muted-foreground">
          Capture real-time images using your USB camera for immediate analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Camera Feed</CardTitle>
          <CardDescription>
            Start the camera to capture fish images in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isStreaming ? 'block' : 'hidden'}`}
            />
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Camera not started</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {!isStreaming ? (
              <Button onClick={startCamera} className="flex-1">
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </Button>
            ) : (
              <>
                <Button
                  onClick={captureImage}
                  disabled={capturing}
                  className="flex-1"
                >
                  {capturing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <Circle className="mr-2 h-4 w-4" />
                      Capture Photo
                    </>
                  )}
                </Button>
                <Button onClick={stopCamera} variant="destructive">
                  <XCircle className="mr-2 h-4 w-4" />
                  Stop Camera
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Camera Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Ensure adequate lighting for clear images</p>
          <p>• Hold the camera steady when capturing</p>
          <p>• Position the fish specimen clearly in frame</p>
          <p>• USB cameras provide better quality than built-in webcams</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CameraCapture;