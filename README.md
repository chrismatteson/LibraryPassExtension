# Library Pass - Chrome Extension

A Chrome extension that helps users access paywalled news sites through their library's digital resources.

## Features

- **Automatic Paywall Detection**: Detects paywalls on major news sites (NYT, Washington Post, WSJ, The Atlantic, The Economist, Press Democrat)
- **Smart Access Strategies**: Different access methods per site:
  - Direct library login pages with auto-click automation
  - EZproxy URL wrapping
  - Database search via EZproxy
  - Custom strategies
- **User-Configurable Profiles**: Store your library credentials and customize per-site strategies
- **Profile Import/Export**: Share configurations with others using the same library
- **Toast Notifications**: Non-intrusive in-page notifications when paywalls are detected

## Installation

### Development Setup

1. **Clone or download this repository**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run build
   ```

   For development with auto-rebuild:
   ```bash
   npm run dev
   ```

4. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

### Creating Extension Icons

Before loading the extension, you'll need to create icon files. Place PNG icons in the `icons/` folder:

- `icon16.png` (16x16px)
- `icon32.png` (32x32px)
- `icon48.png` (48x48px)
- `icon128.png` (128x128px)

You can use a simple book emoji or library icon. Online tools like [favicon.io](https://favicon.io/) can help generate these.

## Configuration

### First-Time Setup

1. Click the Library Pass icon in your Chrome toolbar
2. Click "Settings" to open the options page
3. Configure your library information:
   - **Library Name**: Your library system name
   - **EZproxy Base URL**: Usually something like `https://yourlibrary.idm.oclc.org`
   - **Login Path**: Typically `/login?url=`
4. (Optional) Add your library card number and PIN for auto-fill
5. Review and customize site strategies
6. Click "Save Settings"

### Site Strategies

Each site can have a custom strategy:

#### Strategy Modes

1. **Direct Login**: Opens your library's dedicated access page
   - Example: NYT Remote Access page
   - Supports auto-clicking through login flow

2. **EZproxy Wrapper**: Wraps the current URL with your EZproxy login
   - Format: `https://library.idm.oclc.org/login?url=<current-url>`

3. **EZproxy Search**: Opens a database via EZproxy and searches for the article
   - Example: EBSCO for The Atlantic articles
   - Auto-fills search with article title

4. **Custom**: Define your own URL template and automation

### Default Profile (Sonoma County Library)

The extension comes pre-configured with Sonoma County Library settings as an example. You can:
- Modify these settings for your own library
- Export your profile as JSON
- Share with others who use the same library system

### Importing a Profile

If someone shares a library profile with you:

1. Open Settings
2. Click "Import Profile"
3. Select the JSON file
4. Click "Save Settings"

## Usage

### Automatic Detection

When you visit a paywalled article on a supported site:
1. A toast notification appears: "📚 Access via Library"
2. Click the toast to open the article via your library
3. The extension will auto-navigate and click through login steps

### Manual Access

For any paywalled page:
1. Click the Library Pass icon in your toolbar
2. Click "Open via Library"
3. The extension will attempt to access it via your library's EZproxy

## Supported Sites (Default)

- **New York Times** (`nytimes.com`)
- **Washington Post** (`washingtonpost.com`)
- **Wall Street Journal** (`wsj.com`)
- **The Atlantic** (`theatlantic.com`)
- **The Economist** (`economist.com`)
- **Press Democrat** (`pressdemocrat.com`)

You can add more sites in Settings → Site Strategies.

## Development

### Project Structure

```
LibraryPassExtension/
├── src/
│   ├── background.ts          # Background service worker
│   ├── content.ts             # Content script (paywall detection)
│   ├── content.css            # Toast notification styles
│   ├── popup.ts               # Extension popup
│   ├── popup.html             # Popup UI
│   ├── options.tsx            # React-based options page
│   ├── options.html           # Options page container
│   └── types.ts               # TypeScript interfaces
├── icons/                     # Extension icons (create these)
├── manifest.json              # Chrome extension manifest
├── webpack.config.js          # Build configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies
```

### Extending the Extension

#### Adding a New Site

1. Open Settings
2. Click "Add Strategy"
3. Configure:
   - **Domain**: The site domain (e.g., `newyorker.com`)
   - **Mode**: Choose strategy type
   - **Target URL**: Library access page or EZproxy URL
   - **Selectors**: CSS selectors for automation

4. Update `PAYWALL_PATTERNS` in `src/content.ts` for paywall detection:
   ```typescript
   'newyorker.com': {
     selectors: ['.paywall-class'],
     textPatterns: [/subscribe/i]
   }
   ```

5. Add the domain to `manifest.json` content scripts if you want automatic detection

#### Custom Automation

For complex login flows, you can:
- Add multiple `clickSelectors` to click through steps
- Use `waitForSelector` to wait for elements
- Use `searchSelector` for database searches

### Building for Production

```bash
# Build minified version
npm run build

# Edit webpack.config.js and set:
optimization: {
  minimize: true
}
```

## Troubleshooting

### Paywall Not Detected
- Check if the site is in your strategies list
- Update paywall detection selectors in `src/content.ts`
- The site's paywall structure may have changed

### Auto-Click Not Working
- Inspect the library login page
- Update CSS selectors in your strategy
- Check browser console for Library Pass logs

### EZproxy Not Working
- Verify your EZproxy base URL
- Ensure your library supports EZproxy
- Check if you need to be on campus or VPN

### Library Credentials Not Auto-Filling
- Configure CSS selectors for your library's login form
- Check the selectors match your library's HTML

## Privacy

- All data is stored locally in Chrome's sync storage
- Library credentials are optional and only stored if you provide them
- No data is sent to external servers
- The extension only runs on configured news sites

## Contributing

To contribute:
1. Fork the repository
2. Make your changes
3. Test thoroughly with your library
4. Submit a pull request

### Sharing Library Profiles

Help others by sharing your library profile:
1. Configure your library settings
2. Click "Export Profile"
3. Share the JSON file with your library community
4. Consider creating a pull request with default profiles for popular libraries

## License

[Add your license here]

## Support

For issues or questions:
- Check existing issues on GitHub
- Open a new issue with details about your library and the problem
- Include browser console logs (filter by "Library Pass")

## Acknowledgments

- Built for library patrons who want easier access to their paid subscriptions
- Inspired by the need to support local journalism through library access
- Default configuration based on Sonoma County Library system

---

**Note**: This extension facilitates legitimate library access. Always respect copyright and your library's terms of service.
