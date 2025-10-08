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
                    // Clear any pending verification state
                    localStorage.removeItem('pendingVerificationEmail');
                    showChatInterface(backendData.name || email.split('@')[0]);
                    showNotification('Login successful!', 'success');
                } else {
                    // Check if the error is related to email verification
                    if (response.message && response.message.includes('verify your email')) {
                        // Show notification with a resend button
                        showNotification(
                            response.message, 
                            'info', 
                            { 
                                text: 'Resend Email', 
                                fn: 'resendVerificationFromNotification' 
                            }
                        );
                    } else {
                        showNotification(`Login failed: ${response.error}`, 'error');
                    }
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
                    // Show email verification screen
                    document.getElementById('auth-forms').style.display = 'none';
                    document.getElementById('email-verification').style.display = 'block';
                    
                    // Store email for potential resend functionality
                    localStorage.setItem('pendingVerificationEmail', email);
                    
                    // Display masked email
                    const maskedEmail = maskEmail(email);
                    document.getElementById('verification-email-display').textContent = maskedEmail;
                    
                    // Show notification about email verification
                    showNotification('Registration successful! Please check your email to verify your account.', 'success');
                } else {
                    // Check if the error is related to email already existing
                    if (response.message && response.message.includes('already exists')) {
                        showNotification('An account with this email already exists.', 'error');
                    } else {
                        showNotification(`Registration failed: ${response.error || response.message}`, 'error');
                    }
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
            // Check if user just registered and is waiting for verification
            const pendingEmail = localStorage.getItem('pendingVerificationEmail');
            if (pendingEmail) {
                // Show verification screen
                authContainer.style.display = 'flex';
                chatContainer.style.display = 'none';
                document.getElementById('auth-forms').style.display = 'none';
                document.getElementById('email-verification').style.display = 'block';
                
                // Display masked email
                const maskedEmail = maskEmail(pendingEmail);
                document.getElementById('verification-email-display').textContent = maskedEmail;
            } else {
                authContainer.style.display = 'flex';
                chatContainer.style.display = 'none';
            }
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

    // Function to mask email address (show first and last characters, mask the middle)
    function maskEmail(email) {
        if (!email) return '';
        
        const [localPart, domain] = email.split('@');
        
        if (localPart.length <= 2) {
            // If local part is too short, just show first char and ***
            return `${localPart[0]}***@${domain}`;
        }
        
        const firstChar = localPart[0];
        const lastChar = localPart[localPart.length - 1];
        const maskedPart = `${firstChar}***${lastChar}`;
        
        return `${maskedPart}@${domain}`;
    }
    
    // Function to resend verification email from notification
    async function resendVerificationFromNotification() {
        // Use the email from the login form for resending
        const email = document.getElementById('login-email') ? document.getElementById('login-email').value : '';
        
        if (!email) {
            showNotification('Please enter your email address first.', 'error');
            return;
        }
        
        try {
            const response = await fetch('/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification(result.message, 'success');
            } else {
                showNotification(result.message || 'Failed to resend verification email.', 'error');
            }
            
            return result;
        } catch (error) {
            console.error('Error resending verification:', error);
            showNotification('Network error occurred while resending verification.', 'error');
            return { success: false, message: 'Network error' };
        }
    }
    
    // Function to resend verification email
    async function resendVerification(email) {
        try {
            const response = await fetch('/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification(result.message, 'success');
            } else {
                showNotification(result.message || 'Failed to resend verification email.', 'error');
            }
            
            return result;
        } catch (error) {
            console.error('Error resending verification:', error);
            showNotification('Network error occurred while resending verification.', 'error');
            return { success: false, message: 'Network error' };
        }
    }

    // Function to show notification with optional action button
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

    // Email verification screen event listeners
    const backToLoginBtn = document.getElementById('back-to-login');
    const resendEmailBtn = document.getElementById('resend-email');
    
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', function() {
            // Show login form and hide verification screen
            document.getElementById('auth-forms').style.display = 'block';
            document.getElementById('email-verification').style.display = 'none';
            // Reset form toggle to login
            const formToggle = document.querySelector('.form-toggle');
            formToggle.classList.remove('signup-mode');
            formToggle.classList.add('login-mode');
            
            const loginToggle = document.getElementById('login-toggle');
            const signupToggle = document.getElementById('signup-toggle');
            loginToggle.classList.add('active');
            signupToggle.classList.remove('active');
            
            document.getElementById('login-form').style.display = 'block';
            document.getElementById('signup-form').style.display = 'none';
            
            // Clear the verification email from localStorage
            localStorage.removeItem('pendingVerificationEmail');
        });
    }
    
    if (resendEmailBtn) {
        resendEmailBtn.addEventListener('click', async function() {
            const email = localStorage.getItem('pendingVerificationEmail');
            if (!email) {
                showNotification('No email address found to resend verification.', 'error');
                return;
            }
            
            // Show loading state
            resendEmailBtn.textContent = 'Sending...';
            resendEmailBtn.disabled = true;
            
            try {
                const result = await resendVerification(email);
                
                if (result.success) {
                    showNotification('Verification email has been sent!', 'success');
                }
            } catch (error) {
                console.error('Error resending verification:', error);
                showNotification('Failed to resend verification email.', 'error');
            } finally {
                // Reset button state
                resendEmailBtn.textContent = 'Resend Email';
                resendEmailBtn.disabled = false;
            }
        });
    }
    
    // Add click handler to go to login if user has verified but is still on verification screen
    const emailVerificationDiv = document.getElementById('email-verification');
    if (emailVerificationDiv) {
        // Create a "Try Login" button for users who have verified in another tab
        const tryLoginDiv = document.createElement('div');
        tryLoginDiv.style.marginTop = '1rem';
        tryLoginDiv.innerHTML = '<p style="color: #666; font-size: 0.9rem;">Already verified? <a href="#" id="try-login-link" style="color: #667eea; text-decoration: none;">Try logging in</a></p>';
        emailVerificationDiv.appendChild(tryLoginDiv);
        
        document.getElementById('try-login-link').addEventListener('click', function(e) {
            e.preventDefault();
            
            // Reset the form and switch to login
            document.getElementById('auth-forms').style.display = 'block';
            document.getElementById('email-verification').style.display = 'none';
            
            const formToggle = document.querySelector('.form-toggle');
            formToggle.classList.remove('signup-mode');
            formToggle.classList.add('login-mode');
            
            const loginToggle = document.getElementById('login-toggle');
            const signupToggle = document.getElementById('signup-toggle');
            loginToggle.classList.add('active');
            signupToggle.classList.remove('active');
            
            document.getElementById('login-form').style.display = 'block';
            document.getElementById('signup-form').style.display = 'none';
        });
    }

    // Auto-resize textarea
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
});