// public/js/pages/ProfilePage.js
import { supabase } from '../services/supabaseClient.js';
import { getCurrentUserId, getSupabaseUser, getProfileData } from '../services/authService.js';
import { fetchUserClimbLogs, subscribeToRealtimeChanges } from '../services/climbLogService.js';
// Removed: import { addRoute } from '../services/routeService.js';
// Removed: import { resetWall, getCurrentWallReset } from '../services/wallResetService.js';

function ProfilePage() {
    const profilePageContainer = document.createElement('div');
    profilePageContainer.classList.add('profile-container');

    profilePageContainer.innerHTML = `
        <a href="/#/" class="back-button">Back to Home</a>
        <h1>Profile</h1>

        <p id="auth-status" class="profile-bio">Loading user status...</p>

        <form id="auth-form" class="profile-details">
            <h2>Sign Up or Login</h2>
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" placeholder="Your email" required>
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" placeholder="Your password" required>
            </div>
            <div class="profile-actions">
                <button type="submit" id="signup-button">Sign Up</button>
                <button type="submit" id="login-button">Login</button>
            </div>
        </form>

        <div class="profile-actions">
            <button id="logout-button" style="display: none;">Logout</button>
        </div>

        <div id="user-info" class="profile-details">
            <h2>User Information</h2>
            <ul>
                <li><strong>ID:</strong> <span id="user-id"></span></li>
                <li><strong>Email:</strong> <span id="user-email"></span></li>
                <li><strong>Created At:</strong> <span id="user-created-at"></span></li>
            </ul>
        </div>

        `;

    // Event listener setup needs to happen *after* the elements are in the DOM
    setTimeout(() => {
        const authStatus = profilePageContainer.querySelector('#auth-status');
        const authForm = profilePageContainer.querySelector('#auth-form');
        const emailInput = profilePageContainer.querySelector('#email');
        const passwordInput = profilePageContainer.querySelector('#password');
        const signupButton = profilePageContainer.querySelector('#signup-button');
        const loginButton = profilePageContainer.querySelector('#login-button');
        const logoutButton = profilePageContainer.querySelector('#logout-button');
        const userIdSpan = profilePageContainer.querySelector('#user-id');
        const userEmailSpan = profilePageContainer.querySelector('#user-email');
        const userCreatedAtSpan = profilePageContainer.querySelector('#user-created-at');
        const userInfoDiv = profilePageContainer.querySelector('#user-info');
        // Removed admin specific elements: adminToolsSection, addRouteForm, adminMessageDiv, etc.


        // Function to update UI based on user session
        async function updateAuthUI() {
            const user = await getSupabaseUser();
            if (user) {
                authStatus.textContent = `Logged in as: ${user.email}`;
                authForm.style.display = 'none';
                logoutButton.style.display = 'block';
                userInfoDiv.style.display = 'block';

                userIdSpan.textContent = user.id;
                userEmailSpan.textContent = user.email;
                userCreatedAtSpan.textContent = new Date(user.created_at).toLocaleString();

                // Removed admin check logic from here, as tools are no longer on this page

                await fetchUserClimbLogs();
                subscribeToRealtimeChanges();

            } else {
                authStatus.textContent = 'Not logged in.';
                authForm.style.display = 'block';
                logoutButton.style.display = 'none';
                userInfoDiv.style.display = 'none';
                // Removed adminToolsSection.style.display = 'none';
            }
        }

        // Initial UI update when the ProfilePage is rendered
        updateAuthUI();

        // Event listeners for auth actions
        signupButton.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;
            const { data, error } = await supabase.auth.signUp({ email, password });

            if (error) {
                authStatus.textContent = `Sign Up Error: ${error.message}`;
                console.error('Sign Up Error:', error);
            } else if (data.user) {
                authStatus.textContent = `Sign Up Successful! Check your email for confirmation.`;
            }
        });

        loginButton.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                authStatus.textContent = `Login Error: ${error.message}`;
                console.error('Login Error:', error);
            } else if (data.user) {
                authStatus.textContent = `Logged in as: ${data.user.email}`;
                window.location.hash = '/'; // Go to home page after successful login
            }
        });

        logoutButton.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                authStatus.textContent = `Logout Error: ${error.message}`;
                console.error('Logout Error:', error);
            } else {
                authStatus.textContent = 'Logged out successfully.';
                window.location.hash = '/profile'; // Stay on profile page or redirect to login form
            }
        });

        // Listen for auth state changes *within this component* (optional, but ensures local UI updates)
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                console.log("ProfilePage: Auth State Change detected, updating UI.");
                updateAuthUI();
            }
        });

        // Removed: Add route form event listener
        // Removed: Reset wall form event listener
        // Removed: updateAddRouteFormWallResetId function

    }, 0);

    return profilePageContainer;
}

export default ProfilePage;