// src/components/Navbar.js
function Navbar() {
    const navElement = document.createElement('nav');
    navElement.classList.add('navbar');

    navElement.innerHTML = `
        <div class="logo">
            <a href="/#/"><img src="assets/images/beta-blocker-logo.png" alt="Logo"></a>
        </div>
        <div class="nav-links">
          <a href="/#/">Home</a>    <a href="/#/profile">Profile</a> </div>
    `;
    // Note: The href for the logo image should remain '/' if it's the root of the server
    // and you want it to always reload the page, or change to '/#/' if you want it
    // to go through the client-side router. Let's keep it '/' for now to force a full
    // home page load if clicked, which can be useful.
    // For the logo a href, you might want it to remain '/' to force a full page reload
    // to the root for simplicity, or change it to '/#/' if you want it to go through
    // the client-side router's initial load behavior. Let's keep it simple for now.

    return navElement;
}

export default Navbar;