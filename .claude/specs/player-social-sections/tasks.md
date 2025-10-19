# Implementation Plan: Player Social Contact Sections

## Task Overview

This implementation creates two distinct social contact sections on the radio player home screen by building new purpose-specific components while leveraging existing infrastructure (useSettings hook, ThemedView/ThemedText, Ionicons, theme system).

**Implementation Strategy:**
1. Build foundation (helper utilities)
2. Create reusable ContactButton component
3. Build specialized section components (RequestLine, SocialMedia)
4. Create main wrapper component
5. Integrate into home screen
6. Add tests

**Estimated Total Time:** 4-5 hours for experienced developer

## Steering Document Compliance

**Project Structure (structure.md):**
- All new files follow existing component organization pattern (`components/social/`)
- Use PascalCase for component files
- Import pattern: React → React Native → Expo → Local imports
- StyleSheet.create for all styling (no inline styles)

**Technical Standards (tech.md):**
- Functional components with TypeScript
- React.FC with typed props interfaces
- Leverage existing ThemedView/ThemedText components
- Use @expo/vector-icons (Ionicons) for icons
- Follow existing BrandColors and Colors theme system
- Haptic feedback pattern from VoteButton.tsx

## Atomic Task Requirements

**Each task meets these criteria:**
- ✅ **File Scope**: Touches 1-3 related files maximum
- ✅ **Time Boxing**: Completable in 15-30 minutes
- ✅ **Single Purpose**: One testable outcome per task
- ✅ **Specific Files**: Exact file paths specified
- ✅ **Agent-Friendly**: Clear implementation steps with minimal context switching

## Tasks

### Phase 1: Foundation (Helper Utilities)

- [x] 1. Create helper utilities file for deep linking
  - **File**: `components/social/helpers.ts` (create new)
  - **Purpose**: Extract reusable deep linking and phone formatting logic
  - **Implementation**:
    - Create new file at `components/social/helpers.ts`
    - Add TypeScript exports for utility functions
    - Implement `openWithDeepLink(appUrl, webUrl, appName)` function
      - Check `Linking.canOpenURL(appUrl)`
      - Open app URL if available, fallback to web URL
      - Show Alert on error with localized message
    - Implement `formatPhoneNumber(phone)` function
      - Remove non-digit characters with regex `/\D/g`
      - Add '90' country code if not present
      - Return formatted string
    - Implement `extractInstagramUsername(url)` function
      - Strip https://instagram.com/ and https://www.instagram.com/
      - Remove @ symbol
      - Handle trailing slashes
      - Return username string
    - Implement `showCallConfirmation(phoneNumber, onConfirm)` function
      - Use Alert.alert with title "Canlı Yayın Hattı"
      - Include phone number in message
      - Two buttons: İptal (cancel), Ara (confirm with onConfirm callback)
    - Add JSDoc comments for each function
    - Import Linking from 'react-native'
    - Import Alert from 'react-native'
  - **Testing**: Export all functions, verify TypeScript types compile
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 5.1, 5.2, 5.3_
  - _Leverage: Linking API patterns from SocialMediaButtons.tsx, Alert pattern from existing components_

### Phase 2: ContactButton Component

- [x] 2. Create ContactButton component file with TypeScript interface
  - **File**: `components/social/ContactButton.tsx` (create new)
  - **Purpose**: Reusable icon+text button for social contact actions
  - **Implementation**:
    - Create new file at `components/social/ContactButton.tsx`
    - Import React and React Native components (TouchableOpacity, View, StyleSheet)
    - Import ThemedText from '@/components/themed-text'
    - Import Ionicons from '@expo/vector-icons'
    - Import Haptics from 'expo-haptics'
    - Define TypeScript interface `ContactButtonProps`:
      ```typescript
      interface ContactButtonProps {
        icon: keyof typeof Ionicons.glyphMap;
        label: string;
        onPress: () => void;
        color: string;
        accessibilityLabel: string;
        style?: StyleProp<ViewStyle>;
      }
      ```
    - Export interface for testing
  - **Testing**: Verify TypeScript compilation, interface is correctly exported
  - _Requirements: 3.1, 3.2, 6.1, 6.2_
  - _Leverage: VoteButton.tsx interface pattern, ThemedText component_

- [x] 3. Implement ContactButton component render logic
  - **File**: `components/social/ContactButton.tsx` (continue from task 2)
  - **Purpose**: Implement button rendering with icon and label
  - **Implementation**:
    - Create functional component `ContactButton: React.FC<ContactButtonProps>`
    - Implement handlePress function:
      - Call `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`
      - Call `onPress()` prop
    - Render structure:
      - TouchableOpacity wrapper with onPress={handlePress}
      - Add accessibilityRole="button"
      - Add accessibilityLabel from props
      - Set activeOpacity={0.7}
      - Inner View for icon container
      - Ionicons component with icon prop, size={28}, color from props
      - ThemedText component with label prop, type="default"
    - Apply styles from StyleSheet (to be created in next task)
    - Export component as default
  - **Testing**: Component renders without errors, accepts all props
  - _Requirements: 3.1, 3.3, 6.1, 6.2, 6.3_
  - _Leverage: ThemedText, VoteButton.tsx haptic pattern, TouchableOpacity patterns_

- [x] 4. Add ContactButton styles and platform touch targets
  - **File**: `components/social/ContactButton.tsx` (continue from task 3)
  - **Purpose**: Style button with proper touch targets and spacing
  - **Implementation**:
    - Create StyleSheet.create at bottom of file
    - Add `container` style:
      - alignItems: 'center'
      - justifyContent: 'center'
      - minWidth: 48
      - minHeight: 48 (meets Android 48dp / iOS 44pt minimum)
      - paddingHorizontal: 8
      - paddingVertical: 8
    - Add `iconContainer` style:
      - marginBottom: 8 (spacing between icon and label)
      - alignItems: 'center'
    - Add `label` style:
      - fontSize: 14
      - textAlign: 'center'
    - Apply container style to TouchableOpacity
    - Apply iconContainer style to icon View wrapper
    - Apply label style to ThemedText
  - **Testing**: Button has minimum 48x48 touch target, visual spacing is correct
  - _Requirements: 3.4, 6.4_
  - _Leverage: Existing StyleSheet patterns from VoteButton.tsx, touch target sizing from polls components_

### Phase 3: RequestLineSection Component

- [x] 5. Create RequestLineSection component file with interface
  - **File**: `components/social/RequestLineSection.tsx` (create new)
  - **Purpose**: Display İstek Hattı section with WhatsApp and Phone buttons
  - **Implementation**:
    - Create new file at `components/social/RequestLineSection.tsx`
    - Import React, View, Alert, Linking, StyleSheet from react-native
    - Import ThemedView from '@/components/themed-view'
    - Import ThemedText from '@/components/themed-text'
    - Import ContactButton from './ContactButton'
    - Import helper functions from './helpers' (formatPhoneNumber, showCallConfirmation, openWithDeepLink)
    - Define TypeScript interface `RequestLineSectionProps`:
      ```typescript
      interface RequestLineSectionProps {
        whatsappNumber: string | null;
        phoneNumber: string | null;
        style?: StyleProp<ViewStyle>;
      }
      ```
    - Export interface
  - **Testing**: TypeScript compiles, imports resolve correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - _Leverage: ContactButton component, helper utilities, ThemedView/ThemedText_

- [x] 6. Implement RequestLineSection WhatsApp handler
  - **File**: `components/social/RequestLineSection.tsx` (continue from task 5)
  - **Purpose**: Handle WhatsApp deep linking with app/web fallback
  - **Implementation**:
    - Create `handleWhatsApp` async function inside component:
      - Destructure `whatsappNumber` from props
      - Return early if `!whatsappNumber`
      - Call `formatPhoneNumber(whatsappNumber)` to clean number
      - Construct pre-filled message: `"Merhaba! Şarkı isteğim var."`
      - Encode message with `encodeURIComponent(message)`
      - Construct app URL: `whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`
      - Construct web URL: `https://wa.me/${formattedNumber}?text=${encodedMessage}`
      - Call `openWithDeepLink(appUrl, webUrl, 'WhatsApp')`
    - Add try/catch around the function
    - Log errors to console.error
  - **Testing**: Function handles WhatsApp number correctly, formats properly
  - _Requirements: 1.3, 5.1_
  - _Leverage: openWithDeepLink helper, formatPhoneNumber helper, existing WhatsApp logic from SocialMediaButtons.tsx:80-99_

- [x] 7. Implement RequestLineSection Phone handler
  - **File**: `components/social/RequestLineSection.tsx` (continue from task 6)
  - **Purpose**: Handle phone call with confirmation dialog
  - **Implementation**:
    - Create `handlePhone` function inside component:
      - Destructure `phoneNumber` from props
      - Return early if `!phoneNumber`
      - Clean number: `phoneNumber.replace(/\s/g, '')`
      - Define `onConfirm` callback:
        - Construct tel URL: `tel:${cleanedNumber}`
        - Call `Linking.openURL(telUrl).catch(() => Alert.alert('Hata', 'Arama yapılamadı'))`
      - Call `showCallConfirmation(phoneNumber, onConfirm)`
    - No try/catch needed (handled in callbacks)
  - **Testing**: Confirmation dialog appears, phone dialer opens on confirm
  - _Requirements: 1.4, 1.5, 5.2_
  - _Leverage: showCallConfirmation helper, Linking API, existing phone logic from SocialMediaButtons.tsx:102-125_

- [x] 8. Implement RequestLineSection render and visibility logic
  - **File**: `components/social/RequestLineSection.tsx` (continue from task 7)
  - **Purpose**: Render section with conditional button visibility
  - **Implementation**:
    - Create functional component `RequestLineSection: React.FC<RequestLineSectionProps>`
    - Add visibility check at top:
      - `if (!whatsappNumber && !phoneNumber) return null;`
    - Render structure:
      - ThemedView container with style prop
      - ThemedText for title "İstek Hattı", type="subtitle", accessibilityRole="header"
      - View for buttons container (horizontal layout)
      - Conditional WhatsApp button: `{whatsappNumber && <ContactButton ... />}`
        - icon="logo-whatsapp"
        - label="WhatsApp"
        - color="#25D366"
        - onPress={handleWhatsApp}
        - accessibilityLabel="WhatsApp ile şarkı iste"
      - Conditional Phone button: `{phoneNumber && <ContactButton ... />}`
        - icon="call"
        - label="Ara"
        - color="#DC2626"
        - onPress={handlePhone}
        - accessibilityLabel="Canlı yayını ara"
    - Export component as default
  - **Testing**: Section hides when no data, shows correct buttons when data present
  - _Requirements: 1.1, 1.2, 1.6, 3.1, 3.4, 6.1_
  - _Leverage: ThemedView, ThemedText, ContactButton_

- [x] 9. Add RequestLineSection styles
  - **File**: `components/social/RequestLineSection.tsx` (continue from task 8)
  - **Purpose**: Style section layout with minimal vertical space
  - **Implementation**:
    - Create StyleSheet.create at bottom
    - Add `container` style:
      - marginBottom: 32 (spacing between sections)
      - alignItems: 'center'
    - Add `title` style:
      - marginBottom: 16 (title to buttons spacing)
    - Add `buttonsContainer` style:
      - flexDirection: 'row'
      - alignItems: 'center'
      - justifyContent: 'center'
      - gap: 20 (horizontal spacing between buttons)
    - Apply styles to respective components
  - **Testing**: Layout matches design, spacing is correct, compact vertical design
  - _Requirements: 3.2, 3.5_
  - _Leverage: Existing StyleSheet patterns_

### Phase 4: SocialMediaSection Component

- [x] 10. Create SocialMediaSection component file with interface
  - **File**: `components/social/SocialMediaSection.tsx` (create new)
  - **Purpose**: Display Sosyal Medya section with Instagram and Facebook buttons
  - **Implementation**:
    - Create new file at `components/social/SocialMediaSection.tsx`
    - Import React, View, Linking, StyleSheet from react-native
    - Import ThemedView from '@/components/themed-view'
    - Import ThemedText from '@/components/themed-text'
    - Import ContactButton from './ContactButton'
    - Import helper functions from './helpers' (extractInstagramUsername, openWithDeepLink)
    - Define TypeScript interface `SocialMediaSectionProps`:
      ```typescript
      interface SocialMediaSectionProps {
        instagramUrl: string | null;
        facebookUrl: string | null;
        style?: StyleProp<ViewStyle>;
      }
      ```
    - Export interface
  - **Testing**: TypeScript compiles, imports resolve correctly
  - _Requirements: 2.1, 2.2_
  - _Leverage: ContactButton component, helper utilities, ThemedView/ThemedText_

- [x] 11. Implement SocialMediaSection Instagram handler
  - **File**: `components/social/SocialMediaSection.tsx` (continue from task 10)
  - **Purpose**: Handle Instagram deep linking with app/web fallback
  - **Implementation**:
    - Create `handleInstagram` async function inside component:
      - Destructure `instagramUrl` from props
      - Return early if `!instagramUrl`
      - Call `extractInstagramUsername(instagramUrl)` to get username
      - Construct app URL: `instagram://user?username=${username}`
      - Construct web URL: `https://instagram.com/${username}`
      - Call `openWithDeepLink(appUrl, webUrl, 'Instagram')`
    - Add try/catch around function
    - Log errors to console.error
  - **Testing**: Function extracts username correctly, opens Instagram app or web
  - _Requirements: 2.3, 2.4, 5.3_
  - _Leverage: extractInstagramUsername helper, openWithDeepLink helper, existing Instagram logic from SocialMediaButtons.tsx:66-78_

- [x] 12. Implement SocialMediaSection Facebook handler
  - **File**: `components/social/SocialMediaSection.tsx` (continue from task 11)
  - **Purpose**: Handle Facebook deep linking with app/web fallback
  - **Implementation**:
    - Create `handleFacebook` async function inside component:
      - Destructure `facebookUrl` from props
      - Return early if `!facebookUrl`
      - Ensure URL has https protocol:
        - `const webUrl = facebookUrl.startsWith('http') ? facebookUrl : https://facebook.com/${facebookUrl}`
      - Extract page ID from URL: `facebookUrl.split('/').pop()`
      - Construct app URL: `fb://profile/${pageId}` (works for both iOS and Android)
      - Call `openWithDeepLink(appUrl, webUrl, 'Facebook')`
    - Add try/catch around function
    - Log errors to console.error
  - **Testing**: Function opens Facebook app or web correctly
  - _Requirements: 2.5, 2.6, 5.3_
  - _Leverage: openWithDeepLink helper, existing Facebook logic from SocialMediaButtons.tsx:54-64_

- [x] 13. Implement SocialMediaSection render and visibility logic
  - **File**: `components/social/SocialMediaSection.tsx` (continue from task 12)
  - **Purpose**: Render section with conditional button visibility
  - **Implementation**:
    - Create functional component `SocialMediaSection: React.FC<SocialMediaSectionProps>`
    - Add visibility check at top:
      - `if (!instagramUrl && !facebookUrl) return null;`
    - Render structure:
      - ThemedView container with style prop
      - ThemedText for title "Sosyal Medya", type="subtitle", accessibilityRole="header"
      - View for buttons container (horizontal layout)
      - Conditional Instagram button: `{instagramUrl && <ContactButton ... />}`
        - icon="logo-instagram"
        - label="Instagram"
        - color="#E4405F"
        - onPress={handleInstagram}
        - accessibilityLabel="Instagram'da takip et"
      - Conditional Facebook button: `{facebookUrl && <ContactButton ... />}`
        - icon="logo-facebook"
        - label="Facebook"
        - color="#1877F2"
        - onPress={handleFacebook}
        - accessibilityLabel="Facebook'ta takip et"
    - Export component as default
  - **Testing**: Section hides when no data, shows correct buttons when data present
  - _Requirements: 2.1, 2.2, 2.7, 3.1, 3.4, 6.1_
  - _Leverage: ThemedView, ThemedText, ContactButton_

- [x] 14. Add SocialMediaSection styles
  - **File**: `components/social/SocialMediaSection.tsx` (continue from task 13)
  - **Purpose**: Style section layout identical to RequestLineSection
  - **Implementation**:
    - Create StyleSheet.create at bottom
    - Add same styles as RequestLineSection:
      - `container`: marginBottom: 32, alignItems: 'center'
      - `title`: marginBottom: 16
      - `buttonsContainer`: flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20
    - Apply styles to respective components
  - **Testing**: Layout matches RequestLineSection, visual consistency maintained
  - _Requirements: 3.2, 3.5_
  - _Leverage: RequestLineSection styles pattern_

### Phase 5: PlayerContactSection Wrapper

- [x] 15. Create PlayerContactSection wrapper component file
  - **File**: `components/social/PlayerContactSection.tsx` (create new)
  - **Purpose**: Main wrapper that conditionally renders both contact sections
  - **Implementation**:
    - Create new file at `components/social/PlayerContactSection.tsx`
    - Import React, View, StyleSheet from react-native
    - Import ThemedView from '@/components/themed-view'
    - Import useSocialLinks from '@/hooks/useSettings'
    - Import RequestLineSection from './RequestLineSection'
    - Import SocialMediaSection from './SocialMediaSection'
    - Define TypeScript interface `PlayerContactSectionProps`:
      ```typescript
      interface PlayerContactSectionProps {
        style?: StyleProp<ViewStyle>;
      }
      ```
    - Export interface
  - **Testing**: TypeScript compiles, all imports resolve correctly
  - _Requirements: 4.1, 4.2_
  - _Leverage: useSocialLinks hook, RequestLineSection, SocialMediaSection_

- [x] 16. Implement PlayerContactSection visibility logic and render
  - **File**: `components/social/PlayerContactSection.tsx` (continue from task 15)
  - **Purpose**: Fetch social links and conditionally render sections
  - **Implementation**:
    - Create functional component `PlayerContactSection: React.FC<PlayerContactSectionProps>`
    - Call `const socialLinks = useSocialLinks()` hook
    - Compute visibility flags:
      - `const hasRequestLine = !!(socialLinks.whatsapp || socialLinks.liveCall);`
      - `const hasSocialMedia = !!(socialLinks.instagram || socialLinks.facebook);`
    - Early return if no data:
      - `if (!hasRequestLine && !hasSocialMedia) return null;`
    - Render structure:
      - ThemedView container with style prop
      - Conditional RequestLineSection:
        - `{hasRequestLine && <RequestLineSection whatsappNumber={socialLinks.whatsapp} phoneNumber={socialLinks.liveCall} />}`
      - Conditional SocialMediaSection:
        - `{hasSocialMedia && <SocialMediaSection instagramUrl={socialLinks.instagram} facebookUrl={socialLinks.facebook} />}`
    - Add basic container style (minimal, just for grouping)
    - Export component as default
  - **Testing**: Component hides entirely when no data, shows correct sections based on available data
  - _Requirements: 1.6, 2.7, 4.1, 4.2, 4.3_
  - _Leverage: useSocialLinks hook_

### Phase 6: Home Screen Integration

- [x] 17. Integrate PlayerContactSection into home screen
  - **File**: `app/(tabs)/index.tsx` (modify existing)
  - **Purpose**: Replace old SocialMediaButtons with new PlayerContactSection
  - **Implementation**:
    - Read current file content
    - Add import at top: `import PlayerContactSection from '@/components/social/PlayerContactSection';`
    - Locate existing SocialMediaButtons usage (around line 113-116):
      ```typescript
      <View style={styles.socialSection}>
        <ThemedText style={styles.sectionTitle}>Bizi Takip Edin</ThemedText>
        <SocialMediaButtons style={styles.socialButtons} />
      </View>
      ```
    - Replace with:
      ```typescript
      <PlayerContactSection style={styles.socialSection} />
      ```
    - Remove old `sectionTitle` and `socialButtons` styles from StyleSheet (lines 170-178)
    - Update `socialSection` style:
      - Change from `marginTop: 40, alignItems: 'center'` to just `marginTop: 40`
      - Remove alignItems since PlayerContactSection handles its own alignment
    - Keep SocialMediaButtons import for now (backward compatibility)
    - Add comment: `// TODO: Consider removing SocialMediaButtons import if not used elsewhere`
  - **Testing**: Home screen renders with new sections, no errors, visual layout is correct
  - _Requirements: All (integration point)_
  - _Leverage: Existing home screen structure, PlayerContactSection component_

### Phase 7: Testing

- [ ] 18. Create unit tests for helper utilities
  - **File**: `__tests__/components/social/helpers.test.ts` (create new)
  - **Purpose**: Test helper functions in isolation
  - **Implementation**:
    - Create test file at `__tests__/components/social/helpers.test.ts`
    - Import helper functions from '@/components/social/helpers'
    - Mock Linking.canOpenURL and Linking.openURL
    - Mock Alert.alert
    - Write test suite for `formatPhoneNumber`:
      - Test adding country code when missing
      - Test preserving country code when present
      - Test removing non-digit characters
    - Write test suite for `extractInstagramUsername`:
      - Test parsing https://instagram.com/username
      - Test parsing https://www.instagram.com/username
      - Test removing @ symbol
      - Test handling trailing slashes
    - Write test suite for `openWithDeepLink`:
      - Test app URL when canOpenURL returns true
      - Test web URL fallback when canOpenURL returns false
      - Test error handling and Alert display
    - Write test for `showCallConfirmation`:
      - Test Alert.alert is called with correct params
      - Test confirm button calls onConfirm callback
  - **Testing**: All helper functions have 100% code coverage
  - _Requirements: 5.1, 5.2, 5.3_
  - _Leverage: Jest, React Native Testing Library, existing test patterns_

- [ ] 19. Create unit tests for ContactButton component
  - **File**: `__tests__/components/social/ContactButton.test.tsx` (create new)
  - **Purpose**: Test ContactButton rendering and interactions
  - **Implementation**:
    - Create test file at `__tests__/components/social/ContactButton.test.tsx`
    - Import ContactButton from '@/components/social/ContactButton'
    - Import render, fireEvent from '@testing-library/react-native'
    - Mock expo-haptics
    - Write test suite:
      - Test renders icon and label correctly
      - Test calls onPress when tapped
      - Test provides haptic feedback on press
      - Test has correct accessibility label
      - Test applies correct color to icon
      - Test has minimum 48x48 touch target
    - Use getByA11yLabel to find button
    - Use fireEvent.press to trigger tap
    - Verify Haptics.impactAsync called with Light style
  - **Testing**: ContactButton has full test coverage, all interactions verified
  - _Requirements: 3.1, 3.3, 6.1, 6.2_
  - _Leverage: React Native Testing Library, existing component test patterns_

- [ ] 20. Create unit tests for RequestLineSection component
  - **File**: `__tests__/components/social/RequestLineSection.test.tsx` (create new)
  - **Purpose**: Test RequestLineSection rendering and button visibility
  - **Implementation**:
    - Create test file at `__tests__/components/social/RequestLineSection.test.tsx`
    - Import RequestLineSection from '@/components/social/RequestLineSection'
    - Import render, fireEvent from '@testing-library/react-native'
    - Mock Linking API
    - Mock Alert API
    - Mock helper functions from './helpers'
    - Write test suite:
      - Test renders section when whatsappNumber provided
      - Test renders section when phoneNumber provided
      - Test hides section when both are null
      - Test shows WhatsApp button only when whatsappNumber present
      - Test shows Phone button only when phoneNumber present
      - Test WhatsApp button calls handleWhatsApp on press
      - Test Phone button shows confirmation dialog
      - Test section title has correct accessibility role
    - Verify formatPhoneNumber, openWithDeepLink, showCallConfirmation called correctly
  - **Testing**: RequestLineSection has full test coverage
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - _Leverage: React Native Testing Library, Jest mocks_

- [ ] 21. Create unit tests for SocialMediaSection component
  - **File**: `__tests__/components/social/SocialMediaSection.test.tsx` (create new)
  - **Purpose**: Test SocialMediaSection rendering and button visibility
  - **Implementation**:
    - Create test file at `__tests__/components/social/SocialMediaSection.test.tsx`
    - Import SocialMediaSection from '@/components/social/SocialMediaSection'
    - Import render, fireEvent from '@testing-library/react-native'
    - Mock Linking API
    - Mock helper functions
    - Write test suite:
      - Test renders section when instagramUrl provided
      - Test renders section when facebookUrl provided
      - Test hides section when both are null
      - Test shows Instagram button only when instagramUrl present
      - Test shows Facebook button only when facebookUrl present
      - Test Instagram button calls handleInstagram with correct username
      - Test Facebook button calls handleFacebook with correct URL
      - Test section title has correct accessibility role
    - Verify extractInstagramUsername, openWithDeepLink called correctly
  - **Testing**: SocialMediaSection has full test coverage
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  - _Leverage: React Native Testing Library, Jest mocks_

- [ ] 22. Create unit tests for PlayerContactSection component
  - **File**: `__tests__/components/social/PlayerContactSection.test.tsx` (create new)
  - **Purpose**: Test PlayerContactSection integration and conditional rendering
  - **Implementation**:
    - Create test file at `__tests__/components/social/PlayerContactSection.test.tsx`
    - Import PlayerContactSection from '@/components/social/PlayerContactSection'
    - Import render from '@testing-library/react-native'
    - Mock useSocialLinks hook with different return values
    - Write test suite:
      - Test renders RequestLineSection when whatsapp OR liveCall present
      - Test renders SocialMediaSection when instagram OR facebook present
      - Test renders both sections when all data present
      - Test hides completely when all fields are null
      - Test passes correct props to child sections
    - Use different mock values for useSocialLinks in each test
    - Verify child components receive correct props
  - **Testing**: PlayerContactSection has full integration test coverage
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - _Leverage: React Native Testing Library, Jest mocks for hooks_

### Phase 8: Documentation and Cleanup

- [ ] 23. Add JSDoc comments to all components
  - **Files**: All component files in `components/social/` (modify existing)
  - **Purpose**: Document component APIs for maintainability
  - **Implementation**:
    - Add JSDoc comments to ContactButton.tsx:
      - Component description
      - Props documentation
      - Usage example
    - Add JSDoc comments to RequestLineSection.tsx:
      - Component description
      - Props documentation
      - Behavior notes
    - Add JSDoc comments to SocialMediaSection.tsx:
      - Component description
      - Props documentation
      - Behavior notes
    - Add JSDoc comments to PlayerContactSection.tsx:
      - Component description
      - Integration notes
      - Data flow explanation
    - Ensure all helper functions already have JSDoc from task 1
  - **Testing**: Documentation is clear, examples are accurate
  - _Requirements: Maintainability (non-functional)_
  - _Leverage: Existing JSDoc patterns in codebase_

- [ ] 24. Run TypeScript type checking and linting
  - **Command**: `npm run typecheck && npm run lint`
  - **Purpose**: Ensure code quality and type safety
  - **Implementation**:
    - Run `npm run typecheck` to verify TypeScript compilation
    - Fix any type errors that appear
    - Run `npm run lint` to check ESLint rules
    - Fix any linting violations
    - Ensure no console.log statements (only console.error for errors)
    - Verify all imports are used
    - Check for any unused variables
  - **Testing**: No TypeScript errors, no ESLint errors
  - _Requirements: Code quality (non-functional)_
  - _Leverage: Existing ESLint and TypeScript configuration_

- [ ] 25. Run all tests and verify coverage
  - **Command**: `npm test`
  - **Purpose**: Ensure all components work correctly
  - **Implementation**:
    - Run `npm test` to execute all test suites
    - Verify all tests pass
    - Check test coverage report
    - Ensure helpers.ts has >95% coverage
    - Ensure all components have >90% coverage
    - Fix any failing tests
    - Add missing test cases if coverage is low
  - **Testing**: All tests pass, coverage meets targets
  - _Requirements: Testing strategy (all)_
  - _Leverage: Jest, React Native Testing Library_

- [ ] 26. Visual QA testing on iOS simulator
  - **Command**: `npm run ios`
  - **Purpose**: Verify visual design matches specifications
  - **Implementation**:
    - Start iOS simulator
    - Run app with `npm run ios`
    - Navigate to home screen
    - Verify İstek Hattı section:
      - Title appears correctly
      - WhatsApp and Phone buttons visible (if configured)
      - Icons are correct size (28px)
      - Labels are legible
      - Touch targets are large enough
      - Spacing matches design (16dp title-to-buttons, 20dp between buttons)
    - Verify Sosyal Medya section:
      - Same visual checks as above for Instagram/Facebook
    - Test dark mode:
      - Toggle system dark mode
      - Verify text colors update correctly
      - Verify icons remain visible
    - Test interactions:
      - Tap each button
      - Verify haptic feedback (feel device vibration)
      - Verify deep links attempt to open
  - **Testing**: Visual design matches specifications, interactions work
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.4_
  - _Leverage: iOS Simulator_

- [ ] 27. Visual QA testing on Android emulator
  - **Command**: `npm run android`
  - **Purpose**: Verify Android-specific functionality and visuals
  - **Implementation**:
    - Start Android emulator
    - Run app with `npm run android`
    - Perform same visual checks as iOS (task 26)
    - Additionally verify:
      - Touch targets meet 48dp minimum
      - Elevation/shadows render correctly
      - Deep links work on Android (WhatsApp, Instagram, Facebook)
      - Phone dialer opens correctly
    - Test Material Design compliance:
      - Ripple effect on button press
      - Haptic feedback works
    - Test different screen densities (if possible)
  - **Testing**: Android design matches iOS functionality, platform-specific features work
  - _Requirements: 3.1, 3.2, 3.4, 6.4_
  - _Leverage: Android Emulator_

- [ ] 28. Accessibility testing with screen readers
  - **Tools**: VoiceOver (iOS), TalkBack (Android)
  - **Purpose**: Ensure accessibility compliance
  - **Implementation**:
    - On iOS:
      - Enable VoiceOver in Settings
      - Navigate to home screen
      - Use VoiceOver gestures to focus each button
      - Verify accessibility labels are announced correctly:
        - "WhatsApp ile şarkı iste"
        - "Canlı yayını ara"
        - "Instagram'da takip et"
        - "Facebook'ta takip et"
      - Verify section titles are announced as headers
      - Verify buttons are identified as buttons
    - On Android:
      - Enable TalkBack in Settings
      - Perform same checks as iOS
      - Verify Android-specific accessibility features work
    - Test keyboard navigation (if applicable)
    - Verify color contrast meets WCAG AA standards
  - **Testing**: Screen readers announce all elements correctly, navigation is logical
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - _Leverage: VoiceOver, TalkBack_

### Phase 9: Final Integration and Polish

- [ ] 29. Test configuration edge cases
  - **Purpose**: Verify graceful handling of edge cases
  - **Implementation**:
    - Test with only whatsappNumber configured (no phone, no social)
      - Verify only İstek Hattı section shows with WhatsApp button
    - Test with only instagramUrl configured
      - Verify only Sosyal Medya section shows with Instagram button
    - Test with all fields null
      - Verify PlayerContactSection doesn't render at all
    - Test with malformed phone number (contains letters, spaces, dashes)
      - Verify formatPhoneNumber cleans it correctly
    - Test with Instagram URL with trailing slash
      - Verify username extraction handles it
    - Test with network offline
      - Verify configuration loads from cache
      - Verify sections still render
  - **Testing**: All edge cases handled gracefully, no crashes
  - _Requirements: 4.3, 4.4, 4.5, 5.4_
  - _Leverage: Manual testing, console logs_

- [ ] 30. Performance testing and optimization check
  - **Purpose**: Ensure no performance regressions
  - **Implementation**:
    - Use React DevTools Profiler to measure render times
    - Navigate to home screen and record interaction
    - Verify PlayerContactSection render time <50ms
    - Check for unnecessary re-renders:
      - useSocialLinks should only trigger render when data changes
      - Child components shouldn't re-render when parent state changes
    - Test scroll performance:
      - Scroll home screen up and down
      - Verify no jank or stuttering
    - Monitor bundle size:
      - Check that new components don't add >10KB to bundle
    - Test memory usage:
      - No memory leaks when navigating away and back
  - **Testing**: Performance is acceptable, no regressions detected
  - _Requirements: Performance (non-functional)_
  - _Leverage: React DevTools, Chrome DevTools_

- [ ] 31. Create pull request and update documentation
  - **Purpose**: Prepare for code review and merge
  - **Implementation**:
    - Ensure all previous tasks are completed
    - Run final checks:
      - `npm run typecheck` passes
      - `npm run lint` passes
      - `npm test` all tests pass
    - Stage all changes:
      - `git add components/social/`
      - `git add app/(tabs)/index.tsx`
      - `git add __tests__/components/social/`
    - Create commit with descriptive message:
      ```
      feat: Add player social contact sections

      - Split social contacts into two sections: İstek Hattı and Sosyal Medya
      - Create ContactButton with icon+text layout
      - Add RequestLineSection for WhatsApp/Phone
      - Add SocialMediaSection for Instagram/Facebook
      - Implement deep linking with app/web fallback
      - Add phone call confirmation dialog
      - Full accessibility support with screen readers
      - Comprehensive unit and integration tests

      🤖 Generated with [Claude Code](https://claude.com/claude-code)

      Co-Authored-By: Claude <noreply@anthropic.com>
      ```
    - Update CHANGELOG.md or relevant docs
    - Add to docs/api/mobile-player-social-features.md if needed
  - **Testing**: Commit is clean, message is descriptive
  - _Requirements: All_
  - _Leverage: Git workflow_

## Summary

**Total Tasks**: 31 atomic tasks
**Estimated Time**: 4-5 hours for experienced developer
**Files Created**: 9 new files (5 components, 1 helpers, 3 test files)
**Files Modified**: 1 file (app/(tabs)/index.tsx)

**Task Dependencies:**
- Tasks 1-4: Can be done independently (helpers and ContactButton)
- Tasks 5-9: Depend on tasks 1-4 (RequestLineSection needs ContactButton and helpers)
- Tasks 10-14: Depend on tasks 1-4 (SocialMediaSection needs ContactButton and helpers)
- Tasks 15-16: Depend on tasks 5-14 (PlayerContactSection needs both sections)
- Task 17: Depends on task 15-16 (integration needs wrapper component)
- Tasks 18-22: Can be done in parallel after implementation tasks complete
- Tasks 23-31: Sequential final polish tasks

**Validation Checklist:**
- ✅ All tasks are atomic (1-3 files, 15-30 minutes each)
- ✅ All tasks have specific file paths
- ✅ All tasks reference requirements
- ✅ All tasks leverage existing code
- ✅ All tasks are agent-friendly with clear steps
- ✅ Task breakdown is complete and logical
