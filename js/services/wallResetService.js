// public/js/services/wallResetService.js
import { supabase } from './supabaseClient.js';

// Fetches the current active reset for a specific wall
export async function getCurrentWallReset(wallId) {
    const { data, error } = await supabase
        .from('wall_resets')
        .select('id, reset_date, photo_url')
        .eq('wall_id', wallId)
        .eq('is_current', true)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
        console.error(`WallResetService: Error fetching current reset for ${wallId}:`, error.message);
        return { data: null, error };
    }
    return { data, error: null };
}

// Fetches all historical resets for a specific wall, ordered by date
export async function getWallResets(wallId) {
    const { data, error } = await supabase
        .from('wall_resets')
        .select('id, reset_date, photo_url, is_current')
        .eq('wall_id', wallId)
        .order('reset_date', { ascending: false }); // Most recent first

    if (error) {
        console.error(`WallResetService: Error fetching wall resets for ${wallId}:`, error.message);
        return { data: [], error };
    }
    return { data, error: null };
}

// Handles the "reset" action: deactivates current, creates new current
// Now accepts a custom resetDate
export async function resetWall(wallId, photoUrl, customResetDate = null) { // ADD customResetDate
    console.log(`WallResetService: Attempting to reset wall ${wallId}, date: ${customResetDate || 'now()'}`);

    // 1. Get the currently active wall reset for this wall
    const { data: currentReset, error: fetchError } = await getCurrentWallReset(wallId);

    if (fetchError && fetchError.code !== 'PGRST116') {
         return { data: null, error: fetchError };
    }

    // Use a transaction for atomicity (ensures both operations succeed or fail together)
    const { error: transactionError } = await supabase.rpc('perform_wall_reset', {
        p_wall_id: wallId,
        p_photo_url: photoUrl,
        p_old_reset_id: currentReset ? currentReset.id : null,
        p_new_reset_date: customResetDate // Pass the custom date to the RPC
    });

    if (transactionError) {
        console.error("WallResetService: Transaction failed:", transactionError);
        return { data: null, error: transactionError };
    }

    const { data: newCurrentReset, error: newFetchError } = await getCurrentWallReset(wallId);
    if (newFetchError) {
         console.error("WallResetService: Could not fetch new current reset after successful transaction:", newFetchError);
    }

    return { data: newCurrentReset, error: null };
}