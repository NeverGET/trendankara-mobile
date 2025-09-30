# app-icon-implementation - Task 32

Execute task 32 for the app-icon-implementation specification.

## Task Description
Create basic orchestration flow structure

## Requirements Reference
**Requirements**: 1.1

## Usage
```
/Task:32-app-icon-implementation
```

## Instructions

Execute with @spec-task-executor agent the following task: "Create basic orchestration flow structure"

```
Use the @spec-task-executor agent to implement task 32: "Create basic orchestration flow structure" for the app-icon-implementation specification and include all the below context.

# Steering Context
## Steering Documents Context

No steering documents found or all are empty.

# Specification Context
## Specification Context (Pre-loaded): app-icon-implementation

### Requirements
# Requirements Document - App Icon Implementation

## Introduction

This feature implements modern, adaptive app icons for the Trend Ankara mobile application on both iOS and Android platforms. The implementation will use the existing SVG logo (`trendankaralogo.svg`) to generate platform-specific icons that support the latest iOS 18 appearance modes (light, dark, tinted) and Android 13+ themed icons (Material You). This ensures the app icon properly adapts to user preferences and system themes while maintaining brand consistency.

## Alignment with Product Vision

This feature directly supports the product vision of Trend Ankara as a "simple, elegant radio station mobile app" by:
- Enhancing brand identity through consistent, professional app icon presentation
- Supporting the red, black, and white brand color scheme
- Providing a polished user experience that adapts to user preferences (dark/light mode)
- Maintaining professional brand presence on mobile platforms across all system themes
- Following the "simple is better" principle with clean icon design

## Requirements

### Requirement 1: SVG-Based Icon Generation

**User Story:** As a developer, I want to convert the SVG logo into platform-specific icon formats, so that the app maintains visual quality across all device resolutions and configurations.

#### Acceptance Criteria

1. WHEN the SVG logo is processed THEN the system SHALL generate PNG icons at all required resolutions for iOS (1024x1024 base)
2. IF the target platform is iOS THEN the system SHALL generate icons supporting Display P3 wide-gamut color space with sRGB fallback
3. WHEN generating Android icons THEN the system SHALL create adaptive icon layers (foreground, background, monochrome) at 108x108 dp
4. IF rounded corners are needed for compatibility THEN the system SHALL apply appropriate alpha channels to PNG exports
5. WHEN icons are generated THEN the system SHALL preserve the red (#e53e3e), black (#000000), and white (#ffffff) brand colors

### Requirement 2: iOS 18 Appearance Modes Support

**User Story:** As an iOS user, I want the app icon to adapt to my device's appearance settings, so that it looks cohesive with my chosen system theme.

#### Acceptance Criteria

1. WHEN the user has light mode enabled THEN the system SHALL display the standard light mode icon variant
2. IF the user enables dark mode THEN the system SHALL display a dark mode optimized icon with transparent background
3. WHEN the user enables tinted mode THEN the system SHALL display a grayscale icon that adapts to system accent colors
4. IF the device runs iOS 16 or earlier THEN the system SHALL fallback to the standard icon without appearance variations
5. WHEN generating tinted icons THEN the system SHALL use Gray Gamma 2.2 color profile with black (#000000) background

### Requirement 3: Android Material You Theming

**User Story:** As an Android user, I want the app icon to match my device's Material You theme colors, so that it integrates seamlessly with my personalized system appearance.

#### Acceptance Criteria

1. WHEN the user enables themed icons in Android 13+ THEN the system SHALL display the monochrome icon variant
2. IF the device supports adaptive icons THEN the system SHALL provide separate foreground and background layers
3. WHEN creating the monochrome layer THEN the system SHALL ensure the logo fits within the 66x66 dp safe zone
4. IF the device runs Android 12 or earlier THEN the system SHALL display the standard adaptive icon without theming
5. WHEN the monochrome icon is displayed THEN the system SHALL allow the launcher to apply user's wallpaper-based tinting

### Requirement 4: Expo Configuration Integration

**User Story:** As a developer, I want the icon configuration integrated with Expo's build system, so that icons are automatically applied during the build process.

#### Acceptance Criteria

1. WHEN configuring iOS icons THEN the system SHALL update app.json with separate light, dark, and tinted icon paths
2. IF Android adaptive icons are configured THEN the system SHALL specify foregroundImage, backgroundImage, and monochromeImage paths
3. WHEN building the app THEN the system SHALL ensure all icon files are included in the assets directory structure
4. IF icon files are missing THEN the build system SHALL provide clear error messages indicating which variants are required
5. WHEN icons are updated THEN the system SHALL maintain backward compatibility with existing app configurations

### Requirement 5: Legacy Device Compatibility

**User Story:** As a user with an older device, I want to see a properly formatted app icon, so that the app looks professional regardless of my device version.

#### Acceptance Criteria

1. WHEN the device doesn't support adaptive icons THEN the system SHALL provide standard PNG fallback icons
2. IF the iOS version is below 18 THEN the system SHALL use the single icon configuration without appearance modes
3. WHEN generating fallback icons THEN the system SHALL ensure proper alpha channels for rounded corners
4. IF Android version is below 8.0 (API 26) THEN the system SHALL use legacy square/circular icon formats
5. WHEN fallback icons are used THEN the system SHALL maintain the core brand visual identity

## Non-Functional Requirements

### Performance
- Icon generation process must complete within 10 seconds
- Generated icons must be optimized for file size without quality loss
- Icon loading must not impact app launch time (< 100ms overhead)

### Security
- No external services should be used for icon generation
- Icon files must be included in the app bundle, not fetched remotely
- Generated icons should not contain metadata that could expose system information

### Reliability
- Icon generation must be deterministic (same input produces same output)
- Build process must validate all required icon variants are present
- Icons must render correctly across all supported device configurations

### Usability
- Icons must be visually recognizable at all sizes (from 20x20 to 1024x1024)
- Brand colors must remain consistent across all icon variants
- Icon must be distinguishable in both light and dark backgrounds
- The "1 3.8" text and play button must remain legible at app icon sizes

---

### Design
# Design Document - App Icon Implementation

## Overview

This design outlines the technical architecture for implementing adaptive app icons for the Trend Ankara mobile application. The solution leverages the existing SVG logo to generate platform-specific icon variants supporting iOS 18 appearance modes (light, dark, tinted) and Android 13+ Material You theming. The implementation uses a Node.js-based generation script integrated with the Expo build pipeline to ensure icons are automatically created and configured during the build process.

## Steering Document Alignment

### Technical Standards (from Product Vision)
- **Expo SDK 54 Framework**: Utilizes Expo's native icon configuration capabilities through `app.json` and config plugins
- **TypeScript 5.9.2**: Icon generation script and utilities written in TypeScript with strict typing
- **Simple is Better**: Simple Node.js script approach instead of complex third-party services
- **Minimal Dependencies**: Uses only essential packages (sharp for image processing, svgson for SVG parsing)
- **Cross-Platform Parity**: Ensures icons work identically on iOS and Android through Expo's unified configuration
- **Brand Consistency**: Maintains red (#e53e3e), black (#000000), white (#ffffff) color palette

### Project Structure (Existing Patterns)
Following the established directory organization from the codebase:
- Icon assets stored in `assets/icons/` directory (new subdirectory for generated icons)
- Leverage existing `assets/images/` icon files as reference
- Generation script in `scripts/generate-icons.ts` following `android-install.sh` patterns
- Configuration utilities merged into script for simplicity
- Types defined inline in the generation script

## Code Reuse Analysis

### Existing Components to Leverage
- **assets/logo/trendankaralogo.svg**: Source SVG logo that will be processed for all icon variants
- **assets/images/android-icon-*.png**: Existing Android icon files to use as templates and validation references
- **assets/images/icon.png**: Current iOS icon to use as size/quality reference
- **scripts/android-install.sh**: Reference implementation for script structure, error handling, colored output
- **app.json (lines 7, 24-29)**: Existing icon configuration structure to extend and preserve
- **package.json scripts**: Existing script patterns for adding `generate-icons` command

### Integration Points
- **Expo Build System**: Integrates with existing `expo prebuild` workflow
- **Assets Pipeline**: Connects to existing asset management in `assets/` directory
- **Configuration Management**: Extends current `app.json` structure
- **Script Execution**: Follows patterns from existing `scripts/` directory

## Architecture

The icon generation system follows a three-stage pipeline: parsing the SVG source, transforming it into platform-specific variants, and integrating with Expo's configuration system.

```mermaid
graph TD
    A[SVG Logo Source] --> B[Icon Generator Script]
    B --> C[SVG Parser]
    C --> D[Transform Pipeline]
    D --> E[iOS Variants]
    D --> F[Android Layers]
    E --> G[Light Mode]
    E --> H[Dark Mode]
    E --> I[Tinted Mode]
    F --> J[Foreground]
    F --> K[Background]
    F --> L[Monochrome]
    G --> M[app.json Config]
    H --> M
    I --> M
    J --> N[app.json Android]
    K --> N
    L --> N
    M --> O[Expo Build]
    N --> O
    O --> P[Native Apps]
```

## Components and Interfaces

### Component 1: SVG Parser Module
- **Purpose:** Parse and analyze the source SVG to extract visual elements, colors, and structure
- **Interfaces:**
  - `parseSVG(filePath: string): Promise<SVGData>`
  - `extractElements(svg: SVGData): SVGElements`
  - `identifyBrandColors(elements: SVGElements): ColorPalette`
- **Dependencies:** svgson library for SVG parsing, fs for file operations
- **Reuses:** None (new component)

### Component 2: Icon Transformer
- **Purpose:** Transform parsed SVG data into platform-specific icon variants with appropriate modifications
- **Interfaces:**
  - `generateIOSVariants(svg: SVGData): Promise<IOSIconSet>`
  - `generateAndroidLayers(svg: SVGData): Promise<AndroidIconSet>`
  - `applyColorProfile(image: Buffer, profile: ColorProfile): Buffer`
  - `createMonochrome(svg: SVGData): Promise<Buffer>`
- **Dependencies:** sharp for image processing, color manipulation utilities
- **Reuses:** SVG Parser Module output

### Component 3: File Generator
- **Purpose:** Write generated icon files to appropriate directories with correct naming conventions
- **Interfaces:**
  - `writeIconFile(buffer: Buffer, path: string): Promise<void>`
  - `createDirectoryStructure(): Promise<void>`
  - `optimizePNG(buffer: Buffer): Promise<Buffer>`
  - `validateIconDimensions(buffer: Buffer, size: number): boolean`
- **Dependencies:** Node.js fs module, sharp for optimization
- **Reuses:** Project structure patterns from structure.md

### Component 4: Configuration Updater
- **Purpose:** Update app.json with new icon paths and ensure proper Expo configuration
- **Interfaces:**
  - `updateAppConfig(iconPaths: IconPaths): Promise<void>`
  - `validateConfiguration(): Promise<ValidationResult>`
  - `backupConfig(): Promise<void>`
  - `restoreConfig(): Promise<void>`
- **Dependencies:** JSON manipulation, file system operations
- **Reuses:** Existing app.json structure

### Component 5: Generation Script
- **Purpose:** Orchestrate the entire icon generation process with error handling and progress reporting
- **Interfaces:**
  - `generateIcons(options: GenerationOptions): Promise<void>`
  - `validateSource(svgPath: string): Promise<boolean>`
  - `reportProgress(stage: string, progress: number): void`
- **Dependencies:** All other components, command-line argument parser
- **Reuses:** Script patterns from android-install.sh (error handling, colored output)

## Data Models

### IconConfiguration
```typescript
interface IconConfiguration {
  source: string;                    // Path to source SVG
  outputDirectory: string;           // Base directory for generated icons
  platforms: {
    ios: {
      enabled: boolean;
      variants: {
        light: boolean;
        dark: boolean;
        tinted: boolean;
      };
      sizes: number[];               // [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]
      colorProfile: 'sRGB' | 'DisplayP3';
      tintedColorProfile: 'GrayGamma2.2';  // For tinted mode icons
    };
    android: {
      enabled: boolean;
      adaptiveIcon: {
        foreground: boolean;
        background: boolean;
        monochrome: boolean;
        safeZone: number;            // 66dp safe zone for monochrome
      };
      legacyIcon: boolean;
      dpi: {                         // Specific pixel dimensions
        mdpi: 48,                    // 48x48px
        hdpi: 72,                    // 72x72px
        xhdpi: 96,                   // 96x96px
        xxhdpi: 144,                 // 144x144px
        xxxhdpi: 192                 // 192x192px
      };
    };
  };
  optimization: {
    compress: boolean;
    stripMetadata: boolean;
  };
  migration: {
    backupOriginal: boolean;         // Backup existing app.json
    preserveExisting: boolean;       // Preserve non-icon config
  };
}
```

### SVGData
```typescript
interface SVGData {
  width: number;
  height: number;
  viewBox: string;
  elements: SVGElement[];
  styles: StyleDefinition[];
  colors: {
    primary: string[];               // Brand colors found
    all: Set<string>;                // All unique colors
    hasRed: boolean;                // #e53e3e validation
    hasBlack: boolean;              // #000000 validation
    hasWhite: boolean;              // #ffffff validation
  };
  metadata: {
    hasText: boolean;
    hasGradients: boolean;
    colorCount: number;
    complexity: 'simple' | 'moderate' | 'complex';
  };
}
```

### GeneratedIcon
```typescript
interface GeneratedIcon {
  platform: 'ios' | 'android';
  variant: string;                   // 'light', 'dark', 'tinted', 'foreground', etc.
  size: number;
  path: string;
  buffer: Buffer;
  checksum: string;                  // For validation
  metadata: {
    colorSpace: string;
    hasAlpha: boolean;
    fileSize: number;
  };
}
```

### IconPaths
```typescript
interface IconPaths {
  ios: {
    icon?: string;                    // Legacy single icon
    light?: string;
    dark?: string;
    tinted?: string;
  };
  android: {
    icon?: string;                    // Legacy icon
    adaptiveIcon: {
      foregroundImage: string;
      backgroundImage: string;
      monochromeImage?: string;
      backgroundColor?: string;
    };
  };
  web: {
    favicon: string;
  };
}
```

### ValidationResult
```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
  iconQuality: {
    resolution: boolean;             // Meets minimum resolution
    colorAccuracy: boolean;          // Brand colors preserved
    safeZone: boolean;              // Content within safe zones
    fileSize: boolean;              // Within size limits
  };
}

interface ValidationError {
  type: 'MISSING_FILE' | 'INVALID_SIZE' | 'COLOR_MISMATCH' | 'CONFIG_ERROR';
  message: string;
  file?: string;
  expected?: any;
  actual?: any;
}
```

## Dependencies and Prerequisites

### Required NPM Packages
The following packages need to be added to devDependencies:
```json
{
  "sharp": "^0.33.0",        // Image processing and PNG generation
  "svgson": "^5.3.0",         // SVG parsing and manipulation
  "commander": "^11.0.0"      // CLI argument parsing
}
```

### Installation Command
```bash
npm install --save-dev sharp svgson commander
```

### Node.js Requirements
- Minimum Node.js version: 18.0.0 (for native sharp bindings)
- Platform compatibility: macOS, Linux, Windows (WSL recommended)

## Error Handling

### Error Scenarios

1. **Invalid SVG Source**
   - **Handling:** Validate SVG structure before processing, provide detailed error about what's wrong
   - **User Impact:** Clear error message with instructions to fix the SVG

2. **Color Space Conversion Failure**
   - **Handling:** Fallback to sRGB if Display P3 conversion fails, log warning
   - **User Impact:** Icons generated with standard color space, warning shown

3. **File System Permission Issues**
   - **Handling:** Check write permissions before starting, suggest permission fixes
   - **User Impact:** Helpful error message with chmod command suggestions

4. **Memory Issues with Large SVG**
   - **Handling:** Stream processing for large files, chunked operations
   - **User Impact:** Slower but successful generation with progress indicator

5. **Configuration Update Failure**
   - **Handling:** Backup original config, atomic write operations, rollback on failure
   - **User Impact:** Original configuration preserved, error details provided

6. **Missing Dependencies**
   - **Handling:** Check for required packages, provide npm install instructions
   - **User Impact:** Clear instructions to install missing packages

## Testing Strategy

### Unit Testing
- **SVG Parser**: Test with various SVG structures, malformed SVGs, edge cases
- **Color Transformations**: Verify grayscale conversion, transparency handling
- **File Operations**: Mock file system for testing write operations
- **Configuration Updates**: Test JSON manipulation with various app.json structures

### Integration Testing
- **End-to-End Generation**: Test complete pipeline from SVG to configured icons
- **Platform Compatibility**: Verify generated icons work on iOS simulator and Android emulator
- **Build Integration**: Test with `expo prebuild` to ensure icons are properly included
- **Variant Validation**: Check all variants meet platform requirements

### End-to-End Testing
- **Fresh Installation**: Generate icons on clean project, build, and deploy
- **Update Scenario**: Replace existing icons with newly generated ones
- **CI/CD Integration**: Ensure icon generation works in automated build pipelines
- **Device Testing**: Verify icons appear correctly on physical iOS and Android devices
- **Theme Switching**: Test icon appearance changes with system theme changes

**Note**: Specification documents have been pre-loaded. Do not use get-content to fetch them again.

## Task Details
- Task ID: 32
- Description: Create basic orchestration flow structure
- Requirements: 1.1

## Instructions
- Implement ONLY task 32: "Create basic orchestration flow structure"
- Follow all project conventions and leverage existing code
- Mark the task as complete using: claude-code-spec-workflow get-tasks app-icon-implementation 32 --mode complete
- Provide a completion summary
```

## Task Completion
When the task is complete, mark it as done:
```bash
claude-code-spec-workflow get-tasks app-icon-implementation 32 --mode complete
```

## Next Steps
After task completion, you can:
- Execute the next task using /app-icon-implementation-task-[next-id]
- Check overall progress with /spec-status app-icon-implementation
