/**
 * GCC Dashboard Store
 * Centralized state management using localStorage
 */
window.GCC = window.GCC || {};

window.GCC.Store = (function() {
    const STORAGE_KEY = 'gcc_data';
    const SESSION_KEY = 'gcc_session';
    
    // Initial state schema
    const initialState = {
        users: [],
        customers: [],
        sites: [],
        assets: [],
        alerts: [],
        incidents: [],
        requests: [],
        handovers: [],
        auditLog: [],
        settings: {
            theme: 'dark',
            simulatorEnabled: false
        }
    };
    
    // Internal state cache
    let state = null;
    
    // Event listeners
    const listeners = {};

    function init() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                state = JSON.parse(stored);
            } catch (e) {
                console.error('Error parsing stored data, resetting...', e);
                state = JSON.parse(JSON.stringify(initialState));
            }
        } else {
            // Need to seed data
            console.log('No data found. Seeding mock data...');
            state = JSON.parse(JSON.stringify(initialState));
            if (window.GCC.MockData) {
                state = window.GCC.MockData.generate(state);
            }
            save();
        }
    }

    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    return {
        // Init happens explicitly or on first get
        init,
        
        // Read data
        get: (collection) => {
            if (!state) init();
            return collection ? state[collection] : state;
        },
        
        // Write data
        set: (collection, data) => {
            if (!state) init();
            state[collection] = data;
            save();
            if (listeners[collection]) {
                listeners[collection].forEach(cb => cb(data));
            }
        },
        
        // Add single item to collection
        add: (collection, item) => {
            if (!state) init();
            if (!Array.isArray(state[collection])) return false;
            
            state[collection].unshift(item); // Add to beginning
            save();
            
            if (listeners[collection]) {
                listeners[collection].forEach(cb => cb(state[collection]));
            }
            return item;
        },
        
        // Update single item
        update: (collection, id, updates) => {
            if (!state) init();
            if (!Array.isArray(state[collection])) return false;
            
            const index = state[collection].findIndex(i => i.id === id);
            if (index === -1) return false;
            
            state[collection][index] = { ...state[collection][index], ...updates, lastUpdated: new Date().toISOString() };
            save();
            
            if (listeners[collection]) {
                listeners[collection].forEach(cb => cb(state[collection]));
            }
            return state[collection][index];
        },
        
        // Subscribe to changes
        subscribe: (collection, callback) => {
            if (!listeners[collection]) {
                listeners[collection] = [];
            }
            listeners[collection].push(callback);
            
            // Return unsubscribe function
            return () => {
                listeners[collection] = listeners[collection].filter(cb => cb !== callback);
            };
        },
        
        // Session management
        getSession: () => {
            const session = localStorage.getItem(SESSION_KEY);
            return session ? JSON.parse(session) : null;
        },
        
        logout: () => {
            localStorage.removeItem(SESSION_KEY);
            window.location.href = 'login.html';
        },
        
        // Complete reset
        reset: () => {
            localStorage.removeItem(STORAGE_KEY);
            init();
            window.location.reload();
        }
    };
})();
