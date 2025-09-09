import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

export function ImageGenerator({ onImageGenerated }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImage(imageUrl);
      onImageGenerated?.(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Text to Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Describe the image you want to generate</Label>
          <Textarea
            id="prompt"
            placeholder="e.g., A serene mountain landscape with a crystal clear lake reflecting the snow-capped peaks, golden hour lighting"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </div>

        <Button 
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Image'
          )}
        </Button>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {generatedImage && (
          <div className="space-y-2">
            <Label>Generated Image</Label>
            <div className="rounded-lg border overflow-hidden bg-muted">
              <img
                src={generatedImage}
                alt="Generated from prompt"
                className="w-full h-auto object-contain max-h-96"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = generatedImage;
                  link.download = 'generated-image.png';
                  link.click();
                }}
              >
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGeneratedImage(null)}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}