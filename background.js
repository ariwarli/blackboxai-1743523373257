// Background service worker for TabFlow
let tabTimers = new Map();

// Initialize tab timer when created
chrome.tabs.onCreated.addListener((tab) => {
  tabTimers.set(tab.id, {
    startTime: Date.now(),
    timer: null
  });
});

// Update tab timer when activated
chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo.tabId;
  if (!tabTimers.has(tabId)) {
    tabTimers.set(tabId, {
      startTime: Date.now(),
      timer: null
    });
  }
});

// Remove tab timer when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabTimers.has(tabId)) {
    const timerInfo = tabTimers.get(tabId);
    if (timerInfo.timer) {
      clearInterval(timerInfo.timer);
    }
    tabTimers.delete(tabId);
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_TAB_PREVIEW') {
    chrome.tabs.captureVisibleTab(null, {format: 'jpeg', quality: 50})
      .then(dataUrl => {
        sendResponse({success: true, preview: dataUrl});
      })
      .catch(error => {
        console.error('Failed to capture tab preview:', error);
        sendResponse({success: false, error: error.message});
      });
    return true; // Will respond asynchronously
  }

  if (request.type === 'GET_TAB_TIME') {
    const tabId = request.tabId;
    if (tabTimers.has(tabId)) {
      const startTime = tabTimers.get(tabId).startTime;
      const elapsedTime = Date.now() - startTime;
      sendResponse({success: true, elapsedTime});
    } else {
      sendResponse({success: false, error: 'Tab timer not found'});
    }
    return false; // Synchronous response
  }
});

// Helper function to format time
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Initialize: clean up any existing timers
chrome.tabs.query({}, (tabs) => {
  tabs.forEach(tab => {
    tabTimers.set(tab.id, {
      startTime: Date.now(),
      timer: null
    });
  });
});