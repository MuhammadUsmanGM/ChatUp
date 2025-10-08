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
                    // If join date is not already set, set it (this might be from a previous session)
                    if (!localStorage.getItem('joinDate')) {
                        localStorage.setItem('joinDate', new Date().toISOString().split('T')[0]);
                    }
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
    
    // Profile functionality
    const profileBtn = document.getElementById('profile-btn');
    const profileModal = document.getElementById('profile-modal');
    const closeProfile = document.getElementById('close-profile');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileJoinDate = document.getElementById('profile-join-date');
    
    // Show profile modal
    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
            // Get user data from localStorage
            const name = localStorage.getItem('userName') || 'User';
            const email = localStorage.getItem('userEmail') || 'Not available';
            
            // Set profile data
            profileName.textContent = name;
            profileEmail.textContent = email;
            
            // Calculate join date (using registration timestamp if available, or current date as fallback)
            const joinDate = localStorage.getItem('joinDate') || new Date().toISOString().split('T')[0];
            profileJoinDate.textContent = formatDate(joinDate);
            
            // Show modal
            profileModal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }
    
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
            const newPassword = document.getElementById('new-password').value;
            const confirmNewPassword = document.getElementById('confirm-new-password').value;
            
            // Validation
            if (!oldPassword || !newPassword || !confirmNewPassword) {
                showNotification('Please fill in all fields', 'error');
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
            
            // Load stored avatar if available, otherwise use default
            const storedAvatar = localStorage.getItem('userAvatar');
            if (storedAvatar) {
                // For now, we'll just continue to use the default icon
                // In a real implementation, we'd show the actual avatar
            }
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
                // In a real implementation, we'd upload the image to a server
                // For now, we'll just store a reference to the file or use a default
                const reader = new FileReader();
                reader.onload = function(event) {
                    // Since we're using localStorage and icons, we'll store a reference
                    // For this implementation, we'll just show a notification
                    showNotification('Profile picture updated successfully!', 'success');
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