// src/components/Navbar.js

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

const BASE_URL = getBaseUrl(); // Get the base URL once

function Navbar() {
    const navElement = document.createElement('nav');
    navElement.classList.add('navbar');

    // Updated the href for the logo to use the dynamic BASE_URL
    navElement.innerHTML = `
        <div class="logo">
            <a href="${BASE_URL}/#/"><img src="${BASE_URL}/assets/images/beta-blocker-logo.png" alt="Logo"></a>
        </div>
        <div class="nav-links">
          <a href="${BASE_URL}/#/">Home</a>
          <a href="${BASE_URL}/#/profile">Profile</a>
        </div>
    `;

    return navElement;
}

export default Navbar;