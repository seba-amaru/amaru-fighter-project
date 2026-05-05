export const appState = {
    plans: [],
    classes: [],
    tournaments: [],
    userProfile: null
};

// Also attach to window for backwards compatibility during migration
window.appState = appState;
