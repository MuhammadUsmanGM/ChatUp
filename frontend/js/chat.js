// chat.js - Handles chat functionality

document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const messagesContainer = document.getElementById('messages-container');
    const welcomeMessage = document.querySelector('.welcome-message');

    // Send message when button is clicked
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    // Send message when Enter is pressed (without Shift)
    if (messageInput) {
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Function to send message
    function sendMessage() {
        const message = messageInput.value.trim();
        
        if (message) {
            // Add user message to chat
            addMessage(message, 'user');
            
            // Clear input
            messageInput.value = '';
            messageInput.style.height = 'auto';
            
            // Show typing indicator
            showTypingIndicator();
            
            // Simulate bot response after a delay
            setTimeout(() => {
                hideTypingIndicator();
                generateBotResponse(message);
            }, 1000);
        }
    }

    // Function to add a message to the chat
    function addMessage(text, sender) {
        // Remove welcome message if it's the first interaction
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.textContent = text;
        
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Function to show typing indicator
    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        typingIndicator.id = 'typing-indicator';
        
        typingIndicator.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        
        messagesContainer.appendChild(typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Function to hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Function to generate bot response
    function generateBotResponse(userMessage) {
        // Simple responses for demo purposes
        // In the future, this will connect to your backend
        let botResponse;
        
        const lowerCaseMessage = userMessage.toLowerCase();
        
        if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi') || lowerCaseMessage.includes('hey')) {
            botResponse = "Hello! How can I assist you today?";
        } else if (lowerCaseMessage.includes('how are you')) {
            botResponse = "I'm just a bot, but I'm functioning perfectly! How can I help you?";
        } else if (lowerCaseMessage.includes('name')) {
            botResponse = "I'm your friendly ChatUp assistant. What's on your mind?";
        } else if (lowerCaseMessage.includes('thank')) {
            botResponse = "You're welcome! Is there anything else I can help with?";
        } else if (lowerCaseMessage.includes('bye') || lowerCaseMessage.includes('goodbye')) {
            botResponse = "Goodbye! Feel free to come back if you have more questions.";
        } else if (lowerCaseMessage.includes('help')) {
            botResponse = "I can help answer your questions. Just type your query and I'll do my best to assist you!";
        } else {
            // Default responses
            const responses = [
                "That's interesting. Tell me more about that.",
                "I understand. How else can I assist you?",
                "Thanks for sharing. Do you have any other questions?",
                "I'm here to help. What else would you like to know?",
                "That's a great point. Is there anything specific you'd like to discuss?",
                "I've processed your message. How else can I be of service?"
            ];
            botResponse = responses[Math.floor(Math.random() * responses.length)];
        }
        
        // Add bot response to chat
        addMessage(botResponse, 'bot');
    }

    // Function to send message to backend
    async function sendToBackend(message) {
        try {
            // This will be used when the Python backend is implemented
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Include auth token
                },
                body: JSON.stringify({
                    message: message,
                    userId: localStorage.getItem('userEmail')
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error sending message to backend:', error);
            return "Sorry, I'm having trouble connecting to the server.";
        }
    }
});