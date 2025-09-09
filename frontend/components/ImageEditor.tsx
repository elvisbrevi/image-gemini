import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Edit3, Upload, X } from 'lucide-react';

interface ImageEditorProps {
  onImageEdited?: (imageUrl: string) => void;
  initialImages?: File[];
  onImagesChange?: (images: File[]) => void;
}

export function ImageEditor({ onImageEdited, initialImages = [], onImagesChange }: ImageEditorProps) {
  const [originalImage, setOriginalImage] = useState<File | null>(initialImages[0] || null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(
    initialImages[0] ? URL.createObjectURL(initialImages[0]) : null
  );
  const [instructions, setInstructions] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalImage(file);
      const url = URL.createObjectURL(file);
      setOriginalImageUrl(url);
      setEditedImage(null);
      setError(null);
      onImagesChange?.([file]);
    }
  };

  const removeImage = () => {
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl);
    }
    setOriginalImage(null);
    setOriginalImageUrl(null);
    setEditedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImagesChange?.([]);
  };

  const handleEdit = async () => {
    if (!originalImage || !instructions.trim()) return;

    setIsEditing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', originalImage);
      formData.append('instructions', instructions.trim());

      const response = await fetch('http://localhost:3001/api/image-edit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.success && data.imageUrl) {
        setEditedImage(data.imageUrl);
        onImageEdited?.(data.imageUrl);
      } else {
        throw new Error('No image URL received from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit image');
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          Image Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="image-upload">Upload an image to edit</Label>
          <div className="flex items-center gap-2">
            <Input
              id="image-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="flex-1"
            />
            {originalImage && (
              <Button
                variant="outline"
                size="icon"
                onClick={removeImage}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Original Image Preview */}
        {originalImageUrl && (
          <div className="space-y-2">
            <Label>Original Image</Label>
            <div className="rounded-lg border overflow-hidden bg-muted">
              <img
                src={originalImageUrl}
                alt="Original image"
                className="w-full h-auto object-contain max-h-64"
              />
            </div>
          </div>
        )}

        {/* Edit Instructions */}
        {originalImage && (
          <div className="space-y-2">
            <Label htmlFor="instructions">Editing instructions</Label>
            <Textarea
              id="instructions"
              placeholder="e.g., Make the sky more dramatic with storm clouds, change the car color to red, add a person walking in the background"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        )}

        {/* Edit Button */}
        {originalImage && (
          <Button
            onClick={handleEdit}
            disabled={!instructions.trim() || isEditing}
            className="w-full"
          >
            {isEditing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Editing Image...
              </>
            ) : (
              <>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Image
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

        {/* Edited Image Result */}
        {editedImage && (
          <div className="space-y-2">
            <Label>Edited Image</Label>
            <div className="rounded-lg border overflow-hidden bg-muted">
              <img
                src={editedImage}
                alt="Edited result"
                className="w-full h-auto object-contain max-h-96"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch(editedImage);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `edited-image-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Download failed:', error);
                  }
                }}
              >
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditedImage(null)}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Upload Prompt when no image */}
        {!originalImage && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Upload className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium mb-2">Upload an image to get started</p>
            <p className="text-sm">
              Select an image file and provide instructions for how you'd like it modified
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}