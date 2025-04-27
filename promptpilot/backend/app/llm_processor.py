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
            # Combine context chunks into a single string with clear separation
            context_text = "\n\n---\n\n".join([f"Context {i+1}:\n{chunk}" for i, chunk in enumerate(context)])
            
            # Create enhanced prompt template
            prompt = f"""You are a helpful AI assistant specialized in answering questions based on provided context. Your task is to:

1. Carefully analyze the provided context
2. Answer the question using ONLY information from the context
3. If the answer is not fully available in the context, explain what information is missing
4. If you cannot find any relevant information, say "I cannot find the answer in the provided context"
5. Be specific and detailed in your answers
6. Maintain a professional and clear tone

Context:
{context_text}

Question: {question}

Remember to:
- Base your answer ONLY on the provided context
- Be specific and detailed
- Acknowledge any limitations in the available information
- Maintain a professional tone
- If the context seems unrelated to the question, explicitly state this
- If the context is a table of contents or outline, acknowledge this and explain what information would be needed for a complete answer

Answer:"""
            
            logger.info("Sending request to Groq API")
            # Generate answer using Groq with adjusted parameters
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant that provides detailed, accurate answers based on the provided context. You are thorough in your analysis and clear in your explanations. You always acknowledge when the context is insufficient or unrelated to the question. You are particularly good at identifying when the context is a table of contents or outline and explaining what additional information would be needed."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Further reduced for more focused answers
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

    def generate_answer_from_text(self, question: str, text: str) -> str:
        """Generate an answer directly from pasted text."""
        try:
            # Create enhanced prompt template for direct text
            prompt = f"""You are a helpful AI assistant specialized in answering questions based on provided text. Your task is to:

1. Carefully analyze the provided text
2. Answer the question using ONLY information from the text
3. If the answer is not fully available in the text, explain what information is missing
4. If you cannot find any relevant information, say "I cannot find the answer in the provided text"
5. Be specific and detailed in your answers
6. Maintain a professional and clear tone

Text:
{text}

Question: {question}

Remember to:
- Base your answer ONLY on the provided text
- Be specific and detailed
- Acknowledge any limitations in the available information
- Maintain a professional tone
- If the text seems unrelated to the question, explicitly state this

Answer:"""
            
            logger.info("Sending request to Groq API for pasted text")
            # Generate answer using Groq with adjusted parameters
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant that provides detailed, accurate answers based on the provided text. You are thorough in your analysis and clear in your explanations. You always acknowledge when the text is insufficient or unrelated to the question."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1024,
                top_p=0.9
            )
            
            answer = response.choices[0].message.content.strip()
            logger.info("Successfully received response from Groq API")
            return answer
        except Exception as e:
            error_msg = f"Error generating answer from pasted text: {str(e)}"
            logger.error(error_msg)
            return error_msg 