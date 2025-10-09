// chat.js - Handles chat functionality

document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const messagesContainer = document.getElementById('messages-container');
    const welcomeMessage = document.querySelector('.welcome-message');
    
    // Sidebar elements
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const showSidebarBtn = document.getElementById('show-sidebar-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const chatHistoryList = document.getElementById('chat-history-list');
    
    // Current chat ID
    let currentChatId = null;
    
    // Load user's chat history from database
    loadUserChatHistory();
    
    // Also check for a current chat when the page loads
    const storedCurrentChatId = localStorage.getItem('currentChatId');
    if (storedCurrentChatId) {
        currentChatId = storedCurrentChatId;
    }
    
    // Set up default sidebar state if not already set
    if (!localStorage.getItem('sidebarState')) {
        // Set sidebar as visible by default on first visit
        localStorage.setItem('sidebarState', 'visible');
        // Do not add 'hidden' class since we want it visible by default
        sidebar.classList.remove('hidden');
        
        // Update icon to show left arrow since sidebar is initially visible
        const toggleIcon = toggleSidebarBtn.querySelector('i');
        if (toggleIcon) {
            toggleIcon.classList.remove('fa-chevron-right');
            toggleIcon.classList.add('fa-chevron-left');
        }
        
        // Remove class to hide show-sidebar button 
        document.querySelector('.main-chat').classList.remove('hidden-sidebar');
    } else {
        // Apply saved sidebar state
        const savedState = localStorage.getItem('sidebarState');
        if (savedState === 'hidden') {
            sidebar.classList.add('hidden');
            const toggleIcon = toggleSidebarBtn.querySelector('i');
            if (toggleIcon) {
                toggleIcon.classList.remove('fa-chevron-left');
                toggleIcon.classList.add('fa-chevron-right');
            }
            document.querySelector('.main-chat').classList.add('hidden-sidebar');
        } else {
            sidebar.classList.remove('hidden');
            const toggleIcon = toggleSidebarBtn.querySelector('i');
            if (toggleIcon) {
                toggleIcon.classList.remove('fa-chevron-right');
                toggleIcon.classList.add('fa-chevron-left');
            }
            document.querySelector('.main-chat').classList.remove('hidden-sidebar');
        }
    }
    
    // Sidebar toggle functionality
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', function() {
            sidebar.classList.toggle('hidden');
            // Update icon based on sidebar state
            const icon = toggleSidebarBtn.querySelector('i');
            if (sidebar.classList.contains('hidden')) {
                icon.classList.remove('fa-chevron-left');
                icon.classList.add('fa-chevron-right');
                // Add class to main chat area to show show-sidebar button
                document.querySelector('.main-chat').classList.add('hidden-sidebar');
                // Save state to localStorage
                localStorage.setItem('sidebarState', 'hidden');
            } else {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-left');
                // Remove class to hide show-sidebar button
                document.querySelector('.main-chat').classList.remove('hidden-sidebar');
                // Save state to localStorage
                localStorage.setItem('sidebarState', 'visible');
            }
        });
    }
    
    // Show sidebar button functionality
    if (showSidebarBtn) {
        showSidebarBtn.addEventListener('click', function() {
            sidebar.classList.remove('hidden');
            // Update icon based on sidebar state
            const icon = toggleSidebarBtn.querySelector('i');
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-left');
            // Remove class to hide show-sidebar button
            document.querySelector('.main-chat').classList.remove('hidden-sidebar');
            // Save state to localStorage
            localStorage.setItem('sidebarState', 'visible');
        });
    }
    
    // New chat button functionality
    if (newChatBtn) {
        newChatBtn.addEventListener('click', function() {
            // Create a new chat
            createNewChat();
        });
    }
    
    // Function to create a new chat
    function createNewChat() {
        // Clear current chat
        clearChat();
        
        // Generate a new chat ID
        currentChatId = 'chat_' + Date.now();
        localStorage.setItem('currentChatId', currentChatId);
        
        // Update chat history in localStorage
        const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        const newChat = {
            id: currentChatId,
            title: 'New Chat',
            lastMessage: 'New chat started',
            timestamp: new Date().toISOString()
        };
        
        chatHistory.unshift(newChat); // Add to the beginning of the array
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        
        // Update the chat history list
        updateChatHistoryList();
        
        // Show welcome message
        if (welcomeMessage) {
            welcomeMessage.style.display = 'flex';
        }
    }
    
    // Function to clear the current chat
    function clearChat() {
        if (messagesContainer) {
            // Remove all messages except the welcome message
            const messages = messagesContainer.querySelectorAll('.message');
            messages.forEach(msg => msg.remove());
            
            // Show welcome message
            if (welcomeMessage) {
                welcomeMessage.style.display = 'flex';
            }
        }
    }
    
    // Function to load chat history from localStorage (now it's loaded via API)
    // This is kept for backward compatibility but uses new functions
    function loadChatHistory() {
        // Load user's chat history from database
        loadUserChatHistory();
        
        // If there's a current chat in localStorage, load it
        const currentChat = localStorage.getItem('currentChatId');
        if (currentChat) {
            loadChat(currentChat);
        } 
        // Note: We don't load the first chat automatically anymore as we want to 
        // wait for the database response before populating the UI
    }
    
    // Function to update the chat history list UI
    function updateChatHistoryList() {
        const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        
        if (chatHistoryList) {
            chatHistoryList.innerHTML = '';
            
            chatHistory.forEach(chat => {
                const chatItem = document.createElement('div');
                chatItem.classList.add('chat-history-item');
                if (chat.id === currentChatId) {
                    chatItem.classList.add('active');
                }
                
                // Get the first 30 characters of the last message as the title
                const title = chat.title || chat.lastMessage.substring(0, 30) + (chat.lastMessage.length > 30 ? '...' : '');
                
                chatItem.innerHTML = `
                    <div class="chat-history-text">${title}</div>
                    <div class="chat-history-actions">
                        <button class="chat-history-delete" data-chat-id="${chat.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                // Add click event to load the chat
                chatItem.addEventListener('click', function(e) {
                    // If the delete button was clicked, don't load the chat
                    if (e.target.closest('.chat-history-delete')) return;
                    
                    loadChat(chat.id);
                });
                
                // Add click event to delete the chat
                const deleteBtn = chatItem.querySelector('.chat-history-delete');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function(e) {
                        e.stopPropagation(); // Prevent loading the chat when deleting
                        deleteChat(chat.id);
                    });
                }
                
                chatHistoryList.appendChild(chatItem);
            });
        }
    }
    
    // Function to load a specific chat
    function loadChat(chatId) {
        currentChatId = chatId;
        localStorage.setItem('currentChatId', chatId);
        
        // Clear current chat display
        clearChat();
        
        // Get chat messages from localStorage
        const chatMessages = JSON.parse(localStorage.getItem(`chat_${chatId}`) || '[]');
        
        if (chatMessages.length > 0) {
            // Hide welcome message
            if (welcomeMessage) {
                welcomeMessage.style.display = 'none';
            }
            
            // Add messages to the chat container
            chatMessages.forEach(msg => {
                // Use the original addMessage logic to avoid saving to history again
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message', msg.sender);
                messageDiv.textContent = msg.text;
                messagesContainer.appendChild(messageDiv);
                
                // Add visual effect for new messages
                messageDiv.style.animation = 'none';
                setTimeout(() => {
                    messageDiv.style.animation = 'slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                }, 10);
            });
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
            // Show welcome message if no messages in the chat
            if (welcomeMessage) {
                welcomeMessage.style.display = 'flex';
            }
        }
        
        // Update active chat in the history list
        updateChatHistoryList();
    }
    
    // Function to save the current message to the chat history (database only)
    function saveMessageToChatHistory(text, sender) {
        // Save to database via API call
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            console.error('No user email available to save chat history');
            return;
        }
        
        // The chat history is now saved server-side in the /chat endpoint,
        // so this function is kept for compatibility but doesn't save to localStorage
    }
    
    // Function to load chat history for current user from database
    async function loadUserChatHistory() {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            console.error('No user email available to load chat history');
            return;
        }
        
        try {
            const response = await fetch(`/chat-history?user_email=${encodeURIComponent(userEmail)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Include auth token
                }
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Store the chat history in localStorage under the user's key
                const userChatHistoryKey = `chat_history_${userEmail}`;
                localStorage.setItem(userChatHistoryKey, JSON.stringify(data.chats));
                
                // Update the UI with chat history
                updateChatHistoryList();
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }
    
    // Function to load a specific chat for the user
    async function loadChat(chatId) {
        currentChatId = chatId;
        localStorage.setItem('currentChatId', chatId);
        
        // Clear current chat display
        clearChat();
        
        // Get user email to identify the user
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            console.error('No user email available');
            return;
        }
        
        // Load chat messages from stored history
        const userChatHistoryKey = `chat_history_${userEmail}`;
        const userChats = JSON.parse(localStorage.getItem(userChatHistoryKey) || '[]');
        const chat = userChats.find(c => c.id === chatId);
        
        if (chat && chat.messages && chat.messages.length > 0) {
            // Hide welcome message
            if (welcomeMessage) {
                welcomeMessage.style.display = 'none';
            }
            
            // Add messages to the chat container
            chat.messages.forEach(msg => {
                // Use the original addMessage logic to avoid saving to history again
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message', msg.sender);
                messageDiv.textContent = msg.text;
                messagesContainer.appendChild(messageDiv);
                
                // Add visual effect for new messages
                messageDiv.style.animation = 'none';
                setTimeout(() => {
                    messageDiv.style.animation = 'slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                }, 10);
            });
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
            // Show welcome message if no messages in the chat
            if (welcomeMessage) {
                welcomeMessage.style.display = 'flex';
            }
        }
        
        // Update active chat in the history list
        updateChatHistoryList();
    }
    
    // Function to create a new chat for the user
    function createNewChat() {
        // Clear current chat
        clearChat();
        
        // Generate a new chat ID
        currentChatId = 'chat_' + Date.now();
        localStorage.setItem('currentChatId', currentChatId);
        
        // Update chat history in localStorage for this user
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            console.error('No user email available');
            return;
        }
        
        const userChatHistoryKey = `chat_history_${userEmail}`;
        const chatHistory = JSON.parse(localStorage.getItem(userChatHistoryKey) || '[]');
        const newChat = {
            id: currentChatId,
            title: 'New Chat',
            lastMessage: 'New chat started',
            timestamp: new Date().toISOString(),
            messages: []
        };

        chatHistory.unshift(newChat); // Add to the beginning of the array
        localStorage.setItem(userChatHistoryKey, JSON.stringify(chatHistory));

        // Update the chat history list
        updateChatHistoryList();

        // Show welcome message
        if (welcomeMessage) {
            welcomeMessage.style.display = 'flex';
        }
    }
    
    // Function to update the chat history list UI for the current user
    function updateChatHistoryList() {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            console.error('No user email available');
            return;
        }
        
        const userChatHistoryKey = `chat_history_${userEmail}`;
        const chatHistory = JSON.parse(localStorage.getItem(userChatHistoryKey) || '[]');
        
        if (chatHistoryList) {
            chatHistoryList.innerHTML = '';
            
            chatHistory.forEach(chat => {
                const chatItem = document.createElement('div');
                chatItem.classList.add('chat-history-item');
                if (chat.id === currentChatId) {
                    chatItem.classList.add('active');
                }
                
                // Get the first 30 characters of the last message as the title
                const lastMessage = chat.messages && chat.messages.length > 0 
                    ? chat.messages[chat.messages.length - 1].text 
                    : (chat.lastMessage || 'New chat');
                    
                // Check if the chat has a title, otherwise use the first part of the last message
                let title = 'New Chat'; // default fallback
                if (chat.title) {
                    title = chat.title;
                } else if (lastMessage && lastMessage.length > 0) {
                    title = lastMessage.substring(0, 30) + (lastMessage.length > 30 ? '...' : '');
                }
                
                chatItem.innerHTML = `
                    <div class="chat-history-text">${title}</div>
                    <div class="chat-history-actions">
                        <button class="chat-history-delete" data-chat-id="${chat.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                // Add click event to load the chat
                chatItem.addEventListener('click', function(e) {
                    // If the delete button was clicked, don't load the chat
                    if (e.target.closest('.chat-history-delete')) return;
                    
                    currentChatId = chat.id;  // Update current chat ID
                    localStorage.setItem('currentChatId', currentChatId);  // Save to localStorage
                    loadChat(chat.id);
                });
                
                // Add click event to delete the chat
                const deleteBtn = chatItem.querySelector('.chat-history-delete');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function(e) {
                        e.stopPropagation(); // Prevent loading the chat when deleting
                        deleteChat(chat.id);
                    });
                }
                
                chatHistoryList.appendChild(chatItem);
            });
        }
    }

    // Function to delete a chat for the current user
    async function deleteChat(chatId) {
        showDeleteChatConfirmation(chatId);
    }

    // Function to perform the actual chat deletion
    async function performDeleteChat(chatId) {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            console.error('No user email available');
            return;
        }
        
        try {
            // Call the backend API to delete the chat
            const response = await fetch(`/chat-history/${chatId}?user_email=${encodeURIComponent(userEmail)}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Include auth token
                }
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Remove chat from local storage
                const userChatHistoryKey = `chat_history_${userEmail}`;
                let chatHistory = JSON.parse(localStorage.getItem(userChatHistoryKey) || '[]');
                chatHistory = chatHistory.filter(chat => chat.id !== chatId);
                localStorage.setItem(userChatHistoryKey, JSON.stringify(chatHistory));
                
                // If we're deleting the current chat, clear the chat display
                if (currentChatId === chatId) {
                    currentChatId = null;
                    localStorage.removeItem('currentChatId');
                    clearChat();
                }
                
                // Update the chat history list
                updateChatHistoryList();
            } else {
                console.error('Failed to delete chat from server:', data.message);
                showNotification(data.message || 'Failed to delete chat', 'error');
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
            showNotification('Error deleting chat. Please try again.', 'error');
        }
    }
    
    // Delete chat modal elements
    const deleteChatModal = document.getElementById('delete-chat-modal');
    const closeDeleteChat = document.getElementById('close-delete-chat');
    const cancelDeleteChat = document.getElementById('cancel-delete-chat');
    const confirmDeleteChat = document.getElementById('confirm-delete-chat');
    let chatIdToDelete = null;

    // Function to show delete chat confirmation modal
    function showDeleteChatConfirmation(chatId) {
        chatIdToDelete = chatId;
        deleteChatModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // Close delete chat modal
    if (closeDeleteChat) {
        closeDeleteChat.addEventListener('click', function() {
            deleteChatModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            chatIdToDelete = null;
        });
    }

    if (cancelDeleteChat) {
        cancelDeleteChat.addEventListener('click', function() {
            deleteChatModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            chatIdToDelete = null;
        });
    }

    // Also close modal when clicking outside of it
    if (deleteChatModal) {
        deleteChatModal.addEventListener('click', function(e) {
            if (e.target === deleteChatModal) {
                deleteChatModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                chatIdToDelete = null;
            }
        });
    }

    // Handle chat deletion confirmation
    if (confirmDeleteChat) {
        confirmDeleteChat.addEventListener('click', function() {
            if (chatIdToDelete) {
                performDeleteChat(chatIdToDelete);
                deleteChatModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                chatIdToDelete = null;
            }
        });
    }

    // Function to show delete chat confirmation modal
    function showDeleteChatConfirmation(chatId) {
        chatIdToDelete = chatId;
        deleteChatModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    // Override the addMessage function to save messages to history
    function addMessage(text, sender) {
        // Remove welcome message if it's the first interaction
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        
        // Add message content with proper formatting
        messageDiv.textContent = text;
        
        messagesContainer.appendChild(messageDiv);
        
        // Add visual effect for new messages
        messageDiv.style.animation = 'none';
        setTimeout(() => {
            messageDiv.style.animation = 'slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }, 10);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Save the message to chat history if we have a current chat
        saveMessageToChatHistory(text, sender);
    }
    
    // Make functions available globally so they can be used by other scripts
    window.addMessage = addMessage;
    window.loadChatHistory = loadChatHistory;
    window.loadUserChatHistory = loadUserChatHistory;  // Make this available globally too
    window.createNewChat = createNewChat;
    window.loadChat = loadChat;  // Make this available globally too
    
    // Function to handle window resize and orientation change
    function handleResize() {
        // Ensure the message container stays scrolled to bottom
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    // Listen for resize events
    window.addEventListener('resize', handleResize);
    
    // Listen for orientation change (especially important for mobile)
    window.addEventListener('orientationchange', function() {
        // Add a small delay to ensure the viewport has fully adjusted
        setTimeout(handleResize, 100);
    });
    
    // Initialize resize handling
    handleResize();

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
    async function sendMessage() {
        const message = messageInput.value.trim();
        
        if (message) {
            // Add user message to chat
            addMessage(message, 'user');
            
            // Clear input
            messageInput.value = '';
            messageInput.style.height = 'auto';
            
            // Show typing indicator
            showTypingIndicator();
            
            try {
                // Get bot response from backend agent
                const botResponse = await sendToBackend(message);
                
                // Hide typing indicator and add bot response
                hideTypingIndicator();
                addMessage(botResponse, 'bot');
                
                // After getting response, reload the chat history to update it with the new conversation
                setTimeout(() => {
                    loadUserChatHistory();
                }, 500); // Small delay to ensure the backend has time to save the chat
            } catch (error) {
                console.error('Error getting bot response:', error);
                hideTypingIndicator();
                addMessage("Sorry, I'm having trouble connecting to the server.", 'bot');
            }
        }
    }


    
    // Function to handle window resize and orientation change
    function handleResize() {
        // Ensure the message container stays scrolled to bottom
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    // Listen for resize events
    window.addEventListener('resize', handleResize);
    
    // Listen for orientation change (especially important for mobile)
    window.addEventListener('orientationchange', function() {
        // Add a small delay to ensure the viewport has fully adjusted
        setTimeout(handleResize, 100);
    });

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

    // Function to show notification (similar to the one in auth.js)
    function showNotification(message, type, action = null) {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Add message and optional action button
        if (action) {
            notification.innerHTML = `
                <div class="notification-content">${message}</div>
                <button class="notification-action-btn" onclick="${action.fn}()" style="
                    background: rgba(255,255,255,0.2); 
                    border: 1px solid rgba(255,255,255,0.3); 
                    color: white; 
                    border-radius: 4px; 
                    padding: 4px 8px; 
                    margin-left: 10px; 
                    cursor: pointer; 
                    font-size: 0.85em;
                ">${action.text}</button>
            `;
        } else {
            notification.textContent = message;
        }
        
        // Add to body
        document.body.appendChild(notification);
        
        // Trigger the show animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
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
                    userId: localStorage.getItem('userEmail')  // Use email to identify user
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