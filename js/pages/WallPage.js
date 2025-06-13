// public/js/pages/WallPage.js
import { fetchWallRoutes, deleteRoute, addRoute } from '../services/routeService.js';
import { fetchUserClimbLogs, updateClimbStatus } from '../services/climbLogService.js';
import { getCurrentUserId } from '../services/authService.js';
import { getWallResets, resetWall, getCurrentWallReset, updateWallResetDate } from '../services/wallResetService.js';

// WallPage now accepts isAdmin as an argument
function WallPage(wallId, isAdmin) {
    const wallPageContainer = document.createElement('div');
    wallPageContainer.classList.add('wall-container');

    // Initial HTML structure including potential admin tools section (hidden by default)
    wallPageContainer.innerHTML = `
        <a href="/#/" class="back-button">Back to Gym View</a>
        <h1>Wall ${wallId.replace('wall', '')} Routes</h1>
        <div id="status-message" style="color: red; margin-bottom: 10px;"></div>

        <div class="wall-version-toggle">
            <label for="wall-reset-selector">View Version:</label>
            <select id="wall-reset-selector">
                </select>
        </div>

        <div id="admin-tools-section" class="profile-details" style="display: none;">
            <h2>Admin Tools for Wall ${wallId.replace('wall', '')}</h2>

            <div class="admin-tool-block">
                <h3>Add New Route</h3>
                <div id="add-route-message" style="color: green; margin-bottom: 10px;"></div>
                <form id="add-route-form">
                    <div class="form-group">
                        <label for="new-route-grade">Grade:</label>
                        <input type="text" id="new-route-grade" placeholder="e.g., V0, B1" required>
                    </div>
                    <div class="form-group">
                        <label for="new-route-wall-id">Wall ID:</label>
                        <input type="text" id="new-route-wall-id" value="${wallId}" readonly required>
                    </div>
                    <div class="form-group">
                        <label for="new-route-wall-version-selector">Wall Version:</label>
                        <select id="new-route-wall-version-selector" required>
                            </select>
                    </div>
                    <div class="form-group">
                        <label for="new-route-tape-color">Tape Color:</label>
                        <input type="text" id="new-route-tape-color" placeholder="e.g., Orange, Pink" required>
                    </div>
                    <div class="form-group">
                        <label for="new-route-hold-color">Hold Colors (comma-separated):</label>
                        <input type="text" id="new-route-hold-color" placeholder="e.g., Red, Blue" required>
                    </div>
                    <div class="form-group">
                        <label for="new-route-date-set">Date Set:</label>
                        <input type="date" id="new-route-date-set" required>
                    </div>
                    <div class="profile-actions">
                        <button type="submit" id="add-route-button">Add Route</button>
                    </div>
                </form>
            </div>

            <div class="admin-tool-block" style="margin-top: 30px;">
                <h3>Reset Wall</h3>
                <div id="reset-wall-message" style="color: green; margin-bottom: 10px;"></div>
                <form id="reset-wall-form">
                    <div class="form-group">
                        <label for="reset-wall-date">Reset Date:</label>
                        <input type="date" id="reset-wall-date" value="${new Date().toISOString().slice(0,10)}" required>
                    </div>
                    <div class="form-group">
                        <label for="reset-wall-photo-url">Wall Photo URL (Optional):</label>
                        <input type="text" id="reset-wall-photo-url" placeholder="URL for wall photo">
                    </div>
                    <div class="profile-actions">
                        <button type="submit" id="reset-wall-button">Reset Wall</button>
                    </div>
                </form>
            </div>

            <div class="admin-tool-block" style="margin-top: 30px;">
                <h3>Edit Wall Reset Date</h3>
                <div id="edit-reset-message" style="color: green; margin-bottom: 10px;"></div>
                <form id="edit-reset-form">
                    <div class="form-group">
                        <label for="edit-reset-selector">Select Reset:</label>
                        <select id="edit-reset-selector" required>
                            </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-reset-date">New Date:</label>
                        <input type="date" id="edit-reset-date" required>
                    </div>
                    <div class="profile-actions">
                        <button type="submit" id="update-reset-button">Update Date</button>
                    </div>
                </form>
            </div>
        </div>

        <div id="routes-list">
            <p>Loading routes...</p>
        </div>
    `;

    // Element references (declared as let, assigned below)
    let wallResetSelector;
    let newRouteWallVersionSelector;
    let newRouteDateSetInput;
    let editResetSelector;
    let editResetDateInput;

    const routesListDiv = wallPageContainer.querySelector('#routes-list');
    const adminToolsSection = wallPageContainer.querySelector('#admin-tools-section');

    const addRouteForm = wallPageContainer.querySelector('#add-route-form');
    const addRouteMessageDiv = wallPageContainer.querySelector('#add-route-message');

    const resetWallForm = wallPageContainer.querySelector('#reset-wall-form');
    const resetWallDateInput = wallPageContainer.querySelector('#reset-wall-date');
    const resetWallPhotoUrlInput = wallPageContainer.querySelector('#reset-wall-photo-url');
    const resetWallMessageDiv = wallPageContainer.querySelector('#reset-wall-message');

    const editResetForm = wallPageContainer.querySelector('#edit-reset-form');
    const editResetMessageDiv = wallPageContainer.querySelector('#edit-reset-message');


    // Helper for general messages (e.g., login needed, errors during route fetching)
    const displayStatusMessage = (message, type = 'error') => {
        const messageDiv = wallPageContainer.querySelector('#status-message');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.style.color = type === 'error' ? 'red' : 'green';
        }
    };

    const displayAddRouteMessage = (message, type = 'success') => {
        addRouteMessageDiv.textContent = message;
        addRouteMessageDiv.style.color = type === 'error' ? 'red' : 'green';
        setTimeout(() => { addRouteMessageDiv.textContent = ''; }, 5000);
    };

    const displayResetWallMessage = (message, type = 'success') => {
        resetWallMessageDiv.textContent = message;
        resetWallMessageDiv.style.color = type === 'error' ? 'red' : 'green';
        setTimeout(() => { resetWallMessageDiv.textContent = ''; }, 5000);
    };

    const displayEditResetMessage = (message, type = 'success') => {
        editResetMessageDiv.textContent = message;
        editResetMessageDiv.style.color = type === 'error' ? 'red' : 'green';
        setTimeout(() => { editResetMessageDiv.textContent = ''; }, 5000);
    };


    // Helper to populate the Edit Reset Selector
    const populateEditResetSelector = async (resets) => {
        if (!resets || resets.length === 0) {
            displayEditResetMessage(`No resets found for editing.`, 'error');
            editResetSelector.innerHTML = '<option value="">No Resets Available</option>';
            return;
        }

        editResetSelector.innerHTML = '<option value="">Select Reset to Edit</option>';
        resets.forEach(reset => {
            const option = document.createElement('option');
            option.value = reset.id;
            option.textContent = `${reset.is_current ? 'Current - ' : ''}Reset on ${new Date(reset.reset_date).toLocaleDateString()}`;
            option.dataset.resetDate = new Date(reset.reset_date).toISOString().slice(0,10); // Store YYYY-MM-DD
            editResetSelector.appendChild(option);
        });
        // Ensure default selection is cleared
        editResetSelector.value = "";
    };


    // Function to populate Wall Version selectors (both view and add route forms)
    const populateWallVersionSelectors = async (selectedViewResetId = null, selectedAddRouteResetId = null) => {
        console.log("populateWallVersionSelectors: Fetching resets for wallId:", wallId);
        const { data: resets, error: resetsError } = await getWallResets(wallId);

        if (resetsError) {
            console.error("populateWallVersionSelectors: Error fetching wall resets:", resetsError);
            displayStatusMessage(`Error fetching wall versions: ${resetsError.message}`, 'error');
            wallResetSelector.innerHTML = '<option value="">Error Loading Versions</option>';
            if (isAdmin) newRouteWallVersionSelector.innerHTML = '<option value="">Error Loading Versions</option>';
            return;
        }

        console.log("populateWallVersionSelectors: Fetched resets data:", resets);

        // --- Populate View Version Selector ---
        wallResetSelector.innerHTML = '<option value="">Select Version</option>';
        const currentReset = resets.find(r => r.is_current);

        if (currentReset) {
            const currentOption = document.createElement('option');
            currentOption.value = currentReset.id;
            currentOption.textContent = `Current (${new Date(currentReset.reset_date).toLocaleDateString()})`;
            currentOption.dataset.isCurrent = "true";
            wallResetSelector.appendChild(currentOption);
        } else {
            displayStatusMessage(`No current reset found for Wall ${wallId.replace('wall','')}. Admin: Please reset the wall first!`, 'error');
        }

        resets.filter(r => !r.is_current).forEach(reset => {
            const option = document.createElement('option');
            option.value = reset.id;
            option.textContent = `Reset on ${new Date(reset.reset_date).toLocaleDateString()}`;
            wallResetSelector.appendChild(option);
        });

        // Set the view selector to the last selected or current default
        if (selectedViewResetId) {
            wallResetSelector.value = selectedViewResetId;
        } else if (currentReset) {
            wallResetSelector.value = currentReset.id; // Default to current if no specific selected
        } else {
            wallResetSelector.value = ""; // No current and no specific selected, default to empty
        }


        // --- Populate Add Route Wall Version Selector (for Admin) ---
        if (isAdmin) {
            newRouteWallVersionSelector.innerHTML = '<option value="">Select Version</option>';

            if (currentReset) {
                const currentAddOption = document.createElement('option');
                currentAddOption.value = currentReset.id;
                currentAddOption.textContent = `Current (${new Date(currentReset.reset_date).toLocaleDateString()})`;
                currentAddOption.dataset.resetDate = new Date(currentReset.reset_date).toISOString();
                newRouteWallVersionSelector.appendChild(currentAddOption);
            } else {
                displayAddRouteMessage(`Warning: No active reset for Wall ${wallId.replace('wall','')}! New routes cannot be linked to a version until a reset.`, 'error');
            }

            resets.filter(r => !r.is_current).forEach(reset => {
                const option = document.createElement('option');
                option.value = reset.id;
                option.textContent = `Reset on ${new Date(reset.reset_date).toLocaleDateString()}`;
                option.dataset.resetDate = new Date(reset.reset_date).toISOString();
                newRouteWallVersionSelector.appendChild(option);
            });

            if (selectedAddRouteResetId) {
                newRouteWallVersionSelector.value = selectedAddRouteResetId;
            } else if (currentReset) {
                newRouteWallVersionSelector.value = currentReset.id;
            } else {
                newRouteWallVersionSelector.value = ""; // Default to empty if no current
            }
            newRouteWallVersionSelector.dispatchEvent(new Event('change'));
        }

        // NEW: Also populate the Edit Reset Selector with the fetched data
        if (isAdmin) {
            await populateEditResetSelector(resets);
        }
    };

    // Main function to render routes list
    const renderRoutes = async (targetResetId = null) => {
        routesListDiv.innerHTML = '<p>Loading routes...</p>';

        // Ensure selectors and other elements are initialized (re-queried) on each render
        // This is crucial because WallPage's innerHTML might be reset by App.js
        wallResetSelector = wallPageContainer.querySelector('#wall-reset-selector');
        newRouteWallVersionSelector = wallPageContainer.querySelector('#new-route-wall-version-selector');
        newRouteDateSetInput = wallPageContainer.querySelector('#new-route-date-set');
        editResetSelector = wallPageContainer.querySelector('#edit-reset-selector');
        editResetDateInput = wallPageContainer.querySelector('#edit-reset-date'); // Ensure this is also queried

        // Attach view selector event listener
        wallResetSelector.removeEventListener('change', wallResetSelectorChangeListener); // Prevent duplicates
        wallResetSelector.addEventListener('change', wallResetSelectorChangeListener);
        function wallResetSelectorChangeListener(event) {
            renderRoutes(event.target.value);
        }

        // Attach add route wall version selector listener (to set default route date)
        if (isAdmin && newRouteWallVersionSelector) {
            newRouteWallVersionSelector.removeEventListener('change', newRouteWallVersionSelectorChangeListener);
            newRouteWallVersionSelector.addEventListener('change', newRouteWallVersionSelectorChangeListener);
            function newRouteWallVersionSelectorChangeListener(e) {
                const selectedOption = e.target.selectedOptions[0];
                const resetDateString = selectedOption ? selectedOption.dataset.resetDate : new Date().toISOString().slice(0,10);
                newRouteDateSetInput.value = resetDateString.slice(0,10);
            }
        }

        // Listen for selection change to pre-fill date in Edit Reset form
        if (isAdmin && editResetSelector) {
            editResetSelector.removeEventListener('change', editResetSelectorChangeListener);
            editResetSelector.addEventListener('change', editResetSelectorChangeListener);
            function editResetSelectorChangeListener(e) {
                const selectedOption = e.target.selectedOptions[0];
                if (selectedOption && selectedOption.value) {
                    editResetDateInput.value = selectedOption.dataset.resetDate;
                } else {
                    editResetDateInput.value = '';
                }
            }
        }


        // Always re-populate selectors to ensure they are up-to-date with latest resets
        await populateWallVersionSelectors(targetResetId, newRouteWallVersionSelector ? newRouteWallVersionSelector.value : null);


        const currentUserId = await getCurrentUserId();
        const userClimbLogs = await fetchUserClimbLogs(currentUserId);

        // Fetch wall routes based on the targetResetId
        const wallRoutes = await fetchWallRoutes(wallId, targetResetId);

        if (wallRoutes.length === 0) {
            routesListDiv.innerHTML = '<p>No routes found for this wall version.</p>';
            return;
        }

        routesListDiv.innerHTML = '';

        // Determine if the current view is historical or editable (current version)
        const currentActualResetOption = wallResetSelector.querySelector('option[data-is-current="true"]');
        const currentActualResetId = currentActualResetOption ? currentActualResetOption.value : null;

        const isHistoricalView = (targetResetId && targetResetId !== currentActualResetId) || (!targetResetId && !currentActualResetId);


        wallRoutes.forEach(route => {
            const routeItem = document.createElement('div');
            routeItem.classList.add('route-item');

            const isComplete = userClimbLogs[route.id] || false;

            routeItem.innerHTML = `
                <input type="checkbox" id="checkboxRoute${route.id}" data-route-id="${route.id}" class="route-checkbox" ${isComplete ? 'checked' : ''} ${isHistoricalView ? 'disabled' : ''}>
                <label for="checkboxRoute${route.id}">
                    <a href="/#/route/${route.id}">
                        ${route.grade} (${route.hold_color.join(', ')} holds, ${route.tape_color} tape)
                    </a>
                </label>
                ${isAdmin ? `<button class="delete-route-button" data-route-id="${route.id}" ${isHistoricalView ? 'disabled' : ''}>Delete</button>` : ''}
            `;
            routesListDiv.appendChild(routeItem);
        });

        // Attach event listeners for checkboxes
        routesListDiv.querySelectorAll('.route-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', async function() {
                const routeId = this.dataset.routeId;
                const isChecked = this.checked;
                const result = await updateClimbStatus(routeId, isChecked);

                if (result.error) {
                    console.error("Failed to update climb status from checkbox:", result.message);
                    this.checked = !isChecked;
                    if (result.message === "User not logged in") {
                        if (!this.dataset.isRedirecting) {
                            this.dataset.isRedirecting = 'true';
                            displayStatusMessage("Please log in to track your climbs!", 'error');
                            setTimeout(() => {
                                window.location.hash = '/profile';
                            }, 100);
                        }
                        return;
                    }
                } else {
                    console.log(`Checkbox for route ${routeId} successfully updated to ${isChecked}.`);
                }
                if (this.dataset.isRedirecting) {
                    delete this.dataset.isRedirecting;
                }
            });
        });

        // Attach event listeners for delete buttons (if they exist)
        if (isAdmin) {
            routesListDiv.querySelectorAll('.delete-route-button').forEach(button => {
                button.addEventListener('click', async function() {
                    const routeIdToDelete = this.dataset.routeId;
                    if (confirm(`Are you sure you want to delete this route? This cannot be undone.`)) {
                        displayStatusMessage("Deleting route...", 'green');
                        const { error } = await deleteRoute(routeIdToDelete);

                        if (error) {
                            displayStatusMessage(`Error deleting route: ${error.message}`, 'error');
                            console.error('Delete Route Error:', error);
                        } else {
                            displayStatusMessage("Route deleted successfully!", 'success');
                            renderRoutes(targetResetId); // Re-render the list, keeping selected reset
                        }
                    }
                });
            });
        }
    };

    // Initial call to render routes when WallPage component is created
    renderRoutes();

    // Show/hide admin tools section based on isAdmin flag
    if (isAdmin) {
        adminToolsSection.style.display = 'block';

        // Attach event listener for the Add Route form
        addRouteForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const grade = addRouteForm.querySelector('#new-route-grade').value;
            const wall_id = addRouteForm.querySelector('#new-route-wall-id').value;
            const wall_reset_id = addRouteForm.querySelector('#new-route-wall-version-selector').value; // Get selected wall reset ID
            const tape_color = addRouteForm.querySelector('#new-route-tape-color').value;
            const hold_color_raw = addRouteForm.querySelector('#new-route-hold-color').value;
            const date_set = addRouteForm.querySelector('#new-route-date-set').value; // YYYY-MM-DD format from input

            // Basic validation
            if (!grade || !wall_id || !wall_reset_id || !tape_color || !hold_color_raw || !date_set) {
                displayAddRouteMessage("All fields are required!", 'error');
                return;
            }

            // Date validation: route_set_date >= wall_reset_date
            const selectedResetOption = newRouteWallVersionSelector.selectedOptions[0];
            const selectedResetDateString = selectedResetOption ? selectedResetOption.dataset.resetDate : null; // This is an ISO string from DB

            if (selectedResetDateString) {
                // Convert YYYY-MM-DD input string to a Date object, forcing UTC interpretation
                const newRouteSetDate = new Date(date_set + 'T00:00:00.000Z');
                // Convert selectedResetDateString (ISO string) to a Date object
                const selectedResetDate = new Date(selectedResetDateString);

                if (newRouteSetDate < selectedResetDate) {
                    displayAddRouteMessage(`Route set date (${new Date(date_set).toLocaleDateString()}) must be on or after the selected wall version's reset date (${new Date(selectedResetDateString).toLocaleDateString()})!`, 'error');
                    return;
                }
            }


            const hold_color = hold_color_raw.split(',').map(s => s.trim()).filter(s => s.length > 0);

            const newRouteData = {
                grade,
                wall_id,
                tape_color,
                hold_color, // This should be an array
                date_set: date_set + 'T00:00:00.000Z', // Send as UTC midnight ISO string
                wall_reset_id, // Include the selected wall_reset_id
                is_active: true // New routes are active by default
            };

            displayAddRouteMessage("Adding route...", 'success');

            const { data, error } = await addRoute(newRouteData);

            if (error) {
                displayAddRouteMessage(`Error adding route: ${error.message}`, 'error');
                console.error('Add Route Error:', error);
            } else {
                displayAddRouteMessage(`Route "${data.grade}" added successfully!`, 'success');
                addRouteForm.reset();
                newRouteDateSetInput.value = new Date().toISOString().slice(0,10); // Reset date to today

                // Re-populate selectors and re-render the current view to include the new route
                await populateWallVersionSelectors(wallResetSelector.value, wall_reset_id);
                renderRoutes(wall_reset_id); // Re-render the view for the wall version just modified
            }
        });

        // Attach event listener for the Reset Wall form
        resetWallForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const resetDate = resetWallDateInput.value; // YYYY-MM-DD format from input
            const photoUrl = resetWallPhotoUrlInput.value;

            if (!resetDate) {
                displayResetWallMessage("Please select a reset date!", 'error');
                return;
            }

            displayResetWallMessage("Resetting wall...", 'green');

            // Call resetWall with the custom resetDate, formatted to UTC midnight ISO string
            const { data, error } = await resetWall(wallId, photoUrl, resetDate + 'T00:00:00.000Z');

            if (error) {
                displayResetWallMessage(`Error resetting wall: ${error.message}`, 'error');
                console.error('Reset Wall Error:', error);
            } else {
                displayResetWallMessage(`Wall ${wallId} reset successfully!`, 'success');
                resetWallForm.reset(); // Clear the form
                resetWallDateInput.value = new Date().toISOString().slice(0,10); // Reset date to today

                // Re-populate selectors (as new 'current' reset exists) and re-render to new current wall
                await populateWallVersionSelectors(); // Reset to default current view
                renderRoutes(); // Re-render to show new current wall (no targetResetId means current)
            }
        });

        // Add event listener for the Edit Wall Reset form submission
        editResetForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const resetIdToEdit = editResetSelector.value;
            const newDate = editResetDateInput.value; // YYYY-MM-DD format

            if (!resetIdToEdit || !newDate) {
                displayEditResetMessage("Please select a reset and a new date!", 'error');
                return;
            }

            displayEditResetMessage("Updating reset date...", 'green');

            // Format newDate to UTC midnight ISO string
            const newDateUTC = newDate + 'T00:00:00.000Z';

            const { data, error } = await updateWallResetDate(resetIdToEdit, newDateUTC);

            if (error) {
                displayEditResetMessage(`Error updating reset date: ${error.message}`, 'error');
                console.error('Update Reset Date Error:', error);
            } else {
                displayEditResetMessage(`Reset date updated successfully!`, 'success');
                editResetForm.reset();
                // Re-populate all selectors and re-render routes
                await populateWallVersionSelectors(); // Populate view selector and add route selector
                // The populateEditResetSelector is now called inside populateWallVersionSelectors for consistency
                renderRoutes(); // Re-render current view (no targetResetId means current)
            }
        });

    } else {
        adminToolsSection.style.display = 'none'; // Hide if not admin
    }


    return wallPageContainer;
}

export default WallPage;