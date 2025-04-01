// DOM Elements
const tabGrid = document.getElementById('tabGrid');
const searchInput = document.getElementById('searchInput');
const previewPopup = document.getElementById('previewPopup');
const previewImage = document.getElementById('previewImage');

// State
let tabs = [];
let activeView = 'tabs';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTabs();
    setupEventListeners();
});

// Load all tabs
async function loadTabs() {
    try {
        const tabs = await chrome.tabs.query({});
        renderTabs(tabs);
    } catch (error) {
        console.error('Error loading tabs:', error);
        showError('Failed to load tabs');
    }
}

// Render tabs in grid
function renderTabs(tabsToRender) {
    tabGrid.innerHTML = '';
    
    tabsToRender.forEach(tab => {
        const card = createTabCard(tab);
        tabGrid.appendChild(card);
    });
}

// Create a card element for a tab
function createTabCard(tab) {
    const card = document.createElement('div');
    card.className = 'tab-card';
    card.setAttribute('data-tab-id', tab.id);
    
    const header = document.createElement('div');
    header.className = 'tab-header';
    
    const favicon = document.createElement('img');
    favicon.className = 'tab-favicon';
    favicon.src = tab.favIconUrl || 'default-favicon.png';
    favicon.onerror = () => favicon.src = 'default-favicon.png';
    
    const title = document.createElement('div');
    title.className = 'tab-title';
    title.textContent = tab.title;
    
    const timer = document.createElement('div');
    timer.className = 'tab-timer';
    updateTabTimer(timer, tab.id);
    
    header.appendChild(favicon);
    header.appendChild(title);
    card.appendChild(header);
    card.appendChild(timer);
    
    // Event Listeners
    card.addEventListener('click', () => switchToTab(tab.id));
    card.addEventListener('mouseover', (e) => showPreview(e, tab));
    card.addEventListener('mouseout', hidePreview);
    
    return card;
}

// Switch to tab when clicked
async function switchToTab(tabId) {
    try {
        await chrome.tabs.update(tabId, { active: true });
        window.close(); // Close popup after switching
    } catch (error) {
        console.error('Error switching tab:', error);
        showError('Failed to switch tab');
    }
}

// Show tab preview on hover
function showPreview(event, tab) {
    const rect = event.target.closest('.tab-card').getBoundingClientRect();
    
    chrome.runtime.sendMessage({ type: 'GET_TAB_PREVIEW', tabId: tab.id }, response => {
        if (response && response.success) {
            previewImage.src = response.preview;
            previewPopup.style.display = 'block';
            
            // Position preview popup
            const popupWidth = 320;
            const popupHeight = 200;
            
            let left = rect.right + 10;
            let top = rect.top;
            
            // Adjust if would appear off-screen
            if (left + popupWidth > window.innerWidth) {
                left = rect.left - popupWidth - 10;
            }
            if (top + popupHeight > window.innerHeight) {
                top = window.innerHeight - popupHeight - 10;
            }
            
            previewPopup.style.left = left + 'px';
            previewPopup.style.top = top + 'px';
        }
    });
}

// Hide preview popup
function hidePreview() {
    previewPopup.style.display = 'none';
}

// Update tab timer
function updateTabTimer(timerElement, tabId) {
    chrome.runtime.sendMessage({ type: 'GET_TAB_TIME', tabId }, response => {
        if (response && response.success) {
            const minutes = Math.floor(response.elapsedTime / 60000);
            timerElement.textContent = minutes > 0 ? `${minutes}m` : 'Just opened';
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredTabs = tabs.filter(tab => 
            tab.title.toLowerCase().includes(searchTerm) || 
            tab.url.toLowerCase().includes(searchTerm)
        );
        renderTabs(filteredTabs);
    });
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelector('.nav-item.active').classList.remove('active');
            item.classList.add('active');
            activeView = item.dataset.view;
            handleViewChange();
        });
    });
}

// Handle view changes
function handleViewChange() {
    switch(activeView) {
        case 'tabs':
            loadTabs();
            break;
        case 'groups':
            // TODO: Implement tab groups view
            break;
        case 'sessions':
            // TODO: Implement saved sessions view
            break;
        case 'settings':
            // TODO: Implement settings view
            break;
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    tabGrid.innerHTML = '';
    tabGrid.appendChild(errorDiv);
}