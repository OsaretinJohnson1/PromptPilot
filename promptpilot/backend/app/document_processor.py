from pathlib import Path
import PyPDF2
from typing import List, Dict
import json
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.documents = []
        self.chunk_size = 500  # characters per chunk
        self.chunk_overlap = 50  # characters overlap between chunks
        logger.info("DocumentProcessor initialized")
        
    def process_pdf(self, file_path: Path) -> List[str]:
        """Extract text from PDF and split into chunks."""
        try:
            logger.info(f"Processing PDF file: {file_path}")
            chunks = []
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text()
                
                logger.info(f"Extracted {len(text)} characters from PDF")
                # Split text into chunks
                chunks = self._split_text(text)
                logger.info(f"Created {len(chunks)} chunks from PDF")
                
                # Log first chunk for debugging
                if chunks:
                    logger.info(f"First chunk preview: {chunks[0][:100]}...")
                
            return chunks
        except Exception as e:
            logger.error(f"Error processing PDF {file_path}: {str(e)}")
            raise
    
    def process_text(self, file_path: Path) -> List[str]:
        """Process text file and split into chunks."""
        try:
            logger.info(f"Processing text file: {file_path}")
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
                logger.info(f"Read {len(text)} characters from text file")
                chunks = self._split_text(text)
                logger.info(f"Created {len(chunks)} chunks from text file")
                
                # Log first chunk for debugging
                if chunks:
                    logger.info(f"First chunk preview: {chunks[0][:100]}...")
                
                return chunks
        except Exception as e:
            logger.error(f"Error processing text file {file_path}: {str(e)}")
            raise
    
    def _split_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks."""
        try:
            logger.info("Starting text chunking process")
            chunks = []
            start = 0
            text_length = len(text)
            
            while start < text_length:
                end = start + self.chunk_size
                if end > text_length:
                    end = text_length
                chunk = text[start:end]
                chunks.append(chunk)
                start = end - self.chunk_overlap
                logger.debug(f"Created chunk {len(chunks)}: {len(chunk)} characters")
            
            logger.info(f"Split text into {len(chunks)} chunks")
            return chunks
        except Exception as e:
            logger.error(f"Error splitting text: {str(e)}")
            raise
    
    def create_index(self, chunks: List[str]):
        """Create TF-IDF vectors from text chunks."""
        try:
            logger.info(f"Creating index from {len(chunks)} chunks")
            self.documents = chunks
            logger.info("Fitting TF-IDF vectorizer")
            self.vectorizer.fit(chunks)
            logger.info("Index created successfully")
            
            # Log some statistics
            if chunks:
                avg_length = sum(len(c) for c in chunks) / len(chunks)
                logger.info(f"Average chunk length: {avg_length:.2f} characters")
                logger.info(f"Total chunks: {len(chunks)}")
                logger.info(f"First chunk preview: {chunks[0][:100]}...")
        except Exception as e:
            logger.error(f"Error creating index: {str(e)}")
            raise
    
    def search(self, query: str, k: int = 3) -> List[str]:
        """Search for similar chunks using TF-IDF and cosine similarity."""
        try:
            if not self.documents:
                raise ValueError("No documents indexed. Please process documents first.")
            
            logger.info(f"Searching for query: {query}")
            # Transform query and documents
            query_vec = self.vectorizer.transform([query])
            doc_vecs = self.vectorizer.transform(self.documents)
            
            # Calculate similarities
            similarities = cosine_similarity(query_vec, doc_vecs).flatten()
            
            # Get top k similar documents
            top_k_idx = np.argsort(similarities)[-k:][::-1]
            
            results = [self.documents[i] for i in top_k_idx]
            logger.info(f"Found {len(results)} relevant chunks")
            return results
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            raise
    
    def save_index(self, path: Path):
        """Save documents to disk."""
        try:
            logger.info(f"Saving index to {path}")
            with open(path / "documents.json", 'w') as f:
                json.dump(self.documents, f)
            logger.info("Index saved successfully")
        except Exception as e:
            logger.error(f"Error saving index: {str(e)}")
            raise
    
    def load_index(self, path: Path):
        """Load documents from disk."""
        try:
            logger.info(f"Loading index from {path}")
            with open(path / "documents.json", 'r') as f:
                self.documents = json.load(f)
                self.vectorizer.fit(self.documents)
            logger.info("Index loaded successfully")
        except Exception as e:
            logger.error(f"Error loading index: {str(e)}")
            raise 