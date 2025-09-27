# Icon Generation Script Documentation

## Overview

The Trend Ankara icon generation script creates adaptive app icons for iOS 18 and Android 13+ from a single SVG source file. It supports iOS appearance modes (light, dark, tinted) and Android Material You theming.

## Prerequisites

- Node.js 18+ installed
- NPM dependencies installed (`npm install`)
- SVG source file containing brand colors:
  - Red: `#e53e3e`
  - Black: `#000000`
  - White: `#ffffff`

## Usage

### Basic Generation

Generate all icons using the default source SVG:

```bash
npm run generate-icons
```

### Custom Source File

Use a different SVG file as the source:

```bash
npm run generate-icons -- --source path/to/your/icon.svg
```

### Command-Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--source <path>` | `-s` | Path to source SVG file | `assets/logo/trendankaralogo.svg` |
| `--dry-run` | `-d` | Test run without writing files | `false` |
| `--verbose` | `-v` | Enable verbose output | `false` |
| `--test` | `-t` | Run validation tests | `false` |
| `--no-ios` | | Skip iOS icon generation | iOS enabled |
| `--no-android` | | Skip Android icon generation | Android enabled |
| `--no-web` | | Skip web favicon generation | Web enabled |
| `--help` | `-h` | Display help information | |

### Examples

#### Dry Run (Test Without Writing)

```bash
npm run generate-icons -- --dry-run
```

#### Verbose Output for Debugging

```bash
npm run generate-icons -- --verbose
```

#### Generate Only iOS Icons

```bash
npm run generate-icons -- --no-android --no-web
```

#### Run Validation Tests

```bash
npm run generate-icons -- --test
```

## Generated Icon Variants

### iOS Icons

| Variant | Size | Path | Description |
|---------|------|------|-------------|
| Light Mode | 1024×1024 | `assets/icons/ios/icon-light.png` | Standard app icon for light mode |
| Dark Mode | 1024×1024 | `assets/icons/ios/icon-dark.png` | Icon with transparent background for dark mode |
| Tinted Mode | 1024×1024 | `assets/icons/ios/icon-tinted.png` | Grayscale icon for system tinting |
| Legacy | 1024×1024 | `assets/icons/ios/icon.png` | Fallback for iOS < 18 |
| Size Variants | Multiple | `assets/icons/ios/icon-{size}.png` | All required iOS sizes |

**Supported Sizes:** 20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024

### Android Icons

| Variant | Size | Path | Description |
|---------|------|------|-------------|
| Foreground | 108×108dp | `assets/icons/android/adaptive/foreground.png` | Logo layer for adaptive icons |
| Background | 108×108dp | `assets/icons/android/adaptive/background.png` | Background layer (black) |
| Monochrome | 108×108dp | `assets/icons/android/adaptive/monochrome.png` | Material You themed icons |
| Legacy | Multiple | `assets/icons/android/icon-legacy-*.png` | Fallback for Android < 8.0 |

**DPI Sizes:** mdpi (48px), hdpi (72px), xhdpi (96px), xxhdpi (144px), xxxhdpi (192px)

### Web Favicons

| Variant | Size | Path | Description |
|---------|------|------|-------------|
| Small | 32×32 | `assets/icons/web/favicon-32.png` | Browser tab icon |
| Large | 192×192 | `assets/icons/web/favicon-192.png` | PWA and bookmarks |

## Output Files

After successful generation, you'll find:

1. **Icon Files**: All generated icons in `assets/icons/` directory
2. **Configuration**: Updated `app.json` with new icon paths
3. **Backup**: `app.json.backup.[timestamp]` for safety
4. **Report**: `assets/icons/generation-report.json` with generation details
5. **Preview**: `assets/icons/preview.html` for visual validation

## Configuration Updates

The script automatically updates `app.json`:

### iOS Configuration

```json
{
  "expo": {
    "ios": {
      "icon": {
        "light": "assets/icons/ios/icon-light.png",
        "dark": "assets/icons/ios/icon-dark.png",
        "tinted": "assets/icons/ios/icon-tinted.png"
      }
    }
  }
}
```

### Android Configuration

```json
{
  "expo": {
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "assets/icons/android/adaptive/foreground.png",
        "backgroundImage": "assets/icons/android/adaptive/background.png",
        "monochromeImage": "assets/icons/android/adaptive/monochrome.png"
      }
    }
  }
}
```

## Validation

The script performs automatic validation:

- **Dimension Check**: Ensures icons match expected sizes
- **Color Validation**: Verifies brand colors are preserved
- **Format Check**: Confirms PNG format with proper channels
- **Color Space**: Validates sRGB/Display P3/Gray profiles

## Visual Preview

Open the generated preview page to visually inspect all icons:

```bash
open assets/icons/preview.html
```

## Troubleshooting

### Common Issues

#### SVG File Not Found

```
Error: Source SVG file not found or invalid
```

**Solution**: Ensure the SVG file exists and path is correct. Use absolute path if needed.

#### Permission Denied

```
Error: EACCES: permission denied
```

**Solution**: Check directory permissions:
```bash
chmod 755 assets/
chmod 644 assets/**/*
```

#### Sharp Installation Issues

```
Error: Cannot find module 'sharp'
```

**Solution**: Reinstall sharp:
```bash
npm uninstall sharp
npm install sharp@0.33.0
```

#### Memory Issues

```
Error: JavaScript heap out of memory
```

**Solution**: Increase Node memory:
```bash
node --max-old-space-size=4096 scripts/generate-icons.ts
```

#### Missing Brand Colors

```
Warning: Brand colors not detected
```

**Solution**: Verify your SVG contains the required colors:
- Red: `#e53e3e`
- Black: `#000000`
- White: `#ffffff`

### Debug Mode

Run with verbose flag for detailed output:

```bash
npm run generate-icons -- --verbose
```

Or set DEBUG environment variable:

```bash
DEBUG=true npm run generate-icons
```

## Platform Requirements

### iOS 18+
- Supports appearance modes (light, dark, tinted)
- Display P3 wide-gamut color space
- Automatic adaptation to system theme

### iOS < 18
- Falls back to single icon variant
- Standard sRGB color space

### Android 13+
- Material You themed icons
- Dynamic color extraction from wallpaper
- Monochrome icon layer support

### Android 8-12
- Adaptive icons with foreground/background
- No Material You theming

### Android < 8
- Legacy square/circular icons
- DPI-specific sizes

## Best Practices

1. **SVG Quality**: Use clean, optimized SVG with solid colors
2. **Brand Colors**: Ensure primary brand colors are prominent
3. **Safe Zones**: Keep important content within center 66% for Android
4. **Testing**: Always preview icons before deployment
5. **Backups**: Script creates automatic backups of app.json
6. **Validation**: Run tests before production builds

## Integration with Expo

After generation, build your app:

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android

# EAS Build
eas build --platform all
```

The icons will be automatically included in the build process.

## Report Structure

The `generation-report.json` contains:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "source": "assets/logo/trendankaralogo.svg",
  "iconCount": 25,
  "platforms": {
    "ios": true,
    "android": true,
    "web": true
  },
  "validationPassed": true,
  "icons": [
    {
      "platform": "ios",
      "variant": "light",
      "path": "assets/icons/ios/icon-light.png",
      "size": 45678,
      "checksum": "sha256..."
    }
  ]
}
```

## Support

For issues or questions:
- Check the troubleshooting section above
- Run validation tests: `npm run generate-icons -- --test`
- Enable verbose output for debugging
- Review the generation report for details

## License

This script is part of the Trend Ankara mobile application project.