/**
 * Popup script for quick library access
 */

document.getElementById('accessBtn')?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab.url) {
    const url = new URL(tab.url);
    const domain = url.hostname.replace(/^(www\.|m\.)/, '');

    chrome.runtime.sendMessage({
      type: 'OPEN_VIA_LIBRARY',
      domain,
      url: tab.url,
      title: tab.title || ''
    }, (response) => {
      if (response?.success) {
        showStatus('Opening via library...', 'success');
        setTimeout(() => window.close(), 1000);
      }
    });
  }
});

document.getElementById('optionsBtn')?.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

function showStatus(message: string, type: 'success' | 'info') {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
  }
}
