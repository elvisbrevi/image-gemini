import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, MessageSquare, Send, Upload, RotateCcw, Download } from 'lucide-react';

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: Date;
}

interface IterativeRefinementProps {
  initialImage?: string;
  onRefinementComplete?: (imageUrl: string) => void;
}

export function IterativeRefinement({ initialImage, onRefinementComplete }: IterativeRefinementProps) {
  const [baseImage, setBaseImage] = useState<File | null>(null);
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(initialImage || null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(initialImage || null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBaseImage(file);
      const url = URL.createObjectURL(file);
      setBaseImageUrl(url);
      setCurrentImage(url);
      setConversation([]);
      setError(null);
      
      // Add initial message
      const initialMessage: ConversationMessage = {
        id: `msg-${Date.now()}`,
        type: 'assistant',
        content: 'Image uploaded successfully! What would you like me to help you with?',
        image: url,
        timestamp: new Date(),
      };
      setConversation([initialMessage]);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !baseImage || isProcessing) return;

    const userMessage: ConversationMessage = {
      id: `msg-${Date.now()}-user`,
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date(),
    };

    setConversation(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', baseImage);
      formData.append('instructions', currentMessage.trim());

      const response = await fetch('http://localhost:3001/api/image-edit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setCurrentImage(imageUrl);
      onRefinementComplete?.(imageUrl);

      const assistantMessage: ConversationMessage = {
        id: `msg-${Date.now()}-assistant`,
        type: 'assistant',
        content: 'Here\'s your refined image. What would you like to adjust next?',
        image: imageUrl,
        timestamp: new Date(),
      };

      setConversation(prev => [...prev, assistantMessage]);
      
      // Update base image for next iteration
      const newBlob = await fetch(imageUrl).then(r => r.blob());
      const newFile = new File([newBlob], 'refined-image.png', { type: 'image/png' });
      setBaseImage(newFile);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      
      const errorMessage: ConversationMessage = {
        id: `msg-${Date.now()}-error`,
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetConversation = () => {
    setConversation([]);
    setCurrentImage(baseImageUrl);
    setError(null);
    if (baseImageUrl && baseImage) {
      const initialMessage: ConversationMessage = {
        id: `msg-${Date.now()}`,
        type: 'assistant',
        content: 'Conversation reset. How can I help you refine this image?',
        image: baseImageUrl,
        timestamp: new Date(),
      };
      setConversation([initialMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Iterative Refinement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        {!baseImageUrl && (
          <div className="space-y-2">
            <Label htmlFor="refinement-upload">Upload an image to start refining</Label>
            <Input
              id="refinement-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
        )}

        {/* Upload Prompt */}
        {!baseImageUrl && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Upload className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium mb-2">Start with an image</p>
            <p className="text-sm">
              Upload an image and have a conversation to refine it step by step
            </p>
          </div>
        )}

        {/* Conversation Area */}
        {baseImageUrl && (
          <div className="space-y-4">
            {/* Control Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetConversation}
                className="flex-1"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Reset
              </Button>
              {currentImage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentImage) {
                      const link = document.createElement('a');
                      link.href = currentImage;
                      link.download = 'refined-image.png';
                      link.click();
                    }
                  }}
                  className="flex-1"
                >
                  <Download className="mr-1 h-3 w-3" />
                  Download
                </Button>
              )}
            </div>

            {/* Conversation Messages */}
            <div className="max-h-96 overflow-y-auto space-y-3 p-3 border rounded-lg bg-muted/20">
              {conversation.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] space-y-2 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border'
                    } rounded-lg p-3`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {message.image && (
                      <div className="rounded-md overflow-hidden">
                        <img
                          src={message.image}
                          alt="Refined image"
                          className="w-full h-auto max-h-48 object-contain"
                        />
                      </div>
                    )}
                    <div className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-background border rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Processing your request...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Describe what you'd like to change about the image..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 min-h-[60px] resize-none"
                rows={2}
              />
              <Button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isProcessing}
                size="icon"
                className="self-end mb-1"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}