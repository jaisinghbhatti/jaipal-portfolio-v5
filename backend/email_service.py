from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from fastapi import HTTPException
import os
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

# Email configuration
conf = ConnectionConfig(
    MAIL_USERNAME=os.environ.get('SMTP_USER', ''),
    MAIL_PASSWORD=os.environ.get('SMTP_PASS', ''),
    MAIL_FROM=os.environ.get('SMTP_USER', ''),
    MAIL_PORT=int(os.environ.get('SMTP_PORT', 587)),
    MAIL_SERVER=os.environ.get('SMTP_HOST', 'smtp.gmail.com'),
    MAIL_FROM_NAME="Jaipal Singh Portfolio",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=Path(__file__).parent / 'templates'
)

# Initialize FastMail
fm = FastMail(conf)

# Initialize Jinja2 environment
template_env = Environment(loader=FileSystemLoader(Path(__file__).parent / 'templates'))

async def send_contact_email(name: str, email: str, message: str):
    """Send contact form email to Jaipal Singh"""
    try:
        # Create email content
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h1 style="color: white; margin: 0; text-align: center;">New Contact Form Submission</h1>
                <p style="color: #e0e7ff; text-align: center; margin: 10px 0 0 0;">From your portfolio website</p>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h2 style="color: #1e293b; margin-top: 0;">Contact Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0;">Name:</td>
                        <td style="padding: 10px; color: #1e293b; border-bottom: 1px solid #e2e8f0;">{name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0;">Email:</td>
                        <td style="padding: 10px; color: #1e293b; border-bottom: 1px solid #e2e8f0;">{email}</td>
                    </tr>
                </table>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px;">
                <h2 style="color: #1e293b; margin-top: 0;">Message</h2>
                <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #2563eb;">
                    <p style="margin: 0; line-height: 1.6; color: #374151;">{message}</p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; margin: 0;">
                    This email was sent from your portfolio website contact form.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Create message
        message_schema = MessageSchema(
            subject=f"New Contact Form Submission from {name}",
            recipients=[os.environ.get('TO_EMAIL', 'jaisinghbhatti@gmail.com')],
            body=html_content,
            subtype="html"
        )
        
        # Send email
        await fm.send_message(message_schema)
        return True
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

async def send_confirmation_email(name: str, email: str):
    """Send confirmation email to the person who submitted the form"""
    try:
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h1 style="color: white; margin: 0; text-align: center;">Thank You for Your Message!</h1>
            </div>
            
            <div style="padding: 20px;">
                <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hi {name},</p>
                
                <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                    Thank you for reaching out through my portfolio website. I've received your message and will get back to you within 24-48 hours.
                </p>
                
                <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                    I'm excited to discuss potential opportunities and how we can work together.
                </p>
                
                <div style="margin: 30px 0; padding: 20px; background: #f0f9ff; border-left: 4px solid #2563eb; border-radius: 5px;">
                    <p style="margin: 0; color: #1e40af; font-weight: 500;">
                        Best regards,<br>
                        Jaipal Singh<br>
                        Senior Marketing Manager & Digital Marketing Leader
                    </p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; margin: 0;">
                    This is an automated confirmation email from Jaipal Singh's portfolio website.
                </p>
            </div>
        </body>
        </html>
        """
        
        message_schema = MessageSchema(
            subject="Thank you for your message - Jaipal Singh",
            recipients=[email],
            body=html_content,
            subtype="html"
        )
        
        await fm.send_message(message_schema)
        return True
        
    except Exception as e:
        print(f"Error sending confirmation email: {str(e)}")
        # Don't raise exception for confirmation email failure
        return False