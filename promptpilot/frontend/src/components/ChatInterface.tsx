"use client";

import { useState, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ContentItem {
  id: string;
  type: "document" | "text";
  name: string;
  timestamp: string;
  isActive: boolean;
}

interface ChatInterfaceProps {
  initialContentHistory: Array<{ type: "document" | "text"; name: string }>;
}

export default function ChatInterface({
  initialContentHistory,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentHistory, setContentHistory] = useState<ContentItem[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteText, setShowPasteText] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");

  // Initialize content history from props
  useEffect(() => {
    const initialItems: ContentItem[] = initialContentHistory.map((item) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: item.type,
      name: item.name,
      timestamp: new Date().toLocaleString(),
      isActive: true,
    }));
    setContentHistory(initialItems);
  }, [initialContentHistory]);

  // Save content history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("contentHistory", JSON.stringify(contentHistory));
  }, [contentHistory]);

  const handleUploadNewDocument = () => {
    // Clear messages and localStorage
    setMessages([]);
    localStorage.removeItem("documentUploaded");
    window.location.reload();
  };

  const toggleContentActive = (id: string) => {
    setContentHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isActive: !item.isActive } : item
      )
    );
  };

  const removeContent = (id: string) => {
    setContentHistory((prev) => prev.filter((item) => item.id !== id));
  };

  // Check if documents are indexed
  useEffect(() => {
    const checkDocuments = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "test" }),
        });

        if (!response.ok) {
          const data = await response.json();
          if (data.detail?.includes("No documents indexed")) {
            // If no documents are indexed, clear localStorage and reload
            localStorage.removeItem("documentUploaded");
            window.location.reload();
          }
        }
      } catch (error) {
        console.error("Error checking documents:", error);
      }
    };

    checkDocuments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to get response");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "Sorry, I could not process your request.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Sorry, there was an error connecting to the server.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await handleFiles(files);
    }
  };

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

  const handleFiles = async (files: File[]) => {
    setIsLoading(true);
    setError(null);
    setUploadProgress("Starting upload...");

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      setUploadProgress("Uploading to server...");
      const response = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Upload failed");
      }

      const data = await response.json();
      setUploadProgress("Processing files...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setUploadProgress("Upload complete!");
      files.forEach((file) => {
        const newItem: ContentItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: "document",
          name: file.name,
          timestamp: new Date().toLocaleString(),
          isActive: true,
        };
        setContentHistory((prev) => [...prev, newItem]);
      });
      setShowUploadModal(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to upload files"
      );
      setUploadProgress("");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteText = async () => {
    if (!pastedText.trim()) return;

    setIsLoading(true);
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

      const newItem: ContentItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: "text",
        name: "Pasted Text",
        timestamp: new Date().toLocaleString(),
        isActive: true,
      };
      setContentHistory((prev) => [...prev, newItem]);
      setShowUploadModal(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to process text"
      );
      setUploadProgress("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[500px] bg-white rounded-lg shadow-lg">
      {/* Sidebar */}
      <div
        className={`w-64 border-r bg-gray-50 transition-all duration-300 ${
          showSidebar ? "block" : "hidden"
        }`}
      >
        <div className="p-3 border-b">
          <h3 className="text-base font-semibold text-gray-800">
            Content History
          </h3>
          <p className="text-xs text-gray-500">
            Track your documents and pasted content
          </p>
        </div>

        <div className="p-3 space-y-3">
          {contentHistory.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">
              No content added yet
            </p>
          ) : (
            contentHistory.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-2 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.isActive ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-800">
                      {item.name}
                    </span>
                  </div>
                  <button
                    onClick={() => removeContent(item.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{item.type}</span>
                  <span className="text-xs text-gray-500">
                    {item.timestamp}
                  </span>
                </div>
                <button
                  onClick={() => toggleContentActive(item.id)}
                  className={`mt-1 w-full text-xs px-2 py-1 rounded ${
                    item.isActive
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  }`}
                >
                  {item.isActive ? "Hide from Search" : "Include in Search"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-3 border-b">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-800">PromptPilot</h2>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
            Add Content
          </button>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Add Content
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-all duration-300 ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-3">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-sm text-gray-600">
                    Drag and drop your PDF or text files here, or click to
                    browse
                  </p>

                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt"
                    onChange={handleFileInput}
                    className="hidden"
                    id="modal-file-upload"
                    disabled={isLoading}
                  />

                  <label
                    htmlFor="modal-file-upload"
                    className={`inline-block px-4 py-2 bg-blue-500 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-600 transition-all ${
                      isLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Select Files
                  </label>

                  <div className="mt-3">
                    <button
                      onClick={() => setShowPasteText(!showPasteText)}
                      className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                      {showPasteText
                        ? "Hide Text Input"
                        : "Or Paste Text Instead"}
                    </button>
                  </div>

                  {showPasteText && (
                    <div className="mt-3">
                      <textarea
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Paste your text here..."
                        className="w-full h-24 px-3 py-2 text-sm text-gray-600 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={isLoading}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handlePasteText}
                          disabled={isLoading || !pastedText.trim()}
                          className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Process Text
                        </button>
                      </div>
                    </div>
                  )}

                  {uploadProgress && (
                    <div className="mt-3">
                      <div className="text-blue-500 text-sm">
                        {uploadProgress}
                      </div>
                      {isLoading && (
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

                  <div className="mt-3 text-xs text-gray-500">
                    <p>Supported file types: PDF, TXT</p>
                    <p>Maximum file size: 10MB per file</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-600 mt-6">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-lg font-semibold mb-1">
                Welcome to PromptPilot!
              </p>
              <p className="text-sm text-gray-500">
                Ask any question about your uploaded document.
              </p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                  message.role === "user"
                    ? "bg-blue-500 text-white ml-4"
                    : "bg-gray-100 text-gray-800 mr-4"
                }`}
              >
                <div className="flex items-center mb-1">
                  <span className="text-sm font-medium">
                    {message.role === "user" ? "You" : "Assistant"}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 rounded-2xl p-3 shadow-sm mr-4">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t p-3 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your document..."
              className="flex-1 px-3 py-2 text-sm text-gray-600 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <span className="text-sm">Send</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
