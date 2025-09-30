# TrendAnkara Proxy Gateway

Optimized Google Cloud Function proxy to bypass SSL certificate issues for TrendAnkara mobile app. This proxy provides CORS support, request header filtering, and reliable forwarding of all API requests to the TrendAnkara backend.

## Quick Start

### Prerequisites

1. **Google Cloud account** with billing enabled
2. **gcloud CLI** installed and authenticated
3. **Node.js 18+** for local development
4. **NPM** package manager

### Setup & Deployment

#### 1. Initialize Google Cloud CLI
```bash
gcloud init
gcloud auth login
```

#### 2. Create a new project (if needed)
```bash
# Create project
gcloud projects create trendankara-proxy --name="TrendAnkara Proxy"

# Set as active project
gcloud config set project trendankara-proxy

# Enable billing (required for Cloud Functions)
# Go to: https://console.cloud.google.com/billing
```

#### 3. Enable required APIs
```bash
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

#### 4. Install dependencies
```bash
cd trendankara-proxy
npm install
```

#### 5. Deploy to Preferred Region

**Frankfurt (Recommended for Europe):**
```bash
npm run deploy:frankfurt
```

**Netherlands (Alternative):**
```bash
npm run deploy:netherlands
```

**Manual deployment with custom settings:**
```bash
gcloud functions deploy trendankara-proxy \
  --gen2 \
  --runtime=nodejs18 \
  --region=europe-west3 \
  --source=. \
  --entry-point=proxyHandler \
  --trigger=http \
  --allow-unauthenticated \
  --memory=128MB \
  --timeout=30s \
  --min-instances=0 \
  --max-instances=100
```

## Configuration

### Optimized Settings

- **Memory**: 128MB (minimal for cost optimization)
- **Timeout**: 30 seconds
- **Min Instances**: 0 (scale to zero when idle)
- **Max Instances**: 100 (handle concurrent users)
- **Region**: europe-west3 (Frankfurt) or europe-west4 (Netherlands)

### Cost Optimization

With these settings and ~100 concurrent users:
- **Estimated Monthly Cost**: < $5 USD
- **Free Tier Coverage**: First 2M invocations free
- **Memory Usage**: Minimal 128MB allocation
- **Auto-scaling**: Scales down to 0 when not in use

## Testing

After deployment, test the proxy:

```bash
# Set your function URL
export PROXY_URL=https://europe-west3-trendankara-proxy.cloudfunctions.net/trendankara-proxy

# Run tests
node test-proxy.js
```

## Update Mobile App

Update your React Native app configuration:

```javascript
// constants/api.ts
const API_CONFIG = {
  // Replace with your deployed function URL
  BASE_URL: 'https://europe-west3-trendankara-proxy.cloudfunctions.net/trendankara-proxy/api/mobile/v1',
  // ... rest of config
};
```

## Endpoints

All endpoints are proxied transparently:

| Endpoint | Proxy URL |
|----------|-----------|
| `/api/mobile/v1/radio` | `[FUNCTION_URL]/api/mobile/v1/radio` |
| `/api/mobile/v1/content/cards` | `[FUNCTION_URL]/api/mobile/v1/content/cards` |
| `/api/mobile/v1/polls/current` | `[FUNCTION_URL]/api/mobile/v1/polls/current` |
| `/api/mobile/v1/news` | `[FUNCTION_URL]/api/mobile/v1/news` |
| `/api/admin/mobile/settings` | `[FUNCTION_URL]/api/admin/mobile/settings` |

## Monitoring

View function logs:
```bash
gcloud functions logs read trendankara-proxy --tail --region europe-west3
```

View metrics:
```bash
gcloud functions describe trendankara-proxy --region europe-west3
```

## Troubleshooting

### Common Issues

#### CORS Issues
- **Problem**: Browser blocks requests due to CORS policy
- **Solution**: CORS headers are automatically added by the proxy
- **Headers**: All origins (*) are allowed by default
- **Preflight**: OPTIONS requests are handled automatically

#### Timeout Errors
- **Problem**: Requests take too long to complete
- **Function timeout**: 30 seconds (configurable)
- **Backend timeout**: 25 seconds (leaves 5s buffer)
- **Solution**: Check backend performance or increase timeout

#### Authentication Failures
- **Problem**: Auth headers not reaching backend
- **Solution**: All auth headers are forwarded automatically
- **Headers preserved**: Authorization, X-Platform, X-App-Version, X-Device-ID
- **No auth required**: for the proxy function itself

#### Deployment Failures
```bash
# Check project and region settings
gcloud config list

# Verify APIs are enabled
gcloud services list --enabled

# Check function status
gcloud functions describe trendankara-proxy --region=europe-west3
```

#### High Response Times
- **Expected**: < 200ms for cached responses
- **Expected**: < 1000ms for fresh requests
- **Check**: Backend performance at trendankara.com
- **Solution**: Consider increasing function memory if consistently slow

### Error Codes

| Status | Error Type | Cause | Solution |
|--------|------------|-------|----------|
| 502 | Bad Gateway | Backend unreachable | Check trendankara.com status |
| 504 | Gateway Timeout | Backend too slow | Wait or check backend performance |
| 500 | Internal Error | Proxy function error | Check function logs |

## Rollback Procedures

### Emergency Rollback

If the new deployment causes issues:

```bash
# 1. Get previous version
gcloud functions describe trendankara-proxy --region=europe-west3 --format="get(versionId)"

# 2. Rollback to previous version
gcloud functions deploy trendankara-proxy \
  --source=gs://gcf-sources-[PROJECT-ID]-[REGION]/[VERSION-ID].zip \
  --region=europe-west3

# 3. Or quickly redeploy from known good state
git checkout [PREVIOUS-COMMIT]
npm run deploy:frankfurt
```

### Testing Before Production

```bash
# 1. Deploy to test environment first
gcloud functions deploy trendankara-proxy-test \
  --region=europe-west3 \
  [... same parameters ...]

# 2. Run tests against test function
export PROXY_URL=https://europe-west3-PROJECT.cloudfunctions.net/trendankara-proxy-test
npm run test:proxy

# 3. If tests pass, deploy to production
npm run deploy:frankfurt
```

## Performance Monitoring

### Metrics to Watch

```bash
# Response times
gcloud logging read "resource.type=cloud_function AND resource.labels.function_name=trendankara-proxy" \
  --format="table(timestamp,jsonPayload.responseTime)"

# Error rates
gcloud logging read "resource.type=cloud_function AND severity>=ERROR" \
  --format="table(timestamp,jsonPayload.message)"

# Invocation count
gcloud functions describe trendankara-proxy --region=europe-west3 \
  --format="get(serviceConfig.environmentVariables)"
```

### Performance Thresholds

- **Response Time**: < 1000ms (95th percentile)
- **Error Rate**: < 1%
- **Availability**: > 99.9%
- **Cold Start**: < 2000ms

## Support

### Getting Help

1. **Check function logs**:
   ```bash
   npm run logs
   ```

2. **Run diagnostic tests**:
   ```bash
   npm run test:proxy
   ```

3. **Verify deployment**:
   ```bash
   gcloud functions describe trendankara-proxy --region=europe-west3
   ```

4. **Contact Support**: For critical issues, check the mobile app repository issues or contact the development team.

### Useful Commands

```bash
# View real-time logs
npm run logs

# Test all endpoints
npm run test:proxy

# Deploy to Frankfurt
npm run deploy:frankfurt

# Deploy to Netherlands
npm run deploy:netherlands

# Local development server
npm start
```