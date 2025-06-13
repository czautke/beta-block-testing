// public/js/services/routeService.js
import { supabase } from './supabaseClient.js';
import { getCurrentWallReset } from './wallResetService.js'; // NEW IMPORT

// Fetch routes for a given wall, optionally filtered by a specific wall_reset_id
export async function fetchWallRoutes(wallId, targetWallResetId = null) { // targetWallResetId is new
    console.log(`RouteService: Fetching routes for ${wallId}, reset ID: ${targetWallResetId || 'current'}`);

    let query = supabase
        .from('routes')
        .select('*')
        .eq('wall_id', wallId)
        .eq('is_active', true) // Only fetch active routes
        .order('date_set', { ascending: false })
        .order('grade', { ascending: true }); // Then by route name/grade

    if (targetWallResetId) {
        // If a specific reset ID is provided, filter by it
        query = query.eq('wall_reset_id', targetWallResetId);
    } else {
        // If no specific reset ID, find the current one and filter by it
        const { data: currentReset, error: currentResetError } = await getCurrentWallReset(wallId);
        if (currentResetError && currentResetError.code !== 'PGRST116') { // PGRST116 means "no rows found"
            console.error('RouteService: Error fetching current wall reset:', currentResetError.message);
            return []; // Cannot fetch routes if current reset is unknown due to error
        }
        if (currentReset) {
            query = query.eq('wall_reset_id', currentReset.id);
        } else {
            // If no current reset is found for the wall (e.g., wall hasn't been reset yet)
            // This means no routes will be displayed unless linked to a reset.
            console.log(`RouteService: No current reset found for ${wallId}. Returning empty array.`);
            return [];
        }
    }

    const { data, error } = await query;

    if (error) {
        console.error('RouteService: Error fetching wall routes:', error.message);
        return [];
    }
    console.log(`RouteService: Fetched ${data.length} routes for ${wallId}.`);
    return data;
}

// Fetch details for a specific route by its ID (UUID)
export async function fetchRouteDetails(routeId) {
    console.log(`RouteService: Fetching details for route: ${routeId}`);
    const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('id', routeId)
        .single(); // Use .single() to get one record

    if (error) {
        console.error('RouteService: Error fetching route details:', error.message);
        return null;
    }
    console.log(`RouteService: Fetched route details for ${routeId}.`);
    return data;
}

// Add a new route to the 'routes' table
// This function now accepts routeData which can include wall_reset_id
export async function addRoute(routeData) {
    console.log("RouteService: Adding new route:", routeData);
    const { data, error } = await supabase
        .from('routes')
        .insert([routeData])
        .select() // Select the inserted row to get its details (e.g., generated ID)
        .single(); // Assuming we're inserting one route at a time

    if (error) {
        console.error('RouteService: Error adding route:', error.message);
        return { data: null, error };
    }
    console.log('RouteService: Route added successfully:', data);
    return { data, error: null };
}

// Deletes a route by its ID
export async function deleteRoute(routeId) {
    console.log("RouteService: Deleting route:", routeId);
    const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId);

    if (error) {
        console.error('RouteService: Error deleting route:', error.message);
        return { error };
    }
    console.log('RouteService: Route deleted successfully:', routeId);
    return { error: null };
}



// public/js/services/routeService.js (at the end of the file)

// NEW: Fetches total count of active routes grouped by grade across the gym
// public/js/services/routeService.js

// ... (existing imports and other functions like fetchWallRoutes, fetchRouteDetails, addRoute, deleteRoute) ...

// NEW: Fetches total count of active routes grouped by grade across the gym via RPC
export async function getRoutesCountByGrade() {
    console.log("RouteService: Fetching total active routes count by grade via RPC.");
    const { data, error } = await supabase
        .rpc('get_active_routes_count_by_grade'); // Call the RPC function by its name

    if (error) {
        console.error('RouteService: Error fetching total routes by grade via RPC:', error.message);
        return { data: [], error }; // Return empty array on error
    }

    // The RPC returns data as an array of JSON objects: [{ grade: 'V0', count: 5 }, ...]
    console.log('RouteService: Total active routes by grade (from RPC):', data);
    return { data, error: null }; // Return the data as is
}