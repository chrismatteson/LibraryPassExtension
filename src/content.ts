import { Message } from './types';

/**
 * Content script for paywall detection
 * Runs on paywalled news sites and detects paywall overlays
 */

// Paywall detection patterns per site
const PAYWALL_PATTERNS: Record<string, {
  selectors: string[];
  textPatterns?: RegExp[];
}> = {
  'nytimes.com': {
    selectors: [
      '[data-testid="inline-message"]',
      '.css-mcm29f',
      '#gateway-content',
      '[id*="paywall"]',
      'button[data-testid="login-button"]',
      'a[href*="/subscription/"]',
      '.expanded-dock'
    ],
    textPatterns: [/subscribe/i, /log in to keep reading/i, /log in/i, /create.*account/i]
  },
  'washingtonpost.com': {
    selectors: [
      '[data-qa="subscribe-promo"]',
      '.paywall-overlay',
      '#cx-paywall-snippet'
    ],
    textPatterns: [/subscribe/i, /sign in/i]
  },
  'wsj.com': {
    selectors: [
      '[data-layout="Paywall"]',
      '.snippet-promotion',
      '.continue-reading'
    ],
    textPatterns: [/continue reading/i, /subscribe/i]
  },
  'theatlantic.com': {
    selectors: [
      '[data-testid="paywall"]',
      '.c-paywall',
      '.paywall-container'
    ],
    textPatterns: [/subscribe/i, /become a member/i]
  },
  'economist.com': {
    selectors: [
      '[data-test-id="access-gate"]',
      '.subscription-required',
      '.paywall-prompt'
    ],
    textPatterns: [/subscribe/i, /sign in/i]
  },
  'pressdemocrat.com': {
    selectors: [
      '[data-key="soft-metered-inline"]',
      '.meter-content',
      '#paywallSub'
    ],
    textPatterns: [/subscribe/i, /subscription/i]
  }
};

// Get current domain
function getCurrentDomain(): string {
  return window.location.hostname.replace(/^(www\.|m\.)/, '');
}

// Detect if paywall is present on page
function detectPaywall(): boolean {
  const domain = getCurrentDomain();
  const pattern = Object.entries(PAYWALL_PATTERNS).find(([key]) =>
    domain.includes(key)
  )?.[1];

  if (!pattern) return false;

  // Check for paywall selectors
  for (const selector of pattern.selectors) {
    if (document.querySelector(selector)) {
      console.log(`[Library Pass] Paywall detected via selector: ${selector}`);
      return true;
    }
  }

  // Check for text patterns in page
  if (pattern.textPatterns) {
    const bodyText = document.body.innerText;
    for (const regex of pattern.textPatterns) {
      if (regex.test(bodyText)) {
        console.log(`[Library Pass] Paywall detected via text pattern: ${regex}`);
        return true;
      }
    }
  }

  return false;
}

// Extract article title from page
function getArticleTitle(): string {
  // Try common title selectors
  const titleSelectors = [
    'h1[itemprop="headline"]',
    'h1.article-title',
    'h1.headline',
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'h1'
  ];

  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      if (element.tagName === 'META') {
        return (element as HTMLMetaElement).content;
      }
      return element.textContent?.trim() || '';
    }
  }

  return document.title;
}

// Show toast notification
function showToast() {
  // Remove existing toast if any
  const existingToast = document.getElementById('library-pass-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'library-pass-toast';
  toast.className = 'library-pass-toast';
  toast.innerHTML = `
    <div class="library-pass-toast-content">
      <span class="library-pass-toast-icon">📚</span>
      <span class="library-pass-toast-text">Access via Library</span>
      <button class="library-pass-toast-close" aria-label="Close">×</button>
    </div>
  `;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('visible'), 10);

  // Add click handler
  const content = toast.querySelector('.library-pass-toast-content') as HTMLElement;
  content.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).classList.contains('library-pass-toast-close')) {
      hideToast();
    } else {
      handleLibraryAccess();
    }
  });

  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (document.getElementById('library-pass-toast')) {
      hideToast();
    }
  }, 10000);
}

function hideToast() {
  const toast = document.getElementById('library-pass-toast');
  if (toast) {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }
}

// Handle "Open via Library" action
function handleLibraryAccess() {
  const domain = getCurrentDomain();
  const url = window.location.href;
  const title = getArticleTitle();

  const message: Message = {
    type: 'OPEN_VIA_LIBRARY',
    domain,
    url,
    title
  };

  chrome.runtime.sendMessage(message, (response) => {
    if (response?.success) {
      hideToast();
    }
  });
}

// Initialize content script
function init() {
  console.log('[Library Pass] Content script loaded');

  // Check for paywall on load
  if (detectPaywall()) {
    showToast();
  }

  // Watch for dynamic paywall injection
  const observer = new MutationObserver(() => {
    if (detectPaywall() && !document.getElementById('library-pass-toast')) {
      showToast();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // TODO: Add custom paywall detection logic per site
  // Some sites may require waiting for specific elements or scroll events
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
