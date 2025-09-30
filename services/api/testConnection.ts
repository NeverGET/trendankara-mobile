/**
 * Test API Connection
 * Debug utility to test network connectivity
 */

import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';

export async function testApiConnection(): Promise<void> {
  console.log('════════════════════════════════════════');
  console.log('🧪 TESTING API CONNECTION...');
  console.log('════════════════════════════════════════');

  // Check network state first
  console.log('\n📶 NETWORK STATE:');
  const netState = await NetInfo.fetch();
  console.log(`   Connected: ${netState.isConnected}`);
  console.log(`   Internet Reachable: ${netState.isInternetReachable}`);
  console.log(`   Type: ${netState.type}`);
  console.log(`   Details:`, netState.details);

  // Test DNS resolution using nslookup command via fetch
  console.log('\n🔍 DNS RESOLUTION TEST:');
  const domains = ['google.com', 'trendankara.com'];

  for (const domain of domains) {
    try {
      // Try to resolve via a public DNS service
      const dnsResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const dnsData = await dnsResponse.json();
      console.log(`   ${domain}:`, dnsData.Answer ? 'RESOLVED' : 'NOT RESOLVED');
      if (dnsData.Answer) {
        console.log(`      IPs:`, dnsData.Answer.map((a: any) => a.data).join(', '));
      }
    } catch (e) {
      console.log(`   ${domain}: DNS check failed -`, e.message);
    }
  }

  // Get proxy and original endpoints
  const proxyBaseUrl = 'https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy';
  const trendankaraIP = '82.29.169.180'; // Original server IP (for reference)

  const testUrls = [
    { url: 'https://www.google.com', name: 'Google HTTPS' },
    { url: `${proxyBaseUrl}/api/mobile/v1/radio`, name: 'GCP Proxy - Radio endpoint' },
    { url: `${proxyBaseUrl}/api/mobile/v1/config`, name: 'GCP Proxy - Config endpoint' },
    { url: `${proxyBaseUrl}/api/mobile/v1/news`, name: 'GCP Proxy - News endpoint' },
    { url: `${proxyBaseUrl}/api/mobile/v1/polls/current`, name: 'GCP Proxy - Polls endpoint' },
    { url: `${proxyBaseUrl}/api/mobile/v1/content/cards`, name: 'GCP Proxy - Cards endpoint' },
    { url: 'https://trendankara.com', name: 'TrendAnkara HTTPS (original - should fail)' },
    { url: `https://${trendankaraIP}/api/mobile/v1/radio`, name: 'Direct IP (should fail)' },
  ];

  console.log('\n🌐 CONNECTION TESTS:');

  for (const test of testUrls) {
    console.log(`\n📡 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);

    // Test with axios
    try {
      const startTime = Date.now();
      const response = await axios.get(test.url, {
        timeout: 10000,
        validateStatus: () => true,
        headers: {
          'Host': test.url.includes(trendankaraIP) ? 'trendankara.com' : undefined,
        },
        // Disable SSL verification for IP tests
        httpsAgent: test.url.includes(trendankaraIP) ? {
          rejectUnauthorized: false
        } : undefined,
      });
      const duration = Date.now() - startTime;

      console.log(`   ✅ AXIOS SUCCESS`);
      console.log(`      Status: ${response.status}`);
      console.log(`      Duration: ${duration}ms`);
      console.log(`      Headers:`, Object.keys(response.headers).slice(0, 5));
    } catch (error: any) {
      console.log(`   ❌ AXIOS FAILED`);
      console.log(`      Error: ${error.message}`);
      console.log(`      Code: ${error.code}`);
      console.log(`      Errno: ${error.errno}`);
      console.log(`      Syscall: ${error.syscall}`);
      if (error.cause) {
        console.log(`      Cause:`, error.cause);
      }
    }

    // Test with fetch
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const fetchOptions: RequestInit = {
        signal: controller.signal,
        headers: test.url.includes(trendankaraIP) ? {
          'Host': 'trendankara.com'
        } : {},
      };

      const response = await fetch(test.url, fetchOptions);
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      console.log(`   ✅ FETCH SUCCESS`);
      console.log(`      Status: ${response.status}`);
      console.log(`      Duration: ${duration}ms`);
    } catch (error: any) {
      console.log(`   ❌ FETCH FAILED`);
      console.log(`      Error: ${error.message}`);
      console.log(`      Name: ${error.name}`);
    }
  }

  // Test alternative streaming URLs
  console.log('\n🎵 ALTERNATIVE STREAM TESTS:');
  const streamUrls = [
    'https://canli.trendankara.com.tr:8443/trendankara',
    'http://radyo.yayin.com.tr:4032',
    'http://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
  ];

  for (const url of streamUrls) {
    console.log(`\n📻 Testing stream: ${url}`);
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        validateStatus: () => true,
      });
      console.log(`   ✅ Reachable - Status: ${response.status}`);
    } catch (error: any) {
      console.log(`   ❌ Unreachable - ${error.message}`);
    }
  }

  console.log('\n════════════════════════════════════════');
  console.log('🧪 CONNECTION TEST COMPLETE');
  console.log('════════════════════════════════════════');
}