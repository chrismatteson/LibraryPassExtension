import { LibraryProfile, SiteStrategy, Message, DEFAULT_PROFILE } from './types';

/**
 * Background service worker for Library Pass extension
 * Handles strategy routing and library access coordination
 */

// Load library profile from storage
async function getLibraryProfile(): Promise<LibraryProfile> {
  const result = await chrome.storage.sync.get('libraryProfile');
  return result.libraryProfile || DEFAULT_PROFILE;
}

// Find strategy for a given domain
async function getStrategyForDomain(domain: string): Promise<SiteStrategy | null> {
  const profile = await getLibraryProfile();

  // Normalize domain (remove www., subdomains, etc.)
  const normalizedDomain = domain.replace(/^(www\.|m\.)/, '');

  const strategy = profile.strategies.find(s =>
    normalizedDomain.includes(s.domain)
  );

  return strategy || null;
}

// Build the library access URL based on strategy
function buildLibraryUrl(
  strategy: SiteStrategy,
  profile: LibraryProfile,
  currentUrl: string,
  title?: string
): string {
  switch (strategy.mode) {
    case 'direct-login':
      // Use the predefined library login page
      return strategy.url || '';

    case 'ezproxy-wrapper':
      // Wrap current URL with EZproxy
      if (strategy.url) {
        return strategy.url;
      }
      return `${profile.proxyBaseUrl}${profile.loginPath}${encodeURIComponent(currentUrl)}`;

    case 'ezproxy-search':
      // Navigate to database, content script will handle search
      return strategy.url || '';

    case 'custom':
      // Custom strategy - use template
      if (strategy.url) {
        return strategy.url
          .replace('{{articleUrl}}', encodeURIComponent(currentUrl))
          .replace('{{title}}', encodeURIComponent(title || ''));
      }
      return '';

    default:
      // Fallback: wrap with EZproxy
      return `${profile.proxyBaseUrl}${profile.loginPath}${encodeURIComponent(currentUrl)}`;
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (message.type === 'GET_STRATEGY') {
    const domain = message.domain || '';
    getStrategyForDomain(domain).then(strategy => {
      sendResponse({ type: 'STRATEGY_RESPONSE', strategy });
    });
    return true; // Will respond asynchronously
  }

  if (message.type === 'OPEN_VIA_LIBRARY') {
    const domain = message.domain || '';
    const currentUrl = message.url || '';
    const title = message.title || '';

    (async () => {
      const strategy = await getStrategyForDomain(domain);
      const profile = await getLibraryProfile();

      if (strategy) {
        const libraryUrl = buildLibraryUrl(strategy, profile, currentUrl, title);

        // Store automation state
        const automationState = {
          returnToUrl: currentUrl,
          clickSelectors: strategy.clickSelectors || [],
          currentStep: 0,
          returnToArticle: strategy.returnToArticle || false,
          active: true
        };

        await chrome.storage.local.set({ automationState });

        // Open in new tab and execute automation if needed
        const tab = await chrome.tabs.create({ url: libraryUrl });

        // Set up persistent listener for this tab
        if (strategy.clickSelectors && strategy.clickSelectors.length > 0) {
          // Track this tab's automation
          chrome.tabs.onUpdated.addListener(async function listener(tabId, info) {
            if (tabId !== tab.id || info.status !== 'complete') return;

            // Check if automation is still active
            const { automationState } = await chrome.storage.local.get('automationState');
            if (!automationState?.active) {
              chrome.tabs.onUpdated.removeListener(listener);
              return;
            }

            // Inject automation script
            chrome.scripting.executeScript({
              target: { tabId: tab.id! },
              func: autoClickSequence,
              args: [automationState.clickSelectors, automationState.currentStep, automationState.returnToArticle, automationState.returnToUrl]
            });
          });
        }

        // If strategy requires search, inject search automation
        if (strategy.mode === 'ezproxy-search' && strategy.searchSelector) {
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);

              // Inject search automation
              chrome.scripting.executeScript({
                target: { tabId: tab.id! },
                func: autoSearch,
                args: [strategy.searchSelector, title]
              });
            }
          });
        }
      } else {
        // Fallback: wrap with EZproxy
        const fallbackUrl = `${profile.proxyBaseUrl}${profile.loginPath}${encodeURIComponent(currentUrl)}`;
        chrome.tabs.create({ url: fallbackUrl });
      }

      sendResponse({ success: true });
    })();

    return true; // Will respond asynchronously
  }
});

/**
 * Auto-click through a sequence of selectors
 * This function is injected into the target page after each navigation
 */
function autoClickSequence(selectors: string[], currentStep: number, returnToArticle: boolean, returnToUrl: string) {
  console.log(`[Library Pass] Running automation step ${currentStep} of ${selectors.length}`);

  // Check if we're done
  if (currentStep >= selectors.length) {
    console.log('[Library Pass] All steps complete!');
    if (returnToArticle && returnToUrl) {
      console.log('[Library Pass] Waiting for activation to complete...');
      // Wait a bit for the redemption to process before returning
      setTimeout(() => {
        chrome.storage.local.set({ automationState: { active: false } });
        window.location.href = returnToUrl;
      }, 2000);
    } else {
      chrome.storage.local.set({ automationState: { active: false } });
    }
    return;
  }

  const selector = selectors[currentStep];
  console.log(`[Library Pass] Looking for selector: ${selector}`);

  // Wait for element to appear (with timeout)
  const maxWait = 10000; // 10 seconds max
  const startTime = Date.now();

  function checkAndClick() {
    const element = document.querySelector(selector) as HTMLElement;

    if (element) {
      console.log(`[Library Pass] Found element, clicking: ${selector}`);

      // Update state before clicking (in case it navigates)
      chrome.storage.local.get('automationState', (result) => {
        if (result.automationState) {
          result.automationState.currentStep = currentStep + 1;
          chrome.storage.local.set({ automationState: result.automationState });
        }
      });

      // Click immediately
      element.click();
      console.log(`[Library Pass] Clicked! Moving to step ${currentStep + 1}`);

    } else if (Date.now() - startTime < maxWait) {
      // Keep checking every 100ms until element appears
      setTimeout(checkAndClick, 100);
    } else {
      console.warn(`[Library Pass] Selector not found after ${maxWait}ms: ${selector}`);
      // Skip this step and move to next
      chrome.storage.local.get('automationState', (result) => {
        if (result.automationState) {
          result.automationState.currentStep = currentStep + 1;
          chrome.storage.local.set({ automationState: result.automationState });
        }
      });
    }
  }

  // Start checking immediately
  checkAndClick();
}

/**
 * Auto-fill search field and submit
 * This function is injected into the target page
 */
function autoSearch(searchSelector?: string, searchTerm?: string) {
  if (!searchSelector || !searchTerm) return;

  const FILL_DELAY = 1500;

  setTimeout(() => {
    const searchInput = document.querySelector(searchSelector) as HTMLInputElement;

    if (searchInput) {
      searchInput.value = searchTerm;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));

      console.log(`[Library Pass] Filled search: ${searchTerm}`);

      // Try to submit (look for nearby submit button or form)
      const form = searchInput.closest('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      } else {
        // Look for submit button
        const submitBtn = document.querySelector('button[type="submit"], input[type="submit"]') as HTMLElement;
        if (submitBtn) {
          submitBtn.click();
        }
      }
    } else {
      console.warn(`[Library Pass] Search selector not found: ${searchSelector}`);
    }
  }, FILL_DELAY);
}

console.log('[Library Pass] Background service worker loaded');
