# Radio API

## Overview
The Radio API provides endpoints for live radio streaming, current playing information, and program schedules. It includes fallback URLs and metadata for the currently playing tracks.

## Endpoints

### 1. Get Radio Stream Info

Retrieves the current radio stream information including URLs and now playing data.

**Endpoint:** `GET /radio`

**Production URL:** `https://trendankara.com/api/mobile/v1/radio`

#### Request
```javascript
GET https://trendankara.com/api/mobile/v1/radio
Headers:
  Accept: application/json
  X-Platform: ios
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "stream": {
      "primaryUrl": "https://trendankara.com/stream/live",
      "fallbackUrl": "https://backup.trendankara.com/stream/live",
      "format": "mp3",
      "bitrate": 128,
      "sampleRate": 44100
    },
    "nowPlaying": {
      "title": "Gece",
      "artist": "Duman",
      "album": "Belki Alışman Lazım",
      "artwork": "https://trendankara.com/api/media/artwork/duman-gece.jpg",
      "duration": 245,
      "startedAt": "2025-09-27T14:30:00.000Z",
      "endingAt": "2025-09-27T14:34:05.000Z",
      "listenersCount": 1523
    },
    "program": {
      "name": "Öğleden Sonra Keyfi",
      "presenter": "Cem Kurt",
      "description": "Günün en güzel şarkıları ile öğleden sonra keyfi",
      "imageUrl": "https://trendankara.com/api/media/programs/ogleden-sonra.jpg",
      "startTime": "14:00",
      "endTime": "17:00",
      "isLive": true
    },
    "nextProgram": {
      "name": "Akşam Esintileri",
      "presenter": "Ayşe Yılmaz",
      "startTime": "17:00",
      "endTime": "20:00"
    },
    "quality": {
      "options": [
        { "label": "Düşük", "bitrate": 64, "url": "https://trendankara.com/stream/low" },
        { "label": "Normal", "bitrate": 128, "url": "https://trendankara.com/stream/live" },
        { "label": "Yüksek", "bitrate": 320, "url": "https://trendankara.com/stream/high" }
      ],
      "recommended": 128
    }
  },
  "cache": {
    "etag": "\"radio-1695823800\"",
    "maxAge": 30
  }
}
```

### 2. Get Program Schedule

Retrieves the daily or weekly program schedule.

**Endpoint:** `GET /radio/schedule`

**Production URL:** `https://trendankara.com/api/mobile/v1/radio/schedule`

#### Request
```javascript
GET https://trendankara.com/api/mobile/v1/radio/schedule?day=monday
Headers:
  Accept: application/json
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| day | string | No | Day of week (monday-sunday). If not provided, returns today's schedule |
| week | boolean | No | If true, returns full week schedule |

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "day": "monday",
    "date": "2025-09-27",
    "programs": [
      {
        "id": 1,
        "name": "Günaydın Ankara",
        "presenter": "Ali Yılmaz",
        "description": "Güne enerjik başlamak için en güzel şarkılar",
        "startTime": "07:00",
        "endTime": "10:00",
        "imageUrl": "https://trendankara.com/api/media/programs/gunaydin.jpg",
        "isLive": false,
        "isRepeat": false
      },
      {
        "id": 2,
        "name": "Sabah Klasikleri",
        "presenter": "Mehmet Öz",
        "description": "Unutulmaz klasiklerle sabah keyfi",
        "startTime": "10:00",
        "endTime": "12:00",
        "imageUrl": "https://trendankara.com/api/media/programs/klasikler.jpg",
        "isLive": false,
        "isRepeat": false
      },
      {
        "id": 3,
        "name": "Öğle Arası",
        "presenter": "Selin Demir",
        "description": "Öğle arasında dinlendiren müzikler",
        "startTime": "12:00",
        "endTime": "14:00",
        "imageUrl": "https://trendankara.com/api/media/programs/ogle-arasi.jpg",
        "isLive": false,
        "isRepeat": false
      }
    ]
  },
  "cache": {
    "etag": "\"schedule-monday\"",
    "maxAge": 3600
  }
}
```

### 3. Get Song History

Retrieves recently played songs.

**Endpoint:** `GET /radio/history`

**Production URL:** `https://trendankara.com/api/mobile/v1/radio/history`

#### Request
```javascript
GET https://trendankara.com/api/mobile/v1/radio/history?limit=20
Headers:
  Accept: application/json
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of songs to return (default: 10, max: 50) |

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "songs": [
      {
        "title": "Gece",
        "artist": "Duman",
        "album": "Belki Alışman Lazım",
        "artwork": "https://trendankara.com/api/media/artwork/duman-gece.jpg",
        "playedAt": "2025-09-27T14:30:00.000Z",
        "duration": 245
      },
      {
        "title": "Bir Derdim Var",
        "artist": "Mor ve Ötesi",
        "album": "Dünya Yalan Söylüyor",
        "artwork": "https://trendankara.com/api/media/artwork/morveotesi-birderdim.jpg",
        "playedAt": "2025-09-27T14:26:00.000Z",
        "duration": 223
      }
    ],
    "total": 2
  },
  "cache": {
    "etag": "\"history-1695823800\"",
    "maxAge": 60
  }
}
```

## React Native Implementation

### Radio Service
```javascript
// services/radioService.js
import apiClient from '../api/authenticatedClient';
import TrackPlayer, { Capability, State } from 'react-native-track-player';

class RadioService {
  constructor() {
    this.isInitialized = false;
    this.currentStreamUrl = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await TrackPlayer.setupPlayer({
        waitForBuffer: true
      });

      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause
        ],
        stopWithApp: true
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize player:', error);
    }
  }

  async getRadioInfo() {
    try {
      const response = await apiClient.get('/radio');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getSchedule(day = null) {
    try {
      const params = day ? { day } : {};
      const response = await apiClient.get('/radio/schedule', params);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getHistory(limit = 10) {
    try {
      const response = await apiClient.get('/radio/history', { limit });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async startStream(streamUrl, trackInfo = {}) {
    await this.initialize();

    try {
      // Stop current stream if playing
      await TrackPlayer.reset();

      // Add radio stream as track
      await TrackPlayer.add({
        id: 'radio-stream',
        url: streamUrl,
        title: trackInfo.title || 'Trend Ankara',
        artist: trackInfo.artist || 'Canlı Yayın',
        artwork: trackInfo.artwork || require('../assets/radio-default.png'),
        isLiveStream: true
      });

      // Start playback
      await TrackPlayer.play();
      this.currentStreamUrl = streamUrl;

    } catch (error) {
      console.error('Failed to start stream:', error);
      throw error;
    }
  }

  async stopStream() {
    try {
      await TrackPlayer.stop();
      await TrackPlayer.reset();
      this.currentStreamUrl = null;
    } catch (error) {
      console.error('Failed to stop stream:', error);
    }
  }

  async pauseStream() {
    try {
      await TrackPlayer.pause();
    } catch (error) {
      console.error('Failed to pause stream:', error);
    }
  }

  async resumeStream() {
    try {
      await TrackPlayer.play();
    } catch (error) {
      console.error('Failed to resume stream:', error);
    }
  }

  async getPlaybackState() {
    try {
      const state = await TrackPlayer.getState();
      return state;
    } catch (error) {
      return State.None;
    }
  }
}

export default new RadioService();
```

### Radio Player Screen
```javascript
// screens/RadioScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Animated
} from 'react-native';
import { State, usePlaybackState, useProgress } from 'react-native-track-player';
import Icon from 'react-native-vector-icons/MaterialIcons';
import radioService from '../services/radioService';

const RadioScreen = () => {
  const [radioInfo, setRadioInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(128);
  const playbackState = usePlaybackState();
  const { position, duration } = useProgress();
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    loadRadioInfo();
    startAnimation();
  }, []);

  useEffect(() => {
    // Update now playing info periodically
    const interval = setInterval(loadRadioInfo, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const startAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true
        })
      ])
    ).start();
  };

  const loadRadioInfo = async () => {
    try {
      const response = await radioService.getRadioInfo();

      if (response.success && response.data) {
        setRadioInfo(response.data);

        // Find current quality URL
        const qualityOption = response.data.quality.options.find(
          opt => opt.bitrate === selectedQuality
        ) || response.data.quality.options[1];

        // Update track info if already playing
        if (playbackState === State.Playing) {
          // Update metadata without interrupting stream
          await radioService.updateMetadata({
            title: response.data.nowPlaying?.title || 'Trend Ankara',
            artist: response.data.nowPlaying?.artist || 'Canlı Yayın',
            artwork: response.data.nowPlaying?.artwork
          });
        }
      }
    } catch (error) {
      console.error('Failed to load radio info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (playbackState === State.Playing) {
      await radioService.pauseStream();
    } else if (playbackState === State.Paused) {
      await radioService.resumeStream();
    } else {
      // Start stream
      setIsBuffering(true);
      try {
        const qualityOption = radioInfo.quality.options.find(
          opt => opt.bitrate === selectedQuality
        );

        await radioService.startStream(
          qualityOption?.url || radioInfo.stream.primaryUrl,
          {
            title: radioInfo.nowPlaying?.title,
            artist: radioInfo.nowPlaying?.artist,
            artwork: radioInfo.nowPlaying?.artwork
          }
        );
      } catch (error) {
        Alert.alert('Hata', 'Yayın başlatılamadı. Lütfen tekrar deneyin.');
      } finally {
        setIsBuffering(false);
      }
    }
  };

  const handleQualityChange = async (bitrate) => {
    setSelectedQuality(bitrate);

    if (playbackState === State.Playing) {
      const qualityOption = radioInfo.quality.options.find(
        opt => opt.bitrate === bitrate
      );

      if (qualityOption) {
        setIsBuffering(true);
        await radioService.startStream(qualityOption.url, radioInfo.nowPlaying);
        setIsBuffering(false);
      }
    }
  };

  const isPlaying = playbackState === State.Playing;
  const isPaused = playbackState === State.Paused;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1]
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Album Artwork */}
      <View style={styles.artworkContainer}>
        {isPlaying && (
          <Animated.View style={[styles.liveIndicator, { transform: [{ scale }] }]}>
            <Text style={styles.liveText}>CANLI</Text>
          </Animated.View>
        )}
        <Image
          source={{
            uri: radioInfo?.nowPlaying?.artwork ||
                 radioInfo?.program?.imageUrl ||
                 'https://trendankara.com/api/media/radio-default.jpg'
          }}
          style={styles.artwork}
        />
      </View>

      {/* Now Playing Info */}
      <View style={styles.infoContainer}>
        {radioInfo?.nowPlaying ? (
          <>
            <Text style={styles.title}>{radioInfo.nowPlaying.title}</Text>
            <Text style={styles.artist}>{radioInfo.nowPlaying.artist}</Text>
            {radioInfo.nowPlaying.album && (
              <Text style={styles.album}>{radioInfo.nowPlaying.album}</Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.title}>Trend Ankara</Text>
            <Text style={styles.artist}>Canlı Yayın</Text>
          </>
        )}

        {radioInfo?.nowPlaying?.listenersCount && (
          <Text style={styles.listeners}>
            <Icon name="headset" size={16} /> {radioInfo.nowPlaying.listenersCount} dinleyici
          </Text>
        )}
      </View>

      {/* Player Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlayPause}
          disabled={isBuffering}
        >
          {isBuffering ? (
            <ActivityIndicator size="large" color="#FFF" />
          ) : (
            <Icon
              name={isPlaying ? "pause" : "play-arrow"}
              size={48}
              color="#FFF"
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Quality Selector */}
      <View style={styles.qualityContainer}>
        <Text style={styles.qualityTitle}>Yayın Kalitesi</Text>
        <View style={styles.qualityButtons}>
          {radioInfo?.quality?.options.map(option => (
            <TouchableOpacity
              key={option.bitrate}
              style={[
                styles.qualityButton,
                selectedQuality === option.bitrate && styles.qualityButtonActive
              ]}
              onPress={() => handleQualityChange(option.bitrate)}
            >
              <Text style={[
                styles.qualityButtonText,
                selectedQuality === option.bitrate && styles.qualityButtonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Current Program */}
      {radioInfo?.program && (
        <View style={styles.programContainer}>
          <Text style={styles.sectionTitle}>Şu Anki Program</Text>
          <View style={styles.programCard}>
            <Image
              source={{ uri: radioInfo.program.imageUrl }}
              style={styles.programImage}
            />
            <View style={styles.programInfo}>
              <Text style={styles.programName}>{radioInfo.program.name}</Text>
              <Text style={styles.programPresenter}>{radioInfo.program.presenter}</Text>
              <Text style={styles.programTime}>
                {radioInfo.program.startTime} - {radioInfo.program.endTime}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Next Program */}
      {radioInfo?.nextProgram && (
        <View style={styles.nextProgramContainer}>
          <Text style={styles.sectionTitle}>Sıradaki Program</Text>
          <Text style={styles.nextProgramName}>{radioInfo.nextProgram.name}</Text>
          <Text style={styles.nextProgramInfo}>
            {radioInfo.nextProgram.presenter} • {radioInfo.nextProgram.startTime}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: 40,
    position: 'relative',
  },
  artwork: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 4,
    borderColor: '#E91E63',
  },
  liveIndicator: {
    position: 'absolute',
    top: -10,
    right: 60,
    backgroundColor: '#E91E63',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1,
  },
  liveText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  artist: {
    fontSize: 18,
    color: '#CCC',
    textAlign: 'center',
    marginBottom: 4,
  },
  album: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  listeners: {
    fontSize: 14,
    color: '#E91E63',
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  qualityContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  qualityTitle: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  qualityButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  qualityButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#666',
  },
  qualityButtonActive: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  qualityButtonText: {
    color: '#999',
    fontSize: 14,
  },
  qualityButtonTextActive: {
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  programContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  programCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  programImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  programPresenter: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 4,
  },
  programTime: {
    fontSize: 12,
    color: '#999',
  },
  nextProgramContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  nextProgramName: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 4,
  },
  nextProgramInfo: {
    fontSize: 14,
    color: '#999',
  },
});

export default RadioScreen;
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Stream connection failed | Network issues or server down | Try fallback URL |
| Audio playback error | Unsupported format or codec | Check device compatibility |
| Buffering issues | Slow connection | Switch to lower quality |
| Metadata not updating | API connection issues | Use cached data |

## Best Practices

1. **Stream Management**: Always provide fallback URLs for reliability
2. **Quality Selection**: Detect network speed and suggest appropriate quality
3. **Background Playback**: Configure proper background modes for iOS/Android
4. **Lock Screen Controls**: Display now playing info on lock screen
5. **Audio Focus**: Handle audio focus properly with other apps
6. **Buffering**: Show clear buffering states to users
7. **Error Recovery**: Automatically retry with fallback URLs on failure