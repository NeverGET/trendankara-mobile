import { useState, useEffect, useRef } from 'react';

interface NowPlayingInfo {
  title?: string;
  artist?: string;
  song?: string;
}

export const useNowPlaying = (metadataUrl?: string) => {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!metadataUrl) {
      console.log('[useNowPlaying] No metadataUrl provided');
      return;
    }

    console.log('[useNowPlaying] Starting with URL:', metadataUrl);
    let isMounted = true;

    const fetchMetadata = async () => {
      // Abort previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        if (isMounted) {
          setIsLoading(true);
        }

        console.log('[useNowPlaying] Fetching metadata from:', metadataUrl);
        const response = await fetch(metadataUrl, {
          signal: abortControllerRef.current.signal,
          // Add timeout to prevent hanging requests
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        console.log('[useNowPlaying] Response status:', response.status);

        // Add timeout for the response
        const timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }, 5000); // 5 second timeout

        const text = await response.text();
        clearTimeout(timeoutId);

        console.log('[useNowPlaying] Received text:', text);

        // Parse the metadata (usually comes as plain text or JSON)
        // Common formats: "Artist - Song" or JSON with title/artist fields
        if (text && isMounted) {
          // Try to parse as JSON first
          try {
            const json = JSON.parse(text);
            console.log('[useNowPlaying] Parsed JSON:', json);

            // Check if it's the TrendAnkara format: {"nowPlaying":"SONG - ARTIST"}
            if (json.nowPlaying) {
              const nowPlayingText = json.nowPlaying;
              const parts = nowPlayingText.split(' - ');
              if (parts.length >= 2) {
                const newData = {
                  song: parts[0].trim(),
                  artist: parts[1].trim(),
                  title: nowPlayingText,
                };
                console.log('[useNowPlaying] Setting now playing (TrendAnkara format):', newData);
                setNowPlaying(newData);
              } else {
                const newData = {
                  title: nowPlayingText.trim(),
                  song: nowPlayingText.trim(),
                };
                console.log('[useNowPlaying] Setting now playing (single field):', newData);
                setNowPlaying(newData);
              }
            } else {
              // Standard JSON format
              const newData = {
                title: json.title || json.song,
                artist: json.artist,
                song: json.song || json.title,
              };
              console.log('[useNowPlaying] Setting now playing (standard format):', newData);
              setNowPlaying(newData);
            }
          } catch {
            // If not JSON, assume it's plain text format "SONG - ARTIST"
            console.log('[useNowPlaying] Not JSON, parsing as plain text');
            const parts = text.split(' - ');
            if (parts.length >= 2) {
              const newData = {
                song: parts[0].trim(),  // First part is the song name
                artist: parts.slice(1).join(' - ').trim(),  // Rest is the artist name
                title: text,
              };
              console.log('[useNowPlaying] Setting now playing (plain text):', newData);
              setNowPlaying(newData);
            } else {
              const newData = {
                title: text.trim(),
                song: text.trim(),
              };
              console.log('[useNowPlaying] Setting now playing (single text):', newData);
              setNowPlaying(newData);
            }
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching now playing metadata:', error);
          if (isMounted) {
            setNowPlaying(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Fetch immediately
    fetchMetadata();

    // Set up polling interval (every 5 seconds to match stream delay)
    // Using 5000ms to sync with the ~5 second playback delay
    intervalRef.current = setInterval(fetchMetadata, 5000);

    return () => {
      isMounted = false;

      // Clean up interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [metadataUrl]);

  return { nowPlaying, isLoading };
};