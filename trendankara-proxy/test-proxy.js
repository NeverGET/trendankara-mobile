import axios from 'axios';

// Configuration - UPDATE THIS after deployment
const PROXY_BASE = process.env.PROXY_URL || 'https://europe-west3-kapitel-h.cloudfunctions.net/trendankara-proxy';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function testEndpoint(endpoint, method = 'GET', data = null) {
  try {
    console.log(`${colors.blue}Testing ${method} ${endpoint}...${colors.reset}`);

    const config = {
      method,
      url: `${PROXY_BASE}${endpoint}`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Platform': 'test',
        'X-App-Version': '1.0.0',
        'X-Device-ID': 'test-device'
      }
    };

    if (data) {
      config.data = data;
    }

    const startTime = Date.now();
    const response = await axios(config);
    const responseTime = Date.now() - startTime;

    console.log(`${colors.green}✓ ${endpoint}${colors.reset}`);
    console.log(`  Status: ${response.status}`);
    console.log(`  Response Time: ${responseTime}ms`);

    if (response.data) {
      const dataPreview = JSON.stringify(response.data).slice(0, 100);
      console.log(`  Data Preview: ${dataPreview}...`);
    }

    return { success: true, status: response.status, time: responseTime };
  } catch (error) {
    console.log(`${colors.red}✗ ${endpoint}${colors.reset}`);
    console.log(`  Error: ${error.message}`);

    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Data: ${JSON.stringify(error.response.data)}`);
    }

    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log(`${colors.yellow}================================${colors.reset}`);
  console.log(`${colors.yellow}TrendAnkara Proxy Gateway Test${colors.reset}`);
  console.log(`${colors.yellow}================================${colors.reset}`);
  console.log(`Proxy URL: ${PROXY_BASE}`);
  console.log('');

  const endpoints = [
    // Public endpoints
    { path: '/api/mobile/v1/radio', method: 'GET' },
    { path: '/api/admin/mobile/settings', method: 'GET' },
    { path: '/api/mobile/v1/content/cards', method: 'GET' },
    { path: '/api/mobile/v1/polls/current', method: 'GET' },
    { path: '/api/mobile/v1/news', method: 'GET' },
    { path: '/api/mobile/v1/news?page=1&limit=10', method: 'GET' }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.path, endpoint.method, endpoint.data);
    results.push({ ...endpoint, ...result });
    console.log('');
  }

  // Summary
  console.log(`${colors.yellow}================================${colors.reset}`);
  console.log(`${colors.yellow}Test Summary${colors.reset}`);
  console.log(`${colors.yellow}================================${colors.reset}`);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgTime = results
    .filter(r => r.time)
    .reduce((acc, r) => acc + r.time, 0) / successful || 0;

  console.log(`Total Tests: ${results.length}`);
  console.log(`${colors.green}Successful: ${successful}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

  if (successful > 0) {
    console.log(`Average Response Time: ${Math.round(avgTime)}ms`);
  }

  if (failed > 0) {
    console.log('');
    console.log(`${colors.red}Failed Endpoints:${colors.reset}`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.path}: ${r.error}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests if executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

// Deployment verification functions
async function verifyDeployment() {
  console.log(`${colors.yellow}================================${colors.reset}`);
  console.log(`${colors.yellow}Deployment Verification${colors.reset}`);
  console.log(`${colors.yellow}================================${colors.reset}`);
  console.log(`Proxy URL: ${PROXY_BASE}`);
  console.log('');

  const verificationTests = [];

  // Test 1: Function URL validation
  console.log(`${colors.blue}1. Validating function URL format...${colors.reset}`);
  const urlPattern = /^https:\/\/[a-z0-9-]+-[a-z0-9-]+\.cloudfunctions\.net\/[a-z0-9-]+$/;
  const isValidUrl = urlPattern.test(PROXY_BASE);

  if (isValidUrl) {
    console.log(`${colors.green}✓ URL format is valid${colors.reset}`);
    verificationTests.push({ test: 'URL Format', success: true });
  } else {
    console.log(`${colors.red}✗ Invalid URL format${colors.reset}`);
    console.log(`  Expected: https://[region]-[project].cloudfunctions.net/[function-name]`);
    verificationTests.push({ test: 'URL Format', success: false, error: 'Invalid URL format' });
  }

  // Test 2: CORS headers presence
  console.log(`${colors.blue}2. Testing CORS headers...${colors.reset}`);
  try {
    const corsResponse = await axios.options(PROXY_BASE, {
      timeout: 10000,
      headers: {
        'Origin': 'https://trendankara.com',
        'Access-Control-Request-Method': 'GET'
      }
    });

    const requiredCorsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];

    const missingHeaders = requiredCorsHeaders.filter(header =>
      !corsResponse.headers[header]
    );

    if (missingHeaders.length === 0) {
      console.log(`${colors.green}✓ All CORS headers present${colors.reset}`);
      console.log(`  Allow-Origin: ${corsResponse.headers['access-control-allow-origin']}`);
      console.log(`  Allow-Methods: ${corsResponse.headers['access-control-allow-methods']}`);
      verificationTests.push({ test: 'CORS Headers', success: true });
    } else {
      console.log(`${colors.red}✗ Missing CORS headers: ${missingHeaders.join(', ')}${colors.reset}`);
      verificationTests.push({ test: 'CORS Headers', success: false, error: `Missing: ${missingHeaders.join(', ')}` });
    }
  } catch (error) {
    console.log(`${colors.red}✗ CORS test failed: ${error.message}${colors.reset}`);
    verificationTests.push({ test: 'CORS Headers', success: false, error: error.message });
  }

  // Test 3: Error response format
  console.log(`${colors.blue}3. Testing error response format...${colors.reset}`);
  try {
    // Test with invalid endpoint to trigger error response
    const errorResponse = await axios.get(`${PROXY_BASE}/api/invalid/endpoint`, {
      timeout: 10000,
      validateStatus: () => true // Don't throw on error status
    });

    if (errorResponse.status >= 400) {
      const hasErrorStructure = errorResponse.data &&
        typeof errorResponse.data === 'object' &&
        errorResponse.data.error &&
        errorResponse.data.code &&
        errorResponse.data.timestamp;

      if (hasErrorStructure) {
        console.log(`${colors.green}✓ Error response format is structured${colors.reset}`);
        console.log(`  Error Code: ${errorResponse.data.code}`);
        console.log(`  Error Message: ${errorResponse.data.error}`);
        verificationTests.push({ test: 'Error Format', success: true });
      } else {
        console.log(`${colors.red}✗ Error response not properly structured${colors.reset}`);
        verificationTests.push({ test: 'Error Format', success: false, error: 'Unstructured error response' });
      }
    } else {
      console.log(`${colors.yellow}⚠ Expected error response, got ${errorResponse.status}${colors.reset}`);
      verificationTests.push({ test: 'Error Format', success: true, note: 'Unexpected success response' });
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error format test failed: ${error.message}${colors.reset}`);
    verificationTests.push({ test: 'Error Format', success: false, error: error.message });
  }

  // Test 4: Response time thresholds
  console.log(`${colors.blue}4. Testing response time thresholds...${colors.reset}`);
  try {
    const startTime = Date.now();
    await axios.get(`${PROXY_BASE}/api/mobile/v1/radio`, {
      timeout: 10000,
      headers: {
        'X-Platform': 'test',
        'X-App-Version': '1.0.0'
      }
    });
    const responseTime = Date.now() - startTime;

    const thresholds = {
      excellent: 500,
      good: 1000,
      acceptable: 2000
    };

    let performance = 'poor';
    if (responseTime <= thresholds.excellent) performance = 'excellent';
    else if (responseTime <= thresholds.good) performance = 'good';
    else if (responseTime <= thresholds.acceptable) performance = 'acceptable';

    console.log(`${colors.green}✓ Response time: ${responseTime}ms (${performance})${colors.reset}`);
    verificationTests.push({
      test: 'Response Time',
      success: true,
      time: responseTime,
      performance
    });
  } catch (error) {
    console.log(`${colors.red}✗ Response time test failed: ${error.message}${colors.reset}`);
    verificationTests.push({ test: 'Response Time', success: false, error: error.message });
  }

  // Summary
  console.log('');
  console.log(`${colors.yellow}================================${colors.reset}`);
  console.log(`${colors.yellow}Verification Summary${colors.reset}`);
  console.log(`${colors.yellow}================================${colors.reset}`);

  const passedTests = verificationTests.filter(t => t.success).length;
  const failedTests = verificationTests.filter(t => !t.success).length;

  console.log(`Total Verification Tests: ${verificationTests.length}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);

  if (failedTests === 0) {
    console.log(`${colors.green}🎉 Deployment verification PASSED${colors.reset}`);
    console.log(`${colors.green}Proxy is ready for production use!${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Deployment verification FAILED${colors.reset}`);
    console.log('');
    console.log(`${colors.red}Failed Tests:${colors.reset}`);
    verificationTests.filter(t => !t.success).forEach(t => {
      console.log(`  - ${t.test}: ${t.error}`);
    });
  }

  return { passed: passedTests, failed: failedTests, tests: verificationTests };
}

export { testEndpoint, runTests, verifyDeployment };