# Testing Constellation Integration

## What Was Implemented

The constellation experience is now fully integrated into all group views. Users
can open it from any group type (family, community, etc.) via a sparkles icon
(✨) in the toolbar.

## How to Test

### Desktop Testing

1. **Navigate to any group**

   - Go to `/g/[your-group-slug]`
   - You should see the group grid view

2. **Open Constellation Modal**

   - Look for the sparkles icon (✨) in the toolbar (right side, after the grid
     icon)
   - Click it
   - The constellation experience should open in full-screen mode
   - You should see all group members as stars (not the demo mock data)

3. **Verify Functionality**

   - The experience should load with actual group member photos
   - Navigate through the constellation journey
   - Place stars in Close/Near/Far rings

4. **Close Modal**

   - Click "Back to [Group Name]" button (top-left)
   - OR press Escape key
   - You should return to the group view exactly where you left off

5. **Test from Different Views**
   - Try opening constellation from grid view
   - Try from tree view (if family group)
   - Try from games view
   - It should work from all views

### Mobile Testing

1. **Navigate to any group on mobile**

   - Go to `/g/[your-group-slug]`

2. **Open View Mode Dropdown**

   - Tap the view mode button (top-right in toolbar)
   - You should see a dropdown menu

3. **Select Constellation**

   - Look for "Constellation" option with sparkles icon
   - Tap it
   - Full-screen constellation experience should open

4. **Close Modal**
   - Tap "Back" button (top-left)
   - OR use device back gesture if supported
   - Should return to group view

## Expected Behavior

### ✅ Success Criteria

- [ ] Sparkles icon appears in toolbar on all group types
- [ ] Clicking sparkles opens full-screen constellation modal
- [ ] Modal shows actual group members (with their real photos)
- [ ] Back button returns to group view
- [ ] Escape key closes modal (desktop)
- [ ] Modal appears in mobile dropdown menu
- [ ] Body scroll is prevented when modal is open
- [ ] Standalone `/constellations` demo still works with mock data

### ❌ Known Limitations (Future Work)

- Constellation positions are NOT persisted yet (resets on close)
- No timestamp tracking for playback
- No database schema for storing positions
- No API routes for saving/loading

## Files to Check if Issues Occur

1. **ConstellationModal.tsx** - Modal component
2. **UniversalClient.tsx** - Integration point
3. **GroupToolbar.tsx** - Sparkles button
4. **MakeConstellation.tsx** - Accepts people prop
5. **StarField.tsx** - Uses people data
6. **starData.ts** - Initializes with people

## Common Issues & Solutions

### Issue: Sparkles icon doesn't appear

**Solution**: Check that `onOpenConstellation` prop is being passed to
GroupToolbar in UniversalClient.tsx (line 395)

### Issue: Modal shows mock data instead of group members

**Solution**: Check the people mapping in UniversalClient.tsx (lines 550-554).
Ensure `initialMembers` has data.

### Issue: Modal doesn't close

**Solution**: Check that `isConstellationOpen` state is being set to false in
the onClose handler

### Issue: TypeScript errors

**Solution**: Ensure all imports are correct and Person type matches between
components

## Next Steps After Testing

Once basic functionality is verified:

1. **Add persistence layer**

   - Create database schema for constellation positions
   - Add API routes for CRUD operations
   - Update StarField to load/save positions

2. **Add timestamp tracking**

   - Store constellation snapshots over time
   - Build playback UI

3. **Enhance UX**

   - Add loading states for save operations
   - Add success/error toasts
   - Consider auto-save vs manual save

4. **Performance optimization**
   - Test with large groups (100+ members)
   - Optimize Three.js rendering if needed
