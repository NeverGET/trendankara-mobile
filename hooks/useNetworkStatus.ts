/**
 * Network Status Hook
 *
 * Provides network connectivity information and utilities
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: NetInfoStateType;
  isWifi: boolean;
  isCellular: boolean;
  isOnline: boolean;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent' | 'unknown';
}

interface NetworkHookOptions {
  checkReachability?: boolean;
  reachabilityUrl?: string;
  reachabilityTimeout?: number;
  enableConnectionQualityCheck?: boolean;
}

const DEFAULT_OPTIONS: NetworkHookOptions = {
  checkReachability: true,
  reachabilityUrl: 'https://clients3.google.com/generate_204',
  reachabilityTimeout: 5000,
  enableConnectionQualityCheck: false,
};

export const useNetworkStatus = (options: NetworkHookOptions = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options };

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: false,
    isInternetReachable: false,
    type: NetInfoStateType.unknown,
    isWifi: false,
    isCellular: false,
    isOnline: false,
    connectionQuality: 'unknown',
  });

  const [isLoading, setIsLoading] = useState(true);

  // Convert NetInfo state to our format
  const convertNetInfoState = useCallback((state: NetInfoState): NetworkStatus => {
    const isConnected = state.isConnected ?? false;
    const isInternetReachable = state.isInternetReachable ?? false;
    const type = state.type;
    const isWifi = type === NetInfoStateType.wifi;
    const isCellular = type === NetInfoStateType.cellular;
    const isOnline = isConnected && isInternetReachable;

    // Determine connection quality based on type and details
    let connectionQuality: 'poor' | 'fair' | 'good' | 'excellent' | 'unknown' = 'unknown';

    if (!isOnline) {
      connectionQuality = 'poor';
    } else if (isWifi) {
      connectionQuality = 'excellent';
    } else if (isCellular) {
      // Try to determine cellular quality from details
      if (state.details && typeof state.details === 'object' && 'cellularGeneration' in state.details) {
        const generation = (state.details as any).cellularGeneration;
        switch (generation) {
          case '5g':
            connectionQuality = 'excellent';
            break;
          case '4g':
            connectionQuality = 'good';
            break;
          case '3g':
            connectionQuality = 'fair';
            break;
          case '2g':
            connectionQuality = 'poor';
            break;
          default:
            connectionQuality = 'fair';
        }
      } else {
        connectionQuality = 'good'; // Default for cellular
      }
    } else {
      connectionQuality = 'fair';
    }

    return {
      isConnected,
      isInternetReachable,
      type,
      isWifi,
      isCellular,
      isOnline,
      connectionQuality,
    };
  }, []);

  // Check connection quality by measuring response time
  const checkConnectionQuality = useCallback(async (): Promise<'poor' | 'fair' | 'good' | 'excellent'> => {
    if (!config.enableConnectionQualityCheck) {
      return networkStatus.connectionQuality as any;
    }

    try {
      const startTime = Date.now();

      const response = await fetch(config.reachabilityUrl!, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(config.reachabilityTimeout!),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Categorize based on response time
      if (responseTime < 200) return 'excellent';
      if (responseTime < 500) return 'good';
      if (responseTime < 1000) return 'fair';
      return 'poor';
    } catch {
      return 'poor';
    }
  }, [config, networkStatus.connectionQuality]);

  // Force refresh network status
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const state = await NetInfo.fetch();
      const status = convertNetInfoState(state);

      if (config.enableConnectionQualityCheck && status.isOnline) {
        const quality = await checkConnectionQuality();
        status.connectionQuality = quality;
      }

      setNetworkStatus(status);
    } catch (error) {
      console.error('Failed to refresh network status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [convertNetInfoState, checkConnectionQuality, config.enableConnectionQualityCheck]);

  // Initialize network status monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const status = convertNetInfoState(state);
      setNetworkStatus(status);
      setIsLoading(false);
    });

    // Initial fetch
    refresh();

    return unsubscribe;
  }, [convertNetInfoState, refresh]);

  return {
    networkStatus,
    isLoading,
    refresh,
    // Convenience getters
    isOnline: networkStatus.isOnline,
    isOffline: !networkStatus.isOnline,
    isWifi: networkStatus.isWifi,
    isCellular: networkStatus.isCellular,
    connectionType: networkStatus.type,
    connectionQuality: networkStatus.connectionQuality,
  };
};

// Hook for tracking network state changes
export const useNetworkStateTracker = () => {
  const [connectionHistory, setConnectionHistory] = useState<{
    timestamp: number;
    status: 'online' | 'offline';
    type: NetInfoStateType;
  }[]>([]);

  const { networkStatus } = useNetworkStatus();

  useEffect(() => {
    const newEntry = {
      timestamp: Date.now(),
      status: networkStatus.isOnline ? 'online' as const : 'offline' as const,
      type: networkStatus.type,
    };

    setConnectionHistory(prev => {
      const updated = [...prev, newEntry];
      // Keep only last 50 entries
      return updated.slice(-50);
    });
  }, [networkStatus.isOnline, networkStatus.type]);

  const getDowntimeInLast24Hours = useCallback(() => {
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const recentHistory = connectionHistory.filter(entry => entry.timestamp > last24Hours);

    let totalDowntime = 0;
    let lastOfflineTime: number | null = null;

    for (const entry of recentHistory) {
      if (entry.status === 'offline') {
        lastOfflineTime = entry.timestamp;
      } else if (lastOfflineTime) {
        totalDowntime += entry.timestamp - lastOfflineTime;
        lastOfflineTime = null;
      }
    }

    // If currently offline, add time since last offline event
    if (!networkStatus.isOnline && lastOfflineTime) {
      totalDowntime += Date.now() - lastOfflineTime;
    }

    return totalDowntime;
  }, [connectionHistory, networkStatus.isOnline]);

  const getConnectionStats = useCallback(() => {
    const totalEntries = connectionHistory.length;
    const offlineEntries = connectionHistory.filter(entry => entry.status === 'offline').length;
    const onlineEntries = totalEntries - offlineEntries;

    return {
      totalEntries,
      onlineEntries,
      offlineEntries,
      onlinePercentage: totalEntries > 0 ? (onlineEntries / totalEntries) * 100 : 0,
      downtimeInLast24Hours: getDowntimeInLast24Hours(),
    };
  }, [connectionHistory, getDowntimeInLast24Hours]);

  return {
    connectionHistory,
    getConnectionStats,
    getDowntimeInLast24Hours,
  };
};

// Hook for handling offline/online actions
export const useOfflineHandler = (options: {
  onOnline?: () => void;
  onOffline?: () => void;
  retryOnReconnect?: boolean;
  queueOfflineActions?: boolean;
} = {}) => {
  const { isOnline, isOffline } = useNetworkStatus();
  const [pendingActions, setPendingActions] = useState<(() => void)[]>([]);

  // Handle online/offline events
  useEffect(() => {
    if (isOnline && options.onOnline) {
      options.onOnline();

      // Execute pending actions if configured
      if (options.retryOnReconnect && pendingActions.length > 0) {
        pendingActions.forEach(action => {
          try {
            action();
          } catch (error) {
            console.error('Error executing pending action:', error);
          }
        });
        setPendingActions([]);
      }
    }

    if (isOffline && options.onOffline) {
      options.onOffline();
    }
  }, [isOnline, isOffline, options, pendingActions]);

  // Queue an action to be executed when back online
  const queueAction = useCallback((action: () => void) => {
    if (options.queueOfflineActions && isOffline) {
      setPendingActions(prev => [...prev, action]);
    } else if (isOnline) {
      action();
    }
  }, [isOffline, isOnline, options.queueOfflineActions]);

  // Clear pending actions
  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
  }, []);

  return {
    isOnline,
    isOffline,
    queueAction,
    pendingActions,
    clearPendingActions,
    hasPendingActions: pendingActions.length > 0,
  };
};