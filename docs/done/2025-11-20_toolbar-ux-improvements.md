# Toolbar UX Improvements

## Task 1: Mobile Dropdown - Constellations Placement ✅

**Issue:** Constellations menu item was appearing at the end of the list, after
all view modes.

**Fix:** Moved Constellations to appear immediately after Photo Album (first
view mode).

**Mobile Menu Order (Now):**

1. Photo Album
2. **Constellations** ← Moved here
3. Games (if available)
4. Family Tree (if available)
5. Photo Size controls (if on grid view)

**Code Change:**

- Modified the `config.viewModes.map()` to insert Constellation item after index
  0
- Changed label from "Constellation" to "Constellations" (plural)

## Task 2: Desktop Tooltips ✅

**Issue:** Desktop icon buttons had no tooltips, making it unclear what each
button does.

**Fix:** Added tooltips to all desktop icon buttons using shadcn/ui Tooltip
component.

**Tooltips Added:**

- **Photo Album** - Grid/LayoutGrid icon
- **Constellations** - Sparkles icon
- **Family Tree** - GitFork icon (if enabled)
- **Games** - Gamepad2 icon (if enabled)
- **Help** - HelpCircle icon

**Implementation:**

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button>
      <Icon />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Label</TooltipContent>
</Tooltip>
```

**Notes:**

- Tooltips only appear on desktop (hover interaction)
- Labels match the mobile dropdown text for consistency
- Used `asChild` prop to avoid wrapper div issues
- Works with both Link-wrapped and standalone buttons

## Files Modified

1. `apps/web/src/components/GroupToolbar.tsx`
   - Added Tooltip imports
   - Wrapped all desktop icon buttons with Tooltip
   - Reordered mobile dropdown menu items

## Testing

### Mobile

- [ ] Open mobile dropdown
- [ ] Verify Constellations appears after Photo Album
- [ ] Verify all menu items are clickable

### Desktop

- [ ] Hover over Photo Album icon → "Photo Album" tooltip
- [ ] Hover over Constellations icon → "Constellations" tooltip
- [ ] Hover over Games icon → "Games" tooltip
- [ ] Hover over Family Tree icon → "Family Tree" tooltip (if available)
- [ ] Hover over Help icon → "Help" tooltip
