import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageGenerator } from './components/ImageGenerator';
import { ImageEditor } from './components/ImageEditor';
import { MultiImageComposer } from './components/MultiImageComposer';
import { IterativeRefinement } from './components/IterativeRefinement';
import "./index.css";

import { Image as ImageIcon, Edit3, Layers, MessageSquare, Sparkles } from 'lucide-react';

export function App() {
  const [sharedImage, setSharedImage] = useState<string | null>(null);

  const handleImageGenerated = (imageUrl: string) => {
    setSharedImage(imageUrl);
  };

  const handleImageEdited = (imageUrl: string) => {
    setSharedImage(imageUrl);
  };

  const handleImageComposed = (imageUrl: string) => {
    setSharedImage(imageUrl);
  };

  const handleRefinementComplete = (imageUrl: string) => {
    setSharedImage(imageUrl);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Image Studio
              </h1>
            </div>
            <div className="hidden md:block text-sm text-muted-foreground">
              AI-powered image generation and editing
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Generate</span>
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </TabsTrigger>
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Compose</span>
            </TabsTrigger>
            <TabsTrigger value="refine" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Refine</span>
            </TabsTrigger>
          </TabsList>

          <div className="max-w-4xl mx-auto">
            <TabsContent value="generate" className="mt-0">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-semibold">Text to Image</h2>
                  <p className="text-muted-foreground">
                    Describe your vision and watch it come to life
                  </p>
                </div>
                <ImageGenerator onImageGenerated={handleImageGenerated} />
              </div>
            </TabsContent>

            <TabsContent value="edit" className="mt-0">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-semibold">Image Editor</h2>
                  <p className="text-muted-foreground">
                    Upload an image and describe how you'd like it modified
                  </p>
                </div>
                <ImageEditor onImageEdited={handleImageEdited} />
              </div>
            </TabsContent>

            <TabsContent value="compose" className="mt-0">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-semibold">Multi-Image Composer</h2>
                  <p className="text-muted-foreground">
                    Combine multiple images into a single masterpiece
                  </p>
                </div>
                <MultiImageComposer onImageComposed={handleImageComposed} />
              </div>
            </TabsContent>

            <TabsContent value="refine" className="mt-0">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-semibold">Iterative Refinement</h2>
                  <p className="text-muted-foreground">
                    Have a conversation to perfect your image step by step
                  </p>
                </div>
                <IterativeRefinement 
                  initialImage={sharedImage}
                  onRefinementComplete={handleRefinementComplete} 
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Powered by AI</span>
            </div>
            <div className="text-sm text-muted-foreground text-center md:text-right">
              Create, edit, and refine images with artificial intelligence
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
