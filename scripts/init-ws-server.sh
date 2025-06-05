#!/bin/bash

# Create WebSocket server directory
mkdir -p ws-server

# Copy server files
cp server.js ws-server/
cp package.json ws-server/

# Create README
cat > ws-server/README.md << 'EOL'
# SynergySphere WebSocket Server

This is the WebSocket server for the SynergySphere chat system.

## Running the server

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

The server runs on port 3001 by default, which can be changed through the `PORT` environment variable.
EOL

# Initialize npm in the main project directory for frontend
cp frontend-package.json package.json

echo "WebSocket server files have been set up in the ws-server directory."
echo "Main project has been restored to use the frontend package.json."
echo ""
echo "To start the WebSocket server:"
echo "  cd ws-server"
echo "  npm install"
echo "  npm run dev" 