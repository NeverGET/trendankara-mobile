# Requirements Document - App Logo Update v2

## Introduction

This feature updates the TrendAnkara mobile application logo using new high-quality 1024x1024 assets (PNG and SVG formats) to replace the current `trendankaralogo.svg`. While the previous app icon implementation successfully configured iOS 18 appearance modes, a critical bug was discovered in Android 13+ Material You themed icons: the monochrome layer appears as a blank icon in Google Pixel Launcher's "Theme Icons" feature. This update will fix the Android themed icon issue while applying the new logo assets across all platforms, ensuring proper display in all appearance modes and launcher configurations.

## Alignment with Product Vision

This feature directly supports the Trend Ankara product vision by:
- **Professional Brand Identity**: Replacing the logo with production-ready 1024x1024 assets ensures maximum quality and clarity
- **Platform Excellence**: Fixing the Android themed icon bug demonstrates commitment to quality across all platforms
- **Material You Compliance**: Proper monochrome icon implementation ensures users can personalize the app icon with their wallpaper-based theme colors
- **iOS 18 Support**: Maintaining the successful iOS appearance mode implementation (light, dark, tinted)
- **User Experience**: Ensuring the app icon looks professional and adapts correctly to all system themes and launcher configurations
- **2025 Compliance**: Meeting Google Play's mandate for proper themed icon implementation (effective October 2025)

## Requirements

### Requirement 1: Replace Logo Assets with New Files

**User Story:** As a developer, I want to replace the current logo with the new high-quality assets, so that the app maintains professional visual quality across all platforms and resolutions.

#### Acceptance Criteria

1. WHEN replacing logo assets THEN the system SHALL use `TrendAnkaraLogo.png` (1024x1024) as the primary source for PNG-based icons
2. IF vector format is needed THEN the system SHALL use `TrendAnkara_Logo.svg` for scalable icon generation
3. WHEN generating platform icons THEN the system SHALL deprecate the old `trendankaralogo.svg` file
4. IF iOS icons are generated THEN the system SHALL use the new PNG asset to maintain Display P3 color space support
5. WHEN updating assets THEN the system SHALL preserve the red (#FF0000), black (#000000), and white (#ffffff) brand color scheme

### Requirement 2: Fix Android Material You Themed Icon Bug

**User Story:** As an Android user with themed icons enabled, I want the app icon to properly display in the themed icon view, so that it integrates seamlessly with my Material You personalization settings.

#### Acceptance Criteria

1. WHEN generating the monochrome layer THEN the system SHALL create a solid white silhouette of the logo elements on a transparent background
2. IF the device supports Material You (Android 13+) THEN the system SHALL ensure the monochrome icon is visible when themed icons are enabled
3. WHEN creating the monochrome layer THEN the system SHALL fit the logo within the 66x66 dp safe zone (out of 108x108 dp total)
4. IF the current monochrome.png is blank THEN the system SHALL regenerate it with proper opaque content
5. WHEN the themed icon is displayed THEN the system SHALL allow the Android launcher to apply the user's wallpaper-based tinting correctly

### Requirement 3: Investigate and Document Themed Icon Issue

**User Story:** As a developer, I want to understand why the previous monochrome icon implementation failed, so that I can prevent similar issues in future icon updates.

#### Acceptance Criteria

1. WHEN analyzing the current monochrome.png THEN the system SHALL identify whether the issue is transparency, color, or content-related
2. IF the icon has incorrect alpha channels THEN the system SHALL document the specific transparency requirements for Material You
3. WHEN investigating Google Pixel Launcher behavior THEN the system SHALL document the specific requirements for themed icon display
4. IF the safe zone was violated THEN the system SHALL document the 66x66 dp safe zone requirement clearly
5. WHEN documenting findings THEN the system SHALL create implementation notes to prevent recurrence

### Requirement 4: Maintain iOS Appearance Mode Support

**User Story:** As an iOS user, I want the updated logo to continue supporting light, dark, and tinted appearance modes, so that my app icon remains cohesive with my device theme.

#### Acceptance Criteria

1. WHEN updating iOS icons THEN the system SHALL regenerate light, dark, and tinted variants using the new logo
2. IF the iOS icon configuration is updated THEN the system SHALL preserve the existing app.json structure for iOS appearance modes
3. WHEN generating the tinted variant THEN the system SHALL maintain the Gray Gamma 2.2 color profile with black background
4. IF the dark variant is generated THEN the system SHALL maintain transparency for proper dark mode blending
5. WHEN new icons are built THEN the system SHALL verify all three iOS appearance modes display correctly

### Requirement 5: Update Icon Generation Script

**User Story:** As a developer, I want to update the icon generation script to use the new logo assets and fix the monochrome layer generation, so that icons can be easily regenerated for future updates.

#### Acceptance Criteria

1. WHEN updating the script THEN the system SHALL modify `scripts/generate-icons.ts` to reference `TrendAnkaraLogo.png` and `TrendAnkara_Logo.svg`
2. IF generating the monochrome layer THEN the system SHALL use a proper white-on-transparent silhouette generation algorithm
3. WHEN running the script THEN the system SHALL validate monochrome layer opacity to ensure it's not blank
4. IF the monochrome layer fails validation THEN the system SHALL provide clear error messages with diagnostic information
5. WHEN icons are generated THEN the system SHALL output a validation report confirming all layers are properly created

### Requirement 6: Preserve Existing Icon Configuration

**User Story:** As a developer, I want to maintain the existing icon structure in app.json, so that the app continues to work without breaking changes to the build configuration.

#### Acceptance Criteria

1. WHEN updating icons THEN the system SHALL preserve the existing app.json icon paths and structure
2. IF iOS icon paths are updated THEN the system SHALL maintain the light/dark/tinted configuration format
3. WHEN Android adaptive icon paths are updated THEN the system SHALL keep the foreground/background/monochrome structure
4. IF legacy icon paths exist THEN the system SHALL update them to point to newly generated files
5. WHEN configuration is modified THEN the system SHALL create a backup of app.json before making changes

## Non-Functional Requirements

### Performance
- Icon generation process must complete within 15 seconds for all platforms
- Generated icons must be optimized for file size (monochrome layer should be < 5KB)
- Icon loading must not impact app launch time (< 100ms overhead)
- Sharp image processing operations must use efficient memory management

### Quality Assurance
- Monochrome layer must have >95% opacity for non-transparent pixels
- All icon variants must pass Android lint checks for adaptive icons
- Icons must render correctly on Google Pixel Launcher with themed icons enabled
- Visual quality must be maintained at all DPI levels (mdpi through xxxhdpi)

### Reliability
- Icon generation must be deterministic (same input produces same output)
- Build process must validate all icon layers are present and non-blank
- Script must provide clear error messages for any generation failures
- Validation must catch blank or transparent-only monochrome layers

### Usability
- Icons must be visually recognizable at all sizes (20x20 to 1024x1024)
- Monochrome layer must remain legible when tinted with any Material You color
- The "103.8" text and microphone/play button elements must remain clear in all variants
- Brand colors must remain consistent across all icon variants

### Documentation
- Document the root cause of the themed icon bug for future reference
- Include validation checklist for future icon updates
- Add troubleshooting guide for common Material You icon issues
- Provide testing instructions for verifying themed icons on physical devices

---
