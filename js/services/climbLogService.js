// public/js/services/climbLogService.js
import { supabase } from './supabaseClient.js';
import { getCurrentUserId } from './authService.js'; // Get user ID from authService

let climbLogsCache = {}; // Cache for user's climb logs: { route_id: is_complete }
let realtimeChannel = null; // Supabase Realtime channel instance

// --- Internal Helper for UI updates (generic, can be moved to uiHelpers later) ---
function updateCircleUI(element, isComplete) {
    if (element) {
        console.log(`Updating Circle UI for ${element.dataset.routeId} to: ${isComplete ? 'Complete' : 'Incomplete'}`);
        if (isComplete) {
            element.classList.remove('incomplete');
            element.classList.add('complete');
            element.textContent = 'Complete';
        } else {
            element.classList.remove('complete');
            element.add('incomplete');
            element.textContent = 'Incomplete';
        }
    }
}

function updateCheckboxUI(element, isComplete) {
    if (element) {
        console.log(`Updating Checkbox UI for ${element.dataset.routeId} to: ${isComplete ? 'Checked' : 'Unchecked'}`);
        element.checked = isComplete;
    }
}


// --- Core Data Management Functions ---

// Fetch all climb logs for the current user
export async function fetchUserClimbLogs() {
    const userId = getCurrentUserId(); // Get user ID from authService
    if (!userId) {
        climbLogsCache = {}; // Clear logs if no user
        console.log("ClimbLogService: No user logged in, clearing climb logs cache.");
        return climbLogsCache;
    }
    console.log(`ClimbLogService: Fetching climb logs for user: ${userId}`);
    const { data, error } = await supabase
        .from('climb_logs')
        .select('route_id, is_complete')
        .eq('user_id', userId);

    if (error) {
        console.error('ClimbLogService: Error fetching user climb logs:', error.message);
        climbLogsCache = {}; // Ensure cache is clear on error
        return climbLogsCache;
    }

    climbLogsCache = {}; // Reset cache before populating
    data.forEach(log => {
        climbLogsCache[log.route_id] = log.is_complete; // Store by route_id (UUID)
    });
    console.log(`ClimbLogService: Fetched ${Object.keys(climbLogsCache).length} climb logs.`);
    return climbLogsCache; // Return the populated cache
}

// Get the completion status of a specific route from the cache
export function getClimbStatusFromCache(routeId) {
    return climbLogsCache[routeId] || false; // Default to false if not in cache
}

// Update climb status in Supabase and local cache
export async function updateClimbStatus(routeId, isComplete) {
    const userId = getCurrentUserId(); // Get user ID from authService
    if (!userId) {
        console.warn("ClimbLogService: User not logged in. Cannot update climb status.");
        alert("Please log in to track your climbs!"); // Provide user feedback
        // Optionally, revert UI here if this function was called optimistically
        // For now, we'll let the UI components handle their own optimistic updates.
        return { error: true, message: "User not logged in" };
    }

    console.log(`ClimbLogService: Attempting to set ${routeId} to ${isComplete} for user ${userId}`);

    const { data: existingLog, error: fetchError } = await supabase
        .from('climb_logs')
        .select('id') // Select the UUID of the climb log entry
        .eq('user_id', userId)
        .eq('route_id', routeId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means "no rows found"
        console.error('ClimbLogService: Error checking existing climb log:', fetchError.message);
        return { error: true, message: fetchError.message };
    }

    let dbOperationPromise;
    if (existingLog) {
        // Record exists, update it
        console.log(`ClimbLogService: Updating existing climb log for ${routeId}, ID: ${existingLog.id}`);
        dbOperationPromise = supabase
            .from('climb_logs')
            .update({ is_complete: isComplete, completed_at: new Date().toISOString() })
            .eq('id', existingLog.id);
    } else {
        // No record, insert a new one
        console.log(`ClimbLogService: Inserting new climb log for ${routeId}`);
        dbOperationPromise = supabase
            .from('climb_logs')
            .insert([
                { user_id: userId, route_id: routeId, is_complete: isComplete }
            ]);
    }

    const { error } = await dbOperationPromise;

    if (error) {
        console.error(`ClimbLogService: Error ${existingLog ? 'updating' : 'inserting'} climb log for ${routeId}:`, error.message);
        return { error: true, message: error.message };
    } else {
        console.log(`ClimbLogService: Status for ${routeId} successfully ${existingLog ? 'updated' : 'inserted'} to ${isComplete}`);
        climbLogsCache[routeId] = isComplete; // Update local cache immediately
        return { error: false, message: "Success" };
    }
}

// --- Realtime Subscription ---
export function subscribeToRealtimeChanges() {
    const userId = getCurrentUserId();

    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel); // Unsubscribe from old channel if exists
        realtimeChannel = null;
    }

    if (userId) {
        console.log(`ClimbLogService: Subscribing to realtime changes for user ID: ${userId}`);
        realtimeChannel = supabase
            .channel(`climb_logs_for_${userId}`) // Unique channel name per user
            .on('postgres_changes', { event: '*', schema: 'public', table: 'climb_logs', filter: `user_id=eq.${userId}` }, payload => {
                console.log('ClimbLogService: Realtime Change Received!', payload);
                const changedRouteId = payload.new?.route_id || payload.old?.route_id; // UUID of the route
                const newStatus = payload.new?.is_complete;

                if (changedRouteId) {
                    climbLogsCache[changedRouteId] = newStatus; // Update local cache
                    // Trigger a UI update for any elements currently on the page
                    const affectedCheckbox = document.querySelector(`.route-checkbox[data-route-id="${changedRouteId}"]`);
                    const affectedCircle = document.querySelector(`.status-circle[data-route-id="${changedRouteId}"]`);
                    if (affectedCheckbox) updateCheckboxUI(affectedCheckbox, newStatus);
                    if (affectedCircle) updateCircleUI(affectedCircle, newStatus);
                }
            })
            .subscribe();
    } else {
        console.log("ClimbLogService: No user to subscribe to realtime changes.");
    }
}

// Initial subscription when the module loads, if a user is already present
// Also, re-subscribe/unsubscribe when auth state changes (handled by App.js calling this)
(async () => {
    await fetchUserClimbLogs(); // Fetch initial logs
    subscribeToRealtimeChanges(); // Attempt initial subscription
})();

// Cleanup: Remove Realtime subscription when page is navigated away or closed
// This is handled by App.js now on route changes.
// window.addEventListener('beforeunload', () => {
//     if (realtimeChannel) {
//         supabase.removeChannel(realtimeChannel);
//         console.log("Realtime channel unsubscribed on page unload.");
//     }
// });



// public/js/services/climbLogService.js (at the end of the file)

// Fetches count of user's completed routes grouped by grade, ONLY for currently active routes
export async function getUserCompletedRoutesCountByGrade() {
    const userId = getCurrentUserId();
    if (!userId) {
        console.log("ClimbLogService: No user logged in, cannot fetch completed routes by grade.");
        return { data: [], error: { message: "User not logged in" } };
    }

    console.log(`ClimbLogService: Fetching completed routes by grade for user (only current active routes): ${userId}`);

    // This query joins climb_logs -> routes -> wall_resets
    // 'routes!inner(grade, wall_reset_id)' specifies an INNER JOIN to routes and selects grade and wall_reset_id.
    // '.eq('routes.wall_resets.is_current', true)' implicitly joins to wall_resets
    // and filters based on the is_current flag for the linked wall_reset.
    const { data, error } = await supabase
        .from('climb_logs')
        .select('routes!inner(grade, wall_reset_id, wall_resets!inner(is_current)), is_complete') // Select grade, wall_reset_id from routes, and is_current from wall_resets
        .eq('user_id', userId)
        .eq('is_complete', true)
        .not('routes.grade', 'is', null) // Exclude routes without a grade
        .eq('routes.wall_resets.is_current', true); // Filter on the nested wall_resets property

    if (error) {
        console.error('ClimbLogService: Error fetching user completed routes by grade:', error.message);
        return { data: [], error };
    }

    // Process the data to group by grade and count completed climbs
    const completedByGrade = {};
    data.forEach(log => {
        // Access grade through the nested 'routes' object
        const grade = log.routes?.grade;
        if (grade) {
            completedByGrade[grade] = (completedByGrade[grade] || 0) + 1;
        }
    });

    const formattedData = Object.keys(completedByGrade).map(grade => ({
        grade,
        count: completedByGrade[grade]
    }));

    console.log('ClimbLogService: User completed routes by grade (filtered by current):', formattedData);
    return { data: formattedData, error: null };
}