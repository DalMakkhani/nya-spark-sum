import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, FileText, Brain, Sparkles, Shield, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface UploadState {
  isDragging: boolean;
  isUploading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  success: boolean;
}

const Summarizer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [displayedSummary, setDisplayedSummary] = useState<string>('');
  const [uploadState, setUploadState] = useState<UploadState>({
    isDragging: false,
    isUploading: false,
    isAnalyzing: false,
    error: null,
    success: false
  });

  // Typewriter effect for summary display
  useEffect(() => {
    if (summary && summary !== displayedSummary) {
      setDisplayedSummary('');
      let index = 0;
      const timer = setInterval(() => {
        if (index < summary.length) {
          setDisplayedSummary(prev => prev + summary[index]);
          index++;
        } else {
          clearInterval(timer);
        }
      }, 15); // Adjust speed here (lower = faster)

      return () => clearInterval(timer);
    }
  }, [summary]);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:application/pdf;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const validatePDF = (file: File): boolean => {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  };

  const handleFileUpload = async (selectedFile: File) => {
    if (!validatePDF(selectedFile)) {
      setUploadState(prev => ({ ...prev, error: 'Please select a valid PDF file.' }));
      return;
    }

    setFile(selectedFile);
    setUploadState(prev => ({ 
      ...prev, 
      isUploading: true, 
      isAnalyzing: true, 
      error: null,
      success: false 
    }));
    setSummary('');
    setDisplayedSummary('');

    try {
      const base64 = await convertToBase64(selectedFile);
      
      const response = await fetch('https://jtwx63qbu1.execute-api.us-east-1.amazonaws.com/default/pdf-summarizer-function', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: base64 }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const summaryText = await response.text();
      
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        isAnalyzing: false, 
        success: true 
      }));
      
      setSummary(summaryText);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        isAnalyzing: false, 
        error: 'Failed to analyze the document. Please try again.' 
      }));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragging: false }));
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragging: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragging: false }));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setSummary('');
    setDisplayedSummary('');
    setUploadState({
      isDragging: false,
      isUploading: false,
      isAnalyzing: false,
      error: null,
      success: false
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute top-20 left-10 opacity-10 z-0">
        <Brain className="h-16 w-16 text-primary animate-float" style={{ animationDelay: '0s' }} />
      </div>
      <div className="absolute top-40 right-20 opacity-10 z-0">
        <Shield className="h-12 w-12 text-accent animate-float" style={{ animationDelay: '1.5s' }} />
      </div>
      <div className="absolute bottom-40 left-20 opacity-10 z-0">
        <Sparkles className="h-14 w-14 text-primary-glow animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 rounded-full glass border border-primary/20 mb-6">
            <FileText className="h-4 w-4 text-primary mr-2" />
            <span className="text-sm text-primary font-medium">AI-Powered Document Analysis</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="block text-foreground">NyaAI</span>
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Summarizer
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Upload your PDF documents and get intelligent summaries powered by NyaAI.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="glass p-8 rounded-xl border border-border/20 animate-scale-in">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Upload className="h-6 w-6 text-primary mr-3" />
                Upload Document
              </h2>

              {!file ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-300 ${
                    uploadState.isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Drag and drop your PDF here
                  </p>
                  <p className="text-muted-foreground mb-6">
                    or click to browse files
                  </p>
                  
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button 
                    variant="neon" 
                    size="lg" 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="cursor-pointer"
                  >
                    Browse Files
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 glass rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-primary mr-3" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    {uploadState.success && (
                      <CheckCircle className="h-6 w-6 text-accent" />
                    )}
                  </div>

                  <Button 
                    onClick={resetUpload} 
                    variant="outline" 
                    className="w-full"
                    disabled={uploadState.isAnalyzing}
                  >
                    Upload Different File
                  </Button>
                </div>
              )}

              {/* Loading State */}
              {uploadState.isAnalyzing && (
                <div className="mt-6 p-6 glass rounded-lg text-center animate-scale-in">
                  <div className="flex items-center justify-center mb-4">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mr-3" />
                    <Brain className="h-8 w-8 text-primary-glow animate-pulse" />
                  </div>
                  <p className="text-lg font-medium text-primary mb-2">
                    Analyzing Document...
                  </p>
                  <p className="text-muted-foreground">
                    Our AI is processing your PDF and generating insights
                  </p>
                </div>
              )}

              {/* Error State */}
              {uploadState.error && (
                <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center animate-scale-in">
                  <AlertCircle className="h-5 w-5 text-destructive mr-3 flex-shrink-0" />
                  <p className="text-destructive">{uploadState.error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary Section */}
          <div className="space-y-6">
            <div className="glass p-8 rounded-xl border border-border/20 animate-scale-in">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Brain className="h-6 w-6 text-primary mr-3" />
                AI Summary
              </h2>

              {!summary && !uploadState.isAnalyzing && (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    Upload a PDF document to see the AI-generated summary here
                  </p>
                </div>
              )}

              {displayedSummary && (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-primary mb-4">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-semibold text-primary mb-3">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-medium text-primary mb-2">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-4 text-foreground">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-4 space-y-1 text-foreground">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-foreground">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-primary">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-accent">{children}</em>
                      ),
                      a: ({ children, href }) => (
                        <a 
                          href={href} 
                          className="text-primary hover:text-primary-glow underline transition-colors"
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {displayedSummary}
                  </ReactMarkdown>
                  {displayedSummary.length < summary.length && (
                    <span className="inline-block w-0.5 h-5 bg-primary animate-pulse ml-1" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <div className="glass p-6 rounded-lg hover-lift text-center">
            <Brain className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Advanced AI Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Powered by state-of-the-art language models for accurate summarization
            </p>
          </div>
          <div className="glass p-6 rounded-lg hover-lift text-center">
            <Shield className="h-8 w-8 text-accent mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Secure Processing</h3>
            <p className="text-sm text-muted-foreground">
              Your documents are processed securely and not stored on our servers
            </p>
          </div>
          <div className="glass p-6 rounded-lg hover-lift text-center">
            <Sparkles className="h-8 w-8 text-primary-glow mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Instant Results</h3>
            <p className="text-sm text-muted-foreground">
              Get comprehensive summaries in seconds, not minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summarizer;