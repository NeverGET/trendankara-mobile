import { performanceMonitor } from '../../utils/performance';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics();
    performanceMonitor.stopMonitoring();
  });

  afterEach(() => {
    performanceMonitor.stopMonitoring();
  });

  describe('metric recording', () => {
    it('should record a metric', () => {
      performanceMonitor.recordMetric('test_metric', 100);
      const summary = performanceMonitor.getSummary();
      expect(summary.totalMetrics).toBe(1);
    });

    it('should record metric with metadata', () => {
      const metadata = { component: 'TestComponent', action: 'render' };
      performanceMonitor.recordMetric('test_metric', 100, metadata);

      const exported = performanceMonitor.exportMetrics();
      expect(exported.metrics[0].metadata).toEqual(metadata);
    });

    it('should limit metrics to prevent memory leaks', () => {
      // Record more than 100 metrics
      for (let i = 0; i < 150; i++) {
        performanceMonitor.recordMetric(`metric_${i}`, i);
      }

      const summary = performanceMonitor.getSummary();
      expect(summary.totalMetrics).toBe(100);
    });
  });

  describe('function measurement', () => {
    it('should measure synchronous function execution', () => {
      const result = performanceMonitor.measure('sync_test', () => {
        return 'test_result';
      });

      expect(result).toBe('test_result');
      const summary = performanceMonitor.getSummary();
      expect(summary.totalMetrics).toBe(1);
    });

    it('should measure async function execution', async () => {
      const result = await performanceMonitor.measureAsync('async_test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async_result';
      });

      expect(result).toBe('async_result');
      const summary = performanceMonitor.getSummary();
      expect(summary.totalMetrics).toBe(1);
    });

    it('should handle errors in measured functions', () => {
      expect(() => {
        performanceMonitor.measure('error_test', () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');

      const exported = performanceMonitor.exportMetrics();
      expect(exported.metrics[0].metadata?.status).toBe('error');
    });

    it('should handle errors in async measured functions', async () => {
      await expect(
        performanceMonitor.measureAsync('async_error_test', async () => {
          throw new Error('Async test error');
        })
      ).rejects.toThrow('Async test error');

      const exported = performanceMonitor.exportMetrics();
      expect(exported.metrics[0].metadata?.status).toBe('error');
    });
  });

  describe('render tracking', () => {
    it('should track component render times', () => {
      performanceMonitor.trackRender('TestComponent', 15);
      performanceMonitor.trackRender('TestComponent', 20);

      const summary = performanceMonitor.getSummary();
      expect(summary.avgRenderTime).toBe(20); // Should use latest render time
    });

    it('should track re-render count', () => {
      performanceMonitor.trackRender('TestComponent', 10);
      performanceMonitor.trackRender('TestComponent', 15);
      performanceMonitor.trackRender('TestComponent', 12);

      const exported = performanceMonitor.exportMetrics();
      const renderMetric = exported.renderMetrics.find(m => m.componentName === 'TestComponent');
      expect(renderMetric?.reRenderCount).toBe(3);
    });

    it('should identify slow components', () => {
      performanceMonitor.trackRender('FastComponent', 10);
      performanceMonitor.trackRender('SlowComponent', 25);

      const summary = performanceMonitor.getSummary();
      expect(summary.slowComponents).toHaveLength(1);
      expect(summary.slowComponents[0].componentName).toBe('SlowComponent');
    });
  });

  describe('monitoring lifecycle', () => {
    it('should start and stop monitoring', () => {
      expect(performanceMonitor.getSummary().isMonitoring).toBe(false);

      performanceMonitor.startMonitoring();
      expect(performanceMonitor.getSummary().isMonitoring).toBe(true);

      performanceMonitor.stopMonitoring();
      expect(performanceMonitor.getSummary().isMonitoring).toBe(false);
    });

    it('should not start monitoring twice', () => {
      performanceMonitor.startMonitoring();
      performanceMonitor.startMonitoring(); // Should not cause issues

      expect(performanceMonitor.getSummary().isMonitoring).toBe(true);
    });
  });

  describe('memory usage', () => {
    it('should get memory usage', () => {
      const memoryUsage = performanceMonitor.getMemoryUsage();
      expect(memoryUsage.timestamp).toBeDefined();
      expect(typeof memoryUsage.timestamp).toBe('number');
    });
  });

  describe('data export', () => {
    it('should export metrics', () => {
      performanceMonitor.recordMetric('test_metric', 100);
      performanceMonitor.trackRender('TestComponent', 15);

      const exported = performanceMonitor.exportMetrics();
      expect(exported.metrics).toHaveLength(1);
      expect(exported.renderMetrics).toHaveLength(1);
      expect(exported.summary).toBeDefined();
      expect(exported.exportedAt).toBeDefined();
    });

    it('should clear metrics', () => {
      performanceMonitor.recordMetric('test_metric', 100);
      performanceMonitor.trackRender('TestComponent', 15);

      performanceMonitor.clearMetrics();

      const summary = performanceMonitor.getSummary();
      expect(summary.totalMetrics).toBe(0);
      expect(summary.avgRenderTime).toBe(0);
    });
  });

  describe('summary calculation', () => {
    it('should calculate average render time correctly', () => {
      performanceMonitor.trackRender('Component1', 10);
      performanceMonitor.trackRender('Component2', 20);
      performanceMonitor.trackRender('Component3', 30);

      const summary = performanceMonitor.getSummary();
      expect(summary.avgRenderTime).toBe(20);
    });

    it('should handle empty render metrics', () => {
      const summary = performanceMonitor.getSummary();
      expect(summary.avgRenderTime).toBe(0);
      expect(summary.slowComponents).toHaveLength(0);
    });
  });
});