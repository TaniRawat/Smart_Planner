"""
ScholarSync 2.0 - Authentication Service
Handles email sending, verification, password reset, and welcome emails
"""

import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import uuid

from app.config import settings

logger = logging.getLogger(__name__)

def send_verification_email(email: str, user_id: uuid.UUID) -> bool:
    """
    Send email verification link to user
    Returns True if email sent successfully
    """
    if not settings.SMTP_HOST:
        logger.warning("SMTP not configured, skipping verification email")
        return False
    
    try:
        # Create verification token (in production, use JWT)
        verification_token = str(user_id)  # Simplified
        
        # Create email
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Verify Your ScholarSync Account"
        msg["From"] = settings.SMTP_USER
        msg["To"] = email
        
        # Email content
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{verification_token}"
        
        html = f"""
        <html>
          <body>
            <h2>Welcome to ScholarSync! 🎓</h2>
            <p>Thank you for creating an account. Please verify your email address to get started:</p>
            <p>
              <a href="{verification_url}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px;">
                Verify Email Address
              </a>
            </p>
            <p>Or copy this link: {verification_url}</p>
            <p>The link expires in 24 hours.</p>
            <p>If you didn't create this account, you can safely ignore this email.</p>
            <br>
            <p>Happy studying!<br>The ScholarSync Team</p>
          </body>
        </html>
        """
        
        text = f"""
        Welcome to ScholarSync!
        
        Please verify your email address by visiting:
        {verification_url}
        
        The link expires in 24 hours.
        
        If you didn't create this account, you can safely ignore this email.
        
        Happy studying!
        The ScholarSync Team
        """
        
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Verification email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email: {str(e)}")
        return False

def send_password_reset_email(email: str, reset_token: str) -> bool:
    """
    Send password reset email
    """
    if not settings.SMTP_HOST:
        logger.warning("SMTP not configured, skipping password reset email")
        return False
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Reset Your ScholarSync Password"
        msg["From"] = settings.SMTP_USER
        msg["To"] = email
        
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{reset_token}"
        
        html = f"""
        <html>
          <body>
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p>
              <a href="{reset_url}" style="background-color: #2196F3; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px;">
                Reset Password
              </a>
            </p>
            <p>Or copy this link: {reset_url}</p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
            <br>
            <p>The ScholarSync Team</p>
          </body>
        </html>
        """
        
        text = f"""
        Password Reset Request
        
        Click here to reset your password:
        {reset_url}
        
        This link expires in 1 hour.
        
        If you didn't request a password reset, please ignore this email.
        
        The ScholarSync Team
        """
        
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        
        msg.attach(part1)
        msg.attach(part2)
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Password reset email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")
        return False

def send_welcome_email(email: str, username: str) -> bool:
    """
    Send welcome email after verification
    """
    if not settings.SMTP_HOST:
        logger.warning("SMTP not configured, skipping welcome email")
        return False
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Welcome to ScholarSync! 🎉"
        msg["From"] = settings.SMTP_USER
        msg["To"] = email
        
        html = f"""
        <html>
          <body>
            <h2>Welcome to ScholarSync, {username}! 🎉</h2>
            <p>Your account is now fully activated and ready to use.</p>
            
            <h3>Getting Started:</h3>
            <ul>
              <li><strong>Create your first task</strong> - Start organizing your study schedule</li>
              <li><strong>Try the AI Tutor</strong> - Get help with difficult concepts</li>
              <li><strong>Join a study group</strong> - Collaborate with other students</li>
              <li><strong>Track your progress</strong> - Earn XP and level up</li>
            </ul>
            
            <h3>Pro Tips:</h3>
            <ul>
              <li>Use Pomodoro timer for better focus</li>
              <li>Break large tasks into subtasks</li>
              <li>Review flashcards daily</li>
              <li>Maintain your streak for bonus XP</li>
            </ul>
            
            <p>Need help? Check out our <a href="{settings.FRONTEND_URL}/help">Help Center</a> or reply to this email.</p>
            
            <br>
            <p>Happy studying and productive learning!<br>The ScholarSync Team</p>
          </body>
        </html>
        """
        
        text = f"""
        Welcome to ScholarSync, {username}! 🎉
        
        Your account is now fully activated.
        
        Getting Started:
        - Create your first task
        - Try the AI Tutor
        - Join a study group
        - Track your progress
        
        Need help? Check out our Help Center at {settings.FRONTEND_URL}/help
        
        Happy studying!
        The ScholarSync Team
        """
        
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        
        msg.attach(part1)
        msg.attach(part2)
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Welcome email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send welcome email: {str(e)}")
        return False

def send_streak_notification(email: str, streak_days: int) -> bool:
    """
    Send streak milestone notification
    """
    if not settings.SMTP_HOST:
        logger.warning("SMTP not configured, skipping streak notification")
        return False
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🎯 {streak_days} Day Streak! Keep Going!"
        msg["From"] = settings.SMTP_USER
        msg["To"] = email
        
        html = f"""
        <html>
          <body>
            <h2>🔥 Amazing! {streak_days} Day Study Streak! 🔥</h2>
            <p>You've studied for {streak_days} consecutive days. That's incredible consistency!</p>
            
            <div style="background-color: #FFF3CD; padding: 15px; border-radius: 5px; border-left: 5px solid #FFC107;">
              <h3>🎁 Streak Rewards:</h3>
              <ul>
                <li><strong>+{streak_days * 5} XP</strong> added to your account</li>
                <li><strong>Special achievement unlocked</strong> for {streak_days} days</li>
                <li><strong>Increased focus power</strong> - you're building great habits!</li>
              </ul>
            </div>
            
            <h3>Next Milestone:</h3>
            <p>Keep going for {_next_streak_milestone(streak_days)} days to unlock even greater rewards!</p>
            
            <p>Your dedication is inspiring. Keep up the great work! 💪</p>
            
            <br>
            <p>Stay consistent, stay awesome!<br>The ScholarSync Team</p>
          </body>
        </html>
        """
        
        text = f"""
        Amazing! {streak_days} Day Study Streak! 🔥
        
        You've studied for {streak_days} consecutive days.
        
        Streak Rewards:
        - +{streak_days * 5} XP added to your account
        - Special achievement unlocked
        - Increased focus power
        
        Next Milestone: {_next_streak_milestone(streak_days)} days
        
        Keep up the great work!
        The ScholarSync Team
        """
        
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        
        msg.attach(part1)
        msg.attach(part2)
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Streak notification sent to {email} for {streak_days} days")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send streak notification: {str(e)}")
        return False

def _next_streak_milestone(current_streak: int) -> int:
    """Calculate next streak milestone"""
    milestones = [3, 7, 14, 30, 60, 90, 180, 365]
    
    for milestone in milestones:
        if current_streak < milestone:
            return milestone
    
    return current_streak + 7  # Weekly after 1 year