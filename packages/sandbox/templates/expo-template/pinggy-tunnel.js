const { pinggy } = require('@pinggy/pinggy');

// Get port from command line argument
const port = process.argv[2];

if (!port) {
  console.error('Error: Port number is required as argument');
  console.error('Usage: node pinggy-tunnel.js <port>');
  process.exit(1);
}

async function startTunnel() {
  try {
    console.log(`Starting Pinggy tunnel for port ${port}...`);
    
    const tunnel = await pinggy.forward({ 
      forwardTo: `localhost:${port}`,
      type: 'http'
    });
    
    const urls = tunnel.urls();
    
    // Output URLs in a format that can be easily parsed
    console.log(`PINGGY_HTTP_URL:${urls[0]}`);
    console.log(`PINGGY_HTTPS_URL:${urls[1]}`);
    console.log(`PINGGY_TUNNEL_READY`);
    
    // Log tunnel info
    console.log(`Tunnel created successfully`);
    console.log(`HTTP URL: ${urls[0]}`);
    console.log(`HTTPS URL: ${urls[1]}`);
    // Keep the process running
    process.stdin.resume();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down Pinggy tunnel...');
      try {
        await tunnel.stop();
        console.log('Tunnel stopped successfully');
      } catch (error) {
        console.error('Error stopping tunnel:', error);
      }
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to create Pinggy tunnel:', error);
    process.exit(1);
  }
}

startTunnel();