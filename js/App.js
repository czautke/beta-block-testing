// public/js/App.js
import Navbar from './components/Navbar.js';
import GymView from './components/GymView.js';
import WallPage from './pages/WallPage.js';
import RoutePage from './pages/RoutePage.js';
import ProfilePage from './pages/ProfilePage.js';

import { subscribeToRealtimeChanges } from './services/climbLogService.js';
import { getCurrentUserId, getProfileData } from './services/authService.js'; // ADD getProfileData

function App() {
    const appContainer = document.createElement('div');
    appContainer.id = 'app-container';

    appContainer.appendChild(Navbar());

    const contentArea = document.createElement('main');
    contentArea.id = 'main-content-area';
    appContainer.appendChild(contentArea);

    const renderPage = async () => {
        const hashPath = window.location.hash.slice(1) || '/';
        console.log("Current hash path:", hashPath);

        contentArea.innerHTML = ''; // Clear previous content

        // Authenticate user and fetch profile data for admin check
        await getCurrentUserId(); // Ensures authService has checked user initially
        const profile = await getProfileData(); // FETCH PROFILE DATA
        const isAdmin = profile ? profile.is_admin : false; // Determine isAdmin status

        subscribeToRealtimeChanges(); // Ensure realtime is active for the current user

        if (hashPath === '/') {
            contentArea.appendChild(GymView());
        } else if (hashPath.startsWith('/wall/')) {
            const wallId = hashPath.split('/')[2];
            // PASS isAdmin TO WALLPAGE
            contentArea.appendChild(WallPage(wallId, isAdmin));
        } else if (hashPath === '/profile') {
            contentArea.appendChild(ProfilePage());
        } else if (hashPath.startsWith('/route/')) {
            const routeId = hashPath.split('/')[2];
            contentArea.appendChild(RoutePage(routeId));
        } else {
            contentArea.innerHTML = `<h1>404 Not Found</h1><p>The page you requested does not exist.</p><button onclick="window.location.hash='/'">Go Home</button>`;
        }
    };

    renderPage();
    window.addEventListener('hashchange', renderPage);

    appContainer.addEventListener('click', (event) => {
        const target = event.target;
        if (target.tagName === 'A' && target.host === window.location.host && target.getAttribute('href')?.startsWith('/#') && !target.classList.contains('no-route')) {
            event.preventDefault();
            window.location.hash = target.getAttribute('href').slice(1);
        }
        if (target.tagName === 'IMG' && target.closest('.logo a') && target.closest('.logo a').getAttribute('href') === '/') {
             // No preventDefault
        }
    });

    return appContainer;
}

export default App;