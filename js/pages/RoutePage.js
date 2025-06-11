// public/js/pages/RoutePage.js
import { fetchRouteDetails } from '../services/routeService.js';
import { getClimbStatusFromCache, updateClimbStatus } from '../services/climbLogService.js'; // Import from climbLogService

function RoutePage(routeId) {
    const routePageContainer = document.createElement('div');
    routePageContainer.classList.add('route-detail-container');

    routePageContainer.innerHTML = `
        <a href="/#/wall/wall1" class="back-button">Back to Wall</a> <h1>Loading Route Details...</h1>

        <div class="completion-status">
            <div id="routeStatus" class="status-circle">
                Loading...
            </div>
        </div>
    `;

    // Function to update the circle UI (copied from old main.js, now within this component)
    const updateCircleUI = (element, isComplete) => {
        if (element) {
            if (isComplete) {
                element.classList.remove('incomplete');
                element.classList.add('complete');
                element.textContent = 'Complete';
            } else {
                element.classList.remove('complete');
                element.classList.add('incomplete');
                element.textContent = 'Incomplete';
            }
        }
    };

    const renderRouteDetails = async () => {
        const h1Element = routePageContainer.querySelector('h1');
        const routeStatusCircle = routePageContainer.querySelector('#routeStatus');
        routeStatusCircle.dataset.routeId = routeId; // Set the routeId on the circle element

        const routeData = await fetchRouteDetails(routeId); // This function needs to be added to routeService.js
console.log('Route Data:', routeData);


        if (!routeData) {
            h1Element.textContent = `Route Not Found`;
            updateCircleUI(routeStatusCircle, false);
            return;
        }

        // Update the H1 with detailed route information
        h1Element.textContent = `Route ${routeData.grade} (${routeData.hold_color.join(', ')} holds, ${routeData.tape_color} tape)`;
        // Get completion status from cache and update UI
        const isComplete = getClimbStatusFromCache(routeId);
        updateCircleUI(routeStatusCircle, isComplete);

        // Attach event listener for the circle
        routeStatusCircle.addEventListener('click', async function() {
            const currentRouteId = this.dataset.routeId; // This is the UUID
            const isCurrentlyComplete = this.classList.contains('complete');
            const newStatus = !isCurrentlyComplete; // Toggle the status

            updateCircleUI(this, newStatus); // Optimistic UI update
            const result = await updateClimbStatus(currentRouteId, newStatus); // Update in database via service
            if (result.error) {
                // If there was an error (e.g., not logged in), revert UI
                updateCircleUI(this, !newStatus);
                console.error("Failed to update climb status:", result.message);
                if (result.message === "User not logged in") {
                     // Redirect to profile or login page if not logged in
                     window.location.hash = '/profile';
                }
            }
        });
        // Update the "Back to Wall" link dynamically if wall_id is available
        if (routeData.wall_id) {
            routePageContainer.querySelector('.back-button').href = `/#/wall/${routeData.wall_id}`;
        }
    };

    renderRouteDetails(); // Call to render details on component creation

    return routePageContainer;
}

export default RoutePage;