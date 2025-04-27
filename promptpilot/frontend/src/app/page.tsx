"use client";

import { useState } from "react";
import DocumentUpload from "@/components/DocumentUpload";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const [contentHistory, setContentHistory] = useState<
    Array<{ type: "document" | "text"; name: string }>
  >([]);

  const handleUploadComplete = () => {
    console.log("Upload complete, switching to chat interface");
    setShowChat(true);
  };

  const handleContentAdded = (type: "document" | "text", name: string) => {
    setContentHistory((prev) => [...prev, { type, name }]);
  };

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        
        {!showChat ? (
          <DocumentUpload
            onUploadComplete={handleUploadComplete}
            onContentAdded={handleContentAdded}
          />
        ) : (
          <ChatInterface initialContentHistory={contentHistory} />
        )}
      </div>
    </main>
  );
}
