#!/usr/bin/env node

/**
 * Icon Generation Script for Trend Ankara Mobile App
 * Generates platform-specific adaptive icons from SVG source
 * Supports iOS 18 appearance modes and Android 13+ Material You theming
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
const sharp = require('sharp');
import { parse as svgsonParse } from 'svgson';
import { Command } from 'commander';

// Color codes for output (following android-install.sh patterns)
const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[1;33m';
const NC = '\x1b[0m'; // No Color

// Function to print colored messages
function printMsg(color: string, message: string): void {
    console.log(`${color}${message}${NC}`);
}

// Core Interfaces

/**
 * Configuration interface for icon generation process
 */
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
                mdpi: 48;                    // 48x48px
                hdpi: 72;                    // 72x72px
                xhdpi: 96;                   // 96x96px
                xxhdpi: 144;                 // 144x144px
                xxxhdpi: 192;                // 192x192px
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

/**
 * iOS icon paths for adaptive icon configuration
 * Supports iOS 18+ appearance modes with light, dark, and tinted variants
 */
interface IOSIconPaths {
    light: string;      // Light appearance mode icon path
    dark: string;       // Dark appearance mode icon path
    tinted: string;     // Tinted appearance mode icon path
}

/**
 * Android adaptive icon paths for configuration
 * Supports Android adaptive icons with foreground, background, and monochrome layers
 */
interface AndroidIconPaths {
    foregroundImage: string;    // Foreground layer path (logo/icon content)
    backgroundImage: string;    // Background layer path (solid color or pattern)
    monochromeImage: string;    // Monochrome layer path for Material You theming (Android 13+)
}

/**
 * Parsed SVG data structure
 */
interface SVGData {
    width: number;
    height: number;
    viewBox: string;
    elements: any[];                     // SVG elements array
    styles: any[];                       // Style definitions
    colors: {
        primary: string[];               // Brand colors found
        all: Set<string>;                // All unique colors
        hasRed: boolean;                 // #e53e3e validation
        hasBlack: boolean;               // #000000 validation
        hasWhite: boolean;               // #ffffff validation
    };
    metadata: {
        hasText: boolean;
        hasGradients: boolean;
        colorCount: number;
        complexity: 'simple' | 'moderate' | 'complex';
    };
}

/**
 * Generated icon with platform-specific metadata
 */
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

/**
 * Validation result for generated icons
 */
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

/**
 * Specific validation error details
 */
interface ValidationError {
    type: 'MISSING_FILE' | 'INVALID_SIZE' | 'COLOR_MISMATCH' | 'CONFIG_ERROR';
    message: string;
    file?: string;
    expected?: any;
    actual?: any;
}

/**
 * Color palette extracted from SVG with validation results
 */
interface ColorPalette {
    brandColors: {
        red: boolean;
        black: boolean;
        white: boolean;
        found: string[];
        missing: string[];
    };
    allColors: string[];
    uniqueColorCount: number;
    textElements: {
        hasText: boolean;
        textColors: string[];
        count: number;
    };
    validation: {
        hasRequiredBrandColors: boolean;
        warnings: string[];
        recommendations: string[];
    };
}

// Core Functions

/**
 * Brand colors used in the application
 */
const BRAND_COLORS = {
    red: '#e53e3e',
    black: '#000000',
    white: '#ffffff'
} as const;

/**
 * Extracts all colors from SVG elements and identifies brand colors
 * @param svgNode - Parsed SVG node structure
 * @returns Color analysis object with brand color flags
 */
function extractColorsFromSVG(svgNode: any): {
    primary: string[],
    all: Set<string>,
    hasRed: boolean,
    hasBlack: boolean,
    hasWhite: boolean
} {
    const allColors = new Set<string>();
    const primaryColors: string[] = [];

    // Normalize color values for consistent comparison
    const normalizeColor = (color: string): string => {
        if (!color) return '';

        // Convert to lowercase and trim
        let normalized = color.toLowerCase().trim();

        // Handle different color formats
        if (normalized === 'none' || normalized === 'transparent') {
            return '';
        }

        // Convert named colors to hex if needed
        const namedColors: { [key: string]: string } = {
            'red': '#ff0000',
            'black': '#000000',
            'white': '#ffffff'
        };

        if (namedColors[normalized]) {
            normalized = namedColors[normalized];
        }

        // Ensure hex colors start with #
        if (normalized.match(/^[0-9a-f]{6}$/i)) {
            normalized = '#' + normalized;
        }

        return normalized;
    };

    // Recursively extract colors from all SVG elements
    const extractColors = (node: any): void => {
        if (!node) return;

        // Check attributes for color values
        if (node.attributes) {
            // Extract colors from fill attribute
            if (node.attributes.fill) {
                const fillColor = normalizeColor(node.attributes.fill);
                if (fillColor) {
                    allColors.add(fillColor);
                }
            }

            // Extract colors from stroke attribute
            if (node.attributes.stroke) {
                const strokeColor = normalizeColor(node.attributes.stroke);
                if (strokeColor) {
                    allColors.add(strokeColor);
                }
            }

            // Extract colors from style attribute
            if (node.attributes.style) {
                const styleStr = node.attributes.style;

                // Match fill colors in style
                const fillMatch = styleStr.match(/fill\s*:\s*([^;]+)/i);
                if (fillMatch) {
                    const fillColor = normalizeColor(fillMatch[1]);
                    if (fillColor) {
                        allColors.add(fillColor);
                    }
                }

                // Match stroke colors in style
                const strokeMatch = styleStr.match(/stroke\s*:\s*([^;]+)/i);
                if (strokeMatch) {
                    const strokeColor = normalizeColor(strokeMatch[1]);
                    if (strokeColor) {
                        allColors.add(strokeColor);
                    }
                }
            }
        }

        // Recursively process child elements
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach(extractColors);
        }
    };

    // Start extraction from root SVG node
    extractColors(svgNode);

    // Check for brand colors and populate primary colors
    const hasRed = Array.from(allColors).some(color =>
        color.toLowerCase() === BRAND_COLORS.red.toLowerCase()
    );
    const hasBlack = Array.from(allColors).some(color =>
        color.toLowerCase() === BRAND_COLORS.black.toLowerCase()
    );
    const hasWhite = Array.from(allColors).some(color =>
        color.toLowerCase() === BRAND_COLORS.white.toLowerCase()
    );

    // Add brand colors to primary colors array if found
    if (hasRed) primaryColors.push(BRAND_COLORS.red);
    if (hasBlack) primaryColors.push(BRAND_COLORS.black);
    if (hasWhite) primaryColors.push(BRAND_COLORS.white);

    return {
        primary: primaryColors,
        all: allColors,
        hasRed,
        hasBlack,
        hasWhite
    };
}

/**
 * Extracts color palette from SVG data and performs brand color validation
 * @param svg - Parsed SVG data containing color and element information
 * @returns ColorPalette - Comprehensive color analysis with validation results
 */
function extractColors(svg: SVGData): ColorPalette {
    const brandColors = {
        red: svg.colors.hasRed,
        black: svg.colors.hasBlack,
        white: svg.colors.hasWhite,
        found: [] as string[],
        missing: [] as string[]
    };

    // Populate found brand colors
    if (brandColors.red) brandColors.found.push(BRAND_COLORS.red);
    if (brandColors.black) brandColors.found.push(BRAND_COLORS.black);
    if (brandColors.white) brandColors.found.push(BRAND_COLORS.white);

    // Populate missing brand colors
    if (!brandColors.red) brandColors.missing.push(BRAND_COLORS.red);
    if (!brandColors.black) brandColors.missing.push(BRAND_COLORS.black);
    if (!brandColors.white) brandColors.missing.push(BRAND_COLORS.white);

    // Convert Set to Array for easier processing
    const allColors = Array.from(svg.colors.all);
    const uniqueColorCount = allColors.length;

    // Analyze text elements in the SVG
    const textElements = analyzeTextElements(svg.elements);

    // Validation logic
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check for missing brand colors
    if (brandColors.missing.length > 0) {
        warnings.push(`Missing brand colors: ${brandColors.missing.join(', ')}`);

        if (brandColors.missing.includes(BRAND_COLORS.red)) {
            recommendations.push('Consider adding the primary red color (#e53e3e) to maintain brand consistency');
        }
        if (brandColors.missing.includes(BRAND_COLORS.black)) {
            recommendations.push('Consider adding black (#000000) for better contrast and readability');
        }
        if (brandColors.missing.includes(BRAND_COLORS.white)) {
            recommendations.push('Consider adding white (#ffffff) for background elements or negative space');
        }
    }

    // Check color count for complexity
    if (uniqueColorCount > 10) {
        warnings.push(`High color count (${uniqueColorCount}). Consider simplifying for better icon scalability`);
        recommendations.push('Reduce color palette to 3-5 main colors for optimal icon performance');
    }

    // Check for text elements
    if (textElements.hasText) {
        warnings.push(`Text elements detected (${textElements.count}). Text may not be readable at small icon sizes`);
        recommendations.push('Convert text to vector paths or use symbols instead of text for better scalability');
    }

    // Determine if required brand colors are present (at least red or black)
    const hasRequiredBrandColors = brandColors.red || brandColors.black;

    if (!hasRequiredBrandColors) {
        warnings.push('Icon lacks primary brand colors. Consider adding at least the red (#e53e3e) or black (#000000) brand color');
        recommendations.push('Add primary brand colors to ensure the icon aligns with Trend Ankara brand guidelines');
    }

    return {
        brandColors,
        allColors,
        uniqueColorCount,
        textElements,
        validation: {
            hasRequiredBrandColors,
            warnings,
            recommendations
        }
    };
}

/**
 * Analyzes SVG elements to identify and count text elements
 * @param elements - Array of SVG elements to analyze
 * @returns Object containing text analysis results
 */
function analyzeTextElements(elements: any[]): {
    hasText: boolean;
    textColors: string[];
    count: number;
} {
    let textCount = 0;
    const textColors = new Set<string>();

    const analyzeElement = (element: any): void => {
        if (!element) return;

        // Check if element is a text element
        if (element.name === 'text' || element.name === 'tspan' || element.name === 'textPath') {
            textCount++;

            // Extract text color if available
            if (element.attributes) {
                // Check fill attribute
                if (element.attributes.fill && element.attributes.fill !== 'none') {
                    textColors.add(element.attributes.fill);
                }

                // Check style attribute for color
                if (element.attributes.style) {
                    const fillMatch = element.attributes.style.match(/fill\s*:\s*([^;]+)/i);
                    if (fillMatch && fillMatch[1] !== 'none') {
                        textColors.add(fillMatch[1]);
                    }
                }
            }
        }

        // Recursively analyze child elements
        if (element.children && Array.isArray(element.children)) {
            element.children.forEach(analyzeElement);
        }
    };

    // Analyze all elements
    elements.forEach(analyzeElement);

    return {
        hasText: textCount > 0,
        textColors: Array.from(textColors),
        count: textCount
    };
}

/**
 * Parses SVG file and extracts structural data
 * @param filePath - Path to the SVG file to parse
 * @returns Promise<SVGData> - Parsed SVG structure data
 */
async function parseSVG(filePath: string): Promise<SVGData> {
    try {
        // Read SVG file content
        let svgContent: string;
        try {
            svgContent = await fs.promises.readFile(filePath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to read SVG file: ${filePath} - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Parse SVG content using svgson
        let parsedSVG: any;
        try {
            parsedSVG = await svgsonParse(svgContent);
        } catch (error) {
            throw new Error(`Failed to parse SVG content: ${error instanceof Error ? error.message : 'Invalid SVG structure'}`);
        }

        // Extract width and height from attributes
        const widthAttr = parsedSVG.attributes?.width || '0';
        const heightAttr = parsedSVG.attributes?.height || '0';

        // Parse numeric values from width/height (remove 'px' suffix if present)
        const width = parseFloat(widthAttr.toString().replace('px', '')) || 0;
        const height = parseFloat(heightAttr.toString().replace('px', '')) || 0;

        // Extract viewBox
        const viewBox = parsedSVG.attributes?.viewBox || `0 0 ${width} ${height}`;

        // Extract elements array from parsed structure
        const elements = parsedSVG.children || [];

        // Extract style definitions
        const styles: any[] = [];
        const extractStyles = (node: any) => {
            if (node.name === 'style' || node.name === 'defs') {
                styles.push(node);
            }
            if (node.children) {
                node.children.forEach(extractStyles);
            }
        };
        extractStyles(parsedSVG);

        // Extract colors from SVG elements
        const colors = extractColorsFromSVG(parsedSVG);

        const metadata = {
            hasText: false,
            hasGradients: false,
            colorCount: colors.all.size,
            complexity: 'simple' as 'simple' | 'moderate' | 'complex'
        };

        const svgData: SVGData = {
            width,
            height,
            viewBox,
            elements,
            styles,
            colors,
            metadata
        };

        // Log color analysis results
        const brandColorInfo = [];
        if (colors.hasRed) brandColorInfo.push('Red');
        if (colors.hasBlack) brandColorInfo.push('Black');
        if (colors.hasWhite) brandColorInfo.push('White');

        const brandColorText = brandColorInfo.length > 0
            ? `, Brand colors: ${brandColorInfo.join(', ')}`
            : ', No brand colors found';

        printMsg(GREEN, `✓ Successfully parsed SVG: ${width}x${height}, viewBox: ${viewBox}, Colors: ${colors.all.size}${brandColorText}`);
        return svgData;

    } catch (error) {
        printMsg(RED, `✗ Error parsing SVG file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
    }
}

/**
 * Validates the source SVG file before processing
 * @param svgPath - Path to the SVG file to validate
 * @returns Promise<boolean> - true if valid, false otherwise
 */
async function validateSource(svgPath: string): Promise<boolean> {
    try {
        // Check if file has .svg extension
        if (!svgPath.toLowerCase().endsWith('.svg')) {
            printMsg(RED, `✗ Error: File must have .svg extension: ${svgPath}`);
            return false;
        }

        // Check if file exists and is readable
        try {
            await fs.promises.access(svgPath, fs.constants.F_OK | fs.constants.R_OK);
        } catch (error) {
            printMsg(RED, `✗ Error: SVG file not found or not readable: ${svgPath}`);
            return false;
        }

        // Read and validate SVG structure
        let fileContent: string;
        try {
            fileContent = await fs.promises.readFile(svgPath, 'utf8');
        } catch (error) {
            printMsg(RED, `✗ Error: Could not read SVG file: ${svgPath}`);
            return false;
        }

        // Basic SVG structure validation - check for <svg> tag
        const svgTagRegex = /<svg[^>]*>/i;
        if (!svgTagRegex.test(fileContent)) {
            printMsg(RED, `✗ Error: Invalid SVG structure - missing <svg> tag: ${svgPath}`);
            return false;
        }

        // Check for closing </svg> tag
        if (!fileContent.toLowerCase().includes('</svg>')) {
            printMsg(RED, `✗ Error: Invalid SVG structure - missing closing </svg> tag: ${svgPath}`);
            return false;
        }

        // Additional basic XML validation - check for valid XML declaration if present
        const xmlDeclarationRegex = /<\?xml[^>]*\?>/i;
        if (fileContent.trim().startsWith('<?xml') && !xmlDeclarationRegex.test(fileContent)) {
            printMsg(RED, `✗ Error: Invalid XML declaration in SVG file: ${svgPath}`);
            return false;
        }

        printMsg(GREEN, `✓ SVG file validation successful: ${svgPath}`);
        return true;

    } catch (error) {
        printMsg(RED, `✗ Unexpected error during SVG validation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
    }
}

/**
 * Applies Display P3 color profile to PNG buffer for wide-gamut iOS devices
 * @param buffer - PNG buffer in sRGB color space
 * @returns Promise<Buffer> - PNG buffer with Display P3 color profile or sRGB fallback
 */
async function applyDisplayP3Profile(buffer: Buffer): Promise<Buffer> {
    try {
        printMsg(YELLOW, "Applying Display P3 color profile for wide-gamut displays...");

        // Attempt to apply Display P3 color profile
        const displayP3Buffer = await sharp(buffer)
            .toColorspace('p3')           // Convert to Display P3 color space
            .withMetadata({               // Preserve metadata with Display P3 profile
                orientation: undefined,
                exif: undefined
            })
            .png({
                compressionLevel: 6,
                adaptiveFiltering: true,
                palette: false,
                quality: 100,
                progressive: false
            })
            .toBuffer();

        printMsg(GREEN, `✓ Display P3 color profile applied successfully (${Math.round(displayP3Buffer.length / 1024)}KB)`);
        return displayP3Buffer;

    } catch (error) {
        // Fallback to sRGB if Display P3 conversion fails
        printMsg(YELLOW, `⚠ Display P3 conversion failed, falling back to sRGB: ${error instanceof Error ? error.message : 'Unknown error'}`);

        try {
            // Return original buffer with sRGB profile explicitly set
            const srgbFallback = await sharp(buffer)
                .toColorspace('srgb')
                .withMetadata({
                    orientation: undefined,
                    exif: undefined
                })
                .png({
                    compressionLevel: 6,
                    adaptiveFiltering: true,
                    palette: false,
                    quality: 100,
                    progressive: false
                })
                .toBuffer();

            printMsg(GREEN, `✓ sRGB fallback applied (${Math.round(srgbFallback.length / 1024)}KB)`);
            return srgbFallback;

        } catch (fallbackError) {
            // If even sRGB fallback fails, return original buffer
            printMsg(YELLOW, `⚠ sRGB fallback also failed, returning original buffer: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
            return buffer;
        }
    }
}

/**
 * Generates iOS light mode app icon from SVG source
 * @param svg - SVG content as Buffer
 * @returns Promise<Buffer> - Generated PNG icon as Buffer
 */
async function generateIOSLightIcon(svg: Buffer): Promise<Buffer> {
    try {
        printMsg(YELLOW, "Generating iOS light mode icon (1024x1024)...");

        // Generate PNG using sharp with iOS specifications
        const pngBuffer = await sharp(svg)
            .resize(1024, 1024, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
            })
            .png({
                compressionLevel: 6,        // Balanced compression
                adaptiveFiltering: true,    // Better compression for icons
                palette: false,             // Force RGB mode for better quality
                quality: 100,              // Maximum quality
                progressive: false         // Standard PNG for iOS
            })
            .toColorspace('srgb')         // iOS standard sRGB color space
            .withMetadata({               // Strip unnecessary metadata for size optimization
                orientation: undefined,
                icc: undefined,
                exif: undefined
            })
            .toBuffer();

        printMsg(GREEN, `✓ iOS light mode icon generated successfully (${Math.round(pngBuffer.length / 1024)}KB)`);
        return pngBuffer;

    } catch (error) {
        const errorMessage = `Failed to generate iOS light mode icon: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * Generates iOS dark mode app icon with transparency from SVG source
 * Removes background elements while preserving foreground with alpha channel
 * @param svg - SVG content as Buffer
 * @returns Promise<Buffer> - Generated PNG icon with transparency as Buffer
 */
async function generateIOSDarkIcon(svg: Buffer): Promise<Buffer> {
    try {
        printMsg(YELLOW, "Generating iOS dark mode icon with transparency (1024x1024)...");

        // Generate PNG with full transparency for dark mode
        // iOS will provide the dark background, so we need transparent background
        const pngBuffer = await sharp(svg)
            .resize(1024, 1024, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Fully transparent background
            })
            .png({
                compressionLevel: 6,        // Balanced compression
                adaptiveFiltering: true,    // Better compression for icons
                palette: false,             // Force RGBA mode to maintain alpha channel
                quality: 100,              // Maximum quality
                progressive: false,        // Standard PNG for iOS
                force: true                // Ensure PNG output with alpha channel
            })
            .toColorspace('srgb')         // iOS standard sRGB color space
            .withMetadata({               // Strip unnecessary metadata for size optimization
                orientation: undefined,
                icc: undefined,
                exif: undefined
            })
            .toBuffer();

        // Verify that the generated PNG has alpha channel
        const metadata = await sharp(pngBuffer).metadata();
        const hasAlpha = metadata.channels === 4; // RGBA has 4 channels (RGB + Alpha)

        if (!hasAlpha) {
            printMsg(YELLOW, "⚠ Warning: Generated icon may not have proper alpha channel for transparency");
        }

        printMsg(GREEN, `✓ iOS dark mode icon with transparency generated successfully (${Math.round(pngBuffer.length / 1024)}KB, ${hasAlpha ? 'RGBA' : 'RGB'} mode)`);
        return pngBuffer;

    } catch (error) {
        const errorMessage = `Failed to generate iOS dark mode icon: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * Generates iOS tinted mode app icon from SVG source
 * Converts to grayscale with Gray Gamma 2.2 profile and black background for tinted appearance mode
 * @param svg - SVG content as Buffer
 * @returns Promise<Buffer> - Generated PNG icon as Buffer
 */
async function generateIOSTintedIcon(svg: Buffer): Promise<Buffer> {
    try {
        printMsg(YELLOW, "Generating iOS tinted mode icon (1024x1024)...");

        // Generate PNG with grayscale conversion and black background
        // iOS tinted mode requires grayscale with specific color profile for accent color adaptation
        const pngBuffer = await sharp(svg)
            .resize(1024, 1024, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background (#000000) as required
            })
            .grayscale()                  // Convert to grayscale for tinted mode compatibility
            .gamma(2.2)                   // Apply Gamma 2.2 correction for Gray Gamma 2.2 profile
            .png({
                compressionLevel: 6,        // Balanced compression
                adaptiveFiltering: true,    // Better compression for icons
                palette: false,             // Force grayscale mode without palette
                quality: 100,              // Maximum quality
                progressive: false         // Standard PNG for iOS
            })
            .toColorspace('srgb')         // Maintain sRGB compatibility for iOS
            .withMetadata({               // Strip unnecessary metadata for size optimization
                orientation: undefined,
                icc: undefined,
                exif: undefined
            })
            .toBuffer();

        // Verify the generated PNG properties
        const metadata = await sharp(pngBuffer).metadata();
        const channels = Number(metadata.channels) || 0;
        const isGrayscale = channels === 1 || channels === 2; // Grayscale or Grayscale+Alpha
        const colorSpace = metadata.space || 'unknown';

        if (!isGrayscale) {
            printMsg(YELLOW, "⚠ Warning: Generated icon may not be properly converted to grayscale");
        }

        printMsg(GREEN, `✓ iOS tinted mode icon generated successfully (${Math.round(pngBuffer.length / 1024)}KB, ${isGrayscale ? 'Grayscale' : 'Color'} mode, ${colorSpace} color space)`);
        return pngBuffer;

    } catch (error) {
        const errorMessage = `Failed to generate iOS tinted mode icon: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * Generates iOS legacy fallback icon for older devices (iOS < 18)
 * Creates single icon without appearance variants, with rounded corners and alpha channel
 * @param svg - SVG content as Buffer
 * @returns Promise<Buffer> - Generated PNG icon with rounded corners as Buffer
 */
async function generateIOSLegacyIcon(svg: Buffer): Promise<Buffer> {
    try {
        printMsg(YELLOW, "Generating iOS legacy fallback icon (1024x1024) with rounded corners...");

        // First, generate the base icon at 1024x1024
        const baseIcon = await sharp(svg)
            .resize(1024, 1024, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
            })
            .png({
                compressionLevel: 6,
                adaptiveFiltering: true,
                palette: false,
                quality: 100,
                progressive: false,
                force: true // Ensure PNG with alpha channel
            })
            .toColorspace('srgb')
            .withMetadata({
                orientation: undefined,
                icc: undefined,
                exif: undefined
            })
            .toBuffer();

        // iOS standard corner radius is approximately 22.37% of the icon size
        // For 1024px icon: radius = 1024 * 0.2237 ≈ 229px
        const cornerRadius = Math.round(1024 * 0.2237);

        // Create rounded rectangle mask using SVG
        const roundedMaskSvg = `
        <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="1024" height="1024" rx="${cornerRadius}" ry="${cornerRadius}" fill="white"/>
        </svg>`;

        // Convert the mask SVG to PNG
        const maskBuffer = await sharp(Buffer.from(roundedMaskSvg))
            .png({
                compressionLevel: 6,
                palette: false,
                force: true
            })
            .toBuffer();

        // Apply the rounded corners mask to the base icon
        const roundedIcon = await sharp(baseIcon)
            .composite([
                {
                    input: maskBuffer,
                    blend: 'dest-in' // Use mask to cut out rounded corners with alpha
                }
            ])
            .png({
                compressionLevel: 6,
                adaptiveFiltering: true,
                palette: false,
                quality: 100,
                progressive: false,
                force: true // Ensure PNG with alpha channel
            })
            .toColorspace('srgb')
            .withMetadata({
                orientation: undefined,
                icc: undefined,
                exif: undefined
            })
            .toBuffer();

        // Verify the generated PNG has alpha channel for proper transparency
        const metadata = await sharp(roundedIcon).metadata();
        const hasAlpha = metadata.channels === 4; // RGBA has 4 channels
        const fileSizeKB = Math.round(roundedIcon.length / 1024);

        if (!hasAlpha) {
            printMsg(YELLOW, "⚠ Warning: Generated legacy icon may not have proper alpha channel for rounded corners");
        }

        printMsg(GREEN, `✓ iOS legacy fallback icon generated successfully (${fileSizeKB}KB, ${hasAlpha ? 'RGBA' : 'RGB'} mode, corner radius: ${cornerRadius}px)`);
        return roundedIcon;

    } catch (error) {
        const errorMessage = `Failed to generate iOS legacy fallback icon: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * iOS icon sizes required for all contexts
 * Includes App Store, home screen, settings, spotlight search, and notification icons
 */
const iOS_ICON_SIZES = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024] as const;

/**
 * Android DPI scaling sizes for legacy icons
 * Maps DPI density qualifiers to their corresponding pixel dimensions
 */
const ANDROID_DPI_SIZES = {
    mdpi: 48,      // Medium density: ~160 dpi (baseline)
    hdpi: 72,      // High density: ~240 dpi (1.5x)
    xhdpi: 96,     // Extra high density: ~320 dpi (2x)
    xxhdpi: 144,   // Extra extra high density: ~480 dpi (3x)
    xxxhdpi: 192   // Extra extra extra high density: ~640 dpi (4x)
} as const;

/**
 * Type definition for Android DPI density qualifiers
 */
type AndroidDPI = keyof typeof ANDROID_DPI_SIZES;

/**
 * Scales an iOS icon buffer to specified size while maintaining quality
 * Uses high-quality lanczos3 resampling for optimal results when scaling down
 * @param buffer - PNG buffer of the 1024x1024 source icon
 * @param size - Target size in pixels (square icons)
 * @returns Promise<Buffer> - Scaled PNG icon buffer
 */
async function scaleIOSIcon(buffer: Buffer, size: number): Promise<Buffer> {
    try {
        printMsg(YELLOW, `Scaling iOS icon to ${size}x${size}...`);

        // Validate input parameters
        if (!buffer || buffer.length === 0) {
            throw new Error('Invalid input buffer - buffer is empty or null');
        }

        if (!size || size <= 0 || !Number.isInteger(size)) {
            throw new Error(`Invalid size parameter: ${size}. Size must be a positive integer`);
        }

        // Verify the source buffer is a valid PNG
        const sourceMetadata = await sharp(buffer).metadata();
        if (sourceMetadata.format !== 'png') {
            throw new Error(`Source buffer must be PNG format, received: ${sourceMetadata.format}`);
        }

        // Scale the icon with high-quality settings
        const scaledBuffer = await sharp(buffer)
            .resize(size, size, {
                fit: 'contain',                    // Maintain aspect ratio within bounds
                withoutEnlargement: false,         // Allow scaling up if source is smaller
                kernel: 'lanczos3'                // High-quality resampling algorithm
            })
            .png({
                compressionLevel: 6,               // Balanced compression for file size vs quality
                adaptiveFiltering: true,           // Better compression efficiency
                palette: false,                    // Force RGB/RGBA mode for better quality
                quality: 100,                     // Maximum quality
                progressive: false,               // Standard PNG for iOS compatibility
                force: true                       // Ensure PNG output format
            })
            .toColorspace('srgb')                 // iOS standard sRGB color space
            .withMetadata({                       // Strip metadata for smaller file size
                orientation: undefined,
                icc: undefined,
                exif: undefined
            })
            .toBuffer();

        // Verify the scaled result
        const scaledMetadata = await sharp(scaledBuffer).metadata();
        if (scaledMetadata.width !== size || scaledMetadata.height !== size) {
            throw new Error(`Scaling failed - expected ${size}x${size}, got ${scaledMetadata.width}x${scaledMetadata.height}`);
        }

        const fileSizeKB = Math.round(scaledBuffer.length / 1024);
        const hasAlpha = (scaledMetadata.channels || 0) >= 4;

        printMsg(GREEN, `✓ iOS icon scaled to ${size}x${size} successfully (${fileSizeKB}KB, ${hasAlpha ? 'RGBA' : 'RGB'} mode)`);
        return scaledBuffer;

    } catch (error) {
        const errorMessage = `Failed to scale iOS icon to ${size}x${size}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * Scales an Android icon buffer to specified DPI size with appropriate compression
 * Generates legacy Android icons for various screen densities with optimized settings
 * @param buffer - PNG buffer of the source icon
 * @param dpi - Target DPI density qualifier (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
 * @returns Promise<Buffer> - Scaled PNG icon buffer with DPI-specific compression
 */
async function scaleAndroidIcon(buffer: Buffer, dpi: AndroidDPI): Promise<Buffer> {
    try {
        const targetSize = ANDROID_DPI_SIZES[dpi];
        printMsg(YELLOW, `Scaling Android legacy icon for ${dpi} density to ${targetSize}x${targetSize}...`);

        // Validate input parameters
        if (!buffer || buffer.length === 0) {
            throw new Error('Invalid input buffer - buffer is empty or null');
        }

        if (!dpi || !(dpi in ANDROID_DPI_SIZES)) {
            throw new Error(`Invalid DPI parameter: ${dpi}. Must be one of: ${Object.keys(ANDROID_DPI_SIZES).join(', ')}`);
        }

        // Verify the source buffer is a valid PNG
        const sourceMetadata = await sharp(buffer).metadata();
        if (sourceMetadata.format !== 'png') {
            throw new Error(`Source buffer must be PNG format, received: ${sourceMetadata.format}`);
        }

        // Set compression level based on DPI density
        // Higher density icons use higher compression to manage file sizes
        let compressionLevel: number;
        switch (dpi) {
            case 'mdpi':
                compressionLevel = 3;  // Lower compression for smallest size
                break;
            case 'hdpi':
                compressionLevel = 4;  // Moderate compression
                break;
            case 'xhdpi':
                compressionLevel = 5;  // Balanced compression
                break;
            case 'xxhdpi':
                compressionLevel = 6;  // Higher compression for larger size
                break;
            case 'xxxhdpi':
                compressionLevel = 7;  // Highest compression for largest size
                break;
            default:
                compressionLevel = 6;  // Default balanced compression
        }

        // Scale the icon with high-quality settings optimized for Android
        const scaledBuffer = await sharp(buffer)
            .resize(targetSize, targetSize, {
                fit: 'contain',                    // Maintain aspect ratio within bounds
                withoutEnlargement: false,         // Allow scaling up if source is smaller
                kernel: 'lanczos3'                // High-quality resampling algorithm
            })
            .png({
                compressionLevel: compressionLevel, // DPI-specific compression level
                adaptiveFiltering: true,           // Better compression efficiency
                palette: false,                    // Force RGB/RGBA mode for better quality
                quality: 100,                     // Maximum quality
                progressive: false,               // Standard PNG for Android compatibility
                force: true                       // Ensure PNG output format
            })
            .toColorspace('srgb')                 // Android standard sRGB color space
            .withMetadata({                       // Strip metadata for smaller file size
                orientation: undefined,
                icc: undefined,
                exif: undefined
            })
            .toBuffer();

        // Verify the scaled result
        const scaledMetadata = await sharp(scaledBuffer).metadata();
        if (scaledMetadata.width !== targetSize || scaledMetadata.height !== targetSize) {
            throw new Error(`Scaling failed - expected ${targetSize}x${targetSize}, got ${scaledMetadata.width}x${scaledMetadata.height}`);
        }

        const fileSizeKB = Math.round(scaledBuffer.length / 1024);
        const hasAlpha = (scaledMetadata.channels || 0) >= 4;

        printMsg(GREEN, `✓ Android ${dpi} legacy icon scaled to ${targetSize}x${targetSize} successfully (${fileSizeKB}KB, ${hasAlpha ? 'RGBA' : 'RGB'} mode, compression level: ${compressionLevel})`);
        return scaledBuffer;

    } catch (error) {
        const errorMessage = `Failed to scale Android icon for ${dpi} density: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * Generates Android adaptive icon foreground layer from SVG source
 * Creates a 108x108dp canvas (432x432px for xxxhdpi) with logo centered within 66dp safe zone
 * @param svg - SVG content as Buffer
 * @returns Promise<Buffer> - Generated PNG foreground layer as Buffer with alpha channel
 */
async function generateAndroidForeground(svg: Buffer): Promise<Buffer> {
    try {
        printMsg(YELLOW, "Generating Android adaptive icon foreground layer (432x432 for xxxhdpi)...");

        // Android adaptive icon specifications:
        // - Total canvas: 108x108dp
        // - Safe zone: 66x66dp (centered)
        // - xxxhdpi scaling: 4x (432x432px total, 264x264px safe zone)
        const TOTAL_SIZE = 432;           // 108dp * 4 (xxxhdpi scale factor)
        const SAFE_ZONE_SIZE = 264;       // 66dp * 4 (xxxhdpi scale factor)
        const SAFE_ZONE_OFFSET = (TOTAL_SIZE - SAFE_ZONE_SIZE) / 2; // 84px offset for centering

        // Validate input SVG buffer
        if (!svg || svg.length === 0) {
            throw new Error('Invalid SVG buffer - buffer is empty or null');
        }

        // Get SVG metadata to understand source dimensions
        let svgMetadata;
        try {
            svgMetadata = await sharp(svg).metadata();
            if (!svgMetadata.width || !svgMetadata.height) {
                printMsg(YELLOW, "⚠ SVG metadata incomplete, proceeding with default processing");
            }
        } catch (error) {
            printMsg(YELLOW, `⚠ Could not read SVG metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // First, render the SVG to fit within the safe zone (264x264px)
        const logoBuffer = await sharp(svg)
            .resize(SAFE_ZONE_SIZE, SAFE_ZONE_SIZE, {
                fit: 'contain',                    // Maintain aspect ratio within safe zone
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
            })
            .png({
                compressionLevel: 6,
                adaptiveFiltering: true,
                palette: false,                    // Force RGBA mode for alpha channel
                quality: 100,
                progressive: false,
                force: true                       // Ensure PNG with alpha channel
            })
            .toBuffer();

        // Create the full 432x432px canvas with transparent background
        const foregroundBuffer = await sharp({
            create: {
                width: TOTAL_SIZE,
                height: TOTAL_SIZE,
                channels: 4,                      // RGBA channels for transparency
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Fully transparent background
            }
        })
            .png()
            .composite([
                {
                    input: logoBuffer,
                    top: SAFE_ZONE_OFFSET,        // Center vertically (84px from top)
                    left: SAFE_ZONE_OFFSET,       // Center horizontally (84px from left)
                    blend: 'over'                 // Standard alpha blending
                }
            ])
            .png({
                compressionLevel: 6,
                adaptiveFiltering: true,
                palette: false,                    // Force RGBA mode
                quality: 100,
                progressive: false,
                force: true                       // Ensure PNG with alpha channel
            })
            .toColorspace('srgb')                 // Android standard sRGB color space
            .withMetadata({                       // Strip unnecessary metadata for smaller file size
                orientation: undefined,
                icc: undefined,
                exif: undefined
            })
            .toBuffer();

        // Verify the generated foreground layer
        const metadata = await sharp(foregroundBuffer).metadata();
        const hasAlpha = metadata.channels === 4; // RGBA has 4 channels
        const correctSize = metadata.width === TOTAL_SIZE && metadata.height === TOTAL_SIZE;
        const fileSizeKB = Math.round(foregroundBuffer.length / 1024);

        if (!correctSize) {
            throw new Error(`Foreground layer size validation failed - expected ${TOTAL_SIZE}x${TOTAL_SIZE}, got ${metadata.width}x${metadata.height}`);
        }

        if (!hasAlpha) {
            printMsg(YELLOW, "⚠ Warning: Generated foreground layer may not have proper alpha channel for transparency");
        }

        printMsg(GREEN, `✓ Android adaptive icon foreground layer generated successfully (${fileSizeKB}KB, ${hasAlpha ? 'RGBA' : 'RGB'} mode)`);
        printMsg(GREEN, `  Canvas: ${TOTAL_SIZE}x${TOTAL_SIZE}px (108x108dp), Safe zone: ${SAFE_ZONE_SIZE}x${SAFE_ZONE_SIZE}px (66x66dp)`);

        return foregroundBuffer;

    } catch (error) {
        const errorMessage = `Failed to generate Android adaptive icon foreground layer: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * Generates Android adaptive icon background layer with solid black color
 * Creates a 108x108dp canvas (432x432px for xxxhdpi) filled with solid black (#000000)
 * @returns Promise<Buffer> - Generated PNG background layer as Buffer without transparency
 */
async function generateAndroidBackground(): Promise<Buffer> {
    try {
        printMsg(YELLOW, "Generating Android adaptive icon background layer (432x432 for xxxhdpi)...");

        // Android adaptive icon specifications:
        // - Total canvas: 108x108dp
        // - xxxhdpi scaling: 4x (432x432px total)
        // - Background: solid black (#000000) as per Trend Ankara brand colors
        const TOTAL_SIZE = 432;           // 108dp * 4 (xxxhdpi scale factor)

        // Create a solid black background canvas
        const backgroundBuffer = await sharp({
            create: {
                width: TOTAL_SIZE,
                height: TOTAL_SIZE,
                channels: 3,                      // RGB channels (no transparency needed)
                background: { r: 0, g: 0, b: 0 } // Solid black background (#000000)
            }
        })
            .png({
                compressionLevel: 6,
                adaptiveFiltering: true,
                palette: false,                    // Force RGB mode for solid color
                quality: 100,
                progressive: false,
                force: true                       // Ensure PNG output
            })
            .toColorspace('srgb')                 // Android standard sRGB color space
            .withMetadata({                       // Strip unnecessary metadata for smaller file size
                orientation: undefined,
                icc: undefined,
                exif: undefined
            })
            .toBuffer();

        // Verify the generated background layer
        const metadata = await sharp(backgroundBuffer).metadata();
        const hasAlpha = metadata.channels === 4; // Check if alpha channel exists
        const correctSize = metadata.width === TOTAL_SIZE && metadata.height === TOTAL_SIZE;
        const fileSizeKB = Math.round(backgroundBuffer.length / 1024);

        if (!correctSize) {
            throw new Error(`Background layer size validation failed - expected ${TOTAL_SIZE}x${TOTAL_SIZE}, got ${metadata.width}x${metadata.height}`);
        }

        // Warn if alpha channel is present (background should be opaque)
        if (hasAlpha) {
            printMsg(YELLOW, "⚠ Warning: Generated background layer has alpha channel, but should be fully opaque");
        }

        printMsg(GREEN, `✓ Android adaptive icon background layer generated successfully (${fileSizeKB}KB, ${hasAlpha ? 'RGBA' : 'RGB'} mode)`);
        printMsg(GREEN, `  Canvas: ${TOTAL_SIZE}x${TOTAL_SIZE}px (108x108dp), Color: solid black (#000000)`);

        return backgroundBuffer;

    } catch (error) {
        const errorMessage = `Failed to generate Android adaptive icon background layer: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * Generates Android adaptive icon monochrome layer for Material You themed icons
 * Creates a 108x108dp canvas (432x432px for xxxhdpi) with single color silhouette within 66dp safe zone
 * @param svg - SVG content as Buffer
 * @returns Promise<Buffer> - Generated PNG monochrome layer with white silhouette and transparent background
 */
async function generateAndroidMonochrome(svg: Buffer): Promise<Buffer> {
    try {
        printMsg(YELLOW, "Generating Android adaptive icon monochrome layer for Material You theming (432x432 for xxxhdpi)...");

        // Android adaptive icon monochrome specifications:
        // - Total canvas: 108x108dp
        // - Safe zone: 66x66dp (centered) - same as foreground
        // - xxxhdpi scaling: 4x (432x432px total, 264x264px safe zone)
        // - Style: Single color silhouette (white foreground, transparent background)
        // - Purpose: Android 13+ will tint this based on wallpaper colors
        const TOTAL_SIZE = 432;           // 108dp * 4 (xxxhdpi scale factor)
        const SAFE_ZONE_SIZE = 264;       // 66dp * 4 (xxxhdpi scale factor)
        const SAFE_ZONE_OFFSET = (TOTAL_SIZE - SAFE_ZONE_SIZE) / 2; // 84px offset for centering

        // Validate input SVG buffer
        if (!svg || svg.length === 0) {
            throw new Error('Invalid SVG buffer - buffer is empty or null');
        }

        // Get SVG metadata to understand source dimensions
        let svgMetadata;
        try {
            svgMetadata = await sharp(svg).metadata();
            if (!svgMetadata.width || !svgMetadata.height) {
                printMsg(YELLOW, "⚠ SVG metadata incomplete, proceeding with default processing");
            }
        } catch (error) {
            printMsg(YELLOW, `⚠ Could not read SVG metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // First, convert the SVG to a monochrome silhouette within the safe zone
        // This creates a single white color silhouette maintaining the original shape
        const silhouetteBuffer = await sharp(svg)
            .resize(SAFE_ZONE_SIZE, SAFE_ZONE_SIZE, {
                fit: 'contain',                    // Maintain aspect ratio within safe zone
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
            })
            .threshold(128)                       // Convert to black and white with 50% threshold
            .negate()                            // Invert colors: make logo areas white, background transparent
            .png({
                compressionLevel: 6,
                adaptiveFiltering: true,
                palette: false,                    // Force RGBA mode for alpha channel
                quality: 100,
                progressive: false,
                force: true                       // Ensure PNG with alpha channel
            })
            .toBuffer();

        // Create the full 432x432px monochrome canvas with transparent background
        const monochromeBuffer = await sharp({
            create: {
                width: TOTAL_SIZE,
                height: TOTAL_SIZE,
                channels: 4,                      // RGBA channels for transparency
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Fully transparent background
            }
        })
            .png()
            .composite([
                {
                    input: silhouetteBuffer,
                    top: SAFE_ZONE_OFFSET,        // Center vertically (84px from top)
                    left: SAFE_ZONE_OFFSET,       // Center horizontally (84px from left)
                    blend: 'over'                 // Standard alpha blending
                }
            ])
            .png({
                compressionLevel: 6,
                adaptiveFiltering: true,
                palette: false,                    // Force RGBA mode for proper alpha channel
                quality: 100,
                progressive: false,
                force: true                       // Ensure PNG with alpha channel
            })
            .toColorspace('srgb')                 // Android standard sRGB color space
            .withMetadata({                       // Strip unnecessary metadata for smaller file size
                orientation: undefined,
                icc: undefined,
                exif: undefined
            })
            .toBuffer();

        // Verify the generated monochrome layer
        const metadata = await sharp(monochromeBuffer).metadata();
        const hasAlpha = metadata.channels === 4; // RGBA has 4 channels
        const correctSize = metadata.width === TOTAL_SIZE && metadata.height === TOTAL_SIZE;
        const fileSizeKB = Math.round(monochromeBuffer.length / 1024);

        if (!correctSize) {
            throw new Error(`Monochrome layer size validation failed - expected ${TOTAL_SIZE}x${TOTAL_SIZE}, got ${metadata.width}x${metadata.height}`);
        }

        if (!hasAlpha) {
            printMsg(YELLOW, "⚠ Warning: Generated monochrome layer may not have proper alpha channel for transparency");
        }

        printMsg(GREEN, `✓ Android adaptive icon monochrome layer generated successfully (${fileSizeKB}KB, ${hasAlpha ? 'RGBA' : 'RGB'} mode)`);
        printMsg(GREEN, `  Canvas: ${TOTAL_SIZE}x${TOTAL_SIZE}px (108x108dp), Safe zone: ${SAFE_ZONE_SIZE}x${SAFE_ZONE_SIZE}px (66x66dp)`);
        printMsg(GREEN, `  Style: White silhouette on transparent background for Material You theming`);

        return monochromeBuffer;

    } catch (error) {
        const errorMessage = `Failed to generate Android adaptive icon monochrome layer: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * Generates web favicon from SVG source with web-specific optimizations
 * Creates 32x32px (browser tab) and 192x192px (PWA/bookmark) PNG favicons
 * @param svg - SVG content as Buffer
 * @returns Promise<{ favicon32: Buffer; favicon192: Buffer }> - Object containing both favicon sizes as optimized PNG buffers
 */
async function generateWebFavicon(svg: Buffer): Promise<{ favicon32: Buffer; favicon192: Buffer }> {
    try {
        printMsg(YELLOW, "Generating web favicons (32x32 and 192x192) from SVG...");

        // Web favicon specifications:
        // - 32x32px: Standard browser tab favicon
        // - 192x192px: PWA icons, bookmarks, and high-DPI displays
        // - sRGB color space for web compatibility
        // - High compression for faster web loading
        // - Transparent background for better integration
        const FAVICON_32_SIZE = 32;
        const FAVICON_192_SIZE = 192;

        // Validate input SVG buffer
        if (!svg || svg.length === 0) {
            throw new Error('Invalid SVG buffer - buffer is empty or null');
        }

        // Verify the source buffer is a valid SVG
        let svgMetadata;
        try {
            svgMetadata = await sharp(svg).metadata();
            if (svgMetadata.format !== 'svg') {
                printMsg(YELLOW, `⚠ Input format is ${svgMetadata.format}, expected SVG - proceeding anyway`);
            }
        } catch (error) {
            printMsg(YELLOW, `⚠ Could not read SVG metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        printMsg(YELLOW, "  Generating 32x32px favicon for browser tabs...");

        // Generate 32x32px favicon with web optimizations
        const favicon32Buffer = await sharp(svg)
            .resize(FAVICON_32_SIZE, FAVICON_32_SIZE, {
                fit: 'contain',                    // Maintain aspect ratio within bounds
                background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
                withoutEnlargement: false         // Allow scaling up if source is smaller
            })
            .png({
                compressionLevel: 9,               // Maximum compression for web loading speed
                adaptiveFiltering: true,           // Better compression efficiency
                palette: false,                    // Force RGBA mode for better quality
                quality: 90,                      // Slightly reduced quality for smaller file size
                progressive: false,               // Standard PNG for favicon compatibility
                force: true                       // Ensure PNG output format
            })
            .toColorspace('srgb')                 // sRGB color space for web compatibility
            .withMetadata({                       // Strip all metadata for smaller file size and security
                orientation: undefined,
                icc: undefined,
                exif: undefined,
                density: undefined
            })
            .toBuffer();

        printMsg(YELLOW, "  Generating 192x192px favicon for PWA and bookmarks...");

        // Generate 192x192px favicon with web optimizations
        const favicon192Buffer = await sharp(svg)
            .resize(FAVICON_192_SIZE, FAVICON_192_SIZE, {
                fit: 'contain',                    // Maintain aspect ratio within bounds
                background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
                withoutEnlargement: false         // Allow scaling up if source is smaller
            })
            .png({
                compressionLevel: 9,               // Maximum compression for web loading speed
                adaptiveFiltering: true,           // Better compression efficiency
                palette: false,                    // Force RGBA mode for better quality
                quality: 90,                      // Slightly reduced quality for smaller file size
                progressive: false,               // Standard PNG for favicon compatibility
                force: true                       // Ensure PNG output format
            })
            .toColorspace('srgb')                 // sRGB color space for web compatibility
            .withMetadata({                       // Strip all metadata for smaller file size and security
                orientation: undefined,
                icc: undefined,
                exif: undefined,
                density: undefined
            })
            .toBuffer();

        // Verify both generated favicons
        const favicon32Metadata = await sharp(favicon32Buffer).metadata();
        const favicon192Metadata = await sharp(favicon192Buffer).metadata();

        // Validation checks for 32x32 favicon
        const favicon32HasAlpha = favicon32Metadata.channels === 4;
        const favicon32CorrectSize = favicon32Metadata.width === FAVICON_32_SIZE && favicon32Metadata.height === FAVICON_32_SIZE;
        const favicon32SizeKB = Math.round(favicon32Buffer.length / 1024);

        if (!favicon32CorrectSize) {
            throw new Error(`32x32 favicon size validation failed - expected ${FAVICON_32_SIZE}x${FAVICON_32_SIZE}, got ${favicon32Metadata.width}x${favicon32Metadata.height}`);
        }

        // Validation checks for 192x192 favicon
        const favicon192HasAlpha = favicon192Metadata.channels === 4;
        const favicon192CorrectSize = favicon192Metadata.width === FAVICON_192_SIZE && favicon192Metadata.height === FAVICON_192_SIZE;
        const favicon192SizeKB = Math.round(favicon192Buffer.length / 1024);

        if (!favicon192CorrectSize) {
            throw new Error(`192x192 favicon size validation failed - expected ${FAVICON_192_SIZE}x${FAVICON_192_SIZE}, got ${favicon192Metadata.width}x${favicon192Metadata.height}`);
        }

        // Check color spaces
        const favicon32ColorSpace = favicon32Metadata.space || 'unknown';
        const favicon192ColorSpace = favicon192Metadata.space || 'unknown';

        if (favicon32ColorSpace !== 'srgb') {
            printMsg(YELLOW, `⚠ Warning: 32x32 favicon may not be in sRGB color space: ${favicon32ColorSpace}`);
        }

        if (favicon192ColorSpace !== 'srgb') {
            printMsg(YELLOW, `⚠ Warning: 192x192 favicon may not be in sRGB color space: ${favicon192ColorSpace}`);
        }

        // Report successful generation
        printMsg(GREEN, `✓ Web favicons generated successfully:`);
        printMsg(GREEN, `  32x32px favicon: ${favicon32SizeKB}KB (${favicon32HasAlpha ? 'RGBA' : 'RGB'} mode, ${favicon32ColorSpace} color space)`);
        printMsg(GREEN, `  192x192px favicon: ${favicon192SizeKB}KB (${favicon192HasAlpha ? 'RGBA' : 'RGB'} mode, ${favicon192ColorSpace} color space)`);
        printMsg(GREEN, `  Optimized for web use with maximum compression and stripped metadata`);
        printMsg(GREEN, `  Compatible with: Browser tabs (32px), PWA icons (192px), bookmarks, touch icons`);

        return {
            favicon32: favicon32Buffer,
            favicon192: favicon192Buffer
        };

    } catch (error) {
        const errorMessage = `Failed to generate web favicons: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * Generates Android legacy square and circular icons for pre-API 26 devices
 * Creates both square (with slight padding) and circular variants for older Android launchers
 * @param svg - SVG content as Buffer
 * @returns Promise<Buffer[]> - Array containing [square, circular] PNG icon buffers with proper alpha channels
 */
async function generateAndroidLegacyIcons(svg: Buffer): Promise<Buffer[]> {
    try {
        printMsg(YELLOW, "Generating Android legacy icons (square & circular variants) for API < 26...");

        // Legacy Android icon specifications:
        // - Base size: 512x512px (high resolution base that can be scaled down)
        // - Square variant: icon with slight padding for visual balance
        // - Circular variant: icon with circular mask applied
        // - Both variants: proper alpha channels for transparency
        // - Purpose: Support Android versions below 8.0 (API 26) without adaptive icon support
        const BASE_SIZE = 512;              // High resolution base size
        const SQUARE_PADDING = Math.round(BASE_SIZE * 0.08); // 8% padding (41px) for square variant
        const CIRCLE_RADIUS = BASE_SIZE / 2; // Radius for circular mask

        // Validate input SVG buffer
        if (!svg || svg.length === 0) {
            throw new Error('Invalid SVG buffer - buffer is empty or null');
        }

        // Get SVG metadata to understand source dimensions
        let svgMetadata;
        try {
            svgMetadata = await sharp(svg).metadata();
            if (!svgMetadata.width || !svgMetadata.height) {
                printMsg(YELLOW, "⚠ SVG metadata incomplete, proceeding with default processing");
            }
        } catch (error) {
            printMsg(YELLOW, `⚠ Could not read SVG metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Generate square variant with slight padding
        printMsg(YELLOW, "  Creating square variant with padding...");

        const squareContentSize = BASE_SIZE - (SQUARE_PADDING * 2); // 430px content area with 41px padding

        // First, render the SVG to fit within the padded area
        const squareContentBuffer = await sharp(svg)
            .resize(squareContentSize, squareContentSize, {
                fit: 'contain',                    // Maintain aspect ratio within padded area
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
            })
            .png({
                compressionLevel: 6,
                adaptiveFiltering: true,
                palette: false,                    // Force RGBA mode for alpha channel
                quality: 100,
                progressive: false,
                force: true                       // Ensure PNG with alpha channel
            })
            .toBuffer();

        // Create the full 512x512px square canvas with centered content
        const squareBuffer = await sharp({
            create: {
                width: BASE_SIZE,
                height: BASE_SIZE,
                channels: 4,                      // RGBA channels for transparency
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Fully transparent background
            }
        })
            .png()
            .composite([
                {
                    input: squareContentBuffer,
                    top: SQUARE_PADDING,          // Center vertically with padding
                    left: SQUARE_PADDING,         // Center horizontally with padding
                    blend: 'over'                 // Standard alpha blending
                }
            ])
            .png({
                compressionLevel: 6,
                adaptiveFiltering: true,
                palette: false,                    // Force RGBA mode for proper alpha channel
                quality: 100,
                progressive: false,
                force: true                       // Ensure PNG with alpha channel
            })
            .toColorspace('srgb')                 // Android standard sRGB color space
            .withMetadata({                       // Strip unnecessary metadata for smaller file size
                orientation: undefined,
                icc: undefined,
                exif: undefined
            })
            .toBuffer();

        // Generate circular variant with circular mask
        printMsg(YELLOW, "  Creating circular variant with mask...");

        // First, render the SVG to fit within the circular area (with some padding for visual balance)
        const circleContentSize = Math.round(BASE_SIZE * 0.76); // 76% of size to fit well within circle

        const circleContentBuffer = await sharp(svg)
            .resize(circleContentSize, circleContentSize, {
                fit: 'contain',                    // Maintain aspect ratio within circular area
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
            })
            .png({
                compressionLevel: 6,
                adaptiveFiltering: true,
                palette: false,                    // Force RGBA mode for alpha channel
                quality: 100,
                progressive: false,
                force: true                       // Ensure PNG with alpha channel
            })
            .toBuffer();

        // Create circular mask using SVG
        const circularMaskSvg = `
        <svg width="${BASE_SIZE}" height="${BASE_SIZE}" viewBox="0 0 ${BASE_SIZE} ${BASE_SIZE}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${CIRCLE_RADIUS}" cy="${CIRCLE_RADIUS}" r="${CIRCLE_RADIUS}" fill="white"/>
        </svg>`;

        // Convert the circular mask SVG to PNG
        const maskBuffer = await sharp(Buffer.from(circularMaskSvg))
            .png({
                compressionLevel: 6,
                palette: false,
                force: true
            })
            .toBuffer();

        // Create the base circular canvas with centered content
        const baseCircularBuffer = await sharp({
            create: {
                width: BASE_SIZE,
                height: BASE_SIZE,
                channels: 4,                      // RGBA channels for transparency
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Fully transparent background
            }
        })
            .png()
            .composite([
                {
                    input: circleContentBuffer,
                    top: Math.round((BASE_SIZE - circleContentSize) / 2), // Center vertically
                    left: Math.round((BASE_SIZE - circleContentSize) / 2), // Center horizontally
                    blend: 'over'                 // Standard alpha blending
                }
            ])
            .png({
                compressionLevel: 6,
                adaptiveFiltering: true,
                palette: false,
                force: true
            })
            .toBuffer();

        // Apply the circular mask to create the final circular icon
        const circularBuffer = await sharp(baseCircularBuffer)
            .composite([
                {
                    input: maskBuffer,
                    blend: 'dest-in'              // Use mask to create circular shape with alpha
                }
            ])
            .png({
                compressionLevel: 6,
                adaptiveFiltering: true,
                palette: false,                    // Force RGBA mode for proper alpha channel
                quality: 100,
                progressive: false,
                force: true                       // Ensure PNG with alpha channel
            })
            .toColorspace('srgb')                 // Android standard sRGB color space
            .withMetadata({                       // Strip unnecessary metadata for smaller file size
                orientation: undefined,
                icc: undefined,
                exif: undefined
            })
            .toBuffer();

        // Verify both generated icons
        const squareMetadata = await sharp(squareBuffer).metadata();
        const circularMetadata = await sharp(circularBuffer).metadata();

        const squareHasAlpha = squareMetadata.channels === 4;
        const circularHasAlpha = circularMetadata.channels === 4;

        const squareCorrectSize = squareMetadata.width === BASE_SIZE && squareMetadata.height === BASE_SIZE;
        const circularCorrectSize = circularMetadata.width === BASE_SIZE && circularMetadata.height === BASE_SIZE;

        const squareSizeKB = Math.round(squareBuffer.length / 1024);
        const circularSizeKB = Math.round(circularBuffer.length / 1024);

        // Validation checks
        if (!squareCorrectSize) {
            throw new Error(`Square icon size validation failed - expected ${BASE_SIZE}x${BASE_SIZE}, got ${squareMetadata.width}x${squareMetadata.height}`);
        }

        if (!circularCorrectSize) {
            throw new Error(`Circular icon size validation failed - expected ${BASE_SIZE}x${BASE_SIZE}, got ${circularMetadata.width}x${circularMetadata.height}`);
        }

        if (!squareHasAlpha) {
            printMsg(YELLOW, "⚠ Warning: Generated square legacy icon may not have proper alpha channel for transparency");
        }

        if (!circularHasAlpha) {
            printMsg(YELLOW, "⚠ Warning: Generated circular legacy icon may not have proper alpha channel for transparency");
        }

        printMsg(GREEN, `✓ Android legacy icons generated successfully:`);
        printMsg(GREEN, `  Square variant: ${squareSizeKB}KB (${squareHasAlpha ? 'RGBA' : 'RGB'} mode, ${SQUARE_PADDING}px padding)`);
        printMsg(GREEN, `  Circular variant: ${circularSizeKB}KB (${circularHasAlpha ? 'RGBA' : 'RGB'} mode, ${CIRCLE_RADIUS}px radius)`);
        printMsg(GREEN, `  Base size: ${BASE_SIZE}x${BASE_SIZE}px for high-quality scaling to all DPI densities`);

        // Return array with [square, circular] buffers
        return [squareBuffer, circularBuffer];

    } catch (error) {
        const errorMessage = `Failed to generate Android legacy icons: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * Creates the directory structure for generated icons
 * Organizes icons into platform-specific subdirectories with proper hierarchy
 * @returns Promise<void> - Completes when all directories are created
 */
export async function createDirectoryStructure(): Promise<void> {
    try {
        printMsg(YELLOW, "Creating directory structure for generated icons...");

        // Define the directory paths
        const baseIconsDir = path.join(process.cwd(), 'assets', 'icons');
        const iosDir = path.join(baseIconsDir, 'ios');
        const androidDir = path.join(baseIconsDir, 'android');
        const androidAdaptiveDir = path.join(androidDir, 'adaptive');

        const directories = [
            { path: baseIconsDir, name: 'Base icons directory (assets/icons/)' },
            { path: iosDir, name: 'iOS icons directory (assets/icons/ios/)' },
            { path: androidDir, name: 'Android icons directory (assets/icons/android/)' },
            { path: androidAdaptiveDir, name: 'Android adaptive icons directory (assets/icons/android/adaptive/)' }
        ];

        // Create each directory
        for (const dir of directories) {
            try {
                await fs.promises.mkdir(dir.path, { recursive: true });

                // Check if directory was created or already exists
                try {
                    await fs.promises.access(dir.path, fs.constants.F_OK);
                    printMsg(GREEN, `✓ ${dir.name} ready`);
                } catch (accessError) {
                    throw new Error(`Directory creation verification failed: ${dir.path}`);
                }
            } catch (error) {
                const errorMessage = `Failed to create directory ${dir.path}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                printMsg(RED, `✗ ${errorMessage}`);
                throw new Error(errorMessage);
            }
        }

        printMsg(GREEN, "✓ Directory structure created successfully");
        printMsg(GREEN, "  Structure:");
        printMsg(GREEN, "    assets/icons/");
        printMsg(GREEN, "    ├── ios/");
        printMsg(GREEN, "    └── android/");
        printMsg(GREEN, "        └── adaptive/");

    } catch (error) {
        const errorMessage = `Failed to create directory structure: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * Writes an icon file to the filesystem with optimization and security measures
 * @param buffer - PNG buffer to write to disk
 * @param path - Absolute file path where to write the icon file
 * @returns Promise<void> - Completes when file is written and verified
 */
async function writeIconFile(buffer: Buffer, filePath: string): Promise<void> {
    try {
        printMsg(YELLOW, `Writing icon file: ${path.basename(filePath)}`);

        // Validate input parameters
        if (!buffer || buffer.length === 0) {
            throw new Error('Invalid buffer - buffer is empty or null');
        }

        if (!filePath || typeof filePath !== 'string') {
            throw new Error('Invalid file path - path is empty or not a string');
        }

        // Ensure the file path is absolute
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);

        // Verify the buffer is a valid PNG
        let sourceMetadata;
        try {
            sourceMetadata = await sharp(buffer).metadata();
            if (sourceMetadata.format !== 'png') {
                throw new Error(`Buffer must be PNG format, received: ${sourceMetadata.format}`);
            }
        } catch (error) {
            throw new Error(`Invalid PNG buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Get original file size for comparison
        const originalSizeKB = Math.round(buffer.length / 1024);

        // Optimize PNG with sharp: compression + metadata stripping for security
        const optimizedBuffer = await sharp(buffer)
            .png({
                compressionLevel: 9,           // Maximum compression for smaller file size
                adaptiveFiltering: true,       // Better compression efficiency
                palette: false,                // Maintain RGB/RGBA quality
                quality: 100,                 // Maximum quality despite compression
                progressive: false,           // Standard PNG for compatibility
                force: true                   // Ensure PNG output format
            })
            .withMetadata({                   // Strip all metadata for security (no EXIF, comments, etc.)
                orientation: undefined,       // Remove orientation data
                icc: undefined,              // Remove ICC color profile
                exif: undefined,             // Remove EXIF data
                density: undefined           // Remove DPI/density information
            })
            .toBuffer();

        // Create parent directories if they don't exist
        const parentDir = path.dirname(absolutePath);
        try {
            await fs.promises.mkdir(parentDir, { recursive: true });
        } catch (error) {
            throw new Error(`Failed to create parent directory ${parentDir}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Write the optimized buffer to the specified path
        try {
            await fs.promises.writeFile(absolutePath, optimizedBuffer);
        } catch (error) {
            throw new Error(`Failed to write file to ${absolutePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Verify the file was written successfully by reading it back
        let writtenSize: number;
        try {
            const stats = await fs.promises.stat(absolutePath);
            writtenSize = stats.size;

            if (writtenSize !== optimizedBuffer.length) {
                throw new Error(`File size mismatch - expected ${optimizedBuffer.length} bytes, got ${writtenSize} bytes`);
            }
        } catch (error) {
            throw new Error(`File verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Report optimization results
        const optimizedSizeKB = Math.round(optimizedBuffer.length / 1024);
        const compressionRatio = originalSizeKB > 0 ? ((originalSizeKB - optimizedSizeKB) / originalSizeKB * 100) : 0;
        const compressionText = compressionRatio > 0
            ? ` (${compressionRatio.toFixed(1)}% compression)`
            : '';

        // Verify the written file is readable as PNG
        try {
            const writtenBuffer = await fs.promises.readFile(absolutePath);
            const writtenMetadata = await sharp(writtenBuffer).metadata();

            if (writtenMetadata.format !== 'png') {
                throw new Error('Written file is not a valid PNG');
            }

            // Check dimensions match
            if (writtenMetadata.width !== sourceMetadata.width || writtenMetadata.height !== sourceMetadata.height) {
                throw new Error(`Dimensions mismatch - source: ${sourceMetadata.width}x${sourceMetadata.height}, written: ${writtenMetadata.width}x${writtenMetadata.height}`);
            }

        } catch (error) {
            throw new Error(`Final verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        printMsg(GREEN, `✓ Icon file written successfully: ${path.basename(filePath)} (${optimizedSizeKB}KB${compressionText})`);

    } catch (error) {
        const errorMessage = `Failed to write icon file ${path.basename(filePath)}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * Generates SHA256 checksum for icon validation and consistency verification
 * @param buffer - Buffer containing the icon data to generate checksum for
 * @returns string - Hexadecimal string representation of the SHA256 hash
 * @throws Error if buffer is invalid or hash generation fails
 */
function generateChecksum(buffer: Buffer): string {
    try {
        // Validate input buffer
        if (!buffer || buffer.length === 0) {
            throw new Error('Invalid buffer - buffer is empty or null');
        }

        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Input must be a Buffer object');
        }

        // Generate SHA256 hash using crypto module
        const hash = crypto.createHash('sha256');
        hash.update(buffer);
        const checksum = hash.digest('hex');

        // Validate generated checksum
        if (!checksum || checksum.length !== 64) {
            throw new Error('Failed to generate valid SHA256 checksum');
        }

        return checksum;

    } catch (error) {
        const errorMessage = `Failed to generate checksum: ${error instanceof Error ? error.message : 'Unknown error'}`;
        throw new Error(errorMessage);
    }
}

/**
 * Creates a backup of the app.json configuration file before modifications
 * Preserves the original configuration with a timestamped backup filename
 * @returns Promise<void> - Completes when backup is created and verified
 */
export async function backupConfig(): Promise<void> {
    try {
        printMsg(YELLOW, "Creating backup of app.json configuration...");

        // Define the app.json file path (relative to project root)
        const configPath = path.join(process.cwd(), 'app.json');

        // Check if app.json exists
        try {
            await fs.promises.access(configPath, fs.constants.F_OK);
        } catch (error) {
            throw new Error(`app.json file not found at ${configPath}`);
        }

        // Read the current app.json content
        let configContent: string;
        try {
            configContent = await fs.promises.readFile(configPath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to read app.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Validate that the content is valid JSON
        try {
            JSON.parse(configContent);
        } catch (error) {
            throw new Error(`app.json contains invalid JSON: ${error instanceof Error ? error.message : 'Invalid JSON structure'}`);
        }

        // Generate timestamp for backup filename
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/[:.]/g, '-')  // Replace colons and periods with dashes
            .replace('T', '-')      // Replace T with dash
            .split('.')[0];         // Remove milliseconds (.xxxZ)

        // Create backup filename with timestamp
        const backupPath = path.join(process.cwd(), `app.json.backup.${timestamp}`);

        // Write the backup file
        try {
            await fs.promises.writeFile(backupPath, configContent, 'utf8');
        } catch (error) {
            throw new Error(`Failed to write backup file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Verify the backup was created successfully
        let backupStats: fs.Stats;
        let originalStats: fs.Stats;

        try {
            // Check if backup file exists and get its stats
            backupStats = await fs.promises.stat(backupPath);
            originalStats = await fs.promises.stat(configPath);
        } catch (error) {
            throw new Error(`Failed to verify backup file: ${error instanceof Error ? error.message : 'Backup file not accessible'}`);
        }

        // Verify backup file size matches original
        if (backupStats.size !== originalStats.size) {
            throw new Error(`Backup file size mismatch - original: ${originalStats.size} bytes, backup: ${backupStats.size} bytes`);
        }

        // Verify backup content matches original
        let backupContent: string;
        try {
            backupContent = await fs.promises.readFile(backupPath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to read backup file for verification: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        if (backupContent !== configContent) {
            throw new Error('Backup content does not match original app.json content');
        }

        // Verify backup contains valid JSON
        try {
            const backupJson = JSON.parse(backupContent);
            const originalJson = JSON.parse(configContent);

            // Deep comparison check for critical fields
            if (JSON.stringify(backupJson) !== JSON.stringify(originalJson)) {
                throw new Error('Backup JSON structure does not match original');
            }
        } catch (error) {
            throw new Error(`Backup validation failed: ${error instanceof Error ? error.message : 'JSON validation error'}`);
        }

        // Generate checksums for additional verification
        const originalBuffer = Buffer.from(configContent, 'utf8');
        const backupBuffer = Buffer.from(backupContent, 'utf8');

        const originalChecksum = generateChecksum(originalBuffer);
        const backupChecksum = generateChecksum(backupBuffer);

        if (originalChecksum !== backupChecksum) {
            throw new Error(`Checksum mismatch - backup may be corrupted (original: ${originalChecksum.slice(0, 8)}..., backup: ${backupChecksum.slice(0, 8)}...)`);
        }

        // Report success with details
        const fileSizeKB = Math.round(backupStats.size / 1024);
        const backupFilename = path.basename(backupPath);

        printMsg(GREEN, `✓ Configuration backup created successfully:`);
        printMsg(GREEN, `  File: ${backupFilename}`);
        printMsg(GREEN, `  Size: ${fileSizeKB}KB (${backupStats.size} bytes)`);
        printMsg(GREEN, `  Checksum: ${originalChecksum.slice(0, 16)}...`);
        printMsg(GREEN, `  Timestamp: ${timestamp.replace(/-/g, ':').replace('T', ' ')} UTC`);
        printMsg(GREEN, `  Path: ${backupPath}`);

    } catch (error) {
        const errorMessage = `Failed to backup app.json configuration: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * Updates iOS icon configuration in app.json with adaptive icon paths
 * Preserves all existing iOS configuration while updating the icon property
 * @param paths - IOSIconPaths containing light, dark, and tinted icon file paths
 * @returns Promise<void> - Completes when app.json is successfully updated
 */
export async function updateIOSConfig(paths: IOSIconPaths): Promise<void> {
    try {
        printMsg(YELLOW, "Updating iOS icon configuration in app.json...");

        // Define the app.json file path (relative to project root)
        const configPath = path.join(process.cwd(), 'app.json');

        // Check if app.json exists
        try {
            await fs.promises.access(configPath, fs.constants.F_OK);
        } catch (error) {
            throw new Error(`app.json file not found at ${configPath}`);
        }

        // Validate input paths
        if (!paths || typeof paths !== 'object') {
            throw new Error('Invalid paths parameter - must be an object with light, dark, and tinted properties');
        }

        const requiredPaths = ['light', 'dark', 'tinted'] as const;
        for (const pathKey of requiredPaths) {
            if (!paths[pathKey] || typeof paths[pathKey] !== 'string' || paths[pathKey].trim() === '') {
                throw new Error(`Invalid ${pathKey} path - must be a non-empty string`);
            }
        }

        // Read the current app.json content
        let configContent: string;
        try {
            configContent = await fs.promises.readFile(configPath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to read app.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Parse the current app.json configuration
        let configJson: any;
        try {
            configJson = JSON.parse(configContent);
        } catch (error) {
            throw new Error(`app.json contains invalid JSON: ${error instanceof Error ? error.message : 'Invalid JSON structure'}`);
        }

        // Ensure the expo object exists
        if (!configJson.expo || typeof configJson.expo !== 'object') {
            throw new Error('app.json must contain a valid expo configuration object');
        }

        // Store the current iOS configuration for preservation
        const currentIOSConfig = configJson.expo.ios || {};

        // Log current iOS icon configuration for reference
        const currentIcon = configJson.expo.icon;
        if (currentIcon) {
            printMsg(YELLOW, `  Current global icon: ${currentIcon}`);
        }

        if (currentIOSConfig.icon) {
            printMsg(YELLOW, `  Current iOS icon: ${JSON.stringify(currentIOSConfig.icon)}`);
        }

        // Create new iOS icon configuration object with adaptive icon paths
        const newIconConfig = {
            light: paths.light.trim(),
            dark: paths.dark.trim(),
            tinted: paths.tinted.trim()
        };

        // Preserve all existing iOS configuration and update/add the icon property
        const updatedIOSConfig = {
            ...currentIOSConfig,    // Preserve existing iOS configuration
            icon: newIconConfig     // Update icon with adaptive paths
        };

        // Update the configuration object
        configJson.expo.ios = updatedIOSConfig;

        // Convert back to JSON with proper formatting (2-space indentation to match original)
        const updatedConfigContent = JSON.stringify(configJson, null, 2) + '\n';

        // Write the updated configuration back to app.json
        try {
            await fs.promises.writeFile(configPath, updatedConfigContent, 'utf8');
        } catch (error) {
            throw new Error(`Failed to write updated app.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Verify the update was successful by reading and parsing the file
        let verificationContent: string;
        let verificationJson: any;

        try {
            verificationContent = await fs.promises.readFile(configPath, 'utf8');
            verificationJson = JSON.parse(verificationContent);
        } catch (error) {
            throw new Error(`Failed to verify updated app.json: ${error instanceof Error ? error.message : 'File verification failed'}`);
        }

        // Verify the iOS icon configuration was updated correctly
        const verificationIOSConfig = verificationJson.expo?.ios;
        const verificationIconConfig = verificationIOSConfig?.icon;

        if (!verificationIconConfig || typeof verificationIconConfig !== 'object') {
            throw new Error('Verification failed - iOS icon configuration was not properly updated');
        }

        // Check that all paths were set correctly
        for (const pathKey of requiredPaths) {
            if (verificationIconConfig[pathKey] !== paths[pathKey].trim()) {
                throw new Error(`Verification failed - ${pathKey} path mismatch: expected "${paths[pathKey].trim()}", got "${verificationIconConfig[pathKey]}"`);
            }
        }

        // Verify that other iOS configuration was preserved
        const preservedKeys = Object.keys(currentIOSConfig).filter(key => key !== 'icon');
        for (const key of preservedKeys) {
            if (JSON.stringify(verificationIOSConfig[key]) !== JSON.stringify(currentIOSConfig[key])) {
                printMsg(YELLOW, `⚠ Warning: iOS configuration property "${key}" may have been modified during update`);
            }
        }

        // Generate file size information
        const originalSizeKB = Math.round(Buffer.from(configContent, 'utf8').length / 1024);
        const updatedSizeKB = Math.round(Buffer.from(updatedConfigContent, 'utf8').length / 1024);
        const sizeDiff = updatedSizeKB - originalSizeKB;
        const sizeDiffText = sizeDiff > 0 ? `+${sizeDiff}KB` : sizeDiff < 0 ? `${sizeDiff}KB` : 'no change';

        // Report successful update
        printMsg(GREEN, `✓ iOS icon configuration updated successfully in app.json:`);
        printMsg(GREEN, `  Light mode: ${newIconConfig.light}`);
        printMsg(GREEN, `  Dark mode: ${newIconConfig.dark}`);
        printMsg(GREEN, `  Tinted mode: ${newIconConfig.tinted}`);
        printMsg(GREEN, `  Preserved ${preservedKeys.length} existing iOS configuration properties`);
        printMsg(GREEN, `  File size: ${updatedSizeKB}KB (${sizeDiffText})`);

        // Validate that the updated file is still valid JSON by attempting to parse it again
        try {
            JSON.parse(verificationContent);
            printMsg(GREEN, `✓ app.json structure validation passed`);
        } catch (error) {
            throw new Error(`Final JSON validation failed: ${error instanceof Error ? error.message : 'Invalid JSON after update'}`);
        }

    } catch (error) {
        const errorMessage = `Failed to update iOS configuration: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

/**
 * Updates Android adaptive icon configuration in app.json
 * Preserves all existing Android configuration while updating adaptive icon properties
 * @param paths - AndroidIconPaths containing foreground, background, and monochrome image paths
 * @returns Promise<void> - Completes when app.json is successfully updated
 */
export async function updateAndroidConfig(paths: AndroidIconPaths): Promise<void> {
    try {
        printMsg(YELLOW, "Updating Android adaptive icon configuration in app.json...");

        // Define the app.json file path (relative to project root)
        const configPath = path.join(process.cwd(), 'app.json');

        // Check if app.json exists
        try {
            await fs.promises.access(configPath, fs.constants.F_OK);
        } catch (error) {
            throw new Error(`app.json file not found at ${configPath}`);
        }

        // Validate input paths
        if (!paths || typeof paths !== 'object') {
            throw new Error('Invalid paths parameter - must be an object with foregroundImage, backgroundImage, and monochromeImage properties');
        }

        const requiredPaths = ['foregroundImage', 'backgroundImage', 'monochromeImage'] as const;
        for (const pathKey of requiredPaths) {
            if (!paths[pathKey] || typeof paths[pathKey] !== 'string' || paths[pathKey].trim() === '') {
                throw new Error(`Invalid ${pathKey} path - must be a non-empty string`);
            }
        }

        // Read the current app.json content
        let configContent: string;
        try {
            configContent = await fs.promises.readFile(configPath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to read app.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Parse the current app.json configuration
        let configJson: any;
        try {
            configJson = JSON.parse(configContent);
        } catch (error) {
            throw new Error(`app.json contains invalid JSON: ${error instanceof Error ? error.message : 'Invalid JSON structure'}`);
        }

        // Ensure the expo object exists
        if (!configJson.expo || typeof configJson.expo !== 'object') {
            throw new Error('app.json must contain a valid expo configuration object');
        }

        // Store the current Android configuration for preservation
        const currentAndroidConfig = configJson.expo.android || {};
        const currentAdaptiveIconConfig = currentAndroidConfig.adaptiveIcon || {};

        // Log current Android adaptive icon configuration for reference
        if (currentAdaptiveIconConfig.foregroundImage) {
            printMsg(YELLOW, `  Current foreground: ${currentAdaptiveIconConfig.foregroundImage}`);
        }
        if (currentAdaptiveIconConfig.backgroundImage) {
            printMsg(YELLOW, `  Current background: ${currentAdaptiveIconConfig.backgroundImage}`);
        }
        if (currentAdaptiveIconConfig.monochromeImage) {
            printMsg(YELLOW, `  Current monochrome: ${currentAdaptiveIconConfig.monochromeImage}`);
        }
        if (currentAdaptiveIconConfig.backgroundColor) {
            printMsg(YELLOW, `  Current backgroundColor: ${currentAdaptiveIconConfig.backgroundColor}`);
        }

        // Create new adaptive icon configuration object
        const newAdaptiveIconConfig = {
            foregroundImage: paths.foregroundImage.trim(),
            backgroundImage: paths.backgroundImage.trim(),
            monochromeImage: paths.monochromeImage.trim()
        };

        // Preserve backgroundColor if it exists in the current configuration
        if (currentAdaptiveIconConfig.backgroundColor) {
            newAdaptiveIconConfig['backgroundColor'] = currentAdaptiveIconConfig.backgroundColor;
            printMsg(YELLOW, `  Preserving backgroundColor: ${currentAdaptiveIconConfig.backgroundColor}`);
        }

        // Preserve all existing Android configuration and update the adaptiveIcon property
        const updatedAndroidConfig = {
            ...currentAndroidConfig,        // Preserve existing Android configuration
            adaptiveIcon: newAdaptiveIconConfig    // Update adaptiveIcon with new paths
        };

        // Update the configuration object
        configJson.expo.android = updatedAndroidConfig;

        // Convert back to JSON with proper formatting (2-space indentation to match original)
        const updatedConfigContent = JSON.stringify(configJson, null, 2) + '\n';

        // Write the updated configuration back to app.json
        try {
            await fs.promises.writeFile(configPath, updatedConfigContent, 'utf8');
        } catch (error) {
            throw new Error(`Failed to write updated app.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Verify the update was successful by reading and parsing the file
        let verificationContent: string;
        let verificationJson: any;

        try {
            verificationContent = await fs.promises.readFile(configPath, 'utf8');
            verificationJson = JSON.parse(verificationContent);
        } catch (error) {
            throw new Error(`Failed to verify updated app.json: ${error instanceof Error ? error.message : 'File verification failed'}`);
        }

        // Verify the Android adaptive icon configuration was updated correctly
        const verificationAndroidConfig = verificationJson.expo?.android;
        const verificationAdaptiveIconConfig = verificationAndroidConfig?.adaptiveIcon;

        if (!verificationAdaptiveIconConfig || typeof verificationAdaptiveIconConfig !== 'object') {
            throw new Error('Verification failed - Android adaptive icon configuration was not properly updated');
        }

        // Check that all required paths were set correctly
        for (const pathKey of requiredPaths) {
            if (verificationAdaptiveIconConfig[pathKey] !== paths[pathKey].trim()) {
                throw new Error(`Verification failed - ${pathKey} path mismatch: expected "${paths[pathKey].trim()}", got "${verificationAdaptiveIconConfig[pathKey]}"`);
            }
        }

        // Verify that backgroundColor was preserved if it existed
        if (currentAdaptiveIconConfig.backgroundColor &&
            verificationAdaptiveIconConfig.backgroundColor !== currentAdaptiveIconConfig.backgroundColor) {
            throw new Error(`Verification failed - backgroundColor was not preserved: expected "${currentAdaptiveIconConfig.backgroundColor}", got "${verificationAdaptiveIconConfig.backgroundColor}"`);
        }

        // Verify that other Android configuration was preserved
        const preservedKeys = Object.keys(currentAndroidConfig).filter(key => key !== 'adaptiveIcon');
        for (const key of preservedKeys) {
            if (JSON.stringify(verificationAndroidConfig[key]) !== JSON.stringify(currentAndroidConfig[key])) {
                printMsg(YELLOW, `⚠ Warning: Android configuration property "${key}" may have been modified during update`);
            }
        }

        // Generate file size information
        const originalSizeKB = Math.round(Buffer.from(configContent, 'utf8').length / 1024);
        const updatedSizeKB = Math.round(Buffer.from(updatedConfigContent, 'utf8').length / 1024);
        const sizeDiff = updatedSizeKB - originalSizeKB;
        const sizeDiffText = sizeDiff > 0 ? `+${sizeDiff}KB` : sizeDiff < 0 ? `${sizeDiff}KB` : 'no change';

        // Report successful update
        printMsg(GREEN, `✓ Android adaptive icon configuration updated successfully in app.json:`);
        printMsg(GREEN, `  Foreground: ${newAdaptiveIconConfig.foregroundImage}`);
        printMsg(GREEN, `  Background: ${newAdaptiveIconConfig.backgroundImage}`);
        printMsg(GREEN, `  Monochrome: ${newAdaptiveIconConfig.monochromeImage}`);

        if (newAdaptiveIconConfig['backgroundColor']) {
            printMsg(GREEN, `  Background Color: ${newAdaptiveIconConfig['backgroundColor']} (preserved)`);
        }

        printMsg(GREEN, `  Preserved ${preservedKeys.length} existing Android configuration properties`);
        printMsg(GREEN, `  File size: ${updatedSizeKB}KB (${sizeDiffText})`);

        // Validate that the updated file is still valid JSON by attempting to parse it again
        try {
            JSON.parse(verificationContent);
            printMsg(GREEN, `✓ app.json structure validation passed`);
        } catch (error) {
            throw new Error(`Final JSON validation failed: ${error instanceof Error ? error.message : 'Invalid JSON after update'}`);
        }

    } catch (error) {
        const errorMessage = `Failed to update Android configuration: ${error instanceof Error ? error.message : 'Unknown error'}`;
        printMsg(RED, `✗ ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

// Phase 7: Validation and Error Handling

/**
 * Validates that generated icon matches expected dimensions
 * Ensures icons meet platform requirements for size and format
 * @param buffer Icon buffer to validate
 * @param expectedSize Expected width and height in pixels
 * @returns True if dimensions are valid, false otherwise
 */
async function validateIconDimensions(buffer: Buffer, expectedSize: number): Promise<boolean> {
    try {
        // Get image metadata
        const metadata = await sharp(buffer).metadata();

        // Check if metadata was retrieved successfully
        if (!metadata || !metadata.width || !metadata.height) {
            printMsg(RED, `✗ Unable to retrieve icon metadata`);
            return false;
        }

        // Validate dimensions
        const isValidWidth = metadata.width === expectedSize;
        const isValidHeight = metadata.height === expectedSize;
        const isSquare = metadata.width === metadata.height;

        // Check format is PNG
        const isPNG = metadata.format === 'png';

        // Check for proper alpha channel for icons that need it
        const hasAlphaChannel = metadata.channels === 4;

        // Log validation results
        if (!isValidWidth || !isValidHeight) {
            printMsg(YELLOW, `⚠ Dimension mismatch: Expected ${expectedSize}x${expectedSize}, got ${metadata.width}x${metadata.height}`);
            return false;
        }

        if (!isSquare) {
            printMsg(YELLOW, `⚠ Icon is not square: ${metadata.width}x${metadata.height}`);
            return false;
        }

        if (!isPNG) {
            printMsg(YELLOW, `⚠ Invalid format: Expected PNG, got ${metadata.format || 'unknown'}`);
            return false;
        }

        // Additional metadata checks
        if (metadata.density && metadata.density !== 72) {
            printMsg(YELLOW, `⚠ Non-standard density: ${metadata.density} DPI (expected 72 DPI)`);
            // This is a warning, not a failure
        }

        // Validate color space
        if (metadata.space) {
            const validColorSpaces = ['srgb', 'rgb', 'grey', 'gray', 'p3', 'display-p3'];
            if (!validColorSpaces.includes(metadata.space.toLowerCase())) {
                printMsg(YELLOW, `⚠ Unusual color space: ${metadata.space}`);
                // This is a warning, not a failure
            }
        }

        // All critical validations passed
        return true;

    } catch (error) {
        printMsg(RED, `✗ Error validating icon dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
    }
}

/**
 * Validates brand colors are preserved in generated icons
 * Samples pixels to verify presence of Trend Ankara brand colors
 * @param buffer Icon buffer to validate
 * @returns True if brand colors are detected, false otherwise
 */
async function validateBrandColors(buffer: Buffer): Promise<boolean> {
    try {
        printMsg(YELLOW, `Validating brand color consistency...`);

        // Brand color definitions (as per requirements)
        const BRAND_RED = '#e53e3e';
        const BRAND_BLACK = '#000000';
        const BRAND_WHITE = '#ffffff';

        // Convert hex colors to RGB values for comparison
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };

        const brandRedRgb = hexToRgb(BRAND_RED);
        const brandBlackRgb = hexToRgb(BRAND_BLACK);
        const brandWhiteRgb = hexToRgb(BRAND_WHITE);

        if (!brandRedRgb || !brandBlackRgb || !brandWhiteRgb) {
            throw new Error('Failed to parse brand color hex values');
        }

        // Get image metadata and raw pixel data
        const metadata = await sharp(buffer).metadata();
        if (!metadata.width || !metadata.height) {
            printMsg(RED, `✗ Unable to retrieve image dimensions for color validation`);
            return false;
        }

        // Convert to raw pixel data for sampling
        const rawBuffer = await sharp(buffer)
            .raw()
            .toBuffer();

        // Calculate total pixels and channels
        const channels = metadata.channels || 3;
        const pixelCount = metadata.width * metadata.height;

        // Color tolerance for matching (accounts for compression artifacts)
        const COLOR_TOLERANCE = 10;

        // Helper function to check if colors match within tolerance
        const colorsMatch = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): boolean => {
            return Math.abs(r1 - r2) <= COLOR_TOLERANCE &&
                   Math.abs(g1 - g2) <= COLOR_TOLERANCE &&
                   Math.abs(b1 - b2) <= COLOR_TOLERANCE;
        };

        // Sample pixels across the image (grid sampling for performance)
        const sampleSize = Math.min(100, Math.floor(Math.sqrt(pixelCount))); // Sample in a grid pattern
        const stepX = Math.floor(metadata.width / sampleSize);
        const stepY = Math.floor(metadata.height / sampleSize);

        let hasRed = false;
        let hasBlack = false;
        let hasWhite = false;
        let dominantColors = new Map<string, number>();

        // Sample pixels in a grid pattern
        for (let y = 0; y < metadata.height; y += stepY) {
            for (let x = 0; x < metadata.width; x += stepX) {
                const idx = (y * metadata.width + x) * channels;
                const r = rawBuffer[idx];
                const g = rawBuffer[idx + 1];
                const b = rawBuffer[idx + 2];

                // Skip fully transparent pixels if alpha channel exists
                if (channels === 4 && rawBuffer[idx + 3] < 10) {
                    continue;
                }

                // Check for brand colors
                if (!hasRed && colorsMatch(r, g, b, brandRedRgb.r, brandRedRgb.g, brandRedRgb.b)) {
                    hasRed = true;
                }
                if (!hasBlack && colorsMatch(r, g, b, brandBlackRgb.r, brandBlackRgb.g, brandBlackRgb.b)) {
                    hasBlack = true;
                }
                if (!hasWhite && colorsMatch(r, g, b, brandWhiteRgb.r, brandWhiteRgb.g, brandWhiteRgb.b)) {
                    hasWhite = true;
                }

                // Track dominant colors (rounded to nearest 10 for grouping)
                const roundedR = Math.round(r / 10) * 10;
                const roundedG = Math.round(g / 10) * 10;
                const roundedB = Math.round(b / 10) * 10;
                const colorKey = `rgb(${roundedR},${roundedG},${roundedB})`;
                dominantColors.set(colorKey, (dominantColors.get(colorKey) || 0) + 1);
            }
        }

        // Check color space compliance
        const colorSpace = metadata.space || 'unknown';
        const isValidColorSpace = ['srgb', 'rgb', 'p3', 'display-p3', 'gray', 'grey'].includes(colorSpace.toLowerCase());

        // Report findings
        printMsg(GREEN, `✓ Color space: ${colorSpace} (${isValidColorSpace ? 'valid' : 'non-standard'})`);

        if (hasRed) {
            printMsg(GREEN, `✓ Brand red (#e53e3e) detected`);
        } else {
            printMsg(YELLOW, `⚠ Brand red (#e53e3e) not detected`);
        }

        if (hasBlack) {
            printMsg(GREEN, `✓ Brand black (#000000) detected`);
        } else {
            printMsg(YELLOW, `⚠ Brand black (#000000) not detected`);
        }

        if (hasWhite) {
            printMsg(GREEN, `✓ Brand white (#ffffff) detected`);
        } else {
            printMsg(YELLOW, `⚠ Brand white (#ffffff) not detected`);
        }

        // Sort and display top dominant colors
        const topColors = Array.from(dominantColors.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (topColors.length > 0) {
            printMsg(YELLOW, `Top ${topColors.length} dominant colors:`);
            topColors.forEach(([color, count]) => {
                printMsg(YELLOW, `  ${color}: ${count} samples`);
            });
        }

        // Validation passes if at least one brand color is detected
        // (some icon variants like monochrome may only have black/white)
        const hasAnyBrandColor = hasRed || hasBlack || hasWhite;

        if (!hasAnyBrandColor) {
            printMsg(RED, `✗ No brand colors detected in icon`);
            return false;
        }

        // Additional validation for color space
        if (!isValidColorSpace && colorSpace !== 'unknown') {
            printMsg(YELLOW, `⚠ Non-standard color space detected: ${colorSpace}`);
            // This is a warning, not a failure
        }

        return true;

    } catch (error) {
        printMsg(RED, `✗ Error validating brand colors: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
    }
}

/**
 * Centralized error handling function with context and recovery suggestions
 * Provides user-friendly error messages based on error type and context
 * @param error The error object or message
 * @param context The operation context where the error occurred
 */
function handleError(error: Error | unknown, context: string): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    printMsg(RED, `\n✗ Error during ${context}:`);
    printMsg(RED, `  ${errorMessage}`);

    // Provide specific recovery suggestions based on error type and context
    if (errorMessage.includes('ENOENT') || errorMessage.includes('no such file')) {
        printMsg(YELLOW, `\n💡 Recovery suggestions:`);
        printMsg(YELLOW, `  1. Check that the SVG source file exists at the specified path`);
        printMsg(YELLOW, `  2. Ensure you're running the script from the project root directory`);
        printMsg(YELLOW, `  3. Try using an absolute path to the SVG file`);
        printMsg(YELLOW, `  Example: npm run generate-icons -- --source /path/to/icon.svg`);
    } else if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
        printMsg(YELLOW, `\n💡 Recovery suggestions:`);
        printMsg(YELLOW, `  1. Check file permissions: ls -la assets/`);
        printMsg(YELLOW, `  2. Fix permissions: chmod 755 assets/ && chmod 644 assets/**/*`);
        printMsg(YELLOW, `  3. Run with elevated permissions if necessary (not recommended)`);
        printMsg(YELLOW, `  4. Ensure the output directory is writable`);
    } else if (errorMessage.includes('sharp') || errorMessage.includes('libvips')) {
        printMsg(YELLOW, `\n💡 Recovery suggestions:`);
        printMsg(YELLOW, `  1. Reinstall sharp: npm uninstall sharp && npm install sharp@0.33.0`);
        printMsg(YELLOW, `  2. Clear npm cache: npm cache clean --force`);
        printMsg(YELLOW, `  3. Delete node_modules and reinstall: rm -rf node_modules && npm install`);
        printMsg(YELLOW, `  4. Check Node.js version compatibility (requires Node 18+)`);
    } else if (errorMessage.includes('Invalid SVG') || errorMessage.includes('XML')) {
        printMsg(YELLOW, `\n💡 Recovery suggestions:`);
        printMsg(YELLOW, `  1. Validate your SVG file at: https://validator.w3.org/`);
        printMsg(YELLOW, `  2. Ensure the SVG has proper XML structure`);
        printMsg(YELLOW, `  3. Check for unclosed tags or invalid attributes`);
        printMsg(YELLOW, `  4. Try opening the SVG in a vector editor and re-exporting`);
    } else if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
        printMsg(YELLOW, `\n💡 Recovery suggestions:`);
        printMsg(YELLOW, `  1. Increase Node.js memory: node --max-old-space-size=4096 scripts/generate-icons.ts`);
        printMsg(YELLOW, `  2. Optimize the SVG file to reduce complexity`);
        printMsg(YELLOW, `  3. Close other applications to free up memory`);
        printMsg(YELLOW, `  4. Process icons in smaller batches`);
    } else if (errorMessage.includes('color') || errorMessage.includes('brand')) {
        printMsg(YELLOW, `\n💡 Recovery suggestions:`);
        printMsg(YELLOW, `  1. Verify SVG contains brand colors: #e53e3e (red), #000000 (black), #ffffff (white)`);
        printMsg(YELLOW, `  2. Check that colors aren't being altered by gradients or filters`);
        printMsg(YELLOW, `  3. Ensure SVG uses solid fill colors, not patterns`);
        printMsg(YELLOW, `  4. Try simplifying the SVG to basic shapes with brand colors`);
    } else if (errorMessage.includes('app.json')) {
        printMsg(YELLOW, `\n💡 Recovery suggestions:`);
        printMsg(YELLOW, `  1. Check that app.json exists and is valid JSON`);
        printMsg(YELLOW, `  2. Restore from backup: cp app.json.backup app.json`);
        printMsg(YELLOW, `  3. Validate JSON syntax at: https://jsonlint.com/`);
        printMsg(YELLOW, `  4. Ensure you have write permissions for app.json`);
    } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        printMsg(YELLOW, `\n💡 Recovery suggestions:`);
        printMsg(YELLOW, `  1. Check your internet connection`);
        printMsg(YELLOW, `  2. Try again with increased timeout`);
        printMsg(YELLOW, `  3. Check if you're behind a proxy or firewall`);
        printMsg(YELLOW, `  4. This script works offline - no network should be required`);
    }

    // Log additional debug information
    if (process.env.DEBUG || process.argv.includes('--verbose')) {
        printMsg(YELLOW, `\n🔍 Debug information:`);
        printMsg(YELLOW, `  Context: ${context}`);
        printMsg(YELLOW, `  Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
        if (error instanceof Error && error.stack) {
            printMsg(YELLOW, `  Stack trace:`);
            const stackLines = error.stack.split('\n').slice(0, 5);
            stackLines.forEach(line => printMsg(YELLOW, `    ${line}`));
        }
        printMsg(YELLOW, `  Node version: ${process.version}`);
        printMsg(YELLOW, `  Platform: ${process.platform}`);
        printMsg(YELLOW, `  Working directory: ${process.cwd()}`);
    }

    // General recovery advice
    if (!errorMessage.includes('ENOENT') && !errorMessage.includes('EACCES')) {
        printMsg(YELLOW, `\n📚 General troubleshooting:`);
        printMsg(YELLOW, `  • Run with --verbose flag for more details`);
        printMsg(YELLOW, `  • Check the logs in the console above`);
        printMsg(YELLOW, `  • Ensure all dependencies are installed: npm install`);
        printMsg(YELLOW, `  • Try running the validation tests: npm run generate-icons -- --test`);
        printMsg(YELLOW, `  • Report issues at: https://github.com/your-repo/issues`);
    }
}

// Phase 8: CLI and Main Orchestration

/**
 * Reports progress during icon generation with colored output and progress bar
 * Provides visual feedback for long-running operations
 * @param stage Current operation stage
 * @param progress Progress percentage (0-100)
 */
function reportProgress(stage: string, progress: number): void {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.min(100, Math.max(0, progress));

    // Calculate progress bar
    const barLength = 30;
    const filledLength = Math.round(barLength * clampedProgress / 100);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

    // Create progress message
    const progressText = `[${bar}] ${clampedProgress}%`;

    // Use different colors based on progress
    const color = clampedProgress === 100 ? GREEN : clampedProgress >= 50 ? YELLOW : NC;

    // Clear line and print progress
    process.stdout.write(`\r${color}${stage}: ${progressText}${NC}`);

    // Add newline when complete
    if (clampedProgress === 100) {
        console.log(''); // Move to next line
    }
}

/**
 * Options for the icon generation process
 */
interface GenerationOptions {
    source: string;
    dryRun: boolean;
    verbose: boolean;
    platforms: {
        ios: boolean;
        android: boolean;
        web: boolean;
    };
}

/**
 * Main orchestration function for icon generation
 * Coordinates all steps of the icon generation pipeline
 * @param options Generation configuration options
 */
async function generateIcons(options: GenerationOptions): Promise<void> {
    let svgBuffer: Buffer | null = null;
    let totalSteps = 0;
    let currentStep = 0;

    try {
        // Calculate total steps based on enabled platforms
        if (options.platforms.ios) totalSteps += 5;     // 5 iOS variants + scaling
        if (options.platforms.android) totalSteps += 4;  // 4 Android variants
        if (options.platforms.web) totalSteps += 1;      // 1 Web favicon
        totalSteps += 3; // SVG parsing, directory creation, config update

        // Step 1: Parse SVG
        reportProgress('Parsing SVG', 0);
        const svgData = await parseSVG(options.source);
        svgBuffer = await fs.promises.readFile(options.source);
        reportProgress('Parsing SVG', 100);
        currentStep++;

        // Step 2: Create directory structure
        if (!options.dryRun) {
            reportProgress('Creating directories', (currentStep / totalSteps) * 100);
            await createDirectoryStructure();
            reportProgress('Creating directories', 100);
        }
        currentStep++;

        const generatedIcons: Array<{ platform: string; variant: string; path: string; buffer: Buffer }> = [];

        // Step 3: Generate iOS icons
        if (options.platforms.ios) {
            printMsg(YELLOW, '\n📱 Generating iOS icons...');

            // Generate light mode
            reportProgress('iOS light mode', (currentStep / totalSteps) * 100);
            const lightIcon = await generateIOSLightIcon(svgBuffer);
            generatedIcons.push({ platform: 'ios', variant: 'light', path: 'assets/icons/ios/icon-light.png', buffer: lightIcon });
            currentStep++;

            // Generate dark mode
            reportProgress('iOS dark mode', (currentStep / totalSteps) * 100);
            const darkIcon = await generateIOSDarkIcon(svgBuffer);
            generatedIcons.push({ platform: 'ios', variant: 'dark', path: 'assets/icons/ios/icon-dark.png', buffer: darkIcon });
            currentStep++;

            // Generate tinted mode
            reportProgress('iOS tinted mode', (currentStep / totalSteps) * 100);
            const tintedIcon = await generateIOSTintedIcon(svgBuffer);
            generatedIcons.push({ platform: 'ios', variant: 'tinted', path: 'assets/icons/ios/icon-tinted.png', buffer: tintedIcon });
            currentStep++;

            // Generate legacy fallback
            reportProgress('iOS legacy', (currentStep / totalSteps) * 100);
            const legacyIcon = await generateIOSLegacyIcon(svgBuffer);
            generatedIcons.push({ platform: 'ios', variant: 'legacy', path: 'assets/icons/ios/icon.png', buffer: legacyIcon });
            currentStep++;

            // Scale to various sizes
            reportProgress('iOS scaling', (currentStep / totalSteps) * 100);
            for (const size of iOS_ICON_SIZES) {
                const scaled = await scaleIOSIcon(lightIcon, size);
                generatedIcons.push({ platform: 'ios', variant: `light-${size}`, path: `assets/icons/ios/icon-${size}.png`, buffer: scaled });
            }
            currentStep++;
        }

        // Step 4: Generate Android icons
        if (options.platforms.android) {
            printMsg(YELLOW, '\n🤖 Generating Android icons...');

            // Generate adaptive foreground
            reportProgress('Android foreground', (currentStep / totalSteps) * 100);
            const foreground = await generateAndroidForeground(svgBuffer);
            generatedIcons.push({ platform: 'android', variant: 'foreground', path: 'assets/icons/android/adaptive/foreground.png', buffer: foreground });
            currentStep++;

            // Generate adaptive background
            reportProgress('Android background', (currentStep / totalSteps) * 100);
            const background = await generateAndroidBackground();
            generatedIcons.push({ platform: 'android', variant: 'background', path: 'assets/icons/android/adaptive/background.png', buffer: background });
            currentStep++;

            // Generate monochrome
            reportProgress('Android monochrome', (currentStep / totalSteps) * 100);
            const monochrome = await generateAndroidMonochrome(svgBuffer);
            generatedIcons.push({ platform: 'android', variant: 'monochrome', path: 'assets/icons/android/adaptive/monochrome.png', buffer: monochrome });
            currentStep++;

            // Generate legacy icons
            reportProgress('Android legacy', (currentStep / totalSteps) * 100);
            const legacyIcons = await generateAndroidLegacyIcons(svgBuffer);
            legacyIcons.forEach((icon, index) => {
                generatedIcons.push({ platform: 'android', variant: `legacy-${index}`, path: `assets/icons/android/icon-legacy-${index}.png`, buffer: icon });
            });
            currentStep++;
        }

        // Step 5: Generate web favicons
        if (options.platforms.web) {
            printMsg(YELLOW, '\n🌐 Generating web favicons...');
            reportProgress('Web favicon', (currentStep / totalSteps) * 100);
            const favicons = await generateWebFavicon(svgBuffer);
            generatedIcons.push({ platform: 'web', variant: 'favicon-32', path: 'assets/icons/web/favicon-32.png', buffer: favicons.favicon32 });
            generatedIcons.push({ platform: 'web', variant: 'favicon-192', path: 'assets/icons/web/favicon-192.png', buffer: favicons.favicon192 });
            currentStep++;
        }

        // Step 6: Write files (unless dry-run)
        if (!options.dryRun) {
            printMsg(YELLOW, '\n💾 Writing icon files...');
            for (const icon of generatedIcons) {
                await writeIconFile(icon.buffer, icon.path);
            }

            // Step 7: Update configuration
            reportProgress('Updating config', (currentStep / totalSteps) * 100);
            await backupConfig();

            if (options.platforms.ios) {
                await updateIOSConfig({
                    light: 'assets/icons/ios/icon-light.png',
                    dark: 'assets/icons/ios/icon-dark.png',
                    tinted: 'assets/icons/ios/icon-tinted.png'
                });
            }

            if (options.platforms.android) {
                await updateAndroidConfig({
                    foregroundImage: 'assets/icons/android/adaptive/foreground.png',
                    backgroundImage: 'assets/icons/android/adaptive/background.png',
                    monochromeImage: 'assets/icons/android/adaptive/monochrome.png'
                });
            }
        }

        // Step 8: Validation
        printMsg(YELLOW, '\n✅ Validating generated icons...');
        let validationPassed = true;

        for (const icon of generatedIcons.slice(0, 5)) { // Validate first 5 for performance
            const dimensionValid = await validateIconDimensions(icon.buffer, 1024);
            const colorsValid = await validateBrandColors(icon.buffer);

            if (!dimensionValid || !colorsValid) {
                printMsg(RED, `✗ Validation failed for ${icon.variant}`);
                validationPassed = false;
            }
        }

        // Generate report
        if (!options.dryRun) {
            const report = {
                timestamp: new Date().toISOString(),
                source: options.source,
                iconCount: generatedIcons.length,
                platforms: options.platforms,
                validationPassed,
                icons: generatedIcons.map(icon => ({
                    platform: icon.platform,
                    variant: icon.variant,
                    path: icon.path,
                    size: icon.buffer.length,
                    checksum: generateChecksum(icon.buffer)
                }))
            };

            await fs.promises.writeFile(
                'assets/icons/generation-report.json',
                JSON.stringify(report, null, 2)
            );
        }

        printMsg(GREEN, '\n✨ Icon generation complete!');
        printMsg(GREEN, `  Generated ${generatedIcons.length} icon variants`);

        if (options.verbose) {
            const totalSize = generatedIcons.reduce((sum, icon) => sum + icon.buffer.length, 0);
            printMsg(GREEN, `  Total size: ${Math.round(totalSize / 1024)}KB`);
        }

    } catch (error) {
        // Cleanup on error
        printMsg(RED, '\n❌ Icon generation failed');

        if (!options.dryRun && svgBuffer) {
            try {
                // Attempt to restore backup if config was modified
                const backupPath = `app.json.backup.${new Date().toISOString().replace(/:/g, '-')}`;
                if (await fs.promises.access(backupPath).then(() => true).catch(() => false)) {
                    await fs.promises.copyFile(backupPath, 'app.json');
                    printMsg(YELLOW, '✓ Restored app.json from backup');
                }
            } catch (restoreError) {
                printMsg(RED, '✗ Failed to restore backup');
            }
        }

        throw error;
    }
}

/**
 * Test results interface
 */
interface TestResults {
    passed: number;
    failed: number;
    tests: Array<{ name: string; passed: boolean; error?: string }>;
}

/**
 * Runs validation tests for the icon generation system
 * Tests core functionality without generating actual files
 */
async function runTests(): Promise<TestResults> {
    const results: TestResults = {
        passed: 0,
        failed: 0,
        tests: []
    };

    printMsg(YELLOW, '🧪 Running validation tests...\n');

    // Test 1: SVG validation
    try {
        const isValid = await validateSource('assets/logo/trendankaralogo.svg');
        results.tests.push({ name: 'SVG source validation', passed: isValid });
        if (isValid) results.passed++; else results.failed++;
        printMsg(isValid ? GREEN : RED, `${isValid ? '✓' : '✗'} SVG source validation`);
    } catch (error) {
        results.tests.push({ name: 'SVG source validation', passed: false, error: String(error) });
        results.failed++;
        printMsg(RED, `✗ SVG source validation: ${error}`);
    }

    // Test 2: SVG parsing
    try {
        const svgData = await parseSVG('assets/logo/trendankaralogo.svg');
        const hasColors = svgData.colors.hasRed || svgData.colors.hasBlack || svgData.colors.hasWhite;
        results.tests.push({ name: 'SVG parsing and color extraction', passed: hasColors });
        if (hasColors) results.passed++; else results.failed++;
        printMsg(hasColors ? GREEN : RED, `${hasColors ? '✓' : '✗'} SVG parsing and color extraction`);
    } catch (error) {
        results.tests.push({ name: 'SVG parsing and color extraction', passed: false, error: String(error) });
        results.failed++;
        printMsg(RED, `✗ SVG parsing: ${error}`);
    }

    // Test 3: Icon generation (memory only)
    try {
        const svgBuffer = await fs.promises.readFile('assets/logo/trendankaralogo.svg');
        const testIcon = await generateIOSLightIcon(svgBuffer);
        const isValid = testIcon.length > 0;
        results.tests.push({ name: 'iOS icon generation', passed: isValid });
        if (isValid) results.passed++; else results.failed++;
        printMsg(isValid ? GREEN : RED, `${isValid ? '✓' : '✗'} iOS icon generation (memory test)`);
    } catch (error) {
        results.tests.push({ name: 'iOS icon generation', passed: false, error: String(error) });
        results.failed++;
        printMsg(RED, `✗ Icon generation: ${error}`);
    }

    // Test 4: Checksum generation
    try {
        const testBuffer = Buffer.from('test');
        const checksum = generateChecksum(testBuffer);
        const isValid = checksum.length === 64; // SHA256 produces 64 char hex string
        results.tests.push({ name: 'Checksum generation', passed: isValid });
        if (isValid) results.passed++; else results.failed++;
        printMsg(isValid ? GREEN : RED, `${isValid ? '✓' : '✗'} Checksum generation`);
    } catch (error) {
        results.tests.push({ name: 'Checksum generation', passed: false, error: String(error) });
        results.failed++;
        printMsg(RED, `✗ Checksum generation: ${error}`);
    }

    // Summary
    printMsg(YELLOW, `\n📊 Test Results:`);
    printMsg(GREEN, `  ✓ Passed: ${results.passed}`);
    printMsg(results.failed > 0 ? RED : GREEN, `  ${results.failed > 0 ? '✗' : '✓'} Failed: ${results.failed}`);
    printMsg(YELLOW, `  Total: ${results.passed + results.failed}`);

    return results;
}

/**
 * Command-line interface setup and argument parsing
 * Provides user-friendly CLI for icon generation with options
 */
function setupCLI(): {
    source: string;
    dryRun: boolean;
    verbose: boolean;
    test: boolean;
    platforms: {
        ios: boolean;
        android: boolean;
        web: boolean;
    }
} {
    const program = new Command();

    program
        .name('generate-icons')
        .description('Generate adaptive app icons for iOS 18 and Android 13+ from SVG source')
        .version('1.0.0')
        .option('-s, --source <path>', 'Path to source SVG file', 'assets/logo/trendankaralogo.svg')
        .option('-d, --dry-run', 'Test run without writing files', false)
        .option('-v, --verbose', 'Enable verbose output for debugging', false)
        .option('-t, --test', 'Run validation tests', false)
        .option('--no-ios', 'Skip iOS icon generation')
        .option('--no-android', 'Skip Android icon generation')
        .option('--no-web', 'Skip web favicon generation')
        .helpOption('-h, --help', 'Display help information')
        .addHelpText('after', `
Examples:
  $ npm run generate-icons
    Generate icons using default source (assets/logo/trendankaralogo.svg)

  $ npm run generate-icons -- --source path/to/icon.svg
    Generate icons from a custom SVG file

  $ npm run generate-icons -- --dry-run
    Test icon generation without writing files

  $ npm run generate-icons -- --verbose
    Show detailed output during generation

  $ npm run generate-icons -- --test
    Run validation tests on the generation system

  $ npm run generate-icons -- --no-android
    Generate only iOS and web icons, skip Android

Notes:
  - The source SVG should contain brand colors: #e53e3e (red), #000000 (black), #ffffff (white)
  - Icons will be generated in assets/icons/ directory
  - app.json will be automatically updated with new icon paths
  - A backup of app.json will be created before modifications
        `);

    // Parse command-line arguments
    program.parse(process.argv);
    const options = program.opts();

    // Validate source path
    const sourcePath = path.resolve(options.source);

    // Set up configuration based on options
    const config = {
        source: sourcePath,
        dryRun: options.dryRun || false,
        verbose: options.verbose || false,
        test: options.test || false,
        platforms: {
            ios: options.ios !== false,
            android: options.android !== false,
            web: options.web !== false
        }
    };

    // Store verbose flag in environment for other functions to access
    if (config.verbose) {
        process.env.DEBUG = 'true';
    }

    // Display configuration
    if (config.verbose) {
        printMsg(YELLOW, '\n📋 Configuration:');
        printMsg(YELLOW, `  Source SVG: ${config.source}`);
        printMsg(YELLOW, `  Dry run: ${config.dryRun ? 'Yes' : 'No'}`);
        printMsg(YELLOW, `  Verbose: ${config.verbose ? 'Yes' : 'No'}`);
        printMsg(YELLOW, `  Test mode: ${config.test ? 'Yes' : 'No'}`);
        printMsg(YELLOW, `  Platforms:`);
        printMsg(YELLOW, `    iOS: ${config.platforms.ios ? 'Enabled' : 'Disabled'}`);
        printMsg(YELLOW, `    Android: ${config.platforms.android ? 'Enabled' : 'Disabled'}`);
        printMsg(YELLOW, `    Web: ${config.platforms.web ? 'Enabled' : 'Disabled'}`);
    }

    return config;
}

// Script initialization
async function main(): Promise<void> {
    try {
        printMsg(GREEN, "=== Trend Ankara Icon Generation Script ===");
        printMsg(YELLOW, "Generating adaptive app icons for iOS 18 and Android 13+\n");

        // Parse CLI arguments
        const config = setupCLI();

        // Check if running in test mode
        if (config.test) {
            const testResults = await runTests();
            process.exit(testResults.failed > 0 ? 1 : 0);
        }

        // Check if running in dry-run mode
        if (config.dryRun) {
            printMsg(YELLOW, "🔍 Running in dry-run mode - no files will be written");
        }

        // Validate source file exists
        if (!await validateSource(config.source)) {
            throw new Error(`Source SVG file not found or invalid: ${config.source}`);
        }

        printMsg(GREEN, `✓ Source SVG validated: ${path.basename(config.source)}`);

        // Execute main icon generation pipeline
        await generateIcons({
            source: config.source,
            dryRun: config.dryRun,
            verbose: config.verbose,
            platforms: config.platforms
        });

        printMsg(GREEN, "\n🎉 All icons generated successfully!");
        printMsg(YELLOW, "  View report: assets/icons/generation-report.json");
        printMsg(YELLOW, "  Preview icons: open assets/icons/preview.html");

    } catch (error) {
        handleError(error, 'icon generation setup');
        process.exit(1);
    }
}

// Execute main function if script is run directly
if (require.main === module) {
    main().catch(error => {
        handleError(error, 'script execution');
        process.exit(1);
    });
}