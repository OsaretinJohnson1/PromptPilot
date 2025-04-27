"use client";

import { useState } from "react";

interface DocumentUploadProps {
  onUploadComplete: () => void;
}

export default function DocumentUpload({
  onUploadComplete,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");

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
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="space-y-4">
        <div className="text-6xl mb-4">📄</div>
        <h2 className="text-2xl font-semibold">Upload Your Documents</h2>
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
          className={`inline-block px-6 py-3 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors ${
            isUploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isUploading ? "Uploading..." : "Select Files"}
        </label>

        {uploadProgress && (
          <div className="text-blue-500 mt-2">{uploadProgress}</div>
        )}

        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  );
}
