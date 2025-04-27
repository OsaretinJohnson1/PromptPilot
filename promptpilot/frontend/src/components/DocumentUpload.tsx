"use client";

import { useState } from "react";

interface DocumentUploadProps {
  onUploadComplete: () => void;
  onContentAdded: (type: "document" | "text", name: string) => void;
}

export default function DocumentUpload({
  onUploadComplete,
  onContentAdded,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [showPasteText, setShowPasteText] = useState(false);
  const [pastedText, setPastedText] = useState("");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await handleFiles(files);
    }
  };

  const handlePasteText = async () => {
    if (!pastedText.trim()) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress("Processing text...");

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "process_text",
          text: pastedText,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to process text");
      }

      setUploadProgress("Text processed successfully!");
      setShowPasteText(false);
      setPastedText("");
      onContentAdded("text", "Pasted Text");
      onUploadComplete();
    } catch (error) {
      console.error("Text processing failed:", error);
      setError(
        error instanceof Error ? error.message : "Failed to process text"
      );
      setUploadProgress("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFiles = async (files: File[]) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress("Starting upload...");

    try {
      const formData = new FormData();
      files.forEach((file) => {
        console.log("Adding file to formData:", file.name);
        formData.append("files", file);
      });

      setUploadProgress("Uploading to server...");
      console.log("Sending request to server...");

      const response = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      console.log("Server response status:", response.status);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Upload failed");
      }

      const data = await response.json();
      console.log("Upload successful:", data);
      setUploadProgress("Processing files...");

      // Wait a moment to show the processing message
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setUploadProgress("Upload complete!");
      files.forEach((file) => onContentAdded("document", file.name));
      onUploadComplete();
    } catch (error) {
      console.error("Upload failed:", error);
      setError(
        error instanceof Error ? error.message : "Failed to upload files"
      );
      setUploadProgress("");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">PromptPilot</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your AI-powered document analysis assistant. Upload documents or
            paste text to get instant insights and answers to your questions.
          </p>
          <div className="mt-4 flex justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Upload PDF or TXT files</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Paste text directly</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Ask questions</span>
            </div>
          </div>
        </div>
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
          isDragging
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-gray-300 hover:border-blue-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-5xl mb-2 transform transition-transform duration-300 hover:scale-110">
            📄
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Upload Your Documents
          </h2>
          <p className="text-gray-600">
            Drag and drop your PDF or text files here, or click to browse
          </p>

          <input
            type="file"
            multiple
            accept=".pdf,.txt"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            disabled={isUploading}
          />

          <label
            htmlFor="file-upload"
            className={`inline-block px-6 py-3 bg-blue-500 text-white rounded-xl cursor-pointer hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>{isUploading ? "Uploading..." : "Select Files"}</span>
            </div>
          </label>

          <div className="mt-3">
            <button
              onClick={() => setShowPasteText(!showPasteText)}
              className="text-blue-500 hover:text-blue-600 font-medium text-sm"
            >
              {showPasteText ? "Hide Text Input" : "Or Paste Text Instead"}
            </button>
          </div>

          {showPasteText && (
            <div className="mt-3">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your text here..."
                className="w-full h-24 px-3 py-2 text-sm text-gray-600 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isUploading}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handlePasteText}
                  disabled={isUploading || !pastedText.trim()}
                  className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Process Text
                </button>
              </div>
            </div>
          )}

          {uploadProgress && (
            <div className="mt-3">
              <div className="text-blue-500 text-sm font-medium">
                {uploadProgress}
              </div>
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-500 h-1.5 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-50 text-red-500 rounded-xl flex items-center gap-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500">
            <p>Supported file types: PDF, TXT</p>
            <p>Maximum file size: 10MB per file</p>
          </div>
        </div>
      </div>
    </div>
  );
}
