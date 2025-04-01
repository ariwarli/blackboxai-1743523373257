// Default settings
const DEFAULT_SETTINGS = {
    theme: 'system',
    background: 'none',
    showTimers: true,
    enablePreview: true,
    tabLayout: 'grid',
    enableSync: false,
    shortcuts: {
        quickSearch: 'Ctrl+Space',
        switchGroup: 'Ctrl+G'
    }
};

// DOM Elements
const themeSelect = document.getElementById('themeSelect');
const backgroundSelect = document.getElementById('backgroundSelect');
const showTimers = document.getElementById('showTimers');
const enablePreview = document.getElementById('enablePreview');
const layoutSelect = document.getElementById('layoutSelect');
const enableSync = document.getElementById('enableSync');
const exportData = document.getElementById('exportData');
const importData = document.getElementById('importData');
const saveSettings = document.getElementById('saveSettings');
const resetSettings = document.getElementById('resetSettings');

// Initialize settings
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupEventListeners();
});

// Load settings from storage
async function loadSettings() {
    try {
        const settings = await chrome.storage.sync.get('settings');
        const currentSettings = settings.settings || DEFAULT_SETTINGS;
        
        // Apply settings to form
        themeSelect.value = currentSettings.theme;
        backgroundSelect.value = currentSettings.background;
        showTimers.checked = currentSettings.showTimers;
        enablePreview.checked = currentSettings.enablePreview;
        layoutSelect.value = currentSettings.tabLayout;
        enableSync.checked = currentSettings.enableSync;
        
        // Apply theme immediately
        applyTheme(currentSettings.theme);
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showNotification('Failed to load settings', 'error');
    }
}

// Save settings to storage
async function saveCurrentSettings() {
    const settings = {
        theme: themeSelect.value,
        background: backgroundSelect.value,
        showTimers: showTimers.checked,
        enablePreview: enablePreview.checked,
        tabLayout: layoutSelect.value,
        enableSync: enableSync.checked,
        shortcuts: DEFAULT_SETTINGS.shortcuts // Keep default shortcuts for now
    };
    
    try {
        await chrome.storage.sync.set({ settings });
        showNotification('Settings saved successfully', 'success');
        
        // Apply theme immediately
        applyTheme(settings.theme);
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Failed to save settings', 'error');
    }
}

// Reset settings to default
async function resetToDefault() {
    try {
        await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
        loadSettings(); // Reload settings
        showNotification('Settings reset to default', 'success');
    } catch (error) {
        console.error('Error resetting settings:', error);
        showNotification('Failed to reset settings', 'error');
    }
}

// Export settings
function exportSettings() {
    chrome.storage.sync.get('settings', (data) => {
        const settings = data.settings || DEFAULT_SETTINGS;
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tabflow-settings.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// Import settings
function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const settings = JSON.parse(event.target.result);
                await chrome.storage.sync.set({ settings });
                loadSettings(); // Reload settings
                showNotification('Settings imported successfully', 'success');
            } catch (error) {
                console.error('Error importing settings:', error);
                showNotification('Failed to import settings', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// Apply theme
function applyTheme(theme) {
    if (theme === 'system') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    saveSettings.addEventListener('click', saveCurrentSettings);
    resetSettings.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            resetToDefault();
        }
    });
    exportData.addEventListener('click', exportSettings);
    importData.addEventListener('click', importSettings);
    
    // Live preview for theme changes
    themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));
    
    // Auto-save when toggles change
    const toggles = [showTimers, enablePreview, enableSync];
    toggles.forEach(toggle => {
        toggle.addEventListener('change', saveCurrentSettings);
    });
    
    // Auto-save when selects change
    const selects = [backgroundSelect, layoutSelect];
    selects.forEach(select => {
        select.addEventListener('change', saveCurrentSettings);
    });
}

// Add keyboard shortcut listeners
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentSettings();
    }
});