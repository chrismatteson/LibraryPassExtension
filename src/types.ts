/**
 * Strategy modes for different library access patterns
 */
export type StrategyMode =
  | 'direct-login'      // Direct library login page with auto-click
  | 'ezproxy-wrapper'   // Wrap URL with EZproxy login?url=
  | 'ezproxy-search'    // Navigate to database via EZproxy and search
  | 'custom';           // Custom strategy with user-defined script

/**
 * Configuration for a single site strategy
 */
export interface SiteStrategy {
  domain: string;
  mode: StrategyMode;
  url?: string;                    // Target URL template (can include {{articleUrl}}, {{title}})
  searchSelector?: string;         // CSS selector for search input (for ezproxy-search)
  clickSelectors?: string[];       // CSS selectors to auto-click in sequence
  waitForSelector?: string;        // Wait for this selector before proceeding
  fillSelectors?: {                // Selectors to fill with library credentials
    barcode?: string;
    pin?: string;
  };
  returnToArticle?: boolean;       // Return to original article URL after activation
  description?: string;            // Human-readable description
}

/**
 * User's library configuration profile
 */
export interface LibraryProfile {
  libraryName: string;
  proxyBaseUrl: string;            // e.g., https://mylibrary.idm.oclc.org
  loginPath: string;               // e.g., /login?url=
  libraryCard?: string;            // Optional auto-fill
  pin?: string;                    // Optional auto-fill
  barcodeSelector?: string;        // CSS selector for barcode field
  pinSelector?: string;            // CSS selector for PIN field
  submitSelector?: string;         // CSS selector for submit button
  strategies: SiteStrategy[];      // Per-site strategies
}

/**
 * Default example profile (Sonoma County Library)
 */
export const DEFAULT_PROFILE: LibraryProfile = {
  libraryName: "Sonoma County Library",
  proxyBaseUrl: "https://sonomalibrary.idm.oclc.org",
  loginPath: "/login?url=",
  strategies: [
    {
      domain: "nytimes.com",
      mode: "direct-login",
      url: "https://sonomalibrary.org/elibrary/a-z/nyt-remote",
      clickSelectors: [
        "a[href*='nytimes.com/subscription/redeem']",  // Click the redeem link
        "button[type='submit']"                         // Click redeem button on NYT
      ],
      returnToArticle: true,
      description: "NYT Remote Access - Get pass and return to article"
    },
    {
      domain: "washingtonpost.com",
      mode: "direct-login",
      url: "https://www.sonomalibrary.org/washingtonpost",
      clickSelectors: ["a.access-link"],
      description: "Washington Post Remote Access"
    },
    {
      domain: "wsj.com",
      mode: "direct-login",
      url: "https://www.sonomalibrary.org/wsj",
      clickSelectors: ["a.btn-activate"],
      description: "WSJ 3-day renewable pass"
    },
    {
      domain: "theatlantic.com",
      mode: "ezproxy-search",
      url: "https://sonomalibrary.idm.oclc.org/login?url=https://search.ebscohost.com/login.aspx?direct=true&db=f5h",
      searchSelector: "input[name='query']",
      description: "Atlantic via EBSCO MasterFile Complete"
    },
    {
      domain: "economist.com",
      mode: "ezproxy-search",
      url: "https://sonomalibrary.idm.oclc.org/login?url=https://www.pressreader.com",
      searchSelector: "input[type='search']",
      description: "Economist via PressReader"
    },
    {
      domain: "pressdemocrat.com",
      mode: "ezproxy-wrapper",
      url: "https://sonomalibrary.idm.oclc.org/login?url=https://infoweb.newsbank.com/apps/news/browse-source?p=WORLDNEWS&t=product%3DSonoma",
      description: "Press Democrat via NewsBank"
    }
  ]
};

/**
 * Message types for communication between content script and background
 */
export interface Message {
  type: 'PAYWALL_DETECTED' | 'OPEN_VIA_LIBRARY' | 'GET_STRATEGY' | 'STRATEGY_RESPONSE';
  domain?: string;
  url?: string;
  title?: string;
  strategy?: SiteStrategy;
}
