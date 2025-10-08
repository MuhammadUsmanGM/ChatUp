// auth.js - Handles authentication functionality

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginToggle = document.getElementById('login-toggle');
    const signupToggle = document.getElementById('signup-toggle');
    const authContainer = document.getElementById('auth-container');
    const chatContainer = document.getElementById('chat-container');
    const logoutBtn = document.getElementById('logout-btn');
    const messageInput = document.getElementById('message-input');
    const usernameDisplay = document.getElementById('username-display');

    // Form Toggle Functionality
    loginToggle.addEventListener('click', function() {
        const formToggle = document.querySelector('.form-toggle');
        formToggle.classList.remove('signup-mode');
        formToggle.classList.add('login-mode');
        
        loginToggle.classList.add('active');
        signupToggle.classList.remove('active');
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('signup-form').style.display = 'none';
    });

    signupToggle.addEventListener('click', function() {
        const formToggle = document.querySelector('.form-toggle');
        formToggle.classList.remove('login-mode');
        formToggle.classList.add('signup-mode');
        
        signupToggle.classList.add('active');
        loginToggle.classList.remove('active');
        document.getElementById('signup-form').style.display = 'block';
        document.getElementById('login-form').style.display = 'none';
    });

    // Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            // Basic validation
            if (!email || !password) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;
            
            try {
                // When backend is ready, use actual API call:
                // const response = await loginUser({ email, password });
                
                // Call the actual backend API
                const response = await loginUser({ email, password });
                
                if (response.success) {
                    // Successful login - store user info in localStorage
                    const backendData = response.data;
                    localStorage.setItem('userName', backendData.name || email.split('@')[0]);
                    localStorage.setItem('userEmail', backendData.email);
                    localStorage.setItem('isLoggedIn', 'true');
                    showChatInterface(backendData.name || email.split('@')[0]);
                    showNotification('Login successful!', 'success');
                } else {
                    showNotification(`Login failed: ${response.error}`, 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showNotification('An error occurred during login. Please try again.', 'error');
            } finally {
                // Reset button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Signup Form Submission
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            
            // Basic validation
            if (!name || !email || !password || !confirmPassword) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            if (password.length < 6) {
                showNotification('Password must be at least 6 characters long', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating account...';
            submitBtn.disabled = true;
            
            try {
                // When backend is ready, use actual API call:
                // const response = await registerUser({ name, email, password });
                
                // Call the actual backend API
                const response = await registerUser({ name, email, password });
                
                if (response.success) {
                    // Successful registration - store user info in localStorage
                    const backendData = response.data;
                    localStorage.setItem('userName', backendData.name || name);
                    localStorage.setItem('userEmail', backendData.email || email);
                    localStorage.setItem('isLoggedIn', 'true');
                    showChatInterface(backendData.name || name);
                    showNotification('Registration successful!', 'success');
                } else {
                    showNotification(`Registration failed: ${response.error}`, 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showNotification('An error occurred during registration. Please try again.', 'error');
            } finally {
                // Reset button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Logout Functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear user data
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('authToken');
            
            // Show auth container and hide chat container
            authContainer.style.display = 'flex';
            chatContainer.style.display = 'none';
        });
    }

    // Initialize app
    initializeApp();

    // Initialize the application
    function initializeApp() {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            const name = localStorage.getItem('userName') || 'User';
            showChatInterface(name);
        } else {
            authContainer.style.display = 'flex';
            chatContainer.style.display = 'none';
        }
    }

    // Show chat interface
    function showChatInterface(userName) {
        if (usernameDisplay) {
            usernameDisplay.textContent = userName;
        }
        authContainer.style.display = 'none';
        chatContainer.style.display = 'flex';
    }

    // API calls that will connect to backend (to be implemented)
    async function registerUser(userData) {
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            
            if (response.ok) {
                return { success: true, data: result };
            } else {
                return { success: false, error: result.message || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async function loginUser(credentials) {
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();
            
            if (response.ok) {
                // Login successful - store authentication info
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userName', result.name);
                localStorage.setItem('userEmail', result.email);
                localStorage.setItem('isLoggedIn', 'true');
                
                return { success: true, data: result };
            } else {
                return { success: false, error: result.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error' };
        }
    }
    
    // For now, these simulate API calls until the backend is ready
    async function simulateRegisterAPI(userData) {
        // Simulate the MongoDB storage
        // In real implementation, this will happen on the backend
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user already exists (simulating database check)
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const userExists = users.some(u => u.email === userData.email);
        
        if (userExists) {
            return { success: false, error: 'User with this email already exists' };
        }
        
        // Add user to "database" (localStorage for demo)
        users.push({
            name: userData.name,
            email: userData.email,
            // In a real app, password would be hashed on the server
            password: userData.password 
        });
        localStorage.setItem('registeredUsers', JSON.stringify(users));
        
        console.log('Registration data stored in simulated database:', userData);
        return { success: true, data: { name: userData.name, email: userData.email } };
    }

    async function simulateLoginAPI(credentials) {
        // Simulate the MongoDB lookup
        // In real implementation, this will happen on the backend
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check user in "database" (localStorage for demo)
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const user = users.find(u => u.email === credentials.email && u.password === credentials.password);
        
        if (user) {
            // Successful login simulation
            localStorage.setItem('authToken', 'demo-token');
            localStorage.setItem('userName', user.name);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('isLoggedIn', 'true');
            
            console.log('User authenticated from simulated database:', user);
            return { success: true, data: { name: user.name, email: user.email } };
        } else {
            return { success: false, error: 'Invalid credentials' };
        }
    }

    // Function to show notification
    function showNotification(message, type) {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
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

    // Auto-resize textarea
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
});