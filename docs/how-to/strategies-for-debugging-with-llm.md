# Strategies for Debugging with LLM (Cascade/Windsurf)

## Credit Usage & Image Optimization

### Problem
- Large screenshots (3-6MB PNG from phone) consume 6-10x more credits than optimized images
- Mac screenshots copied from memory (Cmd+Ctrl+Shift+4) are better but still not optimized
- 500 credits now lasting days instead of weeks due to image-heavy debugging

### Image Token Cost
- **1MB image**: ~750-1,500 tokens
- **6MB image**: ~4,500-9,000 tokens  
- **Text-only request**: 100-500 tokens

### Best Practices
- Target <500KB per screenshot when possible
- Resize to 1920px width or smaller before sharing
- Use JPG at 80-90% quality instead of PNG
- Only share images directly relevant to current issue
- Crop to show just the relevant portion
- Start new conversations for unrelated tasks to drop old images from context

---

## 1. Still Image Capture Solutions

### Mac Native Solutions

#### Option A: Screenshot Utility with Automation (Recommended)
**Tool**: Built-in Screenshot.app + Automator/Shortcuts

**Setup**:
1. Open **System Settings > Keyboard > Keyboard Shortcuts > Screenshots**
2. Change default save location: `defaults write com.apple.screencapture location ~/Screenshots/llm-debug`
3. Create folder: `mkdir -p ~/Screenshots/llm-debug`

**For automatic compression**, create a **Folder Action** in Automator:
1. Open **Automator** > New > **Folder Action**
2. Choose folder: `~/Screenshots/llm-debug`
3. Add actions:
   - "Filter Finder Items" (Kind is Image)
   - "Scale Images" (to 1920px width, proportionally)
   - "Change Type of Images" (to JPEG, Quality: 80%)
   - "Rename Finder Items" (add text "-optimized")
4. Save as "Optimize Screenshots"

**Keyboard shortcuts** (already built-in):
- `Cmd+Shift+3`: Capture entire screen
- `Cmd+Shift+4`: Select area (click-drag)
- `Cmd+Shift+4` then `Space`: Capture specific window
- `Cmd+Shift+5`: Opens screenshot toolbar with recording options

#### Option B: Third-Party Tools

**CleanShot X** (Paid, ~$29)
- Scrolling capture
- Annotation tools
- Auto-optimization
- Cloud upload
- Custom keyboard shortcuts
- Area pinning (capture same area repeatedly)

**Shottr** (Free)
- Fast and lightweight
- Built-in compression
- Scrolling capture
- Annotation
- OCR text recognition
- Pixel measurement tools

**Kap** (Free, for recordings)
- GIF/MP4 export
- Trim and edit
- Plugin system

### Quick-Capture Workflow for Multiple Screenshots

**Using built-in tools**:
1. Press `Cmd+Shift+5`
2. Click "Options" > "Save to" > Choose your debug folder
3. Select "Capture Selected Portion"
4. Click-drag area once to set it
5. Press `Cmd+Shift+4` repeatedly to capture that same area
6. Or press `Cmd+Shift+5` again to change area

**Using Shottr** (recommended):
1. Install Shottr
2. Set keyboard shortcut (e.g., `Cmd+Shift+2`)
3. Click-drag to capture
4. Stays in capture mode - can immediately capture again
5. Auto-saves optimized JPGs to configured folder

---

## 2. Video/Animation Capture Solutions

### Problem
Animations move too fast for manual screenshots, but can't send video files directly to LLM.

### Solution A: Frame Extraction from Screen Recording

**Using FFmpeg** (command-line):
```bash
# Install ffmpeg
brew install ffmpeg

# Record screen (Cmd+Shift+5, save as .mov)
# Then extract frames at 1 FPS
ffmpeg -i recording.mov -vf "fps=1,scale=1920:-1" -q:v 5 frame_%04d.jpg

# Extract frames at 2 FPS
ffmpeg -i recording.mov -vf "fps=2,scale=1920:-1" -q:v 5 frame_%04d.jpg

# Extract every 2 seconds (0.5 FPS)
ffmpeg -i recording.mov -vf "fps=0.5,scale=1920:-1" -q:v 5 frame_%04d.jpg
```

**Parameters explained**:
- `fps=1`: 1 frame per second
- `scale=1920:-1`: Resize to 1920px width, maintain aspect ratio
- `-q:v 5`: JPEG quality (2-5 is good, lower = better quality/larger files)
- `frame_%04d.jpg`: Output naming (frame_0001.jpg, frame_0002.jpg, etc.)

### Solution B: Automated Screenshot Tools

**Kap** (Free, Mac):
1. Install: `brew install --cask kap`
2. Record screen area
3. Export as GIF or MP4
4. Use FFmpeg script above to extract frames

**ScreenFlow** (Paid, ~$169):
- Professional screen recording
- Built-in frame export
- Annotation and editing

### Solution C: Browser DevTools Performance Recording

For web app debugging:
1. Open Chrome DevTools (`Cmd+Option+I`)
2. Go to **Performance** tab
3. Click **Record** (or `Cmd+E`)
4. Perform actions
5. Stop recording
6. Take screenshots of specific frames in timeline
7. Export performance profile as JSON (can share with LLM)

### Workflow Script for Frame Extraction

Create a script at `~/bin/extract-frames.sh`:

```bash
#!/bin/bash
# Usage: extract-frames.sh input.mov [fps] [output_dir]

INPUT="$1"
FPS="${2:-1}"  # Default 1 FPS
OUTPUT_DIR="${3:-./frames}"

mkdir -p "$OUTPUT_DIR"

ffmpeg -i "$INPUT" \
  -vf "fps=$FPS,scale=1920:-1" \
  -q:v 5 \
  "$OUTPUT_DIR/frame_%04d.jpg"

echo "Frames extracted to $OUTPUT_DIR"
open "$OUTPUT_DIR"
```

Make executable: `chmod +x ~/bin/extract-frames.sh`

Usage: `extract-frames.sh recording.mov 2 ~/Screenshots/llm-debug`

---

## 3. Log Management Strategies

### Browser Console Logs

#### Problem
Verbose logs make it hard to find relevant information.

#### Solutions

**A. Filter in DevTools**
1. Use **Filter** box in Console (top of panel)
2. Filter by:
   - Text: Type keywords (e.g., "error", "API", "user")
   - Level: Click icons to show only Errors, Warnings, Info
   - Source: Filter by file/domain
   - Regex: Use `/pattern/` for advanced filtering

**B. Preserve Logs Across Navigation**
- Check **Preserve log** in Console settings (gear icon)
- Prevents logs from clearing on page reload

**C. Copy Filtered Logs**
1. Right-click in console
2. **Save as...** to export full log
3. Or select specific entries, right-click > **Copy**

**D. Use Console API for Targeted Logging**

Add to your code:
```javascript
// Group related logs
console.group('User Action: Login');
console.log('Email:', email);
console.log('Timestamp:', new Date());
console.groupEnd();

// Use different levels
console.error('Critical error');  // Red, shows stack trace
console.warn('Warning');          // Yellow
console.info('Info');             // Blue (hidden by default)
console.debug('Debug');           // Gray (hidden by default)

// Custom styling
console.log('%cIMPORTANT', 'color: red; font-size: 20px; font-weight: bold', data);

// Table view for arrays/objects
console.table(users);
```

**E. Create Debug Namespace**

```javascript
// In your app
window.DEBUG = {
  enabled: true,
  log: (...args) => window.DEBUG.enabled && console.log('[DEBUG]', ...args),
  api: (...args) => window.DEBUG.enabled && console.log('[API]', ...args),
  user: (...args) => window.DEBUG.enabled && console.log('[USER]', ...args),
};

// Usage
DEBUG.api('Fetching user data', userId);
DEBUG.user('User clicked button', buttonId);

// Filter console by "[API]" or "[USER]"
```

**F. Copy Only What's Needed**

Instead of copying entire console:
1. Clear console (`Cmd+K`)
2. Reproduce the issue
3. Copy only the new logs
4. Or use "Copy object" on specific objects

### Server Logs (Next.js/Node)

#### Problem
Server logs mixed with build output, hard to trace requests.

#### Solutions

**A. Structured Logging with Pino**

```bash
npm install pino pino-pretty
```

```javascript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

// Usage
logger.info({ userId, action: 'login' }, 'User logged in');
logger.error({ error, userId }, 'Login failed');
```

**B. Request ID Tracing**

Add to middleware:
```javascript
// middleware.ts
import { v4 as uuidv4 } from 'uuid';

export function middleware(request) {
  const requestId = uuidv4();
  request.headers.set('x-request-id', requestId);
  
  console.log(`[${requestId}] ${request.method} ${request.url}`);
  
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}
```

**C. Filter Server Logs**

```bash
# Only show errors
npm run dev 2>&1 | grep -i error

# Only show your custom logs
npm run dev 2>&1 | grep "\[DEBUG\]"

# Save to file
npm run dev 2>&1 | tee server.log

# Then search file
grep "userId.*123" server.log
```

**D. Use Next.js Logging Best Practices**

```javascript
// Only log in development
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// Or use debug package
import debug from 'debug';
const log = debug('app:api');
log('API called with', params);

// Enable with: DEBUG=app:* npm run dev
```

### Sharing Logs with LLM

**Best practices**:
1. **Clear and reproduce**: Clear console/terminal, reproduce issue, copy only new logs
2. **Add context**: Include timestamp, what action triggered the logs
3. **Format as code blocks**: Use triple backticks in chat
4. **Highlight the error**: Point out the specific line that's problematic
5. **Include stack traces**: For errors, include full stack trace
6. **Redact sensitive data**: Remove API keys, passwords, personal data

**Example format**:
```
I clicked the "Submit" button and got this error in the browser console:

```
[ERROR] POST /api/users 500
Error: User not found
    at handler (api/users/route.ts:45)
    at process (next/server.js:123)
```

And this in the server logs:

```
[2025-01-29 06:45:23] POST /api/users
[2025-01-29 06:45:23] Query: SELECT * FROM users WHERE id = $1
[2025-01-29 06:45:23] ERROR: relation "users" does not exist
```
```

---

## 4. Browser Preview vs. Local Browser

### How Cascade's Browser Preview Works

**What it is**:
- Cascade can spin up a **browser preview** using the `browser_preview` tool
- Opens a Chromium-based browser in a sandboxed environment
- Cascade can see:
  - Console logs
  - Network requests
  - JavaScript errors
  - DOM structure
  - Performance metrics

**When to use it**:
- When you want Cascade to see errors directly
- For automated testing/verification
- When describing UI issues is difficult

**Limitations**:
- Slower than native Chrome
- May not have your browser extensions
- Separate session (different cookies/localStorage)
- Can't see your local Chrome's DevTools

### Your Local Chrome Browser

**What Cascade sees**:
- Only what you share (screenshots, logs, descriptions)
- Cannot see your DevTools directly
- Cannot see your interactions
- Cannot see console logs unless you copy/paste them

**Advantages**:
- Faster performance
- Your extensions and settings
- Your authenticated sessions
- Better developer experience

### Recommended Workflow

**For most debugging**:
1. Use your local Chrome browser
2. Open DevTools (`Cmd+Option+I`)
3. Reproduce the issue
4. Take optimized screenshots of:
   - The UI problem
   - Relevant console errors
   - Network tab (if API issue)
   - React DevTools (if state issue)
5. Copy relevant logs
6. Share with Cascade

**When to use Browser Preview**:
- Cascade needs to verify a fix works
- You want Cascade to run automated tests
- Complex interaction that's hard to describe
- Cascade needs to see real-time console output

**Hybrid approach**:
1. Debug in local Chrome (faster iteration)
2. Once you have a hypothesis, ask Cascade to verify in Browser Preview
3. Cascade can see if the fix actually works

### Example Request

"I'm seeing an error when I click the submit button. Here's what I see in my local Chrome:

[screenshot of UI]
[screenshot of console error]

```
Error: Cannot read property 'id' of undefined
    at handleSubmit (Form.tsx:45)
```

Can you help me fix this? If you need to see it in action, you can use the browser preview."

---

## Quick Reference

### Optimal Screenshot Workflow
1. **Mac**: Use Shottr (free) or CleanShot X (paid)
2. **Target**: <500KB per image, 1920px width max
3. **Format**: JPG at 80% quality
4. **Folder**: Auto-save to dedicated debug folder

### Animation Capture Workflow
1. Record with `Cmd+Shift+5` (built-in)
2. Extract frames: `extract-frames.sh recording.mov 1 ~/Screenshots/llm-debug`
3. Delete irrelevant frames
4. Share ordered sequence with Cascade

### Log Sharing Workflow
1. Clear console/terminal
2. Reproduce issue
3. Filter to relevant logs only
4. Copy and format as code blocks
5. Add context about what action triggered them

### Browser Choice
- **Local Chrome**: Default for development (faster, better DX)
- **Browser Preview**: When Cascade needs to verify or see real-time behavior

---

## Tools Summary

### Free Tools
- **Shottr**: Screenshot optimization and annotation
- **Kap**: Screen recording and GIF export
- **FFmpeg**: Frame extraction from videos
- **Built-in Mac screenshots**: Good with Automator compression

### Paid Tools (Optional)
- **CleanShot X** ($29): Premium screenshot tool
- **ScreenFlow** ($169): Professional screen recording

### Development Tools
- Chrome DevTools (built-in)
- Pino (structured logging)
- Debug package (namespaced logging)
