import React, { useState, useRef } from 'react';
import { Upload, Download, Lock, Unlock, Image as ImageIcon, Sparkles, Shield, X, Trash2, KeyRound, Github } from 'lucide-react';
import { SteganographyService } from './services/steganography';

function Toast({ message, type = 'success', onClose }) {
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg backdrop-blur-lg transition-all duration-300 animate-slideUp ${
      type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
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
  const [verifying, setVerifying] = useState(false);
  const fileInputRef = useRef(null);

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
        const encodedBlob = await SteganographyService.encode(
          file,
          message,
          isProtected ? SteganographyService.METHODS.protected : SteganographyService.METHODS.default,
          password
        );
        const url = URL.createObjectURL(encodedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'secure_image.png';
        link.click();
        showToast('Process completed successfully');
        setMessage('');
        setPassword('');
      } else {
        const decoded = await SteganographyService.decode(
          file,
          isProtected ? SteganographyService.METHODS.protected : SteganographyService.METHODS.default,
          password
        );
        setDecodedMessage(decoded);
        showToast('Process completed successfully');
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
      <div className="fixed top-0 left-[10rem] w-[600px] h-[400px] -translate-x-1/2 -translate-y-1/2">
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

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-emerald-400 mb-4">
            Steganography Studio
          </h1>
          <p className="text-emerald-300/70">
            Secure your messages within images using advanced steganography
          </p>
        </div>

        <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-900/30">
          {/* Mode Selection */}
          <div className="max-w-sm mx-auto mb-8">
            <div className="bg-black/80 p-1.5 rounded-xl">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMode('encode');
                    setDecodedMessage('');
                  }}
                  className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                    mode === 'encode'
                      ? 'bg-emerald-900/50 text-emerald-400 shadow-emerald-900/50 shadow-sm'
                      : 'text-emerald-500/70 hover:bg-emerald-900/30'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Process</span>
                </button>
                <button
                  onClick={() => {
                    setMode('decode');
                    setMessage('');
                    if (file) verifyImage(file);
                  }}
                  className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                    mode === 'decode'
                      ? 'bg-emerald-900/50 text-emerald-400 shadow-emerald-900/50 shadow-sm'
                      : 'text-emerald-500/70 hover:bg-emerald-900/30'
                  }`}
                >
                  <Unlock className="w-4 h-4" />
                  <span>Extract</span>
                </button>
              </div>
            </div>
          </div>

          {mode === 'encode' && (
            <div className="flex justify-center mb-8">
              <button
                onClick={() => setIsProtected(!isProtected)}
                className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  isProtected
                    ? 'bg-emerald-900/50 text-emerald-400 shadow-emerald-900/50 shadow-sm'
                    : 'bg-black/60 text-emerald-500/70 hover:bg-emerald-900/30'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Password Protection</span>
              </button>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* File Upload Area */}
            <div
              className={`relative transition-all min-h-[300px] rounded-xl border-2 border-dashed ${
                dragActive
                  ? 'border-emerald-400 bg-emerald-900/20'
                  : 'border-emerald-800 hover:border-emerald-700'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {!preview ? (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="p-4 rounded-full bg-emerald-900/30 mb-4">
                    <ImageIcon className="h-8 w-8 text-emerald-400" />
                  </div>
                  <p className="text-emerald-400/70 text-sm">
                    Drop image here or click to upload
                  </p>
                </div>
              ) : (
                <div className="relative group h-full">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 rounded-xl">
                    <button
                      onClick={handleRemoveImage}
                      className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
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

            {/* Message Input/Output Area */}
            <div className="space-y-4">
              {mode === 'encode' ? (
                <>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full h-[200px] px-4 py-3 bg-black/60 rounded-lg border border-emerald-900/50 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none text-sm text-emerald-300 placeholder-emerald-700"
                    placeholder="Enter your message..."
                  />
                  {isProtected && (
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter encryption password"
                        className="w-full px-4 py-2 pl-10 bg-black/60 rounded-lg border border-emerald-900/50 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm text-emerald-300 placeholder-emerald-700"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {decodedMessage && (
                    <div className="h-[200px] p-4 bg-black/60 rounded-lg border border-emerald-900/50 overflow-auto">
                      <p className="text-sm text-emerald-300 whitespace-pre-wrap">
                        {decodedMessage}
                      </p>
                    </div>
                  )}
                  {isProtected && (
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter decryption password"
                        className="w-full px-4 py-2 pl-10 bg-black/60 rounded-lg border border-emerald-900/50 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm text-emerald-300 placeholder-emerald-700"
                      />
                    </div>
                  )}
                </>
              )}

              <button
                onClick={handleSubmit}
                disabled={!file || loading || (mode === 'encode' && !message)}
                className={`w-full py-2 px-4 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                  !file || loading || (mode === 'encode' && !message)
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
          href="https://github.com/Kushal129"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-emerald-500/70 hover:text-emerald-400 transition-colors"
        >
          <Github className="w-4 h-4" />
          <span>Created by Kushal</span>
        </a>
      </footer>
    </div>
  );
}

export default App;