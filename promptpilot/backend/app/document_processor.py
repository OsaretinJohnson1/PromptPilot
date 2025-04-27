from pathlib import Path
import PyPDF2
from typing import List, Dict
import json
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=10000,
            stop_words='english',
            ngram_range=(1, 2)  # Include both single words and pairs of words
        )
        self.documents = []
        self.chunk_size = 2000  # Increased chunk size for better context
        self.chunk_overlap = 300  # Increased overlap to prevent context loss
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
                    text += page.extract_text() + "\n"
                
                # Clean and normalize text
                text = self._clean_text(text)
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
                # Clean and normalize text
                text = self._clean_text(text)
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
    
    def process_pasted_text(self, text: str) -> List[str]:
        """Process pasted text and split into chunks."""
        try:
            logger.info("Processing pasted text")
            # Clean and normalize text
            text = self._clean_text(text)
            logger.info(f"Processed {len(text)} characters from pasted text")
            
            # Split text into chunks
            chunks = self._split_text(text)
            logger.info(f"Created {len(chunks)} chunks from pasted text")
            
            # Log first chunk for debugging
            if chunks:
                logger.info(f"First chunk preview: {chunks[0][:100]}...")
            
            return chunks
        except Exception as e:
            logger.error(f"Error processing pasted text: {str(e)}")
            raise
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s.,!?-]', '', text)
        # Normalize whitespace
        text = ' '.join(text.split())
        return text
    
    def _split_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks."""
        try:
            logger.info("Starting text chunking process")
            chunks = []
            
            # Split by paragraphs first
            paragraphs = text.split('\n\n')
            current_chunk = ""
            
            for paragraph in paragraphs:
                # If adding this paragraph would exceed chunk size, save current chunk
                if len(current_chunk) + len(paragraph) > self.chunk_size:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = paragraph
                else:
                    current_chunk += "\n\n" + paragraph if current_chunk else paragraph
            
            # Add the last chunk if it exists
            if current_chunk:
                chunks.append(current_chunk.strip())
            
            # Ensure chunks aren't too small
            chunks = [chunk for chunk in chunks if len(chunk) > 100]
            
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
    
    def search(self, query: str, k: int = 5) -> List[str]:
        """Search for similar chunks using TF-IDF and cosine similarity."""
        try:
            if not self.documents:
                raise ValueError("No documents indexed. Please process documents first.")
            
            logger.info(f"Searching for query: {query}")
            
            # Preprocess query to improve matching
            query = self._clean_text(query)
            
            # Transform query and documents
            query_vec = self.vectorizer.transform([query])
            doc_vecs = self.vectorizer.transform(self.documents)
            
            # Calculate similarities
            similarities = cosine_similarity(query_vec, doc_vecs).flatten()
            
            # Get top k similar documents with a lower minimum similarity threshold
            min_similarity = 0.05  # Lowered threshold to catch more relevant chunks
            top_k_idx = np.argsort(similarities)[-k:][::-1]
            top_k_idx = [i for i in top_k_idx if similarities[i] > min_similarity]
            
            if not top_k_idx:
                logger.warning("No chunks found above similarity threshold, using top k chunks")
                # Fallback to top k chunks regardless of threshold
                top_k_idx = np.argsort(similarities)[-k:][::-1]
            
            # Sort chunks by their position in the document to maintain context flow
            sorted_indices = sorted(top_k_idx)
            results = [self._truncate_chunk(self.documents[i]) for i in sorted_indices]
            
            # Log similarity scores for debugging
            for i, idx in enumerate(sorted_indices):
                logger.info(f"Chunk {i+1} similarity score: {similarities[idx]:.3f}")
            
            logger.info(f"Found {len(results)} relevant chunks")
            return results
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            raise
    
    def _truncate_chunk(self, chunk: str, max_length: int = 1000) -> str:
        """Truncate a chunk to a maximum length while preserving sentence boundaries."""
        if len(chunk) <= max_length:
            return chunk
            
        # Find the last sentence boundary before max_length
        last_period = chunk[:max_length].rfind('.')
        if last_period > 0:
            return chunk[:last_period + 1]
        return chunk[:max_length] + "..."
    
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