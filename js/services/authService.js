// public/js/services/authService.js
import { supabase } from './supabaseClient.js';

let currentUserId = null; // Local cache for current user's UUID

// --- Internal functions for authentication state management ---

// Sets the currentUserId and notifies listeners (like climbLogService)
function setUser(userId) {
    if (currentUserId !== userId) {
        currentUserId = userId;
        console.log("AuthService: User ID updated to:", currentUserId);
        // Optionally, you can dispatch a custom event here for other modules to listen
        // document.dispatchEvent(new CustomEvent('auth:userChanged', { detail: userId }));
    }
}

// --- Public API for other modules ---

// Gets the current user's ID
export function getCurrentUserId() {
    return currentUserId;
}

// Fetches the current user session (can be used for initial load or UI checks)
export async function getSupabaseUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// --- Authentication State Change Listener ---
// This runs automatically when auth state changes (login, logout, token refresh)
supabase.auth.onAuthStateChange((event, session) => {
    console.log('AuthService: Auth State Change Event:', event, 'Session:', session);
    if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user.id);
        // After sign-in, climbLogService needs to re-fetch logs
        // App.js will also need to trigger re-renders based on user state
    } else if (event === 'SIGNED_OUT') {
        setUser(null);
        // After sign-out, climbLogService needs to clear logs
        // App.js will need to trigger re-renders
    }
    // No need to handle initial load here directly, as the immediate IIFE below covers it.
});

// --- Initial User Check on Module Load ---
// This immediately checks the user status when the module is first imported
// and sets the initial currentUserId.
(async () => {
    const user = await getSupabaseUser();
    setUser(user ? user.id : null);
    console.log("AuthService: Initial user check completed. User ID:", currentUserId);
})();

// You can add login/signup/logout functions here later if you want to centralize them
// For now, these might be handled by the ProfilePage component directly using `supabase.auth`

// public/js/services/authService.js (continued)

// Fetches the profile data for the current user from the 'profiles' table
export async function getProfileData() {
    const userId = getCurrentUserId();
    if (!userId) {
        console.log("AuthService: No user logged in, cannot fetch profile data.");
        return null;
    }
    console.log("AuthService: Fetching profile data for user:", userId);

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, is_admin') // Select columns you need
        .eq('id', userId)
        .single();

    if (error) {
        console.error('AuthService: Error fetching profile data:', error.message);
        return null;
    }
    console.log('AuthService: Profile data fetched:', profile);
    return profile;
}