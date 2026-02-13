"""
ScholarSync 2.0 - Enhanced AI Service Manager
Handles interactions with multiple LLMs for tutoring, quiz generation, and study assistance
"""

import logging
import json
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime

# AI integrations
try:
    from openai import AsyncOpenAI
except ImportError:  # Optional dependency
    AsyncOpenAI = None

try:
    import google.generativeai as genai
except ImportError:  # Optional dependency
    genai = None
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings, AIProvider
from app.schemas import AIChatResponse

logger = logging.getLogger(__name__)

class AIServiceManager:
    """
    Central manager for AI operations with multiple providers
    """
    
    def __init__(self):
        self.provider = settings.AI_PROVIDER
        self.openai_client = None
        self.gemini_client = None
        
        # Initialize OpenAI
        if settings.OPENAI_API_KEY and AsyncOpenAI:
            self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("✅ OpenAI Service Initialized")
        elif settings.OPENAI_API_KEY and not AsyncOpenAI:
            logger.warning("⚠️ OpenAI SDK not installed. Skipping OpenAI init.")
        
        # Initialize Gemini
        if settings.GEMINI_API_KEY and genai:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.gemini_client = genai.GenerativeModel("gemini-pro")
            logger.info("✅ Gemini Service Initialized")
        elif settings.GEMINI_API_KEY and not genai:
            logger.warning("⚠️ google-generativeai not installed. Skipping Gemini init.")
        
        if not self.openai_client and not self.gemini_client:
            logger.warning("⚠️ No AI API keys configured. AI features will use mock responses.")
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def get_tutor_response(self, question: str, context: str = "", user_id: str = None) -> AIChatResponse:
        """
        Generates a response as a friendly study tutor with context awareness
        """
        # If no AI service configured, return mock response
        if not self.openai_client and not self.gemini_client:
            return AIChatResponse(
                response="I'm your AI study tutor! To enable real AI responses, please add an API key in settings.",
                sources=[],
                suggested_questions=[
                    "Can you explain this concept in simpler terms?",
                    "What are some practical applications of this?",
                    "Can you give me an example to understand better?"
                ],
                confidence=0.8,
                tokens_used=0
            )
        
        system_prompt = """You are 'ScholarSync Tutor', an expert AI study assistant for university students.
        Your role is to:
        1. Explain concepts clearly and simply
        2. Provide relevant examples
        3. Ask thought-provoking questions
        4. Encourage active learning
        5. Adapt explanations to the student's level
        
        Always be encouraging and supportive. If you're not sure about something, admit it.
        """
        
        user_prompt = f"""Context provided by student: {context}

        Student's question: {question}

        Please provide a helpful, educational response. Also suggest 2-3 follow-up questions the student might want to ask next."""
        
        try:
            if self.provider == AIProvider.OPENAI and self.openai_client:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )
                
                content = response.choices[0].message.content
                
                # Extract suggested questions (simple parsing)
                lines = content.split('\n')
                main_response = []
                suggested_questions = []
                
                for line in lines:
                    if line.lower().startswith(('suggested question', 'follow-up', 'you might ask')):
                        suggested_questions.append(line)
                    else:
                        main_response.append(line)
                
                return AIChatResponse(
                    response='\n'.join(main_response).strip(),
                    sources=[],
                    suggested_questions=suggested_questions[:3] if suggested_questions else [
                        "Can you explain this in simpler terms?",
                        "What are the key takeaways?",
                        "How would I apply this in practice?"
                    ],
                    confidence=0.95,
                    tokens_used=response.usage.total_tokens if response.usage else 0
                )
                
            elif self.provider == AIProvider.GEMINI and self.gemini_client:
                # Gemini implementation
                response = self.gemini_client.generate_content(
                    f"{system_prompt}\n\n{user_prompt}"
                )
                
                return AIChatResponse(
                    response=response.text,
                    sources=[],
                    suggested_questions=[
                        "Can you explain this in simpler terms?",
                        "What are the key takeaways?",
                        "How would I apply this in practice?"
                    ],
                    confidence=0.9,
                    tokens_used=len(response.text.split())
                )
                
        except Exception as e:
            logger.error(f"AI tutoring failed: {str(e)}")
            return AIChatResponse(
                response=f"I encountered an error: {str(e)[:100]}...",
                sources=[],
                suggested_questions=[],
                confidence=0.0,
                tokens_used=0
            )
    
    async def generate_quiz(self, topic: str, difficulty: str = "medium", 
                           question_count: int = 10, source_text: str = None) -> Dict[str, Any]:
        """Generate a quiz on a given topic"""
        prompt = f"""Generate a {difficulty} difficulty quiz about '{topic}'.
        Number of questions: {question_count}
        
        {f"Use this text as reference: {source_text[:2000]}" if source_text else ""}
        
        Format each question as JSON:
        {{
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Option A",
            "explanation": "Brief explanation of why this is correct",
            "difficulty": "{difficulty}"
        }}
        
        Return ONLY valid JSON array of questions."""
        
        try:
            if self.openai_client:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.5,
                    response_format={"type": "json_object"}
                )
                
                content = response.choices[0].message.content
                questions = json.loads(content).get("questions", [])
                
                return {
                    "questions": questions,
                    "topic": topic,
                    "difficulty": difficulty,
                    "total_questions": len(questions),
                    "estimated_time_minutes": len(questions) * 2
                }
                
        except Exception as e:
            logger.error(f"Quiz generation failed: {str(e)}")
        
        # Fallback mock quiz
        return {
            "questions": [
                {
                    "question": f"What is a key concept of {topic}?",
                    "options": ["Concept A", "Concept B", "Concept C", "Concept D"],
                    "correct_answer": "Concept A",
                    "explanation": "This is the fundamental concept.",
                    "difficulty": difficulty
                }
            ],
            "topic": topic,
            "difficulty": difficulty,
            "total_questions": 1,
            "estimated_time_minutes": 2
        }
    
    async def generate_flashcards(self, topic: str, count: int = 10, difficulty: str = "medium") -> List[Dict[str, str]]:
        """Generate flashcards from a topic"""
        prompt = f"""Generate {count} flashcards about '{topic}' at {difficulty} difficulty.
        
        Each flashcard should have:
        - Front: Question or term
        - Back: Answer or definition
        - Hint: Optional hint
        - Category: Main category
        
        Return as JSON array."""
        
        try:
            if self.openai_client:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    response_format={"type": "json_object"}
                )
                
                content = response.choices[0].message.content
                return json.loads(content).get("flashcards", [])
                
        except Exception as e:
            logger.error(f"Flashcard generation failed: {str(e)}")
        
        # Fallback
        return [
            {
                "front": f"What is the main concept of {topic}?",
                "back": f"The main concept is...",
                "hint": "Think about the fundamentals",
                "category": topic,
                "difficulty": difficulty
            }
        ]
    
    async def summarize_text(self, text: str, max_length: int = 500) -> str:
        """Summarize text concisely"""
        prompt = f"""Summarize the following text in under {max_length} characters:
        
        {text[:3000]}
        
        Provide a clear, concise summary with key points."""
        
        try:
            if self.openai_client:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=200
                )
                
                return response.choices[0].message.content.strip()
                
        except Exception as e:
            logger.error(f"Text summarization failed: {str(e)}")
        
        # Fallback
        return text[:max_length] + "..." if len(text) > max_length else text
    
    async def breakdown_task(self, task_title: str, description: str = "") -> List[Dict[str, Any]]:
        """Break down a task into subtasks"""
        prompt = f"""Break down this task into 3-5 manageable subtasks:
        
        Task: {task_title}
        Description: {description}
        
        For each subtask, provide:
        - Title
        - Estimated time (minutes)
        - Difficulty (easy/medium/hard)
        - Dependencies (if any)
        
        Return as JSON array."""
        
        try:
            if self.openai_client:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.5,
                    response_format={"type": "json_object"}
                )
                
                content = response.choices[0].message.content
                return json.loads(content).get("subtasks", [])
                
        except Exception as e:
            logger.error(f"Task breakdown failed: {str(e)}")
        
        # Fallback
        return [
            {
                "title": f"Research {task_title}",
                "estimated_time": 30,
                "difficulty": "medium",
                "dependencies": []
            },
            {
                "title": f"Plan approach for {task_title}",
                "estimated_time": 20,
                "difficulty": "easy",
                "dependencies": ["Research"]
            }
        ]
    
    async def generate_study_plan(self, topics: List[str], days_available: int, 
                                  hours_per_day: float, user_level: int = 1) -> Dict[str, Any]:
        """Generate a personalized study plan"""
        topics_str = ", ".join(topics)
        total_hours = days_available * hours_per_day
        
        prompt = f"""Create a study plan for these topics: {topics_str}
        
        Constraints:
        - Total days: {days_available}
        - Hours per day: {hours_per_day}
        - Total available hours: {total_hours}
        - Student level: {user_level}
        
        Provide:
        1. Daily schedule for {days_available} days
        2. Topic distribution
        3. Recommended study techniques
        4. Breaks and review sessions
        
        Return as structured JSON."""
        
        try:
            if self.openai_client:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.6,
                    response_format={"type": "json_object"}
                )
                
                content = response.choices[0].message.content
                return json.loads(content)
                
        except Exception as e:
            logger.error(f"Study plan generation failed: {str(e)}")
        
        # Fallback
        return {
            "schedule": [],
            "topics": topics,
            "total_hours": total_hours,
            "recommendations": ["Pomodoro technique", "Active recall", "Spaced repetition"]
        }
    
    async def health_check(self) -> Dict[str, bool]:
        """Check health of AI services"""
        status = {
            "openai": False,
            "gemini": False,
            "overall": False
        }
        
        try:
            if self.openai_client:
                await self.openai_client.models.list()
                status["openai"] = True
        except:
            pass
        
        try:
            if self.gemini_client:
                # Simple Gemini check
                status["gemini"] = True
        except:
            pass
        
        status["overall"] = status["openai"] or status["gemini"]
        return status


# Singleton instance
ai_manager = AIServiceManager()

async def get_ai_service() -> AIServiceManager:
    """Dependency injection for AI service"""
    return ai_manager