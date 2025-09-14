// Simplified hot reload for Manifest V3
// Note: Some APIs are not available in Manifest V3, so this is a minimal implementation

const reload = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.reload(tabs[0].id);
    }
    chrome.runtime.reload();
  });
};

// Simple development check
chrome.management.getSelf((self) => {
  if (self.installType === 'development') {
    console.log('Development mode detected - hot reload functionality limited in Manifest V3');
    // You can implement file watching using other methods if needed
  }
});
