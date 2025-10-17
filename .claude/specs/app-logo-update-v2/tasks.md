# Implementation Plan - App Logo Update v2

## Task Overview

This implementation updates the TrendAnkara mobile app logo assets and fixes the critical Android Material You themed icon bug where the monochrome layer appears blank in Google Pixel Launcher. The tasks focus on: (1) updating source file references to use new 1024x1024 PNG/SVG assets, (2) replacing the broken threshold/negate algorithm with proper alpha-based PNG processing, and (3) enhancing validation to prevent blank monochrome layers. All changes are localized to `scripts/generate-icons.ts` with no modifications to iOS generation functions (which work correctly).

## Steering Document Compliance

Tasks follow established project patterns:
- All modifications contained within existing `scripts/generate-icons.ts` file
- No new dependencies required (Sharp library already installed)
- Preserves backward compatibility (function signatures unchanged)
- Maintains existing app.json icon configuration structure
- Uses atomic task breakdown for single-file operations

## Atomic Task Requirements

**Each task meets these criteria:**
- **File Scope**: Modifies 1 file (scripts/generate-icons.ts) with specific line ranges
- **Time Boxing**: Completable in 10-20 minutes per task
- **Single Purpose**: One specific algorithm change or path update per task
- **Specific Lines**: Exact line numbers provided for each modification
- **Agent-Friendly**: Clear before/after code examples with no ambiguity

## Task Format Guidelines

- Use checkbox format: `- [ ] Task number. Task description`
- **Specify exact lines**: Always include line numbers from generate-icons.ts
- **Include before/after code**: Show OLD and NEW code side-by-side
- Reference requirements using: `_Requirements: X.Y_`
- Reference existing code using: `_Leverage: scripts/generate-icons.ts:line-range_`
- Focus only on coding tasks (no deployment, testing on physical devices)

## Good vs Bad Task Examples

❌ **Bad Examples (Too Broad)**:
- "Update icon generation system" (too many changes, vague scope)
- "Fix Android themed icons" (doesn't specify exact changes)
- "Implement new logo assets" (missing specific file operations)

✅ **Good Examples (Atomic)**:
- "Update SVG source path at line 3002 in generate-icons.ts"
- "Replace threshold/negate with extractChannel at lines 1304-1310"
- "Add PNG file loading at line 1273 in generateAndroidMonochrome"

## Tasks

### Phase 1: Update Source File References

- [x] 1. Update validateSource() call to use new SVG filename
  - **File**: `scripts/generate-icons.ts` (line 3002)
  - **Change**:
    ```typescript
    // OLD:
    const isValid = await validateSource('assets/logo/trendankaralogo.svg');

    // NEW:
    const isValid = await validateSource('assets/logo/TrendAnkara_Logo.svg');
    ```
  - **Purpose**: Point validation to new SVG logo file
  - **Validation**: Script should find and validate TrendAnkara_Logo.svg
  - _Requirements: 1.3_
  - _Leverage: scripts/generate-icons.ts:3002_

- [x] 2. Update parseSVG() call to use new SVG filename
  - **File**: `scripts/generate-icons.ts` (line 3014)
  - **Change**:
    ```typescript
    // OLD:
    const svgData = await parseSVG('assets/logo/trendankaralogo.svg');

    // NEW:
    const svgData = await parseSVG('assets/logo/TrendAnkara_Logo.svg');
    ```
  - **Purpose**: Parse new SVG logo structure for color extraction
  - **Validation**: Color parsing should detect #FF0000, #000000, #ffffff
  - _Requirements: 1.1, 1.5_
  - _Leverage: scripts/generate-icons.ts:3014_

- [x] 3. Update fs.readFile() call to load new SVG source
  - **File**: `scripts/generate-icons.ts` (line 3027)
  - **Change**:
    ```typescript
    // OLD:
    const svgBuffer = await fs.promises.readFile('assets/logo/trendankaralogo.svg');

    // NEW:
    const svgBuffer = await fs.promises.readFile('assets/logo/TrendAnkara_Logo.svg');
    ```
  - **Purpose**: Load new SVG file as buffer for iOS and Android foreground/background generation
  - **Validation**: SVG buffer should be loaded successfully (non-empty buffer)
  - _Requirements: 1.1, 1.2_
  - _Leverage: scripts/generate-icons.ts:3027_

- [x] 4. Update Commander option default value for source path
  - **File**: `scripts/generate-icons.ts` (line 3083)
  - **Change**:
    ```typescript
    // OLD:
    .option('-s, --source <path>', 'Path to source SVG file', 'assets/logo/trendankaralogo.svg')

    // NEW:
    .option('-s, --source <path>', 'Path to source SVG file', 'assets/logo/TrendAnkara_Logo.svg')
    ```
  - **Purpose**: Update CLI default to use new SVG logo file
  - **Validation**: Running `npm run generate-icons` should use new default
  - _Requirements: 1.3, 5.1_
  - _Leverage: scripts/generate-icons.ts:3083_

- [x] 5. Update help text documentation for new source path
  - **File**: `scripts/generate-icons.ts` (line 3094)
  - **Change**:
    ```typescript
    // OLD:
    Generate icons using default source (assets/logo/trendankaralogo.svg)

    // NEW:
    Generate icons using default source (assets/logo/TrendAnkara_Logo.svg)
    ```
  - **Purpose**: Update help documentation to reflect new default SVG path
  - **Validation**: Running `npm run generate-icons -- --help` should show updated text
  - _Requirements: 5.1_
  - _Leverage: scripts/generate-icons.ts:3094_

### Phase 2: Implement PNG-Based Monochrome Generation

- [x] 6. Add PNG file loading at start of generateAndroidMonochrome function
  - **File**: `scripts/generate-icons.ts` (after line 1273, before existing SVG processing)
  - **Add**:
    ```typescript
    // Load PNG source for monochrome generation (replaces SVG processing)
    const pngPath = 'assets/logo/TrendAnkaraLogo.png';
    if (!fs.existsSync(pngPath)) {
        throw new Error(`PNG source file not found: ${pngPath}. Monochrome layer requires PNG with explicit alpha channel.`);
    }
    const pngBuffer = await fs.promises.readFile(pngPath);
    printMsg(YELLOW, `  Loading PNG source: ${pngPath} (${Math.round(pngBuffer.length / 1024)}KB)`);
    ```
  - **Purpose**: Load PNG file with explicit alpha channel for proper silhouette extraction
  - **Validation**: Script should load 30KB PNG file successfully
  - _Requirements: 1.1, 2.1, 5.2_
  - _Leverage: scripts/generate-icons.ts:1273-1300 (existing SVG metadata section)_

- [x] 7. Replace SVG threshold/negate algorithm with PNG alpha extraction
  - **File**: `scripts/generate-icons.ts` (replace lines 1302-1319)
  - **Remove**:
    ```typescript
    // OLD (BROKEN): SVG threshold and negate approach
    const silhouetteBuffer = await sharp(svg)
        .resize(SAFE_ZONE_SIZE, SAFE_ZONE_SIZE, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .threshold(128)
        .negate()
        .png({...})
        .toBuffer();
    ```
  - **Replace with**:
    ```typescript
    // NEW (FIXED): PNG alpha-based white silhouette extraction
    // Step 1: Extract alpha channel as grayscale mask
    const alphaMask = await sharp(pngBuffer)
        .extractChannel('alpha')
        .toBuffer();

    printMsg(YELLOW, `  Extracted alpha mask from PNG (identifies logo vs background)`);

    // Step 2: Create white RGB image (strip alpha temporarily)
    const whiteImage = await sharp(pngBuffer)
        .removeAlpha()  // Flatten to RGB
        .linear([0, 0, 0], [255, 255, 255])  // Set all channels to white
        .toBuffer();

    // Step 3: Recombine white RGB with original alpha mask
    const whiteSilhouette = await sharp(whiteImage)
        .joinChannel(alphaMask)  // Add alpha back as 4th channel
        .toBuffer();

    printMsg(YELLOW, `  Created white silhouette preserving logo shape`);

    // Step 4: Resize to fit within safe zone
    const silhouetteBuffer = await sharp(whiteSilhouette)
        .resize(SAFE_ZONE_SIZE, SAFE_ZONE_SIZE, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({
            compressionLevel: 6,
            adaptiveFiltering: true,
            palette: false,
            quality: 100,
            progressive: false,
            force: true
        })
        .toBuffer();
    ```
  - **Purpose**: Fix Material You themed icon bug by creating proper white-on-transparent silhouette
  - **Validation**: Generated silhouette should have white pixels (#FFFFFF) where logo is, transparent elsewhere
  - _Requirements: 2.1, 2.2, 3.1, 5.3_
  - _Leverage: scripts/generate-icons.ts:1302-1319 (replace entire SVG processing block)_

### Phase 3: Enhanced Validation

- [x] 8. Add blank layer detection with pixel statistics
  - **File**: `scripts/generate-icons.ts` (after line 1353, before existing metadata validation)
  - **Add**:
    ```typescript
    // Enhanced validation: Check for blank layer using pixel statistics
    const stats = await sharp(monochromeBuffer).stats();

    // Check if any non-transparent pixels exist (alpha channel mean > 0)
    const alphaMean = stats.channels[3].mean;
    const hasContent = alphaMean > 0;

    if (!hasContent) {
        throw new Error('Monochrome layer validation failed: Layer is completely blank (no visible content). ' +
                       'Alpha channel mean is 0, indicating all pixels are transparent. ' +
                       'This would cause themed icons to appear invisible in Material You launchers.');
    }

    printMsg(GREEN, `  ✓ Content validation passed: Alpha channel mean = ${alphaMean.toFixed(2)}`);
    ```
  - **Purpose**: Detect blank monochrome layers early to prevent invisible themed icons
  - **Validation**: Should throw error if generated layer has no visible pixels
  - _Requirements: 2.2, 5.4, 5.5_
  - _Leverage: scripts/generate-icons.ts:1355-1371 (existing validation section)_

- [x] 9. Add white color verification for monochrome pixels
  - **File**: `scripts/generate-icons.ts` (after task 8's content check, before success message)
  - **Add**:
    ```typescript
    // Verify white color for non-transparent pixels (Material You requirement)
    const rMean = stats.channels[0].mean;
    const gMean = stats.channels[1].mean;
    const bMean = stats.channels[2].mean;
    const isWhite = rMean > 250 && gMean > 250 && bMean > 250;

    if (!isWhite) {
        printMsg(YELLOW, `  ⚠ Warning: Monochrome layer may not be pure white (R:${rMean.toFixed(0)}, G:${gMean.toFixed(0)}, B:${bMean.toFixed(0)}). ` +
                        `Material You themed icons require white (#FFFFFF) for proper tinting. ` +
                        `Current color may affect how launchers apply theme colors.`);
    } else {
        printMsg(GREEN, `  ✓ Color validation passed: White silhouette (R:${rMean.toFixed(0)}, G:${gMean.toFixed(0)}, B:${bMean.toFixed(0)})`);
    }
    ```
  - **Purpose**: Ensure monochrome layer uses pure white color for proper Material You tinting
  - **Validation**: Should warn if RGB values aren't close to 255
  - _Requirements: 2.1, 2.5, 5.4_
  - _Leverage: scripts/generate-icons.ts:1355-1371 (extends validation section)_

- [x] 10. Add opacity verification for non-transparent pixels
  - **File**: `scripts/generate-icons.ts` (after task 9's color check, before final success message)
  - **Add**:
    ```typescript
    // Calculate opacity percentage for non-transparent pixels
    // Extract non-zero alpha pixels and calculate mean opacity
    const { data, info } = await sharp(monochromeBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

    let nonTransparentCount = 0;
    let opacitySum = 0;

    // Sample every 10th pixel for performance (RGBA = 4 bytes per pixel)
    for (let i = 0; i < data.length; i += 40) {  // Jump 10 pixels (10 * 4 bytes)
        const alpha = data[i + 3];
        if (alpha > 0) {
            nonTransparentCount++;
            opacitySum += alpha;
        }
    }

    const averageOpacity = nonTransparentCount > 0 ? (opacitySum / nonTransparentCount) / 255 : 0;
    const opacityPercent = (averageOpacity * 100).toFixed(1);

    if (averageOpacity < 0.95) {
        printMsg(YELLOW, `  ⚠ Warning: Monochrome layer opacity is ${opacityPercent}% (target: >95%). ` +
                        `Low opacity may cause faint or barely visible themed icons. ` +
                        `Non-transparent pixels should be fully opaque (alpha: 255).`);
    } else {
        printMsg(GREEN, `  ✓ Opacity validation passed: ${opacityPercent}% average opacity for logo pixels`);
    }
    ```
  - **Purpose**: Verify logo pixels are fully opaque (>95%) to ensure visibility in themed icons
  - **Validation**: Should warn if average opacity of logo pixels is below 95%
  - _Requirements: 2.2, 5.4_
  - _Leverage: scripts/generate-icons.ts:1355-1371 (extends validation section)_

### Phase 4: Documentation and Error Messages

- [x] 11. Update generateAndroidMonochrome function documentation comment
  - **File**: `scripts/generate-icons.ts` (lines 1272-1281, function header comment)
  - **Replace**:
    ```typescript
    // OLD:
    // - Style: Single color silhouette (white foreground, transparent background)
    // - Purpose: Android 13+ will tint this based on wallpaper colors

    // NEW:
    // - Style: Single color silhouette (white foreground #FFFFFF, transparent background)
    // - Purpose: Android 13+ Material You will tint this based on wallpaper colors
    // - Source: Uses PNG (assets/logo/TrendAnkaraLogo.png) instead of SVG for explicit alpha channel
    // - Algorithm: Extract alpha mask → Create white RGB → Recombine alpha → Resize → Composite
    // - Fix: Replaces broken threshold(128)/negate() approach that caused blank themed icons
    ```
  - **Purpose**: Document the algorithm change and why PNG is used instead of SVG
  - **Validation**: Code comment should explain the fix for blank themed icon bug
  - _Requirements: 3.1, 3.5_
  - _Leverage: scripts/generate-icons.ts:1272-1281_

- [x] 12. Improve error message for missing PNG source file
  - **File**: `scripts/generate-icons.ts` (task 6's error handling)
  - **Enhance** (already included in task 6, but verify specificity):
    ```typescript
    throw new Error(`PNG source file not found: ${pngPath}. ` +
                    `Monochrome layer requires PNG with explicit alpha channel. ` +
                    `Ensure TrendAnkaraLogo.png exists in assets/logo/ directory. ` +
                    `This file must be a 1024x1024 PNG with transparent background.`);
    ```
  - **Purpose**: Provide actionable error message if PNG asset is missing
  - **Validation**: Error should clearly state PNG requirements (size, transparency)
  - _Requirements: 5.4_
  - _Leverage: scripts/generate-icons.ts:1273+ (error handling from task 6)_

### Phase 5: Final Integration and Testing

- [x] 13. Run icon generation script to test all changes
  - **Command**: `npm run generate-icons`
  - **File**: Execute modified `scripts/generate-icons.ts`
  - **Validation checks**:
    - Script loads TrendAnkara_Logo.svg successfully (new SVG)
    - Script loads TrendAnkaraLogo.png successfully (new PNG)
    - All iOS icons generate correctly (light, dark, tinted)
    - Android foreground/background generate correctly
    - Android monochrome generates without "blank layer" error
    - Monochrome passes content, color, and opacity validations
    - Generated monochrome.png file size is <5KB
    - No errors or warnings during generation
  - **Purpose**: Verify all code changes work together to generate valid icons
  - **Expected output**: "✓ Icon generation completed successfully" with all validation checks passing
  - _Requirements: All (1.1-6.5)_
  - _Leverage: Complete scripts/generate-icons.ts with all modifications_

- [x] 14. Verify generated monochrome layer file properties
  - **File**: Check `assets/icons/android/adaptive/monochrome.png`
  - **Manual validation**:
    - Open monochrome.png in image viewer - should see white logo on transparent background
    - Verify dimensions: 432x432 pixels
    - Verify file size: <5KB (target: 2-4KB)
    - Verify format: PNG with alpha channel (RGBA)
    - Verify content: Microphone, text "103.8", play button visible in white
    - Verify background: Fully transparent (checkerboard pattern in image viewers)
  - **Purpose**: Manually confirm generated monochrome layer is correct before building app
  - **Expected result**: White silhouette of logo elements on transparent background, clearly visible
  - _Requirements: 2.1, 2.2, 2.5_
  - _Leverage: Generated file at assets/icons/android/adaptive/monochrome.png_

- [ ] 15. Build Android app and verify themed icon displays correctly
  - **Command**: `npm run android:install` or `eas build --platform android`
  - **Device validation** (if Google Pixel 7+ available):
    1. Install app on device
    2. Open Settings → Wallpaper & style
    3. Enable "Themed icons"
    4. Return to launcher
    5. Verify TrendAnkara app icon displays with colored tint (not blank)
    6. Change wallpaper to different color
    7. Verify icon tint updates to match new theme color
  - **Purpose**: Confirm Material You themed icons work correctly on physical device
  - **Expected result**: App icon visible with appropriate theme color tinting (bug fixed)
  - **Note**: If physical device unavailable, this can be tested after deployment
  - _Requirements: 2.1, 2.2, 2.5_
  - _Leverage: Android build system, Google Pixel Launcher themed icons feature_

---

## Task Execution Notes

### Prerequisites
- New logo assets must exist:
  - `assets/logo/TrendAnkara_Logo.svg` (11KB)
  - `assets/logo/TrendAnkaraLogo.png` (30KB)
- Both files confirmed present in project

### Execution Strategy
1. **Phase 1 (Tasks 1-5)**: Can be done in rapid sequence (simple path updates)
2. **Phase 2 (Tasks 6-7)**: Core algorithm fix - requires careful code replacement
3. **Phase 3 (Tasks 8-10)**: Enhanced validation - build progressively on existing validation
4. **Phase 4 (Tasks 11-12)**: Documentation polish - improves maintainability
5. **Phase 5 (Tasks 13-15)**: Integration and verification - confirms everything works

### Testing Checkpoints
- **After Phase 1**: Script should load new SVG source without errors
- **After Phase 2**: Monochrome generation should complete without threshold/negate
- **After Phase 3**: All validation checks should pass (content, color, opacity)
- **After Phase 4**: Code should be well-documented for future maintainers
- **After Phase 5**: Generated icons should work correctly on Android with themed icons enabled

### Rollback Strategy
If issues arise:
1. **Backup available**: app.json.backup created automatically by script
2. **Git revert**: All changes in single file (scripts/generate-icons.ts)
3. **Old assets preserved**: trendankaralogo.svg still exists for emergency fallback

### Success Criteria
- [ ] All 15 tasks completed successfully
- [ ] Icon generation script runs without errors
- [ ] Monochrome layer passes all validation checks (content, color, opacity)
- [ ] Generated monochrome.png visually correct (white logo on transparent background)
- [ ] Android build includes new icons
- [ ] Themed icons display correctly on Pixel device (if available for testing)

---
