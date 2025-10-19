#!/bin/bash
# Temporary script to remove emoji from console statements

# Remove specific emoji from utils/appInitializer.ts
sed -i '' "s/console.log('💦 Splash screen initialized');/if (__DEV__) { console.log('Splash screen initialized'); }/" utils/appInitializer.ts
sed -i '' "s/console.log('📊 Performance monitoring initialized');/if (__DEV__) { console.log('Performance monitoring initialized'); }/" utils/appInitializer.ts
sed -i '' "s/console.log('🚨 Crash reporting initialized');/if (__DEV__) { console.log('Crash reporting initialized'); }/" utils/appInitializer.ts
sed -i '' "s/console.log('✅ App marked as ready');/if (__DEV__) { console.log('App marked as ready'); }/" utils/appInitializer.ts

# Clean utils/performance.ts
sed -i '' "s/console.log('🚀 Performance monitoring started');/if (__DEV__) { console.log('Performance monitoring started'); }/" utils/performance.ts
sed -i '' "s/console.log('⏹️ Performance monitoring stopped');/if (__DEV__) { console.log('Performance monitoring stopped'); }/" utils/performance.ts
sed -i '' "s/console.log(\`📊 Metric \[\${name}\]: \${value}\`, metadata);/console.log(\`Metric [\${name}]: \${value}\`, metadata);/" utils/performance.ts
sed -i '' "s/console.warn(\`⚠️ High memory usage:/console.warn(\`High memory usage:/" utils/performance.ts

# Clean utils/appReview.ts
sed -i '' "s/console.log('📱 App Review Service initialized');/if (__DEV__) { console.log('App Review Service initialized'); }/" utils/appReview.ts
sed -i '' "s/console.log(\`📊 Review event recorded:/if (__DEV__) { console.log(\`Review event recorded:/" utils/appReview.ts
sed -i '' "s/console.log('📱 Review prompt shown');/if (__DEV__) { console.log('Review prompt shown'); }/" utils/appReview.ts
sed -i '' "s/console.log('✅ User marked as having rated the app');/if (__DEV__) { console.log('User marked as having rated the app'); }/" utils/appReview.ts
sed -i '' "s/console.log('❌ User marked as having declined review');/if (__DEV__) { console.log('User marked as having declined review'); }/" utils/appReview.ts
sed -i '' "s/console.log('🗑️ App review data reset');/if (__DEV__) { console.log('App review data reset'); }/" utils/appReview.ts

# Clean utils/splashScreen.ts
sed -i '' "s/console.log('✅ Critical resources preloaded');/if (__DEV__) { console.log('Critical resources preloaded'); }/" utils/splashScreen.ts
sed -i '' "s/console.error('❌ Error preloading resources:',/console.error('Error preloading resources:',/" utils/splashScreen.ts

echo "Emoji cleanup complete!"
