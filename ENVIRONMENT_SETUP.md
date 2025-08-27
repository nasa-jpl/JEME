# Environment Setup for Science Model Dashboard

## Required Environment Variables

This application requires certain environment variables to be set for full functionality.

### Google Maps API Key

The dashboard uses Google Maps to display geographic distribution of research. You need to:

1. **Get a Google Maps API Key**:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Maps JavaScript API
   - Create credentials (API Key)
   - Restrict the API key to your domain for security

2. **Set up the environment variable**:
   ```bash
   cp .env.example .env
   ```
   
   Then edit the `.env` file and add:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

### Security Notes

- **Never commit `.env` files** to version control
- **Never hardcode API keys** in the source code
- **Restrict API keys** to specific domains in production
- **Use different API keys** for development and production environments

### Without API Key

If you don't set up the Google Maps API key, the application will still work but will show a warning message instead of the interactive map.

## Setup Instructions

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Add your Google Maps API key to the `.env` file
4. Run `npm install`
5. Run `npm start`

## Deployment

For production deployment, make sure to:

1. Set environment variables in your hosting platform
2. Restrict your Google Maps API key to your production domain
3. Never expose API keys in client-side code bundles