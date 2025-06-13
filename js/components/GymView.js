// src/components/GymView.js

// Function to dynamically determine the base URL for routing
// This makes the path robust for both local development and GitHub Pages.
const getBaseUrl = () => {
    // IMPORTANT: Replace 'beta-block-testing' with your actual repository name if it ever changes.
    const repoName = '/beta-block-testing';
    // Check if the current URL's path starts with the repository name.
    // This handles cases where your site is hosted at username.github.io/repo-name/
    if (window.location.pathname.startsWith(repoName)) {
        return repoName;
    }
    // If not on GitHub Pages (e.g., local development or custom domain root), return an empty string.
    return '';
};

const BASE_URL = getBaseUrl();

function GymView() {
    const gymViewContainer = document.createElement('div');
    gymViewContainer.id = 'gym-view'; // Retain the ID for styling

    // The entire SVG content goes here as a string
    // Note: I've removed the <a> tags around the text elements.
    // We'll handle clicks on the <g class="wall-section"> elements using JavaScript.
    gymViewContainer.innerHTML = `
        <svg width="800" height="600">
            <g class="wall-section" data-wall-id="wall1">
                <rect id="wall1" x="50" y="400" width="50" height="150" style="fill: #e0e0e0; stroke: black; stroke-width: 2;" />
                <rect id="section1" x="55" y="405" width="40" height="140" style="fill: lightblue; stroke: black; stroke-width: 1;" />
                <text x="55" y="470" font-size="16" transform="rotate(-90 75 470)">Wall 1</text>
            </g>
            <g class="wall-section" data-wall-id="wall2">
                <rect id="wall2" x="50" y="200" width="50" height="200" style="fill: #e0e0e0; stroke: black; stroke-width: 2;" />
                <rect id="section2" x="55" y="205" width="40" height="190" style="fill: lightgreen; stroke: black; stroke-width: 1;" />
                <text x="55" y="300" font-size="16" transform="rotate(-90 75 300)">Wall 2</text>
            </g>
            <g class="wall-section" data-wall-id="wall3">
                <path id="wall3" d="M 50 50 L 50 200 L 100 200 C 100 200, 200 50, 400 150 L 400 50 L 50 50 Z" style="fill: #e0e0e0; stroke: black; stroke-width: 2;" />
                <path id="section3" d="M 55 55 L 55 195 L 100 195 C 95 195, 200 45, 395 145 L 395 55 L 55 55 Z" style="fill: lightcoral; stroke: none;" />
                <text x="150" y="95" font-size="20">Wall 3 (Cave)</text>
            </g>
            <g class="wall-section" data-wall-id="wall4">
                <rect id="wall4" x="600" y="200" width="50" height="150" style="fill: #e0e0e0; stroke: black; stroke-width: 2;" />
                <rect id="section4" x="605" y="205" width="40" height="140" style="fill: lightsalmon; stroke: black; stroke-width: 1;" />
                <text x="625" y="275" font-size="16" transform="rotate(90 625 275)">Wall 4</text>
            </g>
            <g class="wall-section" data-wall-id="wall5">
                <rect id="wall5" x="600" y="350" width="50" height="150" style="fill: #e0e0e0; stroke: black; stroke-width: 2;" />
                <rect id="section5" x="605" y="355" width="40" height="140" style="fill: lightcyan; stroke: black; stroke-width: 1;" />
                <text x="625" y="425" font-size="16" transform="rotate(90 625 425)">Wall 5</text>
            </g>

            <rect id="bathrooms" x="500" y="50" width="150" height="100" style="fill: #f0f0f0; stroke: black; stroke-width: 1;" />
            <rect id="lockers" x="500" y="150" width="150" height="50" style="fill: #f0f0f0; stroke: black; stroke-width: 1;" />
            <rect id="lounge" x="350" y="550" width="150" height="50" style="fill: #f0f0f0; stroke: black; stroke-width: 1;" />
            <rect id="checkin" x="50" y="550" width="150" height="50" style="fill: #f0f0f0; stroke: black; stroke-width: 1;" />

            <text x="525" y="100" font-size="18">Bathrooms</text>
            <text x="525" y="180" font-size="18">Lockers</text>
            <text x="400" y="575" font-size="16">Lounge</text>
            <text x="70" y="575" font-size="16">Check-in Counter</text>
        </svg>
    `;

    // Add event listeners for click events on the wall sections
    // We need to do this *after* innerHTML is set, because elements only exist then.
    setTimeout(() => { // Using a setTimeout briefly to ensure DOM is ready.
                      // For more complex apps, consider a rendering library.
        const wallSections = gymViewContainer.querySelectorAll('.wall-section');
        wallSections.forEach(gElement => {
            gElement.addEventListener('click', (event) => {
                const wallId = gElement.dataset.wallId;
                if (wallId) {
                    console.log(`Clicked on ${wallId}`);
                    // Modified line: Prepend the dynamically determined BASE_URL
                    window.location.href = `${BASE_URL}/#/wall/${wallId}`;
                }
            });
        });
    }, 0); // Short delay to allow browser to parse innerHTML

    return gymViewContainer;
}

export default GymView;