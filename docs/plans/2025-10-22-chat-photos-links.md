# Chat Photos & Links Implementation Plan

**Date:** October 22, 2025  
**Branch:** `add-photos-and-links-in-chat`

## Overview

Add support for images and links in chat messages with automatic link previews and content moderation features.

## Design Decisions

### Images
- Store as base64 strings embedded in message content
- Client-side resize to max 800px width, compress to ~100KB
- Keep separate from main Photo model (simpler, faster)
- No CDN/storage overhead for casual chat photos

### Links
- Auto-detect URLs in message content
- Fetch Open Graph metadata server-side
- Store preview data in message metadata JSON
- Render rich preview cards in UI
- Always open in new tab/browser

### Moderation
- Any participant can hide messages for themselves
- Message author can delete their own messages
- Group admin/owner can delete for everyone
- Deleted messages show "[Message deleted]" placeholder

## Implementation Plan

### Phase 1: Schema & Database
- [x] **Step 1:** Update ChatMessage schema
  - Add `type` enum: 'text' | 'image' | 'link' | 'mixed'
  - Add `metadata` JSON field for link previews and image info
  - Add `isHidden` boolean for soft deletes
  - Add `hiddenBy` and `hiddenAt` for moderation tracking
- [x] **Step 2:** Create and run database migration
  - Migration: `20251022214356_add_chat_message_metadata_and_moderation`

### Phase 2: Link Previews
- [ ] **Step 3:** Install `open-graph-scraper` package
- [ ] **Step 4:** Create `/api/chat/link-preview` route
  - Fetch Open Graph metadata
  - Add caching and rate limiting
  - Handle timeouts and errors

### Phase 3: Image Upload
- [ ] **Step 5:** Create image resize utility
  - Client-side compression
  - Convert to base64
  - Max 800px width, ~100KB size
- [ ] **Step 6:** Update ChatInterface
  - Add image picker button
  - Handle image selection
  - Embed base64 in message

### Phase 4: Message Processing
- [ ] **Step 7:** Update message handler
  - Detect URLs in content
  - Queue link preview fetch
  - Update message metadata
  - Broadcast updates

### Phase 5: UI Rendering
- [ ] **Step 8:** Create rendering components
  - `MessageImage` component for base64 images
  - `LinkPreview` component for rich cards
  - Update message display logic

### Phase 6: Moderation
- [ ] **Step 9:** Add moderation UI
  - Long-press menu with Hide/Delete
  - Permission-based options
- [ ] **Step 10:** Implement actions
  - Hide/delete API routes
  - Permission checks
  - Update message state

### Phase 7: Real-time Updates
- [ ] **Step 11:** Update socket handlers
  - Broadcast message updates
  - Handle metadata changes
  - Sync hidden status

### Phase 8: Testing
- [ ] **Step 12:** End-to-end testing
  - Image upload and rendering
  - Link preview generation
  - Moderation permissions
  - Real-time updates

## Technical Details

### Message Metadata Structure
```json
{
  "images": [{
    "width": 800,
    "height": 600,
    "size": 95000
  }],
  "links": [{
    "url": "https://example.com",
    "title": "Page Title",
    "description": "Description...",
    "image": "https://example.com/og-image.jpg",
    "siteName": "Example"
  }]
}
```

### Security Considerations
- Rate limit link preview requests
- Validate URLs before fetching
- Block internal IPs and localhost
- Handle redirects safely
- Set fetch timeout (5-10s)
- Sanitize OG metadata

### Performance Optimizations
- Cache link previews by URL
- Lazy load images
- Compress images client-side
- Batch preview requests
- Use CDN for OG images (optional)
