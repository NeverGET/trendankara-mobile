# Project Structure Steering Document - Trend Ankara

## Directory Organization

```
mobile/
├── app/                      # Expo Router pages
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── index.tsx        # Radio Player (main tab)
│   │   ├── polls.tsx        # Polls page
│   │   ├── news.tsx         # News page
│   │   ├── sponsors.tsx     # Sponsorship/Ads page
│   │   └── _layout.tsx      # Tab layout configuration
│   ├── settings/            # Settings stack
│   │   ├── index.tsx        # Settings main
│   │   └── _layout.tsx      # Settings layout
│   ├── _layout.tsx          # Root layout
│   └── +not-found.tsx       # 404 handler
├── components/              # Reusable components
│   ├── player/             # Audio player components
│   │   ├── PlayButton.tsx
│   │   ├── MuteButton.tsx
│   │   ├── MessageButtons.tsx
│   │   └── PlayerControls.tsx
│   ├── polls/              # Poll components
│   │   ├── PollCard.tsx
│   │   ├── PollVoting.tsx
│   │   └── PollResults.tsx
│   ├── news/               # News components
│   │   ├── NewsCard.tsx
│   │   ├── NewsList.tsx
│   │   └── NewsBadge.tsx
│   ├── sponsors/           # Sponsor components
│   │   └── DynamicContent.tsx
│   ├── common/             # Shared components
│   │   ├── LoadingIndicator.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── CachedImage.tsx
│   │   └── ThemedText.tsx
│   └── navigation/         # Navigation components
│       └── TabBarIcon.tsx
├── services/               # Business logic & API
│   ├── api/               # API integration
│   │   ├── client.ts      # Axios instance
│   │   ├── endpoints.ts   # API endpoints
│   │   ├── news.ts        # News API calls
│   │   ├── polls.ts       # Polls API calls
│   │   └── sponsors.ts    # Sponsors API calls
│   ├── audio/             # Audio streaming
│   │   ├── player.ts      # Player logic
│   │   ├── background.ts  # Background playback
│   │   └── stream.ts      # Stream management
│   ├── cache/             # Caching logic
│   │   ├── storage.ts     # AsyncStorage wrapper
│   │   ├── cache.ts       # Cache management
│   │   └── sync.ts        # Sync logic
│   └── messaging/         # External messaging
│       ├── whatsapp.ts    # WhatsApp integration
│       └── instagram.ts   # Instagram integration
├── hooks/                 # Custom React hooks
│   ├── usePlayer.ts      # Audio player hook
│   ├── useCache.ts       # Cache management hook
│   ├── useTheme.ts       # Theme hook
│   ├── useNetwork.ts     # Network status hook
│   └── useBackgroundPlay.ts # Background play hook
├── store/                # Global state management
│   ├── index.ts         # Store configuration
│   ├── player.ts        # Player state
│   ├── settings.ts      # Settings state
│   ├── polls.ts         # Polls state
│   └── news.ts          # News state
├── constants/           # App constants
│   ├── theme.ts        # Theme configuration
│   ├── colors.ts       # Color palette
│   ├── config.ts       # App configuration
│   └── strings.ts      # Turkish UI strings
├── types/              # TypeScript definitions
│   ├── api.ts         # API response types
│   ├── models.ts      # Data models
│   ├── navigation.ts  # Navigation types
│   └── theme.ts       # Theme types
├── utils/             # Utility functions
│   ├── format.ts     # Formatters
│   ├── validators.ts # Validation helpers
│   └── helpers.ts    # General helpers
└── assets/           # Static assets
    ├── images/       # Images and icons
    ├── fonts/        # Custom fonts (if any)
    └── sounds/       # Sound effects (if any)
```

## File Naming Conventions

### Components
- **PascalCase** for component files: `PlayerControls.tsx`
- **PascalCase** for component names: `export const PlayerControls`
- One component per file
- Index files for barrel exports when needed

### Services & Utilities
- **camelCase** for service files: `audioPlayer.ts`
- **camelCase** for utility files: `formatters.ts`
- Descriptive names that indicate purpose

### Hooks
- **camelCase** starting with 'use': `usePlayer.ts`
- Hook name matches filename: `export const usePlayer`

### Types
- **PascalCase** for interfaces: `interface RadioStation`
- **PascalCase** for type aliases: `type PlaybackState`
- **UPPER_CASE** for enums: `enum PLAYER_STATUS`

## Import Order
```typescript
// 1. React and React Native
import React from 'react';
import { View, Text } from 'react-native';

// 2. Third-party libraries
import { useNavigation } from '@react-navigation/native';
import styled from 'styled-components';

// 3. Expo modules
import { Image } from 'expo-image';

// 4. Services and utilities
import { audioService } from '@/services/audio';
import { formatTime } from '@/utils/format';

// 5. Store and hooks
import { usePlayerStore } from '@/store/player';
import { useTheme } from '@/hooks/useTheme';

// 6. Components
import { PlayButton } from '@/components/player';

// 7. Types
import type { PlaybackState } from '@/types/models';

// 8. Constants and assets
import { Colors } from '@/constants/theme';
```

## Component Structure
```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';

// 2. Types
interface ComponentProps {
  title: string;
  onPress: () => void;
}

// 3. Styled components (if using styled-components)
const Container = styled(View)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

// 4. Component
export const Component: React.FC<ComponentProps> = ({ title, onPress }) => {
  // 5. State
  const [isLoading, setIsLoading] = useState(false);

  // 6. Store hooks
  const playerState = usePlayerStore((state) => state.playerState);

  // 7. Custom hooks
  const theme = useTheme();

  // 8. Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // 9. Handlers
  const handlePress = () => {
    onPress();
  };

  // 10. Render
  return (
    <Container>
      {/* Component JSX */}
    </Container>
  );
};
```

## State Management Pattern
- Use Zustand or Redux Toolkit (to be decided)
- Separate stores by domain
- Keep stores small and focused
- Use selectors for derived state
- Implement persistence where needed

## API Integration Pattern
```typescript
// services/api/news.ts
export const newsApi = {
  async getNews(): Promise<News[]> {
    try {
      // Check cache first
      const cached = await cache.get('news');
      if (cached && !isExpired(cached)) {
        return cached.data;
      }

      // Fetch from API
      const response = await apiClient.get('/news');

      // Update cache
      await cache.set('news', response.data);

      return response.data;
    } catch (error) {
      // Return cached data on error
      const cached = await cache.get('news');
      if (cached) return cached.data;
      throw error;
    }
  }
};
```

## Testing Structure (When Required)
```
__tests__/
├── components/
│   └── player/
│       └── PlayButton.test.tsx
├── services/
│   └── audio/
│       └── player.test.ts
└── utils/
    └── format.test.ts
```

## Code Quality Rules
- No `console.log` in production
- No commented-out code
- No `any` types in TypeScript
- All async operations must have error handling
- All network requests must handle offline state
- All UI strings in Turkish using JSX expressions
- Components must be memoized when appropriate
- Lists must have proper keys
- No inline styles (use styled-components or theme)

## Git Conventions
- Feature branches: `feature/audio-player`
- Bug fixes: `fix/streaming-issue`
- Refactoring: `refactor/api-client`
- Commit messages in English
- Small, atomic commits
- Test before committing