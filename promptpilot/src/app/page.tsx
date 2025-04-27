"use client";

import { useState } from "react";
import DocumentUpload from "@/components/DocumentUpload";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  const [isDocumentUploaded, setIsDocumentUploaded] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl text-gray-600 font-bold text-center mb-8">Smart Q&A Web App</h1>

      <div className="max-w-4xl mx-auto">
        {!isDocumentUploaded ? (
          <DocumentUpload
            onUploadComplete={() => setIsDocumentUploaded(true)}
          />
        ) : (
          <ChatInterface />
        )}
      </div>
    </div>
  );
}
