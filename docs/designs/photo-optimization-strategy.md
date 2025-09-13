# Photo Optimization Strategy

## 1. Problem Definition

The application currently uploads and stores a single, high-resolution version
of user and group photos. When a page with multiple images is loaded (e.g., the
family tree), the Next.js server must fetch each of these potentially large
images (up to 10MB) from the storage provider (DigitalOcean Spaces). This
process is inefficient and leads to:

- **High Latency**: The server spends significant time downloading large files
  before sending them to the client.
- **Increased Bandwidth Usage**: Both server-to-storage and server-to-client
  data transfer are higher than necessary.
- **Poor User Experience**: Pages with many images load slowly, especially on
  mobile devices with slower network connections.

## 2. Goal

The primary goal is to improve the performance and efficiency of image delivery
across the application. We will achieve this by generating multiple, pre-sized
versions of each image upon upload and serving the most appropriate size for a
given context (e.g., a small thumbnail for an avatar).

## 3. Proposed Solutions

Two solutions were considered to manage the different image sizes.

### Solution A: Naming Convention

This approach involves storing only the original image's URL in the database and
inferring the URLs for other sizes using a consistent naming convention.

- **Example**:
  - Original: `.../some_id.jpeg`
  - Medium: `.../some_id_medium.jpeg`
  - Thumbnail: `.../some_id_thumb.jpeg`

- **Pros**:
  - Simpler to implement initially.
  - Avoids changes to the database schema, so no migration is needed.

- **Cons**:
  - Less resilient. If a specific size fails to generate during upload, it will
    result in a broken image link.
  - Requires extra logic to handle potential failures (e.g., checking if a file
    exists before rendering), which adds complexity.

### Solution B: Separate Database Fields

This approach involves modifying the `Photo` model in the database to include
distinct fields for each image size.

- **Example `schema.prisma`**:

  ```prisma
  model Photo {
    // ... existing fields
    url String // Original, full-resolution URL
    url_medium String?
    url_thumb String?
  }
  ```

- **Pros**:
  - **Robust and Explicit**: The database serves as a definitive record of which
    image sizes are available.
  - **Scalable**: Easy to add new image sizes in the future by adding more
    fields.
  - **Error-Proof**: Eliminates the risk of broken links, as the application
    will only request URLs that are confirmed to exist in the database.

- **Cons**:
  - Requires a database schema change and a migration.
  - Involves a slightly more complex initial setup.

## 4. Recommendation

**The recommended approach is Solution B: Separate Database Fields.**

While it requires a database migration, this solution is more robust, scalable,
and maintainable in the long run. It provides a reliable source of truth for
image assets and prevents the application from attempting to fetch resources
that don't exist. This architectural choice will lead to a more stable and
predictable system as the application grows.

### Implementation Plan

1.  **Update Schema**: Add `url_medium` and `url_thumb` fields to the `Photo`
    model in `prisma/schema.prisma`.
2.  **Migrate Database**: Run `prisma migrate dev` to apply the schema changes.
3.  **Modify Upload Logic**: Update the `uploadFile` function in
    `src/lib/storage.ts` to generate and upload three versions (original,
    medium, thumbnail) of each image using the `sharp` library.
4.  **Audit Photo Usage**: Search the codebase to identify all locations where
    photo URLs are retrieved from the database. This will inform the necessary
    changes for the next step.
5.  **Update Data Fetching**: Modify all identified data access functions to
    fetch the appropriate image URL (`url`, `url_medium`, or `url_thumb`) based
    on the context of the view.
6.  **Backfill Script (Optional)**: Create a script to process existing photos
    and generate the new sizes.

## 5. Additional Considerations

### 5.1 Image Format Optimization

**WebP vs AVIF**: While AVIF offers superior compression (20-50% smaller than
WebP), WebP has broader browser support and is already supported by the Sharp
library. For this implementation:

- **Recommendation**: Use WebP format for optimized images
- **Browser Support**: WebP is supported by 95%+ of browsers (all modern
  browsers)
- **Fallback Strategy**: Serve JPEG as fallback for older browsers using
  `<picture>` element or content negotiation

**Processing Capacity Considerations**:

- **Current Synchronous Processing**: Processing images during upload requests
  creates potential bottlenecks and timeout risks
- **Scalability Concern**: Large images or multiple concurrent uploads could
  overwhelm the server
- **Recommended Approach**: Implement asynchronous background processing:
  1. Upload original image immediately to provide fast user feedback
  2. Queue background job to generate optimized versions (WebP + multiple sizes)
  3. Update database with optimized URLs once processing completes
  4. Use original image as fallback until optimized versions are ready

### 5.2 PWA and Service Worker Integration

**Current Architecture**: The app uses a service worker to cache all group
member images for offline functionality. This creates specific requirements:

**Image Size Strategy for PWA**:

- **Cache Size Limit**: Implement maximum cached image size (recommended: 400px
  width maximum)
- **Selective Caching**: Only cache thumbnail and small versions for offline use
- **On-Demand Loading**: Load larger images only when online and needed

**Service Worker Cache Management**:

- **Problem Identified**: Current caching stores multiple sizes of same image
  (including unnecessary 1920x1440 versions)
- **Solution**: Update service worker to only cache appropriately sized images:
  ```javascript
  // Cache only thumb and small sizes for offline PWA use
  const CACHEABLE_SIZES = ['thumb', 'small']
  ```

**Background Caching Strategy**:

1. When group loads, cache only thumb and small versions of all member photos
2. Load medium and large sizes on-demand for desktop users (not cached)
3. Never cache original high-resolution images in service worker
   - Desktop users with reliable wifi connections can load these on-demand
   - Prevents cache bloat while maintaining offline functionality

### 5.3 CDN and Server-Side Processing Flow

**Current Flow Analysis**:

1. DigitalOcean Spaces → Next.js Server (full image download)
2. Next.js Server → Sharp/React Image processing (resize on-demand)
3. Next.js Server → Browser (appropriately sized image)

**Optimization Opportunities**:

- **Confirm CDN Usage**: Verify DigitalOcean CDN is properly configured
  - We appear to have the CDN enabled in our digital ocean space, but don't
    appear to be using it. I believe our next server is getting the original
    image from the space from a URL like this:
    https://nyc3.digitaloceanspaces.com

  - Instead of a CDN url like this:
    https://namegame1.nyc3.cdn.digitaloceanspaces.com

  - TODO: Update route.ts to use the CDN URL (DO_SPACES_CDN_ENDPOINT) to
    retreive.
  - TODO: See whether the browser can do this securely to eliminate all image
    retrieval traffic on our next server. In theory, this is only needed for the
    initial load to cache any new images in the group, then it should fall back
    on local cache.
    - Ensure new images are cached and old images removed from the cache. Same
      with photo URLs saved in database and indexeddb.
  - I believe storage.ts should still use the original URL (DO_SPACES_ENDPOINT)
    to store the image.

- **Pre-processed Images**: Store multiple sizes in CDN to eliminate server-side
  processing
- **Direct CDN Delivery**: Serve optimized images directly from CDN, bypassing
  server processing

### 5.4 Error Handling and Offline Scenarios

**Offline-First Error Handling**:

1. **Cache Storage Cleared**:
   - Detect missing cached images
   - Show placeholder/skeleton while attempting to reload
   - Gracefully degrade to text-only view if images unavailable

2. **Interrupted Caching**:
   - Implement retry mechanism for failed image caches
   - Track caching progress in IndexedDB
   - Resume interrupted caching sessions

3. **Size-Based Fallbacks**:
   - If medium size unavailable, fall back to thumbnail
   - If thumbnail unavailable, fall back to initials/placeholder
   - Only attempt to load original size when online

4. **Connection-Aware Loading**:
   - Use Network Information API to detect connection quality
   - Serve lower quality images on slow connections
   - Implement progressive loading (thumbnail → medium → high quality)

**Implementation Strategy**:

````javascript
// Offline-first image loading with fallbacks
async function loadImageWithFallback(photoUrls, context) {
  const sizePreference = context === 'avatar' ? ['thumb'] : ['medium', 'thumb']

  for (const size of sizePreference) {
    try {
      // Try cached version first
      const cachedImage = await getCachedImage(photoUrls[size])
      if (cachedImage) return cachedImage

      // Try network if online
      if (navigator.onLine) {
        return await loadFromNetwork(photoUrls[size])
      }
    } catch (error) {
      console.warn(`Failed to load ${size} image, trying next size`)
    }
  }

  // Final fallback to placeholder
  return getPlaceholderImage()
}

### 5.5 Image Size Specifications

**Recommended Sizes with Exact Dimensions**:

- **thumb**: 150x150px (avatars, small cards, list views) - WebP, 80% quality
  - **Use cases**: Profile thumbnails, member card avatars, navigation elements
  - **Cached for offline**: ✅ Yes
- **small**: 400x400px (mobile full-screen, card displays) - WebP, 85% quality
  - **Use cases**: Mobile device viewing, tablet displays, card hover states
  - **Cached for offline**: ✅ Yes
- **medium**: 800x800px (desktop cards, modal previews) - WebP, 90% quality
  - **Use cases**: Desktop card displays, modal overlays, detailed viewing
  - **Cached for offline**: ❌ No
- **large**: 1200x1200px (desktop full-screen viewing) - WebP, 90% quality
  - **Use cases**: Desktop full-screen "click to enlarge" feature, high-DPI displays
  - **Cached for offline**: ❌ No
- **original**: Preserve original dimensions - JPEG, 90% quality (up to 10MB)
  - **Use cases**: Emergency fallback only when other sizes fail
  - **Cached for offline**: ❌ No

**Device-Aware Loading Strategy**:
```javascript
const getPreferredSize = (context, screenWidth) => {
  if (context === 'avatar') return 'thumb'
  if (context === 'card') {
    return screenWidth > 1024 ? 'medium' : 'small'
  }
  if (context === 'fullscreen') {
    return screenWidth > 1024 ? 'large' : 'medium'
  }
  return 'small'
}
````

**Cache Storage Strategy**:

- **PWA Offline Caching**: Only `thumb` and `small` sizes cached locally
  - Ensures robust offline functionality for mobile users
  - Limits cache storage to reasonable sizes (150px and 400px max)
  - Total estimated cache per 50-member group: ~2-5MB
- **Desktop On-Demand Loading**: `medium` and `large` sizes loaded as needed
  - Takes advantage of reliable desktop wifi connections
  - Provides excellent quality for large screen viewing
  - Eliminates cache bloat from storing unnecessary large images
- **Maximum individual cached image size**: 400px width/height
- **Cache eviction**: Consider implementing LRU (Least Recently Used) eviction
  based on group access patterns
