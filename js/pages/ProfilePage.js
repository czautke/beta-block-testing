// public/js/pages/ProfilePage.js
import { supabase } from '../services/supabaseClient.js';
import { getCurrentUserId, getSupabaseUser, getProfileData } from '../services/authService.js';
import { fetchUserClimbLogs, subscribeToRealtimeChanges, getUserCompletedRoutesCountByGrade } from '../services/climbLogService.js'; // ADDED getUserCompletedRoutesCountByGrade
import { getRoutesCountByGrade } from '../services/routeService.js'; // ADDED getRoutesCountByGrade
// Removed admin-specific imports: addRoute, resetWall, getCurrentWallReset, updateWallResetDate (now in WallPage)

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

        <div id="climb-stats-section" class="profile-details" style="display: none;">
            <h2>Climb Statistics by Grade</h2>
            <div id="stats-content">
                <p>Loading statistics...</p>
            </div>
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
        
        // NEW: Element references for Climb Statistics Section
        const climbStatsSection = profilePageContainer.querySelector('#climb-stats-section');
        const statsContentDiv = profilePageContainer.querySelector('#stats-content');


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

                // Display climb statistics
                climbStatsSection.style.display = 'block'; // Show stats section
                statsContentDiv.innerHTML = '<p>Loading statistics...</p>'; // Show loading message

                await renderClimbStatistics(); // Call to render stats

                await fetchUserClimbLogs();
                subscribeToRealtimeChanges();

            } else {
                authStatus.textContent = 'Not logged in.';
                authForm.style.display = 'block';
                logoutButton.style.display = 'none';
                userInfoDiv.style.display = 'none';
                climbStatsSection.style.display = 'none'; // Hide stats section if not logged in
                statsContentDiv.innerHTML = ''; // Clear stats content
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

        // NEW: Function to render climb statistics
        async function renderClimbStatistics() {
            statsContentDiv.innerHTML = '<p>Loading statistics...</p>'; // Ensure loading state

            const { data: totalRoutesByGrade, error: totalError } = await getRoutesCountByGrade();
            const { data: completedRoutesByGrade, error: completedError } = await getUserCompletedRoutesCountByGrade();

            if (totalError || completedError) {
                statsContentDiv.innerHTML = `<p style="color: red;">Error loading statistics: ${totalError?.message || completedError?.message}</p>`;
                console.error('Error loading climb statistics:', totalError, completedError);
                return;
            }

            // Combine grades from both total and completed lists to ensure all grades are displayed
            const grades = [...new Set([
                ...totalRoutesByGrade.map(g => g.grade),
                ...completedRoutesByGrade.map(g => g.grade)
            ])].sort((a, b) => {
                // Custom sort for grades like V0, V1, B1, B2 etc.
                const parseGrade = (grade) => {
                    const match = grade.match(/([A-Z])(\d+)/);
                    if (match) {
                        return { type: match[1], num: parseInt(match[2], 10) };
                    }
                    return { type: 'Z', num: 999 }; // Fallback for unexpected grades
                };
                const gradeA = parseGrade(a);
                const gradeB = parseGrade(b);

                if (gradeA.type === gradeB.type) {
                    return gradeA.num - gradeB.num;
                }
                return gradeA.type.localeCompare(gradeB.type); // Sort by type (e.g., B before V)
            });


            if (grades.length === 0) {
                statsContentDiv.innerHTML = '<p>No routes found yet or no climbs logged.</p>';
                return;
            }

            const ul = document.createElement('ul');
            grades.forEach(grade => {
                // Find counts for the current grade
                const totalEntry = totalRoutesByGrade.find(g => g.grade === grade);
                const total = totalEntry ? parseInt(totalEntry.count, 10) : 0; // Ensure count is a number

                const completedEntry = completedRoutesByGrade.find(g => g.grade === grade);
                const completed = completedEntry ? parseInt(completedEntry.count, 10) : 0; // Ensure count is a number

                const li = document.createElement('li');
                li.innerHTML = `<strong>Grade ${grade}:</strong> ${completed} / ${total} completed`;
                ul.appendChild(li);
            });
            statsContentDiv.innerHTML = ''; // Clear loading message
            statsContentDiv.appendChild(ul);
        }

    }, 0); // End of setTimeout

    return profilePageContainer;
}

export default ProfilePage;