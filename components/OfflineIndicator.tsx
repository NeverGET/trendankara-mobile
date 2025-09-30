import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface OfflineIndicatorProps {
  showWhenOnline?: boolean;
  autoHideDelay?: number;
  position?: 'top' | 'bottom';
  style?: any;
  onRetry?: () => void;
  minimumOfflineTime?: number;
}

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string | null;
  wasOffline: boolean;
  offlineStartTime: number | null;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showWhenOnline = true,
  autoHideDelay = 3000,
  position = 'top',
  style,
  onRetry,
  minimumOfflineTime = 2000, // Don't show for quick disconnections
}) => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
    wasOffline: false,
    offlineStartTime: null,
  });

  const [slideAnim] = useState(new Animated.Value(-100));
  const [visible, setVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable ?? false;
      const isActuallyOnline = isConnected && isInternetReachable;

      setNetworkState(prevState => {
        const now = Date.now();
        let newOfflineStartTime = prevState.offlineStartTime;

        // If going offline and wasn't offline before
        if (!isActuallyOnline && prevState.isConnected) {
          newOfflineStartTime = now;
        }

        // If coming back online
        if (isActuallyOnline && !prevState.isConnected) {
          newOfflineStartTime = null;
        }

        return {
          isConnected: isConnected,
          isInternetReachable: isInternetReachable,
          type: state.type,
          wasOffline: prevState.wasOffline || !isActuallyOnline,
          offlineStartTime: newOfflineStartTime,
        };
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const isOffline = !networkState.isConnected || !networkState.isInternetReachable;
    const isOnline = networkState.isConnected && networkState.isInternetReachable;
    const justCameOnline = isOnline && networkState.wasOffline;

    // Determine if we should show the indicator
    let shouldShowIndicator = false;

    if (isOffline && networkState.offlineStartTime) {
      // Only show offline indicator if we've been offline for minimum time
      const offlineTime = Date.now() - networkState.offlineStartTime;
      shouldShowIndicator = offlineTime >= minimumOfflineTime;
    } else if (justCameOnline && showWhenOnline) {
      // Show "back online" message
      shouldShowIndicator = true;
    }

    setShouldShow(shouldShowIndicator);
  }, [networkState, minimumOfflineTime, showWhenOnline]);

  useEffect(() => {
    if (shouldShow) {
      setVisible(true);
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Auto hide for online message
      if (networkState.isConnected && networkState.isInternetReachable && autoHideDelay > 0) {
        const timer = setTimeout(() => {
          handleHide();
        }, autoHideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      handleHide();
    }
  }, [shouldShow, networkState.isConnected, networkState.isInternetReachable, autoHideDelay]);

  const handleHide = () => {
    Animated.timing(slideAnim, {
      toValue: position === 'top' ? -100 : 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      // Reset wasOffline flag after hiding
      if (networkState.isConnected && networkState.isInternetReachable) {
        setNetworkState(prev => ({ ...prev, wasOffline: false }));
      }
    });
  };

  const handleRetry = () => {
    onRetry?.();
    // Check network state again
    NetInfo.fetch().then(state => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable ?? false;

      if (isConnected && isInternetReachable) {
        handleHide();
      }
    });
  };

  if (!visible) {
    return null;
  }

  const isOffline = !networkState.isConnected || !networkState.isInternetReachable;
  const isOnline = networkState.isConnected && networkState.isInternetReachable;

  const getIndicatorStyle = () => {
    const baseStyle = [
      styles.container,
      position === 'top' ? styles.top : styles.bottom,
      isOffline ? styles.offline : styles.online,
      style,
    ];

    return baseStyle;
  };

  const getMessage = () => {
    if (isOffline) {
      return 'No internet connection';
    } else if (isOnline && networkState.wasOffline) {
      return 'Back online';
    }
    return 'Checking connection...';
  };

  const getIcon = () => {
    if (isOffline) {
      return 'cloud-offline-outline';
    } else if (isOnline) {
      return 'cloud-done-outline';
    }
    return 'cloud-outline';
  };

  const getConnectionType = () => {
    if (!networkState.type) return '';

    const typeMap: Record<string, string> = {
      wifi: 'Wi-Fi',
      cellular: 'Mobile Data',
      ethernet: 'Ethernet',
      bluetooth: 'Bluetooth',
      other: 'Other',
      unknown: 'Unknown',
      none: 'None',
    };

    return typeMap[networkState.type] || networkState.type;
  };

  return (
    <Animated.View
      style={[
        getIndicatorStyle(),
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getIcon() as any}
            size={20}
            color={isOffline ? '#FFFFFF' : '#000000'}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.message, isOffline ? styles.offlineText : styles.onlineText]}>
            {getMessage()}
          </Text>
          {networkState.type && (
            <Text style={[styles.subtext, isOffline ? styles.offlineSubtext : styles.onlineSubtext]}>
              {getConnectionType()}
            </Text>
          )}
        </View>

        {isOffline && onRetry && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            accessibilityLabel="Retry connection"
            accessibilityRole="button"
          >
            <Ionicons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}

        {!isOffline && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleHide}
            accessibilityLabel="Dismiss notification"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={16} color="#000000" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  top: {
    top: Platform.OS === 'ios' ? 44 : 0, // Account for status bar
  },
  bottom: {
    bottom: Platform.OS === 'ios' ? 34 : 0, // Account for home indicator
  },
  offline: {
    backgroundColor: '#FF6B6B',
  },
  online: {
    backgroundColor: '#51CF66',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
  },
  offlineText: {
    color: '#FFFFFF',
  },
  onlineText: {
    color: '#000000',
  },
  subtext: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  offlineSubtext: {
    color: '#FFFFFF',
  },
  onlineSubtext: {
    color: '#000000',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    marginLeft: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default OfflineIndicator;