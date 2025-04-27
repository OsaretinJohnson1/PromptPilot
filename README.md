# Smart Q&A Web App

A powerful AI-powered question answering system that allows users to upload documents and ask questions about them in real-time.

## Features

- 📄 Document Upload (PDFs, text files)
- 🤖 AI-powered Question Answering
- 🔍 Fast Document Search with Vector Embeddings
- 💬 Real-time Chat Interface
- 🚀 Scalable Architecture

## Tech Stack

### Frontend

- Next.js 14
- TailwindCSS
- TypeScript
- Vercel Deployment

### Backend

- FastAPI (Python)
- Hugging Face Transformers
- sentence-transformers
- FAISS Vector Database
- Render/AWS Deployment

## Project Structure

```
smart-qa-app/
├── frontend/           # Next.js frontend application
│   ├── src/
│   │   ├── app/       # Next.js app directory
│   │   ├── components/# React components
│   │   └── styles/    # Global styles
│   └── public/        # Static assets
│
└── backend/           # FastAPI backend application
    ├── app/
    │   ├── api/      # API endpoints
    │   ├── core/     # Core functionality
    │   ├── models/   # Data models
    │   └── utils/    # Utility functions
    └── requirements.txt
```

## Getting Started

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## How It Works

1. **Document Upload**: Users upload documents through the web interface
2. **Document Processing**:
   - Documents are split into chunks
   - Each chunk is embedded into vector space
   - Vectors are stored in FAISS index
3. **Question Answering**:
   - User questions are converted to vectors
   - Similar document chunks are retrieved
   - LLM generates answers based on retrieved context
4. **Real-time Response**: Answers are displayed in the chat interface

## License

MIT
