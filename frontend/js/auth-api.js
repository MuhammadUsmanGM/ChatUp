// auth-api.js - API integration for authentication with MongoDB

// Function to register a new user
async function registerUser(userData) {
    try {
        const response = await fetch('http://localhost:5000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: userData.name,
                email: userData.email,
                password: userData.password
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            // Registration successful
            return { success: true, data: result };
        } else {
            // Registration failed
            return { success: false, error: result.message };
        }
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: 'Network error' };
    }
}

// Function to login user
async function loginUser(credentials) {
    try {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: credentials.email,
                password: credentials.password
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            // Login successful - store token/session info
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('userName', result.name);
            localStorage.setItem('userEmail', result.email);
            localStorage.setItem('isLoggedIn', 'true');
            
            return { success: true, data: result };
        } else {
            // Login failed
            return { success: false, error: result.message };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Network error' };
    }
}

// Function to logout user
function logoutUser() {
    // Clear all stored user data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isLoggedIn');
    
    return true;
}

// Function to check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Function to get current user info
function getCurrentUser() {
    if (isAuthenticated()) {
        return {
            name: localStorage.getItem('userName'),
            email: localStorage.getItem('userEmail')
        };
    }
    return null;
}