/**
 * GCC Dashboard Router
 * Handles hash-based routing and view rendering
 */
window.GCC = window.GCC || {};

window.GCC.Router = (function() {
    
    // Available routes and their render functions
    const routes = {};
    
    // View container
    let container = null;
    
    // Current active route
    let currentRoute = null;

    function init() {
        container = document.getElementById('view-container');
        if (!container) return;
        
        // Listen to hash changes
        window.addEventListener('hashchange', handleRouteChange);
        
        // Initial route
        handleRouteChange();
    }
    
    function register(path, renderFunction, cleanupFunction = null) {
        routes[path] = {
            render: renderFunction,
            cleanup: cleanupFunction
        };
    }
    
    function handleRouteChange() {
        const hash = window.location.hash || '#/dashboard';
        const path = hash.replace('#', '');
        
        // Basic path matching (ignoring params for now, except specific exact matches)
        // A more advanced router would parse /incidents/:id
        
        // Match exact or base path
        let routeKey = Object.keys(routes).find(key => {
            if (key === path) return true;
            // Handle parameterized routes like /incidents/INC-001 mapping to /incidents/:id
            if (key.includes(':')) {
                const baseKey = key.split('/:')[0];
                const basePath = path.split('/')[1]; // eg 'incidents'
                return path.startsWith(`/${basePath}/`) && path.split('/').length === 3;
            }
            return false;
        });
        
        // Fallback to dashboard if not found
        if (!routeKey) {
            window.location.hash = '#/dashboard';
            return;
        }
        
        // Extract params if any
        let params = {};
        if (routeKey.includes(':')) {
            const paramName = routeKey.split('/:')[1];
            const paramValue = path.split('/')[2];
            params[paramName] = paramValue;
        }
        
        // Update sidebar active state
        updateSidebarActive(path.split('/')[1]);
        
        // Cleanup previous route
        if (currentRoute && routes[currentRoute].cleanup) {
            routes[currentRoute].cleanup();
        }
        
        // Render new route
        currentRoute = routeKey;
        
        // Call render function (it should return HTML string or a DOM element)
        const content = routes[routeKey].render(params);
        
        if (typeof content === 'string') {
            container.innerHTML = content;
            // Re-init lucide icons for new content
            if (window.lucide) {
                lucide.createIcons();
            }
        }
    }
    
    function updateSidebarActive(baseRoute) {
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('data-route') === baseRoute) {
                el.classList.add('active');
            }
        });
    }

    return {
        init,
        register,
        navigate: (path) => {
            window.location.hash = path;
        }
    };
})();
