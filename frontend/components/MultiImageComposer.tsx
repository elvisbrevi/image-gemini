import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Layers, Upload, X, Image as ImageIcon } from 'lucide-react';

interface MultiImageComposerProps {
  onImageComposed?: (imageUrl: string) => void;
}

export function MultiImageComposer({ onImageComposed }: MultiImageComposerProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [composedImage, setComposedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedImages(prev => [...prev, ...files]);
      const urls = files.map(file => URL.createObjectURL(file));
      setImageUrls(prev => [...prev, ...urls]);
      setComposedImage(null);
      setError(null);
    }
  };

  const removeImage = (index: number) => {
    const urlToRevoke = imageUrls[index];
    if (urlToRevoke) {
      URL.revokeObjectURL(urlToRevoke);
    }
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setComposedImage(null);
    setError(null);
  };

  const clearAllImages = () => {
    imageUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setImageUrls([]);
    setComposedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCompose = async () => {
    if (selectedImages.length === 0 || !instructions.trim()) return;

    setIsComposing(true);
    setError(null);

    try {
      const formData = new FormData();
      selectedImages.forEach((image, index) => {
        formData.append(`images`, image);
      });
      formData.append('instructions', instructions.trim());

      const response = await fetch('http://localhost:3001/api/multi-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setComposedImage(imageUrl);
      onImageComposed?.(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compose images');
    } finally {
      setIsComposing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Multi-Image Composer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="multi-image-upload">Upload multiple images to combine</Label>
          <div className="flex items-center gap-2">
            <Input
              id="multi-image-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="flex-1"
            />
            {selectedImages.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={clearAllImages}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {selectedImages.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Image Previews */}
        {imageUrls.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Images</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="rounded-lg border overflow-hidden bg-muted aspect-square">
                    <img
                      src={url}
                      alt={`Selected image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Composition Instructions */}
        {selectedImages.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="composition-instructions">How should these images be combined?</Label>
            <Textarea
              id="composition-instructions"
              placeholder="e.g., Create a collage with the first image as background, blend the second image in the center, add the third image as a small overlay in the top-right corner"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        )}

        {/* Compose Button */}
        {selectedImages.length > 0 && (
          <Button
            onClick={handleCompose}
            disabled={!instructions.trim() || isComposing || selectedImages.length === 0}
            className="w-full"
          >
            {isComposing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Composing Images...
              </>
            ) : (
              <>
                <Layers className="mr-2 h-4 w-4" />
                Compose Images
              </>
            )}
          </Button>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Composed Image Result */}
        {composedImage && (
          <div className="space-y-2">
            <Label>Composed Image</Label>
            <div className="rounded-lg border overflow-hidden bg-muted">
              <img
                src={composedImage}
                alt="Composed result"
                className="w-full h-auto object-contain max-h-96"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = composedImage;
                  link.download = 'composed-image.png';
                  link.click();
                }}
              >
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setComposedImage(null)}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Upload Prompt when no images */}
        {selectedImages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Upload className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium mb-2">Upload images to combine</p>
            <p className="text-sm mb-4">
              Select multiple image files and provide instructions for how they should be combined
            </p>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                <span>JPG, PNG</span>
              </div>
              <div className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span>Multiple files</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}