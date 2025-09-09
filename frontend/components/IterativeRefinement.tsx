import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, MessageSquare, Send, Upload, RotateCcw, Download, Bot, User, ZoomIn, Copy } from 'lucide-react';

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
  initialImages?: File[];
  onImagesChange?: (images: File[]) => void;
}

export function IterativeRefinement({ initialImage, onRefinementComplete, initialImages = [], onImagesChange }: IterativeRefinementProps) {
  const [baseImage, setBaseImage] = useState<File | null>(initialImages[0] || null);
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(
    initialImages[0] ? URL.createObjectURL(initialImages[0]) : initialImage || null
  );
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

  // Handle when an initialImage is provided from other tabs
  useEffect(() => {
    if (initialImage && !baseImageUrl && conversation.length === 0) {
      // Convert base64 image to File for processing
      fetch(initialImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'shared-image.png', { type: 'image/png' });
          setBaseImage(file);
          setBaseImageUrl(initialImage);
          setCurrentImage(initialImage);
          
          // Add initial message with the shared image
          const initialMessage: ConversationMessage = {
            id: `msg-${Date.now()}`,
            type: 'assistant',
            content: 'I can see you have an image from another tab. What would you like me to help you refine?',
            image: initialImage,
            timestamp: new Date(),
          };
          setConversation([initialMessage]);
          onImagesChange?.([file]);
        })
        .catch(err => {
          console.error('Error loading shared image:', err);
          setError('Failed to load shared image');
        });
    }
  }, [initialImage, baseImageUrl, conversation.length, onImagesChange]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBaseImage(file);
      const url = URL.createObjectURL(file);
      setBaseImageUrl(url);
      setCurrentImage(url);
      setConversation([]);
      setError(null);
      onImagesChange?.([file]);
      
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

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.success && data.imageUrl) {
        setCurrentImage(data.imageUrl);
        onRefinementComplete?.(data.imageUrl);

        const assistantMessage: ConversationMessage = {
          id: `msg-${Date.now()}-assistant`,
          type: 'assistant',
          content: 'Here\'s your refined image. What would you like to adjust next?',
          image: data.imageUrl,
          timestamp: new Date(),
        };

        setConversation(prev => [...prev, assistantMessage]);
        
        // Update base image for next iteration - convert base64 to file
        try {
          const response = await fetch(data.imageUrl);
          const blob = await response.blob();
          const newFile = new File([blob], 'refined-image.png', { type: 'image/png' });
          setBaseImage(newFile);
        } catch (error) {
          console.warn('Failed to convert refined image to file:', error);
          // Continue without updating base image - the user can still see the result
        }
      } else {
        throw new Error('No image URL received from server');
      }
      
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
          <div 
            className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground"
            role="region"
            aria-label="Upload instructions"
          >
            <Upload className="h-12 w-12 mb-4" aria-hidden="true" />
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
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={resetConversation}
                className="flex-1 h-10 sm:h-8 justify-center"
                aria-label="Reset conversation and start over"
              >
                <RotateCcw className="mr-2 h-4 w-4 sm:mr-1 sm:h-3 sm:w-3" aria-hidden="true" />
                Reset Conversation
              </Button>
              {currentImage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (currentImage) {
                      try {
                        const response = await fetch(currentImage);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `refined-current-${Date.now()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error('Download failed:', error);
                      }
                    }
                  }}
                  className="flex-1 h-10 sm:h-8 justify-center"
                  aria-label="Download current refined image"
                >
                  <Download className="mr-2 h-4 w-4 sm:mr-1 sm:h-3 sm:w-3" aria-hidden="true" />
                  Download Current
                </Button>
              )}
            </div>

            {/* Conversation Messages */}
            <div 
              className="max-h-[32rem] overflow-y-auto space-y-4 p-4 border rounded-lg bg-muted/20 scroll-smooth"
              role="log"
              aria-label="Conversation history"
              aria-live="polite"
            >
              {conversation.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} group`}
                  role="article"
                  aria-label={`${message.type === 'user' ? 'Your' : 'Assistant'} message from ${message.timestamp.toLocaleTimeString()}`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted border-2 border-background'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Bot className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 max-w-[80%] lg:max-w-[70%] space-y-3`}>
                    {/* Message bubble */}
                    <div className={`rounded-xl px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-background border-2 border-muted rounded-tl-sm shadow-sm'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>

                    {/* Image Display with Enhanced UX */}
                    {message.image && (
                      <div className="space-y-3">
                        <div className="group/image relative rounded-lg overflow-hidden border-2 border-muted bg-muted/50">
                          <img
                            src={message.image}
                            alt="Generated or refined image"
                            className="w-full h-auto max-h-64 object-contain transition-transform duration-200 hover:scale-[1.02] cursor-pointer"
                            onClick={() => {
                              // Open image in new tab for better viewing
                              const newWindow = window.open(message.image, '_blank');
                              if (newWindow) newWindow.focus();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                const newWindow = window.open(message.image, '_blank');
                                if (newWindow) newWindow.focus();
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label="Click to view image in full size"
                          />
                          
                          {/* Image overlay actions */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity duration-200">
                            <div className="flex gap-1">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0 bg-background/90 hover:bg-background backdrop-blur-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newWindow = window.open(message.image, '_blank');
                                  if (newWindow) newWindow.focus();
                                }}
                                title="View full size"
                              >
                                <ZoomIn className="h-3 w-3" aria-hidden="true" />
                                <span className="sr-only">View image in full size</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Image Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={async () => {
                              try {
                                const response = await fetch(message.image!);
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `refined-${message.timestamp.getTime()}.png`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                              } catch (error) {
                                console.error('Download failed:', error);
                              }
                            }}
                          >
                            <Download className="h-3 w-3 mr-1.5" aria-hidden="true" />
                            Download
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(message.image!);
                                // Could add a toast notification here
                              } catch (err) {
                                console.warn('Failed to copy image URL:', err);
                              }
                            }}
                            title="Copy image URL"
                          >
                            <Copy className="h-3 w-3 mr-1.5" aria-hidden="true" />
                            <span className="hidden sm:inline">Copy URL</span>
                            <span className="sr-only">Copy image URL to clipboard</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className={`text-xs opacity-60 ${
                      message.type === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {message.timestamp.toLocaleString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Enhanced Loading State */}
              {isProcessing && (
                <div className="flex gap-3 group" role="status" aria-label="Processing your request">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted border-2 border-background">
                    <Bot className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="flex-1 max-w-[80%] lg:max-w-[70%]">
                    <div className="bg-background border-2 border-muted rounded-xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                        <span className="text-sm text-muted-foreground">Processing your request...</span>
                      </div>
                      <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/30 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} aria-hidden="true" />
            </div>

            {/* Message Input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Textarea
                  placeholder="Describe what you'd like to change about the image..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 min-h-[80px] sm:min-h-[60px] resize-none text-sm"
                  rows={3}
                  aria-label="Describe your image refinement request"
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
              <Button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isProcessing}
                size="default"
                className="sm:self-end sm:mb-1 h-12 sm:h-10 min-w-[120px] sm:min-w-0 sm:w-10"
                aria-label={isProcessing ? "Processing request..." : "Send message"}
              >
                <Send className="h-4 w-4 sm:mr-0 mr-2" />
                <span className="sm:hidden">Send Message</span>
                <span className="sr-only">{isProcessing ? "Processing request..." : "Send refinement request"}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div 
            className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm"
            role="alert"
            aria-live="assertive"
            aria-label="Error message"
          >
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Error</h3>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}