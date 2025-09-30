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
    if (!metadataUrl) return;

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

        const response = await fetch(metadataUrl, {
          signal: abortControllerRef.current.signal,
          // Add timeout to prevent hanging requests
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        // Add timeout for the response
        const timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }, 5000); // 5 second timeout

        const text = await response.text();
        clearTimeout(timeoutId);

        // Parse the metadata (usually comes as plain text or JSON)
        // Common formats: "Artist - Song" or JSON with title/artist fields
        if (text && isMounted) {
          // Try to parse as JSON first
          try {
            const json = JSON.parse(text);
            setNowPlaying({
              title: json.title || json.song,
              artist: json.artist,
              song: json.song || json.title,
            });
          } catch {
            // If not JSON, assume it's plain text format "Artist - Song"
            const parts = text.split(' - ');
            if (parts.length >= 2) {
              setNowPlaying({
                artist: parts[0].trim(),
                song: parts.slice(1).join(' - ').trim(),
                title: text,
              });
            } else {
              setNowPlaying({
                title: text.trim(),
                song: text.trim(),
              });
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

    // Set up polling interval (every 60 seconds instead of 30 to reduce memory usage)
    intervalRef.current = setInterval(fetchMetadata, 60000);

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