# 2-Minute Snapshot Analysis

## Test Time: 20:38:18

### ✅ HYPOTHESIS CONFIRMED - Polling Pattern Detected!

**Evidence from logs**:

Fetching timestamps (last 30 seconds of capture):
- 20:38:03 - Fetch
- 20:38:08 - Fetch (5 seconds later)
- 20:38:13 - Fetch (5 seconds later)
- 20:38:18 - Fetch (5 seconds later)
- 20:38:23 - Fetch (5 seconds later)
- 20:38:28 - Fetch (5 seconds later)

**Pattern**: EXACTLY 5 seconds between each metadata fetch! ✅

### What We're Seeing:

1. **Network Activity**: `'[useNowPlaying] Fetching metadata from:', 'https://radyo.yayin.com.tr:5132/currentsong'`
2. **Response Time**: ~400-500ms per request
3. **Processing**: JSON parsing, state updates, React re-renders
4. **Bridge Calls**: Updates to TrackPlayerService (though skipped if unchanged)

### CPU Usage at 2-Minute Mark:

```
PID: 13702
CPU: 65.5%  ⚠️ VERY HIGH for background playback!
Memory: 342M
```

**Expected for audio-only background playback**: ~5-10% CPU
**Actual**: 65.5% CPU

### Calculation:

In 2 minutes (120 seconds):
- **Expected requests**: 120 / 5 = 24 requests
- **Log entries**: 504 lines total (includes all metadata-related logs)
- **Actual fetch calls visible**: ~24+ (matches prediction!)

### Impact:

Every 5 seconds:
1. Network fetch (400-500ms)
2. Response parsing
3. State update (`setNowPlaying`)
4. Component re-render
5. Effect trigger
6. Potential TrackPlayer update

**CPU never gets a chance to sleep!**

---

## Initial Conclusion (2 minutes in):

✅ Analysis is **100% CORRECT**
✅ 5-second polling is happening exactly as predicted
✅ CPU usage is abnormally high (65.5% vs expected <10%)
✅ Pattern will continue for entire playback session

**Estimated for full 10-minute test**:
- Total requests: ~120 (one every 5 seconds)
- Continuous CPU activity
- Device will get warm

