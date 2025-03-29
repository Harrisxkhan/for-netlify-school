// Configuration file to handle different environments
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

// API endpoints configuration
window.appConfig = {
  // Use local endpoints when running locally, Netlify functions when deployed
  endpoints: {
    session: isLocalhost ? '/session' : '/.netlify/functions/session',
    test: isLocalhost ? '/test' : '/.netlify/functions/test',
    activate: isLocalhost ? '/activate' : '/.netlify/functions/activate',
    simpleTest: isLocalhost ? '/test' : '/.netlify/functions/simple-test'
  }
}; 