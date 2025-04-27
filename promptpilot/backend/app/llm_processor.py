import os
import logging
from groq import Groq
from typing import List
from dotenv import load_dotenv

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class LLMProcessor:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            error_msg = "GROQ_API_KEY environment variable is not set. Please set it in your .env file or environment variables."
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        try:
            self.client = Groq(api_key=api_key)
            self.model = "llama-3.3-70b-versatile"
            logger.info("Successfully initialized Groq client")
        except Exception as e:
            error_msg = f"Failed to initialize Groq client: {str(e)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
    def generate_answer(self, question: str, context: List[str]) -> str:
        """Generate an answer based on the question and context."""
        try:
            # Combine context chunks into a single string
            context_text = "\n".join(context)
            
            # Create prompt template
            prompt = f"""You are a helpful AI assistant. Use the following context to answer the question.
If you cannot find the answer in the context, say "I cannot find the answer in the provided context."

Context:
{context_text}

Question: {question}

Answer:"""
            
            logger.info("Sending request to Groq API")
            # Generate answer using Groq
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant that answers questions based on the provided context."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1024,
                top_p=0.9
            )
            
            answer = response.choices[0].message.content.strip()
            logger.info("Successfully received response from Groq API")
            return answer
            
        except Exception as e:
            error_msg = f"Error generating answer: {str(e)}"
            logger.error(error_msg)
            return error_msg
    
    def format_context(self, chunks: List[str]) -> str:
        """Format context chunks for better readability."""
        return "\n\n".join([f"Chunk {i+1}: {chunk}" for i, chunk in enumerate(chunks)]) 