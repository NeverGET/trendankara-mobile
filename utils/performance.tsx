import React from 'react';
import { InteractionManager, PixelRatio } from 'react-native';
import * as Device from 'expo-device';

/**
 * Performance monitoring utilities for React Native app
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface RenderMetrics {
  componentName: string;
  renderTime: number;
  reRenderCount: number;
  timestamp: number;
}

interface MemoryMetrics {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  timestamp: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private renderMetrics: Map<string, RenderMetrics> = new Map();
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(options: {
    memoryCheckInterval?: number;
    enableRenderTracking?: boolean;
    enableNetworkTracking?: boolean;
  } = {}) {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    const {
      memoryCheckInterval = 30000, // 30 seconds
      enableRenderTracking = true,
      enableNetworkTracking = true,
    } = options;

    // Start memory monitoring
    this.startMemoryMonitoring(memoryCheckInterval);

    // Log device info for context
    this.logDeviceInfo();

    if (__DEV__) { console.log('Performance monitoring started'); }
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    if (__DEV__) { console.log('Performance monitoring stopped'); }
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    if (__DEV__) {
      console.log(`Metric [${name}]: ${value}`, metadata);
    }
  }

  /**
   * Measure function execution time
   */
  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();

    return fn().then(
      (result) => {
        const endTime = performance.now();
        this.recordMetric(`${name}_duration`, endTime - startTime, { status: 'success' });
        return result;
      },
      (error) => {
        const endTime = performance.now();
        this.recordMetric(`${name}_duration`, endTime - startTime, { status: 'error', error: error.message });
        throw error;
      }
    );
  }

  /**
   * Measure synchronous function execution time
   */
  measure<T>(name: string, fn: () => T): T {
    const startTime = performance.now();

    try {
      const result = fn();
      const endTime = performance.now();
      this.recordMetric(`${name}_duration`, endTime - startTime, { status: 'success' });
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordMetric(`${name}_duration`, endTime - startTime, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Track component render performance
   */
  trackRender(componentName: string, renderTime: number) {
    const existing = this.renderMetrics.get(componentName);

    if (existing) {
      existing.reRenderCount++;
      existing.renderTime = renderTime;
      existing.timestamp = Date.now();
    } else {
      this.renderMetrics.set(componentName, {
        componentName,
        renderTime,
        reRenderCount: 1,
        timestamp: Date.now(),
      });
    }

    // Log slow renders in development
    if (__DEV__ && renderTime > 16) { // 16ms = 60fps threshold
      console.warn(`🐌 Slow render [${componentName}]: ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get current memory usage (if available)
   */
  getMemoryUsage(): MemoryMetrics {
    const timestamp = Date.now();

    // Note: React Native doesn't expose memory usage by default
    // This would need to be implemented with native modules
    if (global.performance && (global.performance as any).memory) {
      const memory = (global.performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp,
      };
    }

    return { timestamp };
  }

  /**
   * Start monitoring memory usage
   */
  private startMemoryMonitoring(interval: number) {
    this.memoryCheckInterval = setInterval(() => {
      const memoryUsage = this.getMemoryUsage();

      if (memoryUsage.usedJSHeapSize) {
        this.recordMetric('memory_used_mb', memoryUsage.usedJSHeapSize / (1024 * 1024));

        // Warn about high memory usage
        if (memoryUsage.usedJSHeapSize && memoryUsage.jsHeapSizeLimit) {
          const usagePercent = (memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100;
          if (usagePercent > 80) {
            console.warn(`High memory usage: ${usagePercent.toFixed(1)}%`);
          }
        }
      }
    }, interval);
  }

  /**
   * Log device information for performance context
   */
  private logDeviceInfo() {
    const deviceInfo = {
      brand: Device.brand,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      platformApiLevel: Device.platformApiLevel,
      deviceType: Device.deviceType,
      pixelRatio: PixelRatio.get(),
      fontScale: PixelRatio.getFontScale(),
    };

    this.recordMetric('device_info', 1, deviceInfo);
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const now = Date.now();
    const last5Minutes = now - 5 * 60 * 1000;

    const recentMetrics = this.metrics.filter(m => m.timestamp > last5Minutes);
    const renderMetricsArray = Array.from(this.renderMetrics.values());

    return {
      totalMetrics: this.metrics.length,
      recentMetrics: recentMetrics.length,
      avgRenderTime: this.calculateAverageRenderTime(renderMetricsArray),
      slowComponents: renderMetricsArray.filter(r => r.renderTime > 16),
      memoryUsage: this.getMemoryUsage(),
      isMonitoring: this.isMonitoring,
    };
  }

  /**
   * Calculate average render time across components
   */
  private calculateAverageRenderTime(metrics: RenderMetrics[]): number {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + m.renderTime, 0);
    return total / metrics.length;
  }

  /**
   * Clear all collected metrics
   */
  clearMetrics() {
    this.metrics = [];
    this.renderMetrics.clear();
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics() {
    return {
      metrics: [...this.metrics],
      renderMetrics: Array.from(this.renderMetrics.values()),
      summary: this.getSummary(),
      exportedAt: new Date().toISOString(),
    };
  }
}

/**
 * Hook for tracking component render performance
 */
export const useRenderTracking = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();

  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      monitor.trackRender(componentName, endTime - startTime);
    };
  });
};

/**
 * Higher-order component for automatic render tracking
 */
export const withRenderTracking = <P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const componentName = displayName || Component.displayName || Component.name || 'Unknown';
    useRenderTracking(componentName);

    return <Component {...props} ref={ref} />;
  });

  WrappedComponent.displayName = `withRenderTracking(${displayName || Component.displayName || Component.name})`;

  return WrappedComponent;
};

/**
 * Utility to measure interaction response time
 */
export const measureInteraction = (name: string, callback: () => void) => {
  const startTime = performance.now();

  InteractionManager.runAfterInteractions(() => {
    const endTime = performance.now();
    PerformanceMonitor.getInstance().recordMetric(
      `interaction_${name}_delay`,
      endTime - startTime
    );
  });

  callback();
};

/**
 * Utility to track navigation performance
 */
export const trackNavigation = (screenName: string, startTime: number) => {
  InteractionManager.runAfterInteractions(() => {
    const endTime = performance.now();
    PerformanceMonitor.getInstance().recordMetric(
      'navigation_time',
      endTime - startTime,
      { screen: screenName }
    );
  });
};

// Export the singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Export React for the hook
