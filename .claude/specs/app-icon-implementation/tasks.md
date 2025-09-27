# Implementation Plan - App Icon Implementation

## Task Overview
The implementation will create a comprehensive icon generation system that transforms the Trend Ankara SVG logo into platform-specific adaptive icons for iOS 18 and Android 13+. Tasks are organized to build incrementally from basic infrastructure to complete integration with the Expo build system.

## Steering Document Compliance
Tasks follow established project patterns:
- Scripts placed in `scripts/` directory following `android-install.sh` patterns
- Assets organized in `assets/icons/` subdirectory
- Configuration updates preserve existing `app.json` structure
- TypeScript with strict typing for all new code

## Atomic Task Requirements
**Each task must meet these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Task Format Guidelines
- Use checkbox format: `- [ ] Task number. Task description`
- **Specify files**: Always include exact file paths to create/modify
- **Include implementation details** as bullet points
- Reference requirements using: `_Requirements: X.Y, Z.A_`
- Reference existing code to leverage using: `_Leverage: path/to/file.ts, path/to/component.tsx_`
- Focus only on coding tasks (no deployment, user testing, etc.)
- **Avoid broad terms**: No "system", "integration", "complete" in task titles

## Good vs Bad Task Examples
❌ **Bad Examples (Too Broad)**:
- "Implement icon generation system" (affects many files, multiple purposes)
- "Add icon support features" (vague scope, no file specification)
- "Build complete icon pipeline" (too large, multiple components)

✅ **Good Examples (Atomic)**:
- "Create TypeScript types for icon configuration in scripts/generate-icons.ts"
- "Add SVG parsing function in scripts/generate-icons.ts using svgson"
- "Create iOS light mode icon generation in scripts/generate-icons.ts with sharp"

## Tasks

### Phase 1: Setup and Dependencies

- [x] 1. Install required npm packages for icon generation
  - File: package.json (modify)
  - Run: `npm install --save-dev sharp@0.33.0 svgson@5.3.0 commander@11.0.0`
  - Add to devDependencies section
  - Purpose: Install image processing and SVG parsing libraries
  - _Requirements: 1.1, 1.3, 4.1_

- [x] 2. Create base icon generation script with core interfaces
  - File: scripts/generate-icons.ts (create new)
  - Define IconConfiguration and SVGData interfaces only
  - Import required modules (fs, path)
  - Add basic script structure with colored output helpers
  - Purpose: Establish base script foundation
  - _Leverage: scripts/android-install.sh (script structure, colored output)_
  - _Requirements: 1.1, 4.1_

- [x] 3. Add validation and error type definitions to script
  - File: scripts/generate-icons.ts (modify)
  - Define GeneratedIcon, ValidationResult, ValidationError types
  - Import sharp, svgson, commander modules
  - Purpose: Complete type-safe foundation
  - _Requirements: 1.1, 4.4_

- [x] 4. Add icon generation command to package.json scripts
  - File: package.json (modify)
  - Add script: `"generate-icons": "npx tsx scripts/generate-icons.ts"`
  - Place after existing "android:install-clean" script
  - Purpose: Enable icon generation via npm run command
  - _Leverage: package.json (existing script patterns)_
  - _Requirements: 4.3_

### Phase 2: SVG Processing

- [x] 5. Implement SVG file loading and validation in generate-icons.ts
  - File: scripts/generate-icons.ts (modify)
  - Create `validateSource(svgPath: string): Promise<boolean>` function
  - Check file exists, has .svg extension, is readable
  - Validate SVG structure using basic XML parsing
  - Purpose: Ensure source SVG is valid before processing
  - _Leverage: assets/logo/trendankaralogo.svg (source file)_
  - _Requirements: 1.1_

- [x] 6. Create basic SVG parsing function using svgson
  - File: scripts/generate-icons.ts (modify)
  - Implement `parseSVG(filePath: string): Promise<SVGData>` function
  - Extract width, height, viewBox, elements from SVG
  - Purpose: Parse SVG structure for transformation
  - _Requirements: 1.1_

- [x] 7. Add brand color identification to SVG parser
  - File: scripts/generate-icons.ts (modify)
  - Extend parseSVG to identify brand colors (#e53e3e, #000000, #ffffff)
  - Set color flags (hasRed, hasBlack, hasWhite)
  - Purpose: Validate brand colors in source
  - _Requirements: 1.5_

- [x] 8. Add color extraction and validation logic
  - File: scripts/generate-icons.ts (modify)
  - Create `extractColors(svg: SVGData): ColorPalette` function
  - Validate presence of brand colors
  - Count unique colors and identify text elements
  - Purpose: Ensure brand color consistency
  - _Requirements: 1.5_

### Phase 3: iOS Icon Generation

- [x] 9. Create iOS light mode icon generator function
  - File: scripts/generate-icons.ts (modify)
  - Implement `generateIOSLightIcon(svg: Buffer): Promise<Buffer>` function
  - Use sharp to render SVG at 1024x1024 with sRGB color space
  - Apply proper PNG optimization settings
  - Purpose: Generate standard iOS app icon
  - _Requirements: 2.1_

- [x] 10. Add Display P3 color space support for iOS icons
  - File: scripts/generate-icons.ts (modify)
  - Create `applyDisplayP3Profile(buffer: Buffer): Promise<Buffer>` function
  - Convert sRGB to Display P3 wide-gamut color
  - Fallback to sRGB if conversion fails
  - Purpose: Support wide-gamut displays on newer iOS devices
  - _Requirements: 1.2_

- [x] 11. Implement iOS dark mode icon generation with transparency
  - File: scripts/generate-icons.ts (modify)
  - Create `generateIOSDarkIcon(svg: Buffer): Promise<Buffer>` function
  - Remove background, maintain foreground with alpha channel
  - Export as PNG with transparency at 1024x1024
  - Purpose: Support iOS dark appearance mode
  - _Requirements: 2.2_

- [x] 12. Add iOS tinted mode icon generation with grayscale
  - File: scripts/generate-icons.ts (modify)
  - Implement `generateIOSTintedIcon(svg: Buffer): Promise<Buffer>` function
  - Convert to grayscale with Gray Gamma 2.2 profile
  - Use black background (#000000) as specified
  - Purpose: Enable iOS tinted appearance mode
  - _Requirements: 2.3, 2.5_

- [x] 13. Create iOS icon size scaling function
  - File: scripts/generate-icons.ts (modify)
  - Add `scaleIOSIcon(buffer: Buffer, size: number): Promise<Buffer>` function
  - Scale to sizes: [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]
  - Maintain aspect ratio and quality during scaling
  - Purpose: Generate all required iOS icon sizes
  - _Requirements: 1.1_

### Phase 4: Android Icon Generation

- [x] 14. Create iOS legacy fallback icon for older devices
  - File: scripts/generate-icons.ts (modify)
  - Implement `generateIOSLegacyIcon(svg: Buffer): Promise<Buffer>` function
  - Generate single icon.png without appearance variants
  - Apply rounded corners with alpha channel
  - Purpose: Support iOS versions below 18
  - _Requirements: 5.2, 5.3_

### Phase 4: Android Icon Generation

- [x] 15. Generate Android adaptive icon foreground layer
  - File: scripts/generate-icons.ts (modify)
  - Create `generateAndroidForeground(svg: Buffer): Promise<Buffer>` function
  - Extract logo elements, center in 108x108dp canvas
  - Ensure content fits within 66dp safe zone
  - Purpose: Create Android adaptive icon foreground
  - _Leverage: assets/images/android-icon-foreground.png (reference)_
  - _Requirements: 3.2, 3.3_

- [x] 16. Create Android adaptive icon background layer
  - File: scripts/generate-icons.ts (modify)
  - Implement `generateAndroidBackground(): Promise<Buffer>` function
  - Generate solid black (#000000) background at 108x108dp
  - Export as PNG without transparency
  - Purpose: Provide Android adaptive icon background
  - _Leverage: assets/images/android-icon-background.png (reference)_
  - _Requirements: 3.2_

- [x] 17. Implement Android monochrome icon for Material You
  - File: scripts/generate-icons.ts (modify)
  - Add `generateAndroidMonochrome(svg: Buffer): Promise<Buffer>` function
  - Convert to single color silhouette maintaining shape
  - Ensure logo fits within 66dp safe zone
  - Purpose: Support Android 13+ themed icons
  - _Leverage: assets/images/android-icon-monochrome.png (reference)_
  - _Requirements: 3.1, 3.3, 3.5_

- [x] 18. Add Android DPI scaling for legacy icons
  - File: scripts/generate-icons.ts (modify)
  - Create `scaleAndroidIcon(buffer: Buffer, dpi: string): Promise<Buffer>` function
  - Scale to: mdpi(48), hdpi(72), xhdpi(96), xxhdpi(144), xxxhdpi(192)
  - Apply proper compression for each DPI level
  - Purpose: Generate legacy Android icon sizes
  - _Requirements: 5.4_

- [x] 19. Generate Android legacy square/circular icons
  - File: scripts/generate-icons.ts (modify)
  - Create `generateAndroidLegacyIcons(svg: Buffer): Promise<Buffer[]>` function
  - Generate square and circular variants for API < 26
  - Apply proper alpha channels
  - Purpose: Support Android versions below 8.0
  - _Requirements: 5.1, 5.4_

### Phase 5: File System Operations

- [x] 20. Create directory structure for generated icons
  - File: scripts/generate-icons.ts (modify)
  - Implement `createDirectoryStructure(): Promise<void>` function
  - Create: assets/icons/ios/, assets/icons/android/, assets/icons/android/adaptive/
  - Use fs.promises.mkdir with recursive option
  - Purpose: Organize generated icons properly
  - _Requirements: 4.3_

- [x] 21. Implement icon file writing with optimization
  - File: scripts/generate-icons.ts (modify)
  - Add `writeIconFile(buffer: Buffer, path: string): Promise<void>` function
  - Optimize PNG with sharp before writing
  - Strip metadata for security
  - Purpose: Save generated icons to filesystem
  - _Requirements: 1.2, 4.3_

- [x] 22. Add checksum generation for icon validation
  - File: scripts/generate-icons.ts (modify)
  - Create `generateChecksum(buffer: Buffer): string` function
  - Use crypto.createHash('sha256') for deterministic hashing
  - Store checksums for validation
  - Purpose: Ensure icon generation consistency
  - _Requirements: 1.1_

### Phase 6: Configuration Management

- [x] 23. Create app.json backup function before modifications
  - File: scripts/generate-icons.ts (modify)
  - Implement `backupConfig(): Promise<void>` function
  - Copy app.json to app.json.backup with timestamp
  - Verify backup was created successfully
  - Purpose: Preserve original configuration
  - _Requirements: 4.5_

- [x] 24. Update iOS icon configuration in app.json
  - File: scripts/generate-icons.ts (modify)
  - Add `updateIOSConfig(paths: IOSIconPaths): Promise<void>` function
  - Update expo.ios.icon with light/dark/tinted paths
  - Preserve existing iOS configuration
  - Purpose: Configure iOS adaptive icons
  - _Leverage: app.json (line 7, existing icon config)_
  - _Requirements: 4.1, 4.5_

- [x] 25. Modify Android adaptive icon configuration in app.json
  - File: scripts/generate-icons.ts (modify)
  - Create `updateAndroidConfig(paths: AndroidIconPaths): Promise<void>` function
  - Update expo.android.adaptiveIcon properties
  - Add monochromeImage path for Material You
  - Purpose: Configure Android adaptive icons
  - _Leverage: app.json (lines 24-29, existing config)_
  - _Requirements: 4.2, 4.5_

- [x] 26. Add web favicon generation from SVG
  - File: scripts/generate-icons.ts (modify)
  - Implement `generateWebFavicon(svg: Buffer): Promise<Buffer>` function
  - Generate 32x32 and 192x192 PNG favicons
  - Apply optimization for web use
  - Purpose: Support web platform favicon
  - _Requirements: 1.1_

### Phase 7: Validation and Error Handling

- [ ] 27. Implement icon dimension validation function
  - File: scripts/generate-icons.ts (modify)
  - Add `validateIconDimensions(buffer: Buffer, expectedSize: number): boolean`
  - Check width, height match expected dimensions
  - Verify image is square and properly formatted
  - Purpose: Ensure icons meet platform requirements
  - _Requirements: 1.1_

- [ ] 28. Create color accuracy validation for brand consistency
  - File: scripts/generate-icons.ts (modify)
  - Implement `validateBrandColors(buffer: Buffer): Promise<boolean>` function
  - Sample pixels to verify red (#e53e3e), black, white presence
  - Check color space compliance (sRGB/Display P3)
  - Purpose: Maintain brand color consistency
  - _Requirements: 1.5, 2.2_

- [ ] 29. Add comprehensive error handling with recovery
  - File: scripts/generate-icons.ts (modify)
  - Wrap all async operations in try-catch blocks
  - Implement `handleError(error: Error, context: string): void` function
  - Provide user-friendly error messages with solutions
  - Purpose: Graceful error handling and recovery
  - _Leverage: scripts/android-install.sh (error handling patterns)_
  - _Requirements: 4.4_

### Phase 8: CLI and Main Orchestration

- [ ] 30. Set up basic CLI argument handling
  - File: scripts/generate-icons.ts (modify)
  - Add simple argument parsing for source SVG path
  - Default to assets/logo/trendankaralogo.svg if not provided
  - Add --dry-run flag for testing without file writes
  - Purpose: Enable basic command-line usage
  - _Requirements: 1.1_

- [ ] 31. Create progress reporting with colored output
  - File: scripts/generate-icons.ts (modify)
  - Implement `reportProgress(stage: string, progress: number): void` function
  - Use ANSI color codes for success/warning/error states
  - Display progress bar for long operations
  - Purpose: Provide clear execution feedback
  - _Leverage: scripts/android-install.sh (colored output)_
  - _Requirements: 4.4_

- [ ] 32. Create basic orchestration flow structure
  - File: scripts/generate-icons.ts (modify)
  - Implement `generateIcons(options: GenerationOptions): Promise<void>` skeleton
  - Add sequential step execution
  - Purpose: Coordinate generation pipeline
  - _Requirements: 1.1_

- [ ] 33. Add error handling and cleanup to orchestration
  - File: scripts/generate-icons.ts (modify)
  - Create `generateIcons(options: GenerationOptions): Promise<void>` function
  - Add try-catch blocks for each step
  - Implement cleanup on failure
  - Report final status with statistics
  - Purpose: Ensure robust pipeline execution
  - _Requirements: 4.4_

### Phase 9: Testing and Documentation

- [ ] 34. Add basic validation tests for icon generation
  - File: scripts/generate-icons.ts (modify)
  - Implement `runTests(): Promise<TestResults>` function
  - Test SVG parsing and color extraction
  - Validate icon dimensions
  - Purpose: Ensure generation quality
  - _Requirements: 1.1_

- [ ] 35. Create icon preview HTML page for visual validation
  - File: assets/icons/preview.html (create new)
  - Display all generated icon variants in grid layout
  - Show iOS light/dark/tinted and Android variants
  - Include size and checksum information
  - Purpose: Visual quality assurance
  - _Leverage: existing HTML patterns_
  - _Requirements: 5.1_

- [ ] 36. Write generation report with statistics
  - File: assets/icons/generation-report.json (create via script)
  - Log generation timestamp, file counts, sizes
  - Include validation results and checksums
  - Record any warnings or non-critical issues
  - Purpose: Document generation results
  - _Requirements: 4.3_

- [ ] 37. Add README with usage instructions
  - File: scripts/README-icons.md (create new)
  - Document command usage: `npm run generate-icons`
  - Explain icon variants and platform requirements
  - Include troubleshooting guide for common issues
  - Purpose: Developer documentation
  - _Leverage: existing README.md patterns_
  - _Requirements: 4.4_