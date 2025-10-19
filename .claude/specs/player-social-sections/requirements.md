# Requirements Document: Player Social Contact Sections

## Introduction

This feature restructures the social contact functionality on the radio player home screen into two distinct, purpose-driven sections. Currently, all social media and contact buttons are grouped together under "Bizi Takip Edin" (Follow Us), which doesn't clearly differentiate between song request channels and social media following channels.

The new design splits these into:
1. **İstek Hattı** (Request Line) - Direct communication channels for song requests and live calls
2. **Sosyal Medya** (Social Media) - Social platforms for following station updates and content

This reorganization provides users with clearer call-to-actions and better usability while maintaining a compact design that keeps the radio player as the primary focus of the screen.

**Value to Users:**
- Clear distinction between request/contact actions vs. social following
- Faster access to song request channels (WhatsApp/Phone)
- Better visual hierarchy with icon+text buttons for improved comprehension
- Cleaner, more organized interface that doesn't overwhelm the player UI

## Alignment with Product Vision

This feature aligns with the product vision in several key ways:

1. **User-Centric Design** - Organizing features by user intent (requesting songs vs. following socially) improves the user experience
2. **Radio Engagement** - Making song request channels more prominent encourages listener participation
3. **Social Presence** - Maintaining social media visibility while properly categorizing these channels
4. **Mobile-First Approach** - Optimizing vertical space usage for mobile screens
5. **Flexibility** - Dynamic showing/hiding based on backend configuration allows station managers to control which channels are active

## Requirements

### Requirement 1: Request Line Section

**User Story:** As a radio listener, I want to easily request songs or call the live show, so that I can participate in the radio program.

#### Acceptance Criteria

1. WHEN the home screen loads AND `playerWhatsappNumber` exists in config THEN the system SHALL display a WhatsApp button in the İstek Hattı section
2. WHEN the home screen loads AND `liveCallPhoneNumber` exists in config THEN the system SHALL display a Phone button in the İstek Hattı section
3. WHEN the WhatsApp button is pressed THEN the system SHALL open WhatsApp with the pre-configured phone number
4. WHEN the Phone button is pressed THEN the system SHALL show a confirmation dialog with the phone number
5. IF the user confirms the call THEN the system SHALL initiate a phone call to the configured number
6. WHEN both `playerWhatsappNumber` AND `liveCallPhoneNumber` are null/undefined THEN the system SHALL hide the entire İstek Hattı section

### Requirement 2: Social Media Section

**User Story:** As a radio listener, I want to follow the station on social media, so that I can stay updated with station news and content.

#### Acceptance Criteria

1. WHEN the home screen loads AND `playerInstagramUrl` exists in config THEN the system SHALL display an Instagram button in the Sosyal Medya section
2. WHEN the home screen loads AND `playerFacebookUrl` exists in config THEN the system SHALL display a Facebook button in the Sosyal Medya section
3. WHEN the Instagram button is pressed THEN the system SHALL attempt to open Instagram app with the station profile
4. IF Instagram app is not installed THEN the system SHALL open the Instagram URL in the web browser
5. WHEN the Facebook button is pressed THEN the system SHALL attempt to open Facebook app with the station page
6. IF Facebook app is not installed THEN the system SHALL open the Facebook URL in the web browser
7. WHEN both `playerInstagramUrl` AND `playerFacebookUrl` are null/undefined THEN the system SHALL hide the entire Sosyal Medya section

### Requirement 3: Button Design and Layout

**User Story:** As a radio listener, I want clearly labeled buttons with recognizable icons, so that I understand what each button does before clicking.

#### Acceptance Criteria

1. WHEN a social contact button is rendered THEN the system SHALL display both an icon AND text label
2. WHEN rendering the İstek Hattı section THEN the system SHALL use horizontal layout for buttons
3. WHEN rendering the Sosyal Medya section THEN the system SHALL use horizontal layout for buttons
4. WHEN displaying buttons THEN the system SHALL use brand-appropriate colors for each platform:
   - WhatsApp: #25D366 (green)
   - Phone: #DC2626 (Trend Ankara red)
   - Instagram: #E4405F (pink/magenta)
   - Facebook: #1877F2 (blue)
5. WHEN rendering sections THEN the system SHALL use minimal vertical spacing to preserve screen real estate for the player

### Requirement 4: Data Source Integration

**User Story:** As a station manager, I want to control which contact methods are visible through the admin panel, so that I can manage listener communication channels centrally.

#### Acceptance Criteria

1. WHEN the app starts THEN the system SHALL fetch configuration from `/api/mobile/v1/config`
2. WHEN configuration is fetched THEN the system SHALL extract social contact fields:
   - `playerWhatsappNumber`
   - `liveCallPhoneNumber`
   - `playerInstagramUrl`
   - `playerFacebookUrl`
3. WHEN configuration fetch fails THEN the system SHALL hide both sections gracefully
4. WHEN configuration is cached THEN the system SHALL use cached values with a 7-day TTL
5. IF any social contact field is updated in the admin panel THEN the app SHALL reflect changes within 7 days (cache expiration) OR when user manually refreshes

### Requirement 5: Error Handling

**User Story:** As a radio listener, I want helpful error messages when something goes wrong, so that I understand what happened and can try again.

#### Acceptance Criteria

1. WHEN WhatsApp is not installed AND user clicks WhatsApp button THEN the system SHALL show an alert "WhatsApp yüklü değil"
2. WHEN phone call fails THEN the system SHALL show an alert "Arama yapılamadı"
3. WHEN Instagram/Facebook link fails to open THEN the system SHALL show an alert "Bağlantı açılırken bir hata oluştu"
4. WHEN configuration fetch fails THEN the system SHALL log the error AND hide social sections
5. IF a deep link fails to open THEN the system SHALL fallback to web URL before showing error

### Requirement 6: Accessibility

**User Story:** As a radio listener with visual impairments, I want screen reader support for all buttons, so that I can use the contact features independently.

#### Acceptance Criteria

1. WHEN any button is rendered THEN the system SHALL include an accessibility label
2. WHEN WhatsApp button is rendered THEN accessibilityLabel SHALL be "WhatsApp ile şarkı iste"
3. WHEN Phone button is rendered THEN accessibilityLabel SHALL be "Canlı yayını ara"
4. WHEN Instagram button is rendered THEN accessibilityLabel SHALL be "Instagram'da takip et"
5. WHEN Facebook button is rendered THEN accessibilityLabel SHALL be "Facebook'ta takip et"
6. WHEN buttons are focused by screen reader THEN the system SHALL provide clear actionable descriptions

## Non-Functional Requirements

### Performance

- Configuration API calls SHALL complete within 2 seconds on 3G networks
- Button press SHALL respond within 100ms
- Deep link fallback SHALL occur within 500ms
- Section rendering SHALL not cause layout shifts or jank

### Security

- Phone numbers SHALL be validated before initiating calls
- URLs SHALL be validated before opening external apps/browsers
- Deep links SHALL use platform-specific URL schemes safely
- WhatsApp messages SHALL properly encode special characters

### Reliability

- Configuration failures SHALL NOT crash the app
- Missing configuration fields SHALL gracefully hide affected buttons
- Deep link failures SHALL have web URL fallbacks
- Network errors SHALL be handled with user-friendly messages

### Usability

- Section headers SHALL be clearly visible and descriptive
- Button text SHALL be concise (1-3 words maximum)
- Icons SHALL be recognizable and platform-standard
- Touch targets SHALL be at least 44x44 points (iOS) / 48x48 dp (Android)
- Sections SHALL occupy minimal vertical space
- Visual hierarchy SHALL emphasize the radio player over contact sections
- Phone number confirmation dialog SHALL clearly display the number being called

### Maintainability

- Social contact logic SHALL be encapsulated in reusable components
- Configuration mapping SHALL follow existing patterns in useSettings hook
- Button rendering SHALL use consistent styling approach
- Deep link logic SHALL be centralized for easy updates

## Edge Cases and Constraints

### Edge Cases

1. **Partial Configuration**: Some fields present, others missing
   - Expected: Only show buttons for available fields, hide sections if all fields are empty

2. **Invalid Phone Numbers**: Configuration contains malformed phone number
   - Expected: Clean/format phone numbers, log warning, attempt call anyway

3. **Invalid URLs**: Configuration contains malformed social media URLs
   - Expected: Validate URLs, log warning, show error on button press

4. **Rapid Button Presses**: User taps button multiple times quickly
   - Expected: Debounce or disable during action, prevent multiple opens

5. **App Switching**: User switches apps during deep link opening
   - Expected: Handle gracefully, no crashes or stuck states

### Technical Constraints

1. React Native environment - cannot use react-icons (web-only library)
2. Must use @expo/vector-icons (Ionicons) for icons
3. Must integrate with existing useSettings hook and SettingsService
4. Must follow existing theme system (constants/theme.ts)
5. Must work on both iOS and Android with platform-specific deep linking
6. Must not increase bundle size significantly (reuse existing components)

### Business Constraints

1. Cannot make breaking changes to existing API contract
2. Must maintain backwards compatibility with existing config structure
3. Must not remove existing SocialMediaButtons component (may be used elsewhere)
4. Must follow existing naming conventions and folder structure
