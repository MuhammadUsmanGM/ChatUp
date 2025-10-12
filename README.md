# ChatUp - Advanced AI Chat Interface

## Overview
ChatUp is a sophisticated chat application that combines modern web technologies with powerful AI capabilities. The platform features a user-friendly interface with secure authentication, real-time chat functionality, and seamless AI integration powered by Google's Gemini model.

## Features

### 🔐 Authentication & Security
- **User Registration & Login**: Secure account creation with email verification
- **Password Management**: Secure password hashing with PBKDF2-SHA256
- **Session Management**: JWT-based authentication system
- **Email Verification**: Automatic verification email system
- **Password Reset**: Secure password reset functionality with token-based validation
- **Account Security**: Two-factor authentication and secure password requirements

### 💬 Chat Functionality
- **Real-time Messaging**: Interactive chat interface with smooth animations
- **Chat History**: Persistent chat history stored in MongoDB
- **AI-Powered Responses**: Gemini AI integration for intelligent conversations
- **Web Search Integration**: Tavily-powered web search for current information
- **Typing Indicators**: Real-time typing status for better UX

### 🎨 User Experience
- **Responsive Design**: Mobile-first responsive interface with adaptive layouts
- **Dark/Light Theme**: Toggle between dark and light themes with local storage persistence
- **Glassmorphism UI**: Modern glassmorphism effects throughout the interface
- **Smooth Animations**: CSS animations for enhanced user experience
- **File Upload**: Avatar upload and profile customization

### 🛠️ Technical Architecture
- **Backend**: Flask-powered REST API
- **Database**: MongoDB with PyMongo integration
- **Authentication**: JWT tokens with secure session management
- **AI Integration**: Google Gemini API via OpenAI-compatible interface
- **Search**: Tavily API integration for real-time web search
- **Email**: SMTP-based email system for verification and notifications

### 📊 Data Management
- **User Profiles**: Complete user profile management with avatar support
- **Chat History**: Organized chat history with title generation and timestamp tracking
- **Data Validation**: Comprehensive client and server-side validation
- **Security**: Input sanitization and security best practices

### 🎯 Additional Features
- **Profile Management**: Edit profile details, change passwords, update avatars
- **Account Deletion**: Secure account removal with password verification
- **Email Masking**: Privacy-focused email display with reveal functionality
- **Contact Support**: Integrated support system with email notifications

## Technology Stack

### Frontend
- **HTML5 & CSS3**: Semantic markup and modern styling with CSS Grid/Flexbox
- **JavaScript (ES6+)**: Client-side logic, API communication, and UI interactions
- **Font Awesome**: Icon library for intuitive interface elements
- **Google Fonts**: Poppins font family for consistent typography

### Backend
- **Python Flask**: REST API framework for backend services
- **PyMongo**: MongoDB driver for database operations
- **Werkzeug**: Security utilities and password hashing
- **Flask-CORS**: Cross-origin resource sharing support

### AI & External Services
- **Google Gemini API**: AI-powered chat responses
- **Tavily API**: Web search functionality for current information
- **SMTP**: Email support for verification and notifications

### Database
- **MongoDB**: NoSQL database for user data and chat history
- **PyMongo**: Python driver for MongoDB operations

## Architecture Highlights

### Security
- Passwords are hashed using PBKDF2-SHA256 with salt_length=10
- JWT tokens for secure session management
- Input validation on both client and server sides
- CORS configured for secure API communication

### Scalability
- MongoDB for flexible data storage
- Modular code architecture with separation of concerns
- Asynchronous processing where appropriate
- Efficient API endpoints optimized for performance

### User Experience
- Responsive design supporting mobile, tablet, and desktop
- Intuitive UI with clear navigation and feedback
- Fast loading times with optimized assets
- Consistent branding and theming throughout the application

## Deployment

The application requires the following environment variables:
- `GEMINI_API_KEY`: Google Gemini API key
- `TAVILY_API_KEY`: Tavily API key for web search
- `EMAIL_ADDRESS`: SMTP email address for notifications
- `EMAIL_PASSWORD`: SMTP email password
- `MONGODB_URI`: MongoDB connection string

## API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login
- `POST /verify-password` - Password verification
- `POST /request-password-reset` - Password reset request
- `POST /reset-password` - Password reset

### User Management
- `POST /change-password` - Change user password
- `POST /update-profile` - Update user profile
- `DELETE /delete-account` - Delete user account
- `GET /verify-email/<token>` - Email verification

### Chat Functionality
- `POST /chat` - Process chat messages with AI
- `GET /chat-history` - Get user's chat history
- `DELETE /chat-history/<chat_id>` - Delete specific chat

### Support
- `POST /contact-support` - Submit support request

## Conclusion

ChatUp represents a modern, secure, and feature-rich chat application that leverages advanced AI technology to provide meaningful conversations. The platform combines strong security practices with an intuitive user interface, making it suitable for both casual and professional use. With its modular architecture, the application can be easily extended with additional features while maintaining performance and security standards.