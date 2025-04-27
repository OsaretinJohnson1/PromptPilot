from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import logging
from pathlib import Path
from .document_processor import DocumentProcessor
from .llm_processor import LLMProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PromptPilot")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Create necessary directories
UPLOAD_DIR = Path("uploads")
INDEX_DIR = Path("index")
UPLOAD_DIR.mkdir(exist_ok=True)
INDEX_DIR.mkdir(exist_ok=True)

# Initialize processors
try:
    document_processor = DocumentProcessor()
    llm_processor = LLMProcessor()
    logger.info("Successfully initialized processors")
except Exception as e:
    logger.error(f"Failed to initialize processors: {str(e)}")
    raise

@app.get("/")
async def read_root():
    return {"message": "Welcome to Smart Q&A API"}

@app.post("/api/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    try:
        logger.info(f"Received upload request for {len(files)} files")
        uploaded_files = []
        all_chunks = []
        
        for file in files:
            logger.info(f"Processing file: {file.filename}")
            # Save file
            file_path = UPLOAD_DIR / file.filename
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            uploaded_files.append(file.filename)
            logger.info(f"Saved file: {file_path}")
            
            # Process file based on extension
            if file.filename.endswith('.pdf'):
                logger.info(f"Processing PDF file: {file_path}")
                chunks = document_processor.process_pdf(file_path)
            elif file.filename.endswith('.txt'):
                logger.info(f"Processing text file: {file_path}")
                chunks = document_processor.process_text(file_path)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.filename}")
            
            logger.info(f"Generated {len(chunks)} chunks from {file.filename}")
            all_chunks.extend(chunks)
        
        # Create FAISS index from all chunks
        logger.info(f"Creating index from {len(all_chunks)} total chunks")
        document_processor.create_index(all_chunks)
        
        # Save index for future use
        logger.info("Saving index")
        document_processor.save_index(INDEX_DIR)
        
        logger.info("Upload and processing completed successfully")
        return {
            "message": "Files uploaded and processed successfully",
            "files": uploaded_files,
            "chunks": len(all_chunks)
        }
    except Exception as e:
        logger.error(f"Error in upload_files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(message: str = Body(..., embed=True), text: str = Body(None, embed=True)):
    try:
        logger.info(f"Received chat request with message: {message}")
        
        if message == "process_text" and text:
            # Process pasted text
            chunks = document_processor.process_pasted_text(text)
            document_processor.create_index(chunks)
            return {"response": "Text processed successfully"}
        
        # Regular chat processing
        chunks = document_processor.search(message)
        answer = llm_processor.generate_answer(message, chunks)
        return {"response": answer}
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 