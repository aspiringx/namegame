# Constellation Photo Size Optimization

## Problem

With large groups (114+ people), loading full-size or medium-size photos for
constellation stars caused:

- Slow texture loading (choppy animations)
- High bandwidth usage (5-9MB for 114 people with small/400x400 photos)
- Poor performance on mobile devices

## Solution

Implemented client-side photo size selection to load thumbnail-sized images.

### Implementation

Added `getPhotoUrlForSize()` helper function in `Scene.tsx`:

```typescript
const getPhotoUrlForSize = (
  photoUrl: string,
  size: 'thumb' | 'small' = 'thumb',
): string => {
  if (
    !photoUrl ||
    photoUrl.startsWith('http') ||
    photoUrl.includes('default-avatar')
  ) {
    return photoUrl
  }

  // Insert size before .webp extension
  return photoUrl.replace(/\.webp$/, `.${size}.webp`)
}
```

### Photo Sizes Available

Per `config/photos.ts`:

- **thumb**: 150x150px, 80% quality (~10-20KB each)
- **small**: 400x400px, 85% quality (~50-80KB each)
- **medium**: 800x800px, 90% quality (~150-250KB each)
- **large**: 1200x1200px, 90% quality (~300-500KB each)

### Why Thumb Size?

1. **Star circles are small** - Even when "arrived" at a star close-up, the
   circle isn't very large
2. **150x150px is sufficient** - Provides good quality for the circular star
   textures
3. **Massive performance gain**:
   - 114 people × thumb = ~1-2MB total
   - 114 people × small = ~5-9MB total
   - **5-7x reduction in bandwidth**

### Performance Impact

**Before:**

- Loading 114 medium/small photos
- Choppy animations during texture loading
- High memory usage

**After:**

- Loading 114 thumb photos (150x150px)
- Smooth animations
- ~80% reduction in texture memory
- ~80% reduction in download size

## Files Modified

- `apps/web/src/app/constellations/Scene.tsx`
  - Added `getPhotoUrlForSize()` helper
  - Modified texture loader to use `thumb` size

## Future Considerations

- Could implement progressive loading (load thumbs first, upgrade to small on
  close-up)
- Could use WebP compression detection and fallback
- Could implement texture pooling/reuse for very large groups (200+)

## Testing

Test with groups of various sizes:

- Small (5-10 people) - Should work as before
- Medium (20-50 people) - Noticeable performance improvement
- Large (100+ people) - Significant performance improvement
