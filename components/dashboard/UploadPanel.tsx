import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { AnalysisResult } from '@/lib/api';

interface UploadPanelProps {
  className?: string;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

type TabType = 'video' | 'text';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const UploadPanel: React.FC<UploadPanelProps> = ({ className = '', onAnalysisComplete }) => {
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Video specific state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Text file upload state
  const [textFile, setTextFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFileInputRef = useRef<HTMLInputElement>(null);
  const cancelTokenSource = useRef<axios.CancelTokenSource | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  // Cancel upload handler
  const handleCancel = useCallback(() => {
    if (cancelTokenSource.current) {
      cancelTokenSource.current.cancel('Upload cancelled by user');
    }
    setIsUploading(false);
    setLoading(false);
    setUploadProgress(null);
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  }, [filePreview]);

  // Handle video file selection
  const handleVideoSelect = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    // Check file size (limit to 100MB for edge devices)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size exceeds 100MB limit for edge devices');
      return;
    }

    setError(null);
    setSelectedFile(file);
    
    // Create preview URL for video
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
  }, []);

  // Handle video upload with progress
  const handleVideoUpload = useCallback(async (file?: File) => {
    const fileToUpload = file || selectedFile;
    if (!fileToUpload) return;

    setLoading(true);
    setIsUploading(true);
    setUploadProgress({ loaded: 0, total: fileToUpload.size, percentage: 0 });
    setError(null);

    // Create cancel token
    cancelTokenSource.current = axios.CancelToken.source();

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const response = await axios.post<AnalysisResult>(
        `${API_BASE_URL}/analyze/video`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          cancelToken: cancelTokenSource.current.token,
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total 
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploadProgress({
              loaded: progressEvent.loaded || 0,
              total: progressEvent.total || fileToUpload.size,
              percentage: progress,
            });
          },
        }
      );

      onAnalysisComplete?.(response.data);
      
      // Reset state after successful upload
      setSelectedFile(null);
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
        setFilePreview(null);
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        setError('Upload cancelled');
      } else {
        setError('Video analysis failed. Please try again.');
        console.error(err);
      }
    } finally {
      setLoading(false);
      setIsUploading(false);
      setUploadProgress(null);
      cancelTokenSource.current = null;
    }
  }, [selectedFile, filePreview, onAnalysisComplete]);

  // Handle text file upload
  const handleTextFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('text/') && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      setError('Please select a valid text file');
      return;
    }

    try {
      const text = await file.text();
      setTextInput(text);
      setTextFile(file);
      setError(null);
    } catch (err) {
      setError('Failed to read text file');
      console.error(err);
    }
  }, []);

  // Handle text analysis
  const handleTextAnalyze = useCallback(async () => {
    if (!textInput.trim()) return;

    setLoading(true);
    setError(null);

    // Create cancel token
    cancelTokenSource.current = axios.CancelToken.source();

    try {
      const response = await axios.post<AnalysisResult>(
        `${API_BASE_URL}/analyze/text`,
        { text: textInput },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          cancelToken: cancelTokenSource.current?.token,
        }
      );

      onAnalysisComplete?.(response.data);
      
      // Reset text input after successful analysis
      setTextInput('');
      setTextFile(null);
    } catch (err) {
      if (axios.isCancel(err)) {
        setError('Analysis cancelled');
      } else {
        setError('Text analysis failed. Please try again.');
        console.error(err);
      }
    } finally {
      setLoading(false);
      cancelTokenSource.current = null;
    }
  }, [textInput, onAnalysisComplete]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (activeTab === 'video') {
        handleVideoSelect(file);
      } else {
        handleTextFileSelect(file);
      }
    }
  }, [activeTab, handleVideoSelect, handleTextFileSelect]);

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleVideoSelect(e.target.files[0]);
    }
  }, [handleVideoSelect]);

  // Handle text file input change
  const handleTextFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleTextFileSelect(e.target.files[0]);
    }
  }, [handleTextFileSelect]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`glass rounded-lg border border-cyber-border ${className}`}>
      <div className="p-4 border-b border-cyber-border">
        <h2 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
          <svg className="w-4 h-4 text-cyber-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload & Analyze
        </h2>
      </div>

      <div className="p-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setActiveTab('video'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'video' 
                ? 'bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30' 
                : 'bg-cyber-card text-cyber-muted border border-cyber-border hover:border-cyber-muted'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Video Detection
          </button>
          <button
            onClick={() => { setActiveTab('text'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'text' 
                ? 'bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30' 
                : 'bg-cyber-card text-cyber-muted border border-cyber-border hover:border-cyber-muted'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Text Analysis
          </button>
        </div>

        {/* Video Upload Section */}
        {activeTab === 'video' ? (
          <div className="space-y-4">
            {/* Drop Zone */}
            {!selectedFile ? (
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                  dragActive 
                    ? 'border-cyber-accent bg-cyber-accent/5' 
                    : 'border-cyber-border hover:border-cyber-muted'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {loading ? (
                  <div className="py-8">
                    <div className="inline-block w-10 h-10 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-sm text-cyber-muted font-mono">ANALYZING VIDEO...</p>
                  </div>
                ) : (
                  <>
                    <svg className="w-10 h-10 mx-auto text-cyber-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-cyber-text mb-2">Drag & drop video file</p>
                    <p className="text-xs text-cyber-muted mb-3">or click to browse</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={loading}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="inline-block px-4 py-2 bg-cyber-accent/10 text-cyber-accent text-xs font-medium rounded-lg border border-cyber-accent/30 hover:bg-cyber-accent/20 transition-colors"
                    >
                      SELECT FILE
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* File Preview & Progress */
              <div className="space-y-3">
                {/* File Info Card */}
                <div className="bg-cyber-card rounded-lg p-3 border border-cyber-border">
                  <div className="flex items-center gap-3">
                    {/* Video Thumbnail */}
                    <div className="w-16 h-16 bg-cyber-dark rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {filePreview ? (
                        <video 
                          src={filePreview} 
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <svg className="w-8 h-8 text-cyber-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    
                    {/* File Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-cyber-text truncate font-medium">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-cyber-muted">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    {!isUploading && (
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          if (filePreview) {
                            URL.revokeObjectURL(filePreview);
                            setFilePreview(null);
                          }
                        }}
                        className="p-1.5 text-cyber-muted hover:text-cyber-danger transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {isUploading && uploadProgress && (
                  <div className="bg-cyber-card rounded-lg p-3 border border-cyber-border">
                    <div className="flex justify-between text-xs text-cyber-muted mb-2">
                      <span>Uploading...</span>
                      <span className="font-mono">{uploadProgress.percentage}%</span>
                    </div>
                    <div className="h-2 bg-cyber-border rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyber-accent rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-cyber-muted mt-2">
                      <span>{formatFileSize(uploadProgress.loaded)}</span>
                      <span>{formatFileSize(uploadProgress.total)}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {isUploading ? (
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-cyber-danger/10 hover:bg-cyber-danger/20 text-cyber-danger border border-cyber-danger/30 rounded-lg py-2.5 text-sm font-medium transition-all"
                    >
                      CANCEL UPLOAD
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVideoUpload()}
                      disabled={loading || !selectedFile}
                      className="flex-1 bg-cyber-accent/10 hover:bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30 rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'ANALYZING...' : 'START ANALYSIS'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Text Analysis Section */
          <div className="space-y-3">
            {/* Text Input */}
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste text content for phishing detection..."
              disabled={loading}
              rows={5}
              className="w-full bg-cyber-card border border-cyber-border rounded-lg p-3 text-cyber-text placeholder-cyber-muted/50 focus:outline-none focus:border-cyber-accent/50 focus:ring-1 focus:ring-cyber-accent/20 transition-all resize-none font-mono text-sm"
            />

            {/* Text File Upload */}
            <div className="flex items-center gap-2">
              <input
                ref={textFileInputRef}
                type="file"
                accept=".txt,.md,text/*"
                onChange={handleTextFileChange}
                className="hidden"
                disabled={loading}
              />
              <button
                onClick={() => textFileInputRef.current?.click()}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-cyber-card border border-cyber-border rounded-lg text-sm text-cyber-muted hover:border-cyber-muted transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {textFile ? textFile.name : 'Upload Text File'}
              </button>
              {textFile && (
                <button
                  onClick={() => setTextFile(null)}
                  className="p-1.5 text-cyber-muted hover:text-cyber-danger transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleTextAnalyze}
              disabled={loading || !textInput.trim()}
              className="w-full bg-cyber-accent/10 hover:bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30 rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ANALYZING...' : 'ANALYZE TEXT'}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-3 p-3 bg-cyber-danger/10 border border-cyber-danger/30 rounded-lg">
            <p className="text-xs text-cyber-danger">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPanel;
