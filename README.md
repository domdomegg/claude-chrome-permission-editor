# claude-chrome-permission-editor

Pre-approve permissions for the [Claude for Chrome](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn) extension.

## Why

Claude for Chrome asks for permission before taking actions on websites and when navigating between different domains. This is a good security feature, but can be tedious if you're using it for automation tasks across many sites.

This tool lets you pre-approve permissions for domains you trust, so Claude can act without prompting.

## What it does

1. **extract-domains** - Reads your Chrome browsing history and outputs your most-visited domains
2. **write-permissions** - Writes permissions to the extension's local storage:
   - Netloc permissions (allow actions on specific domains)
   - Domain transitions (allow navigating between top 50 domains)

## Usage

### Prerequisites

- Node.js 18+
- Chrome must be **closed** when running these scripts (the database is locked while Chrome runs)

### Setup

```bash
npm install
npm run build
```

### Step 1: Extract domains from your history

```bash
# Close Chrome first!
node dist/extract-domains.js > domains.txt
```

Or create your own `domains.txt` with one domain per line. See `domains.example.txt`.

### Step 2: Write permissions

```bash
# Chrome must be closed!
node dist/write-permissions.js domains.txt
```

## Contributing

Pull requests are welcomed on GitHub! To get started:

1. Install Git and Node.js
2. Clone the repository
3. Install dependencies with `npm install`
4. Run `npm run test` to run tests
5. Build with `npm run build`

## ⚠️ Warning

**This tool modifies Chrome extension storage directly.** Use at your own risk.

- Pre-approving permissions bypasses security prompts that exist to protect you
- This modifies undocumented internal storage - a Chrome or extension update could break it

If something breaks, you can reset by:
1. Closing Chrome
2. Deleting the extension's storage folder
3. Reopening Chrome (you'll need to log into the extension again)
