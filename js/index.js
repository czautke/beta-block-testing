// src/index.js
import App from './App.js'; // Import your main application component

document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
        // In a real framework like React, you'd use ReactDOM.render(<App />, rootElement);
        // For now, we'll simply append the App component's content.
        // App.js will be responsible for creating and returning its DOM elements.
        rootElement.appendChild(App());
    } else {
        console.error('Root element not found! Make sure <div id="root"> exists in index.html');
    }
});