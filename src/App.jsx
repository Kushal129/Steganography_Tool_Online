import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Lock, Unlock, Image as ImageIcon, Sparkles, Shield, X, Trash2, KeyRound, Github, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { SteganographyService } from './services/steganography';

function Toast({ message, type = 'success', onClose }) {
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg backdrop-blur-lg transition-all duration-300 animate-slideUp ${type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
      }`}>
      {type === 'success' ? (
        <Sparkles className="w-5 h-5" />
      ) : (
        <X className="w-5 h-5" />
      )}
      <p className="font-medium">{message}</p>
      <button onClick={onClose} className="ml-4 hover:opacity-70 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function Tutorial({ steps, currentStep, onNext, onClose }) {
  const [targetElement, setTargetElement] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  useEffect(() => {
    const element = document.querySelector(steps[currentStep]?.selector);
    setTargetElement(element);

    if (element) {
      const updatePosition = () => {
        const rect = element.getBoundingClientRect();
        const tooltipHeight = tooltipRef.current?.offsetHeight || 150;
        const padding = 12;
        
        // Calculate available space in different directions
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceLeft = rect.left;
        const spaceRight = window.innerWidth - rect.right;
        
        let top, left;
        
        // Vertical positioning
        if (spaceBelow >= tooltipHeight + padding) {
          // Place below
          top = rect.bottom + padding;
        } else if (spaceAbove >= tooltipHeight + padding) {
          // Place above
          top = rect.top - tooltipHeight - padding;
        } else {
          // Center vertically if no space above or below
          top = Math.max(padding, window.innerHeight / 2 - tooltipHeight / 2);
        }
        
        // Horizontal positioning
        const tooltipWidth = 300; // Fixed tooltip width
        if (rect.left + rect.width / 2 <= window.innerWidth / 2) {
          // Element is in the left half of the screen - align tooltip to the right of the element
          left = Math.min(rect.right + padding, window.innerWidth - tooltipWidth - padding);
        } else {
          // Element is in the right half - align tooltip to the left of the element
          left = Math.max(rect.left - tooltipWidth - padding, padding);
        }

        setTooltipPosition({ 
          top: top + window.scrollY,
          left: Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding))
        });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [currentStep, steps]);

  if (!targetElement) return null;

  const rect = targetElement.getBoundingClientRect();
  const padding = 8;

  return (
    <>
      {/* Semi-transparent overlay */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      
      {/* Highlight border */}
      <div
        className="fixed z-50 bg-yellow-600/20 border-2 border-yellow-500 rounded-lg transition-all duration-300"
        style={{
          top: rect.top - padding + window.scrollY,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        }}
      />
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-black/95 text-yellow-500 p-5 rounded-xl shadow-xl max-w-xs w-[300px] border border-yellow-900/50"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 h-1 bg-yellow-600/30 rounded-t-xl w-full overflow-hidden">
          <div 
            className="h-full bg-yellow-500 transition-all duration-300"
            style={{ 
              width: `${((currentStep + 1) / steps.length) * 100}%` 
            }}
          />
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2 text-yellow-400">
            {steps[currentStep].title || `Step ${currentStep + 1} of ${steps.length}`}
          </h3>
          <p className="text-sm leading-relaxed text-yellow-500/90">
            {steps[currentStep].message}
          </p>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-yellow-600/70">
            {currentStep + 1} of {steps.length}
          </span>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs bg-yellow-950/50 hover:bg-yellow-950/70 rounded-lg transition-colors"
            >
              Skip
            </button>
            {currentStep < steps.length - 1 ? (
              <button
                onClick={onNext}
                className="px-3 py-1.5 text-xs bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors text-white"
              >
                Next
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors text-white"
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('encode');
  const [isProtected, setIsProtected] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [decodedMessage, setDecodedMessage] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const visited = localStorage.getItem('hasVisitedBefore');
    if (!visited) {
      setShowTutorial(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, []);

  const encodingSteps = [
    {
      selector: '[data-tutorial="mode-selection"]',
      title: "Welcome to Steganography Studio",
      message: "This powerful tool lets you hide secret messages within images. We're in 'Encode' mode, where you can embed your message into an image.",
    },
    {
      selector: '[data-tutorial="file-upload"]',
      title: "Select Your Image",
      message: "Start by uploading an image that will carry your secret message. Click here or drag and drop any image file. For best results, use PNG images.",
    },
    {
      selector: '[data-tutorial="password-protection"]',
      title: "Enhanced Security",
      message: "Add an extra layer of security by enabling password protection. Only those with the correct password will be able to extract your message.",
    },
    {
      selector: '[data-tutorial="message-input"]',
      title: "Your Secret Message",
      message: "Type or paste the message you want to hide. The message length is limited by the image size - larger images can store longer messages.",
    },
    {
      selector: '[data-tutorial="process-button"]',
      title: "Process and Save",
      message: "Click 'Process Image' to embed your message. The processed image will automatically download to your device, ready to be shared securely.",
    },
  ];

  const decodingSteps = [
    {
      selector: '[data-tutorial="mode-selection"]',
      title: "Decode Mode",
      message: "You're in 'Decode' mode, where you can reveal hidden messages from processed images. Use the mode toggle to switch between hiding and extracting.",
    },
    {
      selector: '[data-tutorial="file-upload"]',
      title: "Load Processed Image",
      message: "Upload the image containing the hidden message. The system will automatically detect if the image requires a password.",
    },
    {
      selector: '[data-tutorial="extract-button"]',
      title: "Reveal the Message",
      message: "Click 'Extract Data' to reveal the hidden message. The decoded content will appear in a secure display area below.",
    },
  ];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      if (mode === 'decode') {
        await verifyImage(droppedFile);
      }
      handleFileSelection(droppedFile);
    } else {
      showToast('Please upload an image file', 'error');
    }
  };

  const verifyImage = async (selectedFile) => {
    setVerifying(true);
    try {
      const isImageProtected = await SteganographyService.verifyProtection(selectedFile);
      setIsProtected(isImageProtected);
      if (isImageProtected) {
        showToast('This image requires a password for decryption', 'error');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleFileSelection = (selectedFile) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
      }
      if (mode === 'decode') {
        await verifyImage(selectedFile);
      }
      handleFileSelection(selectedFile);
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreview(null);
    setIsProtected(false);
    setDecodedMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTutorialNext = () => {
    setTutorialStep(prev => prev + 1);
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
    setTutorialStep(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    if (isProtected && !password) {
      showToast('Please enter a password', 'error');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'encode') {
        if (!message) {
          showToast('Please enter a message to hide', 'error');
          return;
        }
        const encodedBlob = await SteganographyService.encode(file, message, isProtected ? password : null);
        const url = URL.createObjectURL(encodedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'secure_image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Image processed successfully');
        setMessage('');
        setPassword('');
        handleRemoveImage();
      } else {
        const decoded = await SteganographyService.decode(file, isProtected ? password : null);
        setDecodedMessage(decoded);
        showToast('Message extracted successfully');
        setPassword('');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed top-0 left-[10rem] w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 blur-3xl animate-pulse-slow" />
      </div>
      <div className="fixed top-0 left-[20rem] w-[600px] h-[200px] -translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent blur-2xl animate-pulse-slower" />
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showTutorial && (
        <Tutorial
          steps={mode === 'encode' ? encodingSteps : decodingSteps}
          currentStep={tutorialStep}
          onNext={handleTutorialNext}
          onClose={handleTutorialClose}
        />
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-emerald-600 mb-4">
            Steganography Studio
          </h1>
          <p className="text-emerald-300/70">
            Secure your messages within images using advanced steganography
          </p>
          {!showTutorial && (
            <button
              onClick={() => setShowTutorial(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/30 text-emerald-500 rounded-lg hover:bg-emerald-900/50 transition-colors text-sm"
            >
              <HelpCircle className="w-4 h-4" />
              Show Tutorial
            </button>
          )}
        </div>

        <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-900/30">
          <div className="max-w-sm mx-auto mb-8" data-tutorial="mode-selection">
            <div className="bg-black/80 p-1.5 rounded-xl">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMode('encode');
                    setDecodedMessage('');
                  }}
                  className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${mode === 'encode'
                      ? 'bg-emerald-900/50 text-emerald-600 shadow-emerald-900/50 shadow-sm'
                      : 'text-emerald-600/70 hover:bg-emerald-900/30'
                    }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Encode</span>
                </button>
                <button
                  onClick={() => {
                    setMode('decode');
                    setMessage('');
                    if (file) verifyImage(file);
                  }}
                  className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${mode === 'decode'
                      ? 'bg-emerald-900/50 text-emerald-600 shadow-emerald-900/50 shadow-sm'
                      : 'text-emerald-600/70 hover:bg-emerald-900/30'
                    }`}
                >
                  <Unlock className="w-4 h-4" />
                  <span>Decode</span>
                </button>
              </div>
            </div>
          </div>

          {mode === 'encode' && (
            <div className="flex justify-center mb-8" data-tutorial="password-protection">
              <button
                onClick={() => setIsProtected(!isProtected)}
                className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${isProtected
                    ? 'bg-emerald-900/50 text-emerald-600 shadow-emerald-900/50 shadow-sm'
                    : 'bg-black/60 text-emerald-500/70 hover:bg-emerald-900/30'
                  }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Password Protection</span>
              </button>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <div
              data-tutorial="file-upload"
              className={`relative transition-all min-h-[300px] rounded-xl border-2 border-dashed ${dragActive
                  ? 'border-emerald-600 bg-emerald-900/20'
                  : 'border-emerald-800 hover:border-emerald-700'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {!preview ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                  <div className="p-4 rounded-full bg-emerald-900/30 mb-4">
                    <ImageIcon className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-emerald-600/70 text-sm">
                    Drop image here or click to upload
                  </p>
                </div>
              ) : (
                <div className="relative group h-full">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 rounded-xl">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="p-2 bg-red-500/20 rounded-lg text-red-600 hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4 h-full flex items-center justify-center">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-full max-w-full rounded-lg object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {mode === 'encode' ? (
                <>
                  <textarea
                    data-tutorial="message-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full h-[200px] px-4 py-3 bg-black/60 rounded-lg border border-emerald-900/50 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none text-sm text-emerald-300 placeholder-emerald-700"
                    placeholder="Enter your message..."
                  />
                  {isProtected && (
                    <div data-tutorial="password-input" className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter encryption password"
                        className="w-full px-4 py-2 pl-10 bg-black/60 rounded-lg border border-emerald-900/50 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm text-emerald-300 placeholder-emerald-700"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600/50 hover:text-emerald-500"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {decodedMessage ? (
                    <div className="relative">
                      <div className="relative bg-black/60 rounded-lg border border-emerald-900/50 overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600/20 via-emerald-600/40 to-emerald-600/20 animate-pulse" />

                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-emerald-600" />
                              <span className="text-emerald-600/70 text-xs">
                                {new Date().toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isProtected && (
                                <Shield className="w-4 h-4 text-emerald-600" />
                              )}
                              <span className="text-emerald-600/70 text-xs">
                                {decodedMessage.length} characters
                              </span>
                            </div>
                          </div>

                          <div className="relative group">
                            <div className="h-[160px] overflow-auto custom-scrollbar">
                              <pre className="text-sm text-yellow-500 whitespace-pre-wrap font-mono leading-relaxed">
                                {decodedMessage}
                              </pre>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                          </div>

                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(decodedMessage);
                                showToast('Message copied to clipboard');
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-900/30 text-emerald-600 hover:bg-emerald-900/50 transition-colors flex items-center gap-1.5"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                />
                              </svg>
                              Copy
                            </button>
                            <button
                              onClick={() => {
                                setDecodedMessage('');
                                handleRemoveImage();
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/30 text-red-600 hover:bg-red-900/50 transition-colors flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center bg-black/60 rounded-lg border border-emerald-900/50">
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-emerald-600/30 mx-auto mb-2" />
                        <p className="text-emerald-600/50 text-sm">
                          Upload an image to decode the message
                        </p>
                      </div>
                    </div>
                  )}
                  {isProtected && (
                    <div data-tutorial="password-input" className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter decryption password"
                        className="w-full px-4 py-2 pl-10 bg-black/60 rounded-lg border border-emerald-900/50 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm text-emerald-300 placeholder-emerald-700"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600/50 hover:text-emerald-500"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </>
              )}

              <button
                data-tutorial={mode === 'encode' ? "process-button" : "extract-button"}
                onClick={handleSubmit}
                disabled={!file || loading || (mode === 'encode' && !message)}
                className={`w-full py-2 px-4 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2 ${!file || loading || (mode === 'encode' && !message)
                    ? 'bg-emerald-900/30 text-emerald-700 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-emerald-50 shadow-sm shadow-emerald-900/50'
                  }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-emerald-300/20 border-t-emerald-300 rounded-full animate-spin" />
                ) : mode === 'encode' ? (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Process Image</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Extract Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 py-8 text-center">
        <a
          href="https://github.com/yourusername/steganography-studio"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-emerald-500/70 hover:text-emerald-600 transition-colors"
        >
          <Github className="w-4 h-4" />
          <span>View on GitHub</span>
        </a>
      </footer>
    </div>
  );
}

export default App;