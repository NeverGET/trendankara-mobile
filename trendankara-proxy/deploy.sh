#!/bin/bash

# TrendAnkara Proxy Deployment Script - European Regions
# Optimized for minimal cost with 100 concurrent users

echo "TrendAnkara Proxy Gateway Deployment"
echo "====================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed"
    echo "Install it from: https://cloud.google.com/sdk"
    exit 1
fi

# Configuration
PROJECT_ID="${1:-trendankara-proxy}"
REGION="${2:-europe-west3}"  # Frankfurt by default
FUNCTION_NAME="trendankara-proxy"

echo ""
echo "Deployment Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION (Frankfurt)"
echo "  Function: $FUNCTION_NAME"
echo "  Memory: 128MB (optimized for cost)"
echo "  Timeout: 30s"
echo "  Max Instances: 100 (for concurrent users)"
echo ""

# Set project
echo "Setting project..."
gcloud config set project $PROJECT_ID

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Deploy function with optimized settings
echo "Deploying function to $REGION..."
gcloud functions deploy $FUNCTION_NAME \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point proxyRequest \
  --region $REGION \
  --memory 128MB \
  --timeout 30s \
  --min-instances 0 \
  --max-instances 100 \
  --set-env-vars TARGET_API_BASE=https://trendankara.com,NODE_ENV=production \
  --service-account=$PROJECT_ID@appspot.gserviceaccount.com

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "Function URL:"
    echo "https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME"
    echo ""
    echo "Test with:"
    echo "curl https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME/api/mobile/v1/radio"
else
    echo ""
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi