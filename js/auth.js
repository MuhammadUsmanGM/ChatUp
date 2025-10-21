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
        
        // Set up validation for the login form when it's shown
        setupFieldValidation();
    });

    signupToggle.addEventListener('click', function() {
        const formToggle = document.querySelector('.form-toggle');
        formToggle.classList.remove('login-mode');
        formToggle.classList.add('signup-mode');
        
        signupToggle.classList.add('active');
        loginToggle.classList.remove('active');
        document.getElementById('signup-form').style.display = 'block';
        document.getElementById('login-form').style.display = 'none';
        
        // Set up validation for the signup form when it's shown
        setupFieldValidation();
    });

    // Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            // Basic validation
            let hasError = false;
            
            // Clear previous error indicators
            clearFieldErrors(['#login-email', '#login-password']);
            
            // Check each field and add error indicator if empty
            if (!email) {
                addFieldError('#login-email', 'Required');
                hasError = true;
            }
            
            if (!password) {
                addFieldError('#login-password', 'Required');
                hasError = true;
            }
            
            if (hasError) {
                showNotification('Please fill in all required fields', 'error');
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
                    // If join date is not already set, set it (this might be from a previous session)
                    if (!localStorage.getItem('joinDate')) {
                        localStorage.setItem('joinDate', new Date().toISOString().split('T')[0]);
                    }
                    // Clear any pending verification state
                    localStorage.removeItem('pendingVerificationEmail');
                    showChatInterface(backendData.name || email.split('@')[0]);
                    showNotification('Login successful!', 'success');
                    
                    // Load user's chat history after login
                    if (window.loadUserChatHistory) {
                        setTimeout(() => {
                            window.loadUserChatHistory();
                        }, 500); // Small delay to ensure interface is ready
                    } else if (window.loadChatHistory) {
                        setTimeout(() => {
                            window.loadChatHistory();
                        }, 500); // Small delay to ensure interface is ready
                    }
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
            let hasError = false;
            
            // Clear previous error indicators
            clearFieldErrors(['#signup-name', '#signup-email', '#signup-password', '#signup-confirm-password']);
            
            // Check each field and add error indicator if empty
            if (!name) {
                addFieldError('#signup-name', 'Required');
                hasError = true;
            }
            
            if (!email) {
                addFieldError('#signup-email', 'Required');
                hasError = true;
            }
            
            if (!password) {
                addFieldError('#signup-password', 'Required');
                hasError = true;
            }
            
            if (!confirmPassword) {
                addFieldError('#signup-confirm-password', 'Required');
                hasError = true;
            }
            
            if (hasError) {
                showNotification('Please fill in all required fields', 'error');
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
            
            // Check if terms agreement checkbox is checked
            const termsAgreement = document.getElementById('terms-agreement');
            if (!termsAgreement.checked) {
                showNotification('Please agree to the Terms of Service and Privacy Policy', 'error');
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
                    // Store join date
                    localStorage.setItem('joinDate', new Date().toISOString().split('T')[0]);
                    
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
            // Show logout confirmation modal
            const logoutModal = document.getElementById('logout-modal');
            const closeLogout = document.getElementById('close-logout');
            const cancelLogout = document.getElementById('cancel-logout');
            const confirmLogout = document.getElementById('confirm-logout');
            
            // Show the modal
            logoutModal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }
    
    // Handle logout confirmation modal
    const logoutModal = document.getElementById('logout-modal');
    const closeLogout = document.getElementById('close-logout');
    const cancelLogout = document.getElementById('cancel-logout');
    const confirmLogout = document.getElementById('confirm-logout');
    
    // Close logout modal events
    if (closeLogout) {
        closeLogout.addEventListener('click', function() {
            logoutModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }
    
    if (cancelLogout) {
        cancelLogout.addEventListener('click', function() {
            logoutModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }
    
    // Also close modal when clicking outside of it
    if (logoutModal) {
        logoutModal.addEventListener('click', function(e) {
            if (e.target === logoutModal) {
                logoutModal.style.display = 'none';
                document.body.style.overflow = 'auto'; // Re-enable scrolling
            }
        });
    }
    
    // Confirm logout event
    if (confirmLogout) {
        confirmLogout.addEventListener('click', function() {
            // Clear any existing user-specific chat history from localStorage
            // We need to check what user was previously logged in to clear their specific history
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('chat_history_')) {
                    localStorage.removeItem(key);
                }
            }
            
            // Clear user data
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('authToken');
            localStorage.removeItem('joinDate');
            localStorage.removeItem('pendingVerificationEmail');
            localStorage.removeItem('currentChatId');
            localStorage.removeItem('chatHistory'); // Clear any old format chat history
            
            // Show auth container and hide chat container
            authContainer.style.display = 'flex';
            chatContainer.style.display = 'none';
            
            // Close the modal
            logoutModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }
    
    // Profile functionality
    const profileBtn = document.getElementById('profile-btn');
    const profileModal = document.getElementById('profile-modal');
    const closeProfile = document.getElementById('close-profile');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileJoinDate = document.getElementById('profile-join-date');
    
    // Function to mask email (show first and last characters, mask the middle)
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
    
    // Function to add error indicator to a field
    function addFieldError(fieldSelector, message) {
        const field = document.querySelector(fieldSelector);
        if (!field) return;
        
        const inputGroup = field.closest('.input-group');
        if (!inputGroup) return;
        
        // Add required class to input group
        inputGroup.classList.add('required');
        
        // Apply red border styling to the input
        field.style.borderColor = '#ff6b6b';
        field.style.boxShadow = '0 0 0 2px rgba(255, 107, 107, 0.3)';
        
        // For password inputs that are inside a password-input-container
        const passwordContainer = field.closest('.password-input-container');
        if (passwordContainer) {
            // Handle password container separately - use pure CSS positioning
            // Check if indicator already exists in the password container
            let indicator = passwordContainer.querySelector('.required-indicator');
            if (!indicator) {
                // Create the indicator element
                indicator = document.createElement('span');
                indicator.className = 'required-indicator';
                indicator.textContent = message;
                
                // Add to password container with default CSS positioning
                passwordContainer.style.position = 'relative';
                passwordContainer.appendChild(indicator);
            } else {
                indicator.textContent = message;
            }
            return; // Exit early for password containers
        }
        
        // For regular inputs, continue with the JavaScript positioning approach
        // Check if indicator already exists in the input group
        let indicator = inputGroup.querySelector('.required-indicator');
        if (!indicator) {
            // Create the indicator element
            indicator = document.createElement('span');
            indicator.className = 'required-indicator';
            indicator.textContent = message;
            
            // Add to the input group and use JavaScript for precise positioning
            inputGroup.style.position = 'relative';
            inputGroup.appendChild(indicator);
            
            // Calculate and set the correct top position for the indicator
            // Wait for the element to be added to DOM before calculating position
            setTimeout(() => {
                // Calculate the vertical center of the input field within the group
                const inputRect = field.getBoundingClientRect();
                const groupRect = inputGroup.getBoundingClientRect();
                
                // Calculate how far down the input is positioned in the group
                const inputTopOffset = inputRect.top - groupRect.top;
                const inputHeight = inputRect.height;
                
                // Set the indicator to be centered vertically on the input field
                const indicatorTop = inputTopOffset + (inputHeight / 2) - (indicator.offsetHeight / 2);
                indicator.style.top = `${indicatorTop}px`;
                indicator.style.transform = 'none';  // Override any CSS transform
            }, 10);
        } else {
            indicator.textContent = message;
            
            // For existing indicators, recalculate position
            setTimeout(() => {
                const inputRect = field.getBoundingClientRect();
                const groupRect = inputGroup.getBoundingClientRect();
                
                // Calculate how far down the input is positioned in the group
                const inputTopOffset = inputRect.top - groupRect.top;
                const inputHeight = inputRect.height;
                
                // Set the indicator to be centered vertically on the input field
                const indicatorTop = inputTopOffset + (inputHeight / 2) - (indicator.offsetHeight / 2);
                indicator.style.top = `${indicatorTop}px`;
                indicator.style.transform = 'none';  // Override any CSS transform
            }, 10);
        }
    }
    
    // Function to clear error indicators from specified fields
    function clearFieldErrors(selectors) {
        selectors.forEach(selector => {
            const field = document.querySelector(selector);
            if (!field) return;
            
            const inputGroup = field.closest('.input-group');
            if (!inputGroup) return;
            
            // Remove required class
            inputGroup.classList.remove('required');
            
            // Remove indicator if exists
            const indicator = inputGroup.querySelector('.required-indicator');
            if (indicator) {
                indicator.remove();
            }
            
            // Reset field styling
            field.style.borderColor = '';
            field.style.boxShadow = '';
        });
    }
    

    

    
    // Show profile modal
    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
            // Get user data from localStorage
            const name = localStorage.getItem('userName') || 'User';
            const email = localStorage.getItem('userEmail') || 'Not available';
            
            // Set profile data
            profileName.textContent = name;
            
            // Mask the email by default
            if (email !== 'Not available') {
                profileEmail.textContent = maskEmail(email);
            } else {
                profileEmail.textContent = email;
            }
            
            // Calculate join date (using registration timestamp if available, or current date as fallback)
            const joinDate = localStorage.getItem('joinDate') || new Date().toISOString().split('T')[0];
            profileJoinDate.textContent = formatDate(joinDate);
            
            // Update avatar display with custom image if available
            updateAvatarDisplay();
            
            // Show modal
            profileModal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }
    
    // Reveal email functionality
    const revealEmailBtn = document.getElementById('reveal-email-btn');
    const revealEmailModal = document.getElementById('reveal-email-modal');
    const closeRevealEmail = document.getElementById('close-reveal-email');
    const cancelRevealEmail = document.getElementById('cancel-reveal-email');
    const confirmRevealEmail = document.getElementById('confirm-reveal-email');
    const revealEmailPassword = document.getElementById('reveal-email-password');
    
    // Show reveal email modal
    if (revealEmailBtn) {
        revealEmailBtn.addEventListener('click', function() {
            // Clear password field
            revealEmailPassword.value = '';
            // Show modal
            revealEmailModal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }
    
    // Close reveal email modal
    if (closeRevealEmail) {
        closeRevealEmail.addEventListener('click', function() {
            revealEmailModal.style.display = 'none';
            revealEmailPassword.value = ''; // Clear password field
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }
    
    if (cancelRevealEmail) {
        cancelRevealEmail.addEventListener('click', function() {
            revealEmailModal.style.display = 'none';
            revealEmailPassword.value = ''; // Clear password field
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }
    
    // Also close modal when clicking outside of it
    if (revealEmailModal) {
        revealEmailModal.addEventListener('click', function(e) {
            if (e.target === revealEmailModal) {
                revealEmailModal.style.display = 'none';
                revealEmailPassword.value = ''; // Clear password field
                document.body.style.overflow = 'auto'; // Re-enable scrolling
            }
        });
    }
    
    // Handle email reveal confirmation
    if (confirmRevealEmail) {
        confirmRevealEmail.addEventListener('click', async function() {
            const password = revealEmailPassword.value.trim();
            const userEmail = localStorage.getItem('userEmail');
            
            if (!password) {
                showNotification('Please enter your password', 'error');
                return;
            }
            
            // Disable button during verification
            confirmRevealEmail.textContent = 'Verifying...';
            confirmRevealEmail.disabled = true;
            
            try {
                // Call the backend to verify password
                const response = await fetch('/verify-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Include auth token
                    },
                    body: JSON.stringify({
                        email: userEmail,
                        password: password
                    })
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    // Password is correct, show full email
                    profileEmail.textContent = userEmail;
                    revealEmailModal.style.display = 'none';
                    revealEmailPassword.value = ''; // Clear password field
                    showNotification('Email revealed successfully', 'success');
                } else {
                    showNotification(result.message || 'Incorrect password. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error verifying password:', error);
                showNotification('An error occurred while verifying your password. Please try again.', 'error');
            } finally {
                // Re-enable button
                confirmRevealEmail.textContent = 'Reveal Email';
                confirmRevealEmail.disabled = false;
            }
        });
    }
    
    // Password visibility toggle functionality
    function setupPasswordToggle(inputId, toggleId) {
        const passwordInput = document.getElementById(inputId);
        const toggleElement = document.getElementById(toggleId);
        
        if (passwordInput && toggleElement) {
            toggleElement.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                // Toggle the eye icon
                const icon = toggleElement.querySelector('i');
                if (icon) {
                    if (type === 'password') {
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    } else {
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    }
                }
            });
        }
    }
    
    // Setup password toggles for all password fields
    setupPasswordToggle('reveal-email-password', 'toggle-reveal-email-password');
    setupPasswordToggle('old-password', 'toggle-old-password');
    setupPasswordToggle('change-new-password', 'toggle-change-new-password');
    setupPasswordToggle('change-confirm-new-password', 'toggle-change-confirm-new-password');
    setupPasswordToggle('delete-password', 'toggle-delete-password');
    setupPasswordToggle('login-password', 'toggle-login-password');
    setupPasswordToggle('signup-password', 'toggle-signup-password');
    setupPasswordToggle('signup-confirm-password', 'toggle-signup-confirm-password');
    
    // Close profile modal
    if (closeProfile) {
        closeProfile.addEventListener('click', function() {
            profileModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }
    
    // Also close modal when clicking outside of it
    if (profileModal) {
        profileModal.addEventListener('click', function(e) {
            if (e.target === profileModal) {
                profileModal.style.display = 'none';
                document.body.style.overflow = 'auto'; // Re-enable scrolling
            }
        });
    }
    
    // Format date function
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, options);
    }
    
    // Update avatar display based on stored avatar
    function updateAvatarDisplay() {
        const storedAvatar = localStorage.getItem('userAvatar');
        const profileAvatar = document.querySelector('.profile-avatar .fas.fa-user-circle');
        const currentAvatar = document.getElementById('current-avatar');
        
        if (storedAvatar) {
            // Update profile modal avatar
            if (profileAvatar) {
                profileAvatar.className = 'user-avatar-img';
                profileAvatar.style.backgroundImage = `url(${storedAvatar})`;
                profileAvatar.style.backgroundSize = 'cover';
                profileAvatar.style.backgroundPosition = 'center';
                profileAvatar.style.borderRadius = '50%';
                profileAvatar.style.width = '100%';
                profileAvatar.style.height = '100%';
            }
            
            // Update edit profile modal avatar
            if (currentAvatar) {
                currentAvatar.className = 'user-avatar-img';
                currentAvatar.style.backgroundImage = `url(${storedAvatar})`;
                currentAvatar.style.backgroundSize = 'cover';
                currentAvatar.style.backgroundPosition = 'center';
                currentAvatar.style.borderRadius = '50%';
                currentAvatar.style.width = '100%';
                currentAvatar.style.height = '100%';
                currentAvatar.style.display = 'block';
                
                // Create a placeholder element for the icon to maintain structure
                if (currentAvatar.children.length === 0) {
                    const iconPlaceholder = document.createElement('div');
                    iconPlaceholder.style.paddingTop = '100%'; // Maintain aspect ratio
                    currentAvatar.appendChild(iconPlaceholder);
                }
            }
        } else {
            // Use default icon if no stored avatar
            if (profileAvatar) {
                profileAvatar.className = 'fas fa-user-circle';
                profileAvatar.style.backgroundImage = '';
                profileAvatar.style.backgroundSize = '';
                profileAvatar.style.backgroundPosition = '';
                profileAvatar.style.borderRadius = '';
                profileAvatar.style.width = '';
                profileAvatar.style.height = '';
            }
            
            if (currentAvatar) {
                currentAvatar.className = 'fas fa-user-circle';
                currentAvatar.style.backgroundImage = '';
                currentAvatar.style.backgroundSize = '';
                currentAvatar.style.backgroundPosition = '';
                currentAvatar.style.borderRadius = '';
                currentAvatar.style.width = '';
                currentAvatar.style.height = '';
                currentAvatar.style.display = '';
                
                // Remove any children elements if reverting to icon
                currentAvatar.innerHTML = '';
            }
        }
    }
    
    // Password change functionality
    const changePasswordBtn = document.getElementById('change-password-btn');
    const changePasswordModal = document.getElementById('change-password-modal');
    const closePassword = document.getElementById('close-password');
    const cancelPassword = document.getElementById('cancel-password');
    const changePasswordForm = document.getElementById('change-password-form');
    
    // Show password change modal
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            // Close profile modal and open password change modal
            document.getElementById('profile-modal').style.display = 'none';
            changePasswordModal.style.display = 'flex';
        });
    }
    
    // Close password change modal
    if (closePassword) {
        closePassword.addEventListener('click', function() {
            changePasswordModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }
    
    if (cancelPassword) {
        cancelPassword.addEventListener('click', function() {
            changePasswordModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }
    
    // Also close modal when clicking outside of it
    if (changePasswordModal) {
        changePasswordModal.addEventListener('click', function(e) {
            if (e.target === changePasswordModal) {
                changePasswordModal.style.display = 'none';
                document.body.style.overflow = 'auto'; // Re-enable scrolling
            }
        });
    }
    
    // Handle password change form submission
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const oldPassword = document.getElementById('old-password').value;
            const newPassword = document.getElementById('change-new-password').value;
            const confirmNewPassword = document.getElementById('change-confirm-new-password').value;
            
            // Validation
            let hasError = false;
            
            // Clear previous error indicators
            clearFieldErrors(['#old-password', '#change-new-password', '#change-confirm-new-password']);
            
            // Check each field and add error indicator if empty
            if (!oldPassword) {
                addFieldError('#old-password', 'Required');
                hasError = true;
            }
            
            if (!newPassword) {
                addFieldError('#change-new-password', 'Required');
                hasError = true;
            }
            
            if (!confirmNewPassword) {
                addFieldError('#change-confirm-new-password', 'Required');
                hasError = true;
            }
            
            if (hasError) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            if (newPassword !== confirmNewPassword) {
                showNotification('New passwords do not match', 'error');
                return;
            }
            
            if (newPassword.length < 6) {
                showNotification('New password must be at least 6 characters long', 'error');
                return;
            }
            
            // Disable form during submission
            const submitBtn = changePasswordForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Updating...';
            submitBtn.disabled = true;
            

            
            try {
                // Get the user's email from localStorage
                const userEmail = localStorage.getItem('userEmail');
                
                // Call the backend API to change password
                const response = await fetch('/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Include auth token
                    },
                    body: JSON.stringify({
                        oldPassword: oldPassword,
                        newPassword: newPassword,
                        email: userEmail
                    })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showNotification('Password changed successfully!', 'success');
                    // Reset form
                    changePasswordForm.reset();
                    // Close modal
                    changePasswordModal.style.display = 'none';
                } else {
                    showNotification(result.message || 'Failed to change password. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error changing password:', error);
                showNotification('An error occurred while changing your password. Please try again.', 'error');
            } finally {
                // Re-enable form
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Edit profile functionality
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeEditProfile = document.getElementById('close-edit-profile');
    const cancelEditProfile = document.getElementById('cancel-edit-profile');
    const editNameInput = document.getElementById('edit-name');
    const saveProfileBtn = document.getElementById('save-profile');
    const avatarUpload = document.getElementById('avatar-upload');
    const currentAvatar = document.getElementById('current-avatar');
    const profileAvatarEdit = document.querySelector('.profile-avatar-edit');
    
    // Show edit profile modal
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            // Close profile modal and open edit profile modal
            document.getElementById('profile-modal').style.display = 'none';
            editProfileModal.style.display = 'flex';
            
            // Load current user data
            const currentName = localStorage.getItem('userName') || '';
            editNameInput.value = currentName;
            
            // Update avatar display with stored avatar
            updateAvatarDisplay();
        });
    }
    
    // Close edit profile modal
    if (closeEditProfile) {
        closeEditProfile.addEventListener('click', function() {
            editProfileModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }
    
    if (cancelEditProfile) {
        cancelEditProfile.addEventListener('click', function() {
            editProfileModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }
    
    // Update profile display after saving
    function updateProfileDisplay(name, email) {
        document.getElementById('profile-name').textContent = name;
        document.getElementById('profile-email').textContent = email;
        document.getElementById('username-display').textContent = name;
    }
    
    // Also close modal when clicking outside of it
    if (editProfileModal) {
        editProfileModal.addEventListener('click', function(e) {
            if (e.target === editProfileModal) {
                editProfileModal.style.display = 'none';
                document.body.style.overflow = 'auto'; // Re-enable scrolling
            }
        });
    }
    
    // Avatar click to upload
    if (profileAvatarEdit) {
        profileAvatarEdit.addEventListener('click', function() {
            avatarUpload.click();
        });
    }
    
    // Handle avatar file selection
    if (avatarUpload) {
        avatarUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Check if the file is an image
                if (!file.type.match('image.*')) {
                    showNotification('Please select an image file (JPEG, PNG, etc.)', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(event) {
                    // Store the image data URL in localStorage
                    localStorage.setItem('userAvatar', event.target.result);
                    
                    // Update the profile avatar in the modal
                    if (currentAvatar) {
                        currentAvatar.className = 'user-avatar-img'; // Replace the icon class
                        currentAvatar.style.backgroundImage = `url(${event.target.result})`;
                        currentAvatar.style.backgroundSize = 'cover';
                        currentAvatar.style.backgroundPosition = 'center';
                        currentAvatar.style.borderRadius = '50%';
                        currentAvatar.style.width = '100%';
                        currentAvatar.style.height = '100%';
                        currentAvatar.style.display = 'block';
                        
                        // Create a placeholder element for the icon to maintain structure
                        const iconPlaceholder = document.createElement('div');
                        iconPlaceholder.style.paddingTop = '100%'; // Maintain aspect ratio
                        currentAvatar.appendChild(iconPlaceholder);
                    }
                    
                    // Also update the avatar in the profile modal if it's open
                    const profileAvatar = document.querySelector('.profile-avatar .fas.fa-user-circle');
                    if (profileAvatar) {
                        profileAvatar.className = 'user-avatar-img';
                        profileAvatar.style.backgroundImage = `url(${event.target.result})`;
                        profileAvatar.style.backgroundSize = 'cover';
                        profileAvatar.style.backgroundPosition = 'center';
                        profileAvatar.style.borderRadius = '50%';
                        profileAvatar.style.width = '100%';
                        profileAvatar.style.height = '100%';
                    }
                    
                    showNotification('Profile picture updated successfully!', 'success');
                };
                reader.onerror = function() {
                    showNotification('Error reading the image file', 'error');
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Handle profile save
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async function() {
            const newName = editNameInput.value.trim();
            
            if (!newName) {
                showNotification('Please enter a name', 'error');
                return;
            }
            
            // Disable button during save
            saveProfileBtn.textContent = 'Saving...';
            saveProfileBtn.disabled = true;
            
            try {
                const userEmail = localStorage.getItem('userEmail');
                
                // In a real implementation, this would call a backend API
                // For now, just update local storage and show success
                localStorage.setItem('userName', newName);
                
                // Call the backend API to update profile (this endpoint needs to be created)
                const response = await fetch('/update-profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Include auth token
                    },
                    body: JSON.stringify({
                        name: newName,
                        email: userEmail
                    })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Update name in the profile display as well
                    updateProfileDisplay(newName, localStorage.getItem('userEmail'));
                    
                    showNotification('Profile updated successfully!', 'success');
                    // Close modal
                    editProfileModal.style.display = 'none';
                } else {
                    showNotification(result.message || 'Failed to update profile. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showNotification('An error occurred while updating your profile. Please try again.', 'error');
            } finally {
                // Re-enable button
                saveProfileBtn.textContent = 'Save Changes';
                saveProfileBtn.disabled = false;
            }
        });
    }
    
    // Delete account functionality
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const deleteAccountModal = document.getElementById('delete-account-modal');
    const closeDeleteAccount = document.getElementById('close-delete-account');
    const cancelDeleteAccount = document.getElementById('cancel-delete-account');
    const confirmDeleteAccount = document.getElementById('confirm-delete-account');
    const deletePasswordInput = document.getElementById('delete-password');
    
    // Show delete account modal
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function() {
            // Close profile modal and open delete account modal
            document.getElementById('profile-modal').style.display = 'none';
            deleteAccountModal.style.display = 'flex';
            deletePasswordInput.value = ''; // Clear password field
        });
    }
    
    // Close delete account modal
    if (closeDeleteAccount) {
        closeDeleteAccount.addEventListener('click', function() {
            deleteAccountModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
            deletePasswordInput.value = ''; // Clear password field
        });
    }
    
    if (cancelDeleteAccount) {
        cancelDeleteAccount.addEventListener('click', function() {
            deleteAccountModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
            deletePasswordInput.value = ''; // Clear password field
        });
    }
    
    // Also close modal when clicking outside of it
    if (deleteAccountModal) {
        deleteAccountModal.addEventListener('click', function(e) {
            if (e.target === deleteAccountModal) {
                deleteAccountModal.style.display = 'none';
                document.body.style.overflow = 'auto'; // Re-enable scrolling
                deletePasswordInput.value = ''; // Clear password field
            }
        });
    }
    
    // Handle account deletion
    if (confirmDeleteAccount) {
        confirmDeleteAccount.addEventListener('click', async function() {
            const password = deletePasswordInput.value.trim();
            
            if (!password) {
                showNotification('Please enter your password', 'error');
                return;
            }
            
            // Disable button during deletion
            confirmDeleteAccount.textContent = 'Deleting...';
            confirmDeleteAccount.disabled = true;
            
            try {
                const userEmail = localStorage.getItem('userEmail');
                
                // Call the backend API to delete the account
                const response = await fetch('/delete-account', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Include auth token
                    },
                    body: JSON.stringify({
                        email: userEmail,
                        password: password
                    })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showNotification('Account deleted successfully!', 'success');
                    // Clear user data
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('joinDate');
                    localStorage.removeItem('pendingVerificationEmail');
                    
                    // Show auth container and hide chat container
                    document.getElementById('auth-container').style.display = 'flex';
                    document.getElementById('chat-container').style.display = 'none';
                    
                    // Close modal
                    deleteAccountModal.style.display = 'none';
                    document.body.style.overflow = 'auto'; // Re-enable scrolling
                    deletePasswordInput.value = ''; // Clear password field
                } else {
                    showNotification(result.message || 'Failed to delete account. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error deleting account:', error);
                showNotification('An error occurred while deleting your account. Please try again.', 'error');
            } finally {
                // Re-enable button
                confirmDeleteAccount.textContent = 'Delete Account';
                confirmDeleteAccount.disabled = false;
            }
        });
    }

    // Initialize app
    initializeApp();

    // Set up event listeners for all required fields to clear error styling when user types
    function setupFieldValidation() {
        // Function to add input event listener to clear error styling
        function addInputListener(formId) {
            const form = document.getElementById(formId);
            if (!form) return;
            
            const requiredFields = form.querySelectorAll('input[required]');
            requiredFields.forEach(input => {
                // Remove any existing listeners to avoid duplicates
                input.removeEventListener('input', input._errorClearHandler);
                
                // Define the event handler
                const handler = function() {
                    // Check if field has value
                    if (this.value.trim()) {
                        // Reset the styling
                        this.style.borderColor = '';
                        this.style.boxShadow = '';
                        
                        // Remove the required class from the input group
                        const inputGroup = this.closest('.input-group');
                        const passwordContainer = this.closest('.password-input-container');
                        
                        if (inputGroup) {
                            inputGroup.classList.remove('required');
                            const indicator = inputGroup.querySelector('.required-indicator');
                            if (indicator) {
                                indicator.remove();
                            }
                        }
                        
                        // Also check password container for password fields
                        if (passwordContainer) {
                            passwordContainer.classList.remove('required');
                            const indicator = passwordContainer.querySelector('.required-indicator');
                            if (indicator) {
                                indicator.remove();
                            }
                        }
                    }
                };
                
                // Store handler reference to allow removal later
                input._errorClearHandler = handler;
                
                // Add the event listener
                input.addEventListener('input', handler);
            });
        }
        
        // Initialize listeners for login and signup forms
        addInputListener('loginForm');
        addInputListener('signupForm');
        addInputListener('change-password-form');
    }
    
    // Initialize the application
    function initializeApp() {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            const name = localStorage.getItem('userName') || 'User';
            
            // Check if this is a page refresh (same browser session) or a new visit after closing the site
            // sessionStorage is cleared when all tabs are closed and browser is restarted
            if (sessionStorage.getItem('activeSession')) {
                // This appears to be a page refresh within the same browser session
                // Show the chat interface normally without creating a new chat
                showChatInterfaceRefresh(name);
            } else {
                // This is a new visit after closing the site (sessionStorage was cleared)
                // Show chat interface with a new chat
                showChatInterface(name);
            }
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
                
                // Set up validation event listeners
                setupFieldValidation();
            }
        }
    }

    // Show chat interface with a new chat (for new login sessions)
    function showChatInterface(userName) {
        if (usernameDisplay) {
            usernameDisplay.textContent = userName;
        }
        authContainer.style.display = 'none';
        chatContainer.style.display = 'flex';
        
        // Mark that we're in an active session to distinguish between new login and refresh
        sessionStorage.setItem('activeSession', 'true');
        
        // Load user's chat history from the database
        if (window.loadUserChatHistory) {
            window.loadUserChatHistory();
        } else if (window.loadChatHistory) {
            window.loadChatHistory();
        }
    }
    
    // Show chat interface and continue with current chat (for refreshes within same session)
    function showChatInterfaceRefresh(userName) {
        if (usernameDisplay) {
            usernameDisplay.textContent = userName;
        }
        authContainer.style.display = 'none';
        chatContainer.style.display = 'flex';
        
        // Load user's chat history from the database
        if (window.loadUserChatHistory) {
            window.loadUserChatHistory();
        } else if (window.loadChatHistory) {
            window.loadChatHistory();
        }
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
    
    // Password Reset Functionality
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const passwordResetModal = document.getElementById('password-reset-modal');
    const closeResetPassword = document.getElementById('close-reset-password');
    const cancelResetPassword = document.getElementById('cancel-reset-password');
    const passwordResetForm = document.getElementById('password-reset-form');
    const passwordResetConfirmModal = document.getElementById('password-reset-confirm-modal');
    const closeResetConfirm = document.getElementById('close-reset-confirm');
    const backToLoginFromReset = document.getElementById('back-to-login-from-reset');
    const resetEmailDisplay = document.getElementById('reset-email-display');
    
    // Show password reset modal
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            passwordResetModal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }
    
    // Close password reset modal
    if (closeResetPassword) {
        closeResetPassword.addEventListener('click', function() {
            passwordResetModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }
    
    if (cancelResetPassword) {
        cancelResetPassword.addEventListener('click', function() {
            passwordResetModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }
    
    // Also close modal when clicking outside of it
    if (passwordResetModal) {
        passwordResetModal.addEventListener('click', function(e) {
            if (e.target === passwordResetModal) {
                passwordResetModal.style.display = 'none';
                document.body.style.overflow = 'auto'; // Re-enable scrolling
            }
        });
    }
    
    // Handle password reset form submission
    if (passwordResetForm) {
        passwordResetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('reset-email').value;
            
            // Basic validation
            if (!email) {
                showNotification('Please enter your email address', 'error');
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Disable form during submission
            const submitBtn = passwordResetForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            try {
                // Call the backend API to send password reset email
                const response = await fetch('/request-password-reset', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email
                    })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Show confirmation modal
                    resetEmailDisplay.textContent = maskEmail(email);
                    passwordResetModal.style.display = 'none';
                    passwordResetConfirmModal.style.display = 'flex';
                    showNotification('Password reset link has been sent to your email!', 'success');
                } else {
                    // Check if the error is because the account doesn't exist
                    if (result.message && result.message.includes('does not exist')) {
                        showNotification('No account found with this email address. Please check the email and try again.', 'error');
                    } else {
                        showNotification(result.message || 'Failed to send password reset link. Please try again.', 'error');
                    }
                }
            } catch (error) {
                console.error('Error sending password reset:', error);
                showNotification('An error occurred while sending password reset link. Please try again.', 'error');
            } finally {
                // Re-enable form
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Close reset confirmation modal
    if (closeResetConfirm) {
        closeResetConfirm.addEventListener('click', function() {
            passwordResetConfirmModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }
    
    // Back to login from reset confirmation
    if (backToLoginFromReset) {
        backToLoginFromReset.addEventListener('click', function() {
            passwordResetConfirmModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        });
    }
    
    // Also close reset confirmation modal when clicking outside of it
    if (passwordResetConfirmModal) {
        passwordResetConfirmModal.addEventListener('click', function(e) {
            if (e.target === passwordResetConfirmModal) {
                passwordResetConfirmModal.style.display = 'none';
                document.body.style.overflow = 'auto'; // Re-enable scrolling
            }
        });
    }
    
    // Check if we're on the password reset page (when user clicks the reset link)
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken) {
        // Show the password reset UI
        document.getElementById('password-reset-ui').style.display = 'flex';
        document.getElementById('auth-container').style.display = 'none';
    }
    
    // Password Reset UI functionality
    const resetPasswordForm = document.getElementById('reset-password-form');
    const backToLoginFromResetUI = document.getElementById('back-to-login-from-reset-ui');
    
    // Handle password reset submission
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const newPassword = document.getElementById('new-password').value;
            const confirmNewPassword = document.getElementById('confirm-new-password').value;
            
            // Validation
            if (!newPassword || !confirmNewPassword) {
                showNotification('Please fill in both password fields', 'error');
                return;
            }
            
            if (newPassword !== confirmNewPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            if (newPassword.length < 6) {
                showNotification('Password must be at least 6 characters long', 'error');
                return;
            }
            
            // Disable form during submission
            const submitBtn = document.getElementById('save-new-password');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Resetting...';
            submitBtn.disabled = true;
            
            try {
                // Call the backend API to reset the password
                const response = await fetch('/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: resetToken,
                        newPassword: newPassword
                    })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showNotification('Password has been reset successfully!', 'success');
                    // Redirect to login page after a short delay
                    setTimeout(() => {
                        // Hide reset UI and show auth container
                        document.getElementById('password-reset-ui').style.display = 'none';
                        document.getElementById('auth-container').style.display = 'flex';
                        // Reset the form
                        resetPasswordForm.reset();
                    }, 2000);
                } else {
                    showNotification(result.message || 'Failed to reset password. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error resetting password:', error);
                showNotification('An error occurred while resetting your password. Please try again.', 'error');
            } finally {
                // Re-enable form
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Back to login from reset UI
    if (backToLoginFromResetUI) {
        backToLoginFromResetUI.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('password-reset-ui').style.display = 'none';
            document.getElementById('auth-container').style.display = 'flex';
        });
    }
    
    // Password visibility toggle for reset UI
    setupPasswordToggle('new-password', 'toggle-new-password-reset');
    setupPasswordToggle('confirm-new-password', 'toggle-confirm-new-password-reset');

    // Terms and Privacy Policy Modal Functionality
    const termsAgreement = document.getElementById('terms-agreement');
    const termsLink = document.getElementById('terms-link');
    const privacyLink = document.getElementById('privacy-link');
    const policyModal = document.getElementById('policy-modal');
    const closePolicy = document.getElementById('close-policy');
    const acceptPolicy = document.getElementById('accept-policy');
    const policyTitle = document.getElementById('policy-title');
    const policyText = document.getElementById('policy-text');

    // Show terms modal when terms link is clicked
    if (termsLink) {
        termsLink.addEventListener('click', function(e) {
            e.preventDefault();
            policyTitle.textContent = 'Terms of Service';
            loadPolicyContent('terms');
            policyModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }

    // Show privacy policy modal when privacy link is clicked
    if (privacyLink) {
        privacyLink.addEventListener('click', function(e) {
            e.preventDefault();
            policyTitle.textContent = 'Privacy Policy';
            loadPolicyContent('privacy');
            policyModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }

    // Clicking on the agreement text should open the terms modal
    const agreementText = document.querySelector('.agreement-text');
    if (agreementText) {
        agreementText.addEventListener('click', function(e) {
            e.preventDefault();
            // Only show the terms modal if clicking on the text part (not links)
            if (e.target.tagName !== 'A') {
                policyTitle.textContent = 'Terms of Service';
                loadPolicyContent('terms');
                policyModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    }

    // Close policy modal
    if (closePolicy) {
        closePolicy.addEventListener('click', function() {
            policyModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }

    // Accept policy and close modal
    if (acceptPolicy) {
        acceptPolicy.addEventListener('click', function() {
            policyModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            // Check the agreement checkbox if not already checked
            if (termsAgreement && !termsAgreement.checked) {
                termsAgreement.checked = true;
            }
        });
    }

    // Also close modal when clicking outside of it
    if (policyModal) {
        policyModal.addEventListener('click', function(e) {
            if (e.target === policyModal) {
                policyModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Function to load policy content based on type
    function loadPolicyContent(type) {
        if (type === 'terms') {
            policyText.innerHTML = `
                <h3>Terms of Service</h3>
                <p><strong>Last updated:</strong> October 21, 2025</p>

                <h4>1. Acceptance of Terms</h4>
                <p>By accessing and using ChatUp, you accept and agree to be bound by the terms and provision of this agreement.</p>

                <h4>2. Use License</h4>
                <p>Permission is granted to temporarily download one copy of ChatUp per person for personal, non-commercial transitory viewing only.</p>

                <h4>3. Disclaimer</h4>
                <p>ChatUp is provided "as is" without any representations or warranties, express or implied.</p>

                <h4>4. Limitations</h4>
                <p>In no event shall ChatUp or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use ChatUp.</p>

                <h4>5. Accuracy of Materials</h4>
                <p>The materials appearing on ChatUp may include technical, typographical, or photographic errors. These materials are provided "as is" without warranty of any kind.</p>

                <h4>6. Modifications</h4>
                <p>ChatUp reserves the right to modify these terms at any time. Changes will be effective immediately upon posting.</p>

                <h4>7. Governing Law</h4>
                <p>These terms shall be governed by and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law provisions.</p>
            `;
        } else if (type === 'privacy') {
            policyText.innerHTML = `
                <h3>Privacy Policy</h3>
                <p><strong>Last updated:</strong> October 21, 2025</p>

                <h4>1. Information We Collect</h4>
                <p>We collect information you provide directly to us, such as when you create an account, use our services, or communicate with us.</p>

                <h4>2. How We Use Information</h4>
                <p>We use information about you to provide, maintain, and improve our services, to communicate with you, and to ensure the security of our services.</p>

                <h4>3. Information Sharing</h4>
                <p>We do not share your personal information with companies, organizations, or individuals outside of ChatUp except in the following cases:</p>
                <ul>
                    <li>With your consent</li>
                    <li>For legal reasons</li>
                    <li>For external processing</li>
                </ul>

                <h4>4. Data Security</h4>
                <p>We implement appropriate data collection, storage and processing practices and security measures to protect against unauthorized access, alteration, disclosure or destruction of your personal information.</p>

                <h4>5. Your Rights</h4>
                <p>Depending on your location, you may have rights to access, correct, or delete your personal information.</p>

                <h4>6. Changes to This Policy</h4>
                <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page.</p>

                <h4>7. Contact Us</h4>
                <p>If you have any questions about this Privacy Policy, please contact us through our support system.</p>
            `;
        }
    }

    // Auto-resize textarea
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            // Reset height to auto to get the correct scrollHeight
            this.style.height = 'auto';
            // Calculate the appropriate height, making sure it doesn't exceed max-height
            const computedStyle = window.getComputedStyle(this);
            const borderTopWidth = parseFloat(computedStyle.borderTopWidth);
            const borderBottomWidth = parseFloat(computedStyle.borderBottomWidth);
            const padding = borderTopWidth + borderBottomWidth;
            const newHeight = Math.min(this.scrollHeight, 150) + padding;
            this.style.height = newHeight + 'px';
        });
    }

    // Contact Support Modal Functionality
    const contactSupportBtn = document.getElementById('contact-support-btn');
    const contactSupportBtnAuth = document.getElementById('contact-support-btn-auth');
    const contactSupportModal = document.getElementById('contact-support-modal');
    const closeContactSupport = document.getElementById('close-contact-support');
    const cancelContactSupport = document.getElementById('cancel-contact-support');
    const contactSupportForm = document.getElementById('contact-support-form');
    const supportNameInput = document.getElementById('support-name');
    const supportEmailInput = document.getElementById('support-email');
    const supportMessageInput = document.getElementById('support-message');

    // Show contact support modal
    if (contactSupportBtn) {
        contactSupportBtn.addEventListener('click', function() {
            contactSupportModal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }
    
    // Show contact support modal from auth page
    if (contactSupportBtnAuth) {
        contactSupportBtnAuth.addEventListener('click', function() {
            contactSupportModal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }

    // Close contact support modal
    if (closeContactSupport) {
        closeContactSupport.addEventListener('click', function() {
            contactSupportModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
            resetContactSupportForm();
        });
    }

    if (cancelContactSupport) {
        cancelContactSupport.addEventListener('click', function() {
            contactSupportModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
            resetContactSupportForm();
        });
    }

    // Also close modal when clicking outside of it
    if (contactSupportModal) {
        contactSupportModal.addEventListener('click', function(e) {
            if (e.target === contactSupportModal) {
                contactSupportModal.style.display = 'none';
                document.body.style.overflow = 'auto'; // Re-enable scrolling
                resetContactSupportForm();
            }
        });
    }

    // Reset contact support form
    function resetContactSupportForm() {
        contactSupportForm.reset();
        // Hide error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.classList.remove('show');
        });
        // Clear field error styling
        document.querySelectorAll('#support-name, #support-email, #support-message').forEach(input => {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        });
    }

    // Handle contact support form submission
    if (contactSupportForm) {
        contactSupportForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Get form values
            const name = supportNameInput.value.trim();
            const email = supportEmailInput.value.trim();
            const message = supportMessageInput.value.trim();

            // Reset errors
            resetErrors();

            // Validate form
            let hasError = false;

            // Name validation
            if (!name) {
                showError('name-error', 'Name is required');
                markFieldError('support-name');
                hasError = true;
            } else if (name.length < 2) {
                showError('name-error', 'Name must be at least 2 characters');
                markFieldError('support-name');
                hasError = true;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email) {
                showError('email-error', 'Email is required');
                markFieldError('support-email');
                hasError = true;
            } else if (!emailRegex.test(email)) {
                showError('email-error', 'Please enter a valid email address');
                markFieldError('support-email');
                hasError = true;
            }

            // Message validation
            if (!message) {
                showError('message-error', 'Message is required');
                markFieldError('support-message');
                hasError = true;
            } else if (message.length < 10) {
                showError('message-error', 'Message must be at least 10 characters');
                markFieldError('support-message');
                hasError = true;
            }

            if (hasError) {
                return;
            }

            // Disable form during submission
            const submitBtn = contactSupportForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                // Send the support request to the backend
                const response = await fetch('/contact-support', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        message: message
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    showNotification('Your message has been sent successfully! Our support team will contact you soon.', 'success');
                    // Reset form and close modal
                    resetContactSupportForm();
                    contactSupportModal.style.display = 'none';
                    document.body.style.overflow = 'auto'; // Re-enable scrolling
                } else {
                    showNotification(result.message || 'Failed to send your message. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error sending support request:', error);
                showNotification('An error occurred while sending your message. Please try again.', 'error');
            } finally {
                // Re-enable form
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Helper functions for form validation
    function showError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    function markFieldError(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.style.borderColor = '#ff6b6b';
            input.style.boxShadow = '0 0 0 2px rgba(255, 107, 107, 0.3)';
        }
    }

    function resetErrors() {
        // Hide all error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.classList.remove('show');
        });
        // Reset field styles
        document.querySelectorAll('#support-name, #support-email, #support-message').forEach(input => {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        });
    }

    // Add input event listeners to clear errors when user types
    if (supportNameInput) {
        supportNameInput.addEventListener('input', function() {
            if (this.value.trim()) {
                document.getElementById('name-error').classList.remove('show');
                this.style.borderColor = '';
                this.style.boxShadow = '';
            }
        });
    }

    if (supportEmailInput) {
        supportEmailInput.addEventListener('input', function() {
            if (this.value.trim()) {
                document.getElementById('email-error').classList.remove('show');
                this.style.borderColor = '';
                this.style.boxShadow = '';
            }
        });
    }

    if (supportMessageInput) {
        supportMessageInput.addEventListener('input', function() {
            if (this.value.trim()) {
                document.getElementById('message-error').classList.remove('show');
                this.style.borderColor = '';
                this.style.boxShadow = '';
            }
        });
    }
});