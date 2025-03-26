document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const micButton = document.getElementById('mic-button');
    const statusElement = document.getElementById('status');
    const userTranscript = document.getElementById('user-transcript');
    const aiTranscript = document.getElementById('ai-transcript');
    const themeToggle = document.getElementById('theme-toggle');
    const englishBadge = document.querySelector('.language-badge.english');
    const urduBadge = document.querySelector('.language-badge.urdu');

    // DOM elements - activation
    const activationOverlay = document.getElementById('activation-overlay');
    const activationCode = document.getElementById('activation-code');
    const activateButton = document.getElementById('activate-button');
    const activationStatus = document.getElementById('activation-status');
    const mainContainer = document.getElementById('main-container');

    // WebRTC variables
    let peerConnection = null;
    let dataChannel = null;
    let audioElement = null;
    let mediaStream = null;
    let isRecording = false;
    let currentLanguage = 'english'; // Default language
    
    // Arduino button variables
    let buttonCheckInterval = null;
    let lastButtonState = 'released';

    // Check if the app is activated
    function checkActivation() {
        const activationToken = localStorage.getItem('activationToken');
        
        if (!activationToken) {
            // Show activation overlay if not activated
            activationOverlay.classList.remove('hidden');
            mainContainer.classList.add('hidden');
        } else {
            // Hide activation overlay if already activated
            activationOverlay.classList.add('hidden');
            mainContainer.classList.remove('hidden');
            
            // Continue with normal app initialization
            initialize();
        }
    }
    
    // Submit activation code
    async function submitActivationCode() {
        const code = activationCode.value.trim();
        
        if (!code) {
            activationStatus.textContent = 'Please enter an activation code';
            activationStatus.className = 'status-error';
            return;
        }
        
        activateButton.disabled = true;
        activationStatus.textContent = 'Verifying...';
        activationStatus.className = '';
        
        try {
            const response = await fetch('/.netlify/functions/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ activationCode: code })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Store the activation token
                localStorage.setItem('activationToken', data.token);
                
                activationStatus.textContent = 'Activation successful!';
                activationStatus.className = 'status-success';
                
                // Hide overlay after 1 second
                setTimeout(() => {
                    activationOverlay.classList.add('hidden');
                    mainContainer.classList.remove('hidden');
                    
                    // Initialize the app
                    initialize();
                }, 1000);
            } else {
                activationStatus.textContent = data.error || 'Invalid activation code';
                activationStatus.className = 'status-error';
                activateButton.disabled = false;
            }
        } catch (error) {
            console.error('Activation error:', error);
            activationStatus.textContent = 'Connection error. Please try again.';
            activationStatus.className = 'status-error';
            activateButton.disabled = false;
        }
    }

    // Initialize the application
    async function initialize() {
        try {
            // First check if server is running with our simplest endpoint
            try {
                const testResponse = await fetch('/.netlify/functions/simple-test');
                if (!testResponse.ok) {
                    throw new Error('Server test endpoint failed');
                }
                const testData = await testResponse.json();
                console.log('Simple test successful:', testData);
                
                // Check if we have an API key configured
                if (!testData.hasOpenAIKey) {
                    statusElement.textContent = 'Warning: OpenAI API key is not configured on the server.';
                    console.error('OpenAI API key is missing in environment variables');
                }
                
                // Try the main test endpoint
                const mainTest = await fetch('/.netlify/functions/test');
                if (!mainTest.ok) {
                    console.warn('Main test endpoint failed, but simple test passed');
                } else {
                    console.log('Server connection test successful');
                }
            } catch (error) {
                console.error('Server connection test failed:', error);
                statusElement.textContent = 'Cannot connect to server. Please check if the server is running.';
                micButton.disabled = true;
                return;
            }
            
            // Request microphone permission
            await navigator.mediaDevices.getUserMedia({ audio: true });
            statusElement.textContent = 'Microphone ready! Click the microphone to ask your question.';
            
            // Set up the microphone button
            micButton.addEventListener('click', toggleRecording);
            
            // Set up theme toggle
            themeToggle.addEventListener('click', toggleTheme);
            
            // Check for saved theme preference
            if (localStorage.getItem('darkMode') === 'enabled') {
                document.body.classList.add('dark-theme');
                themeToggle.querySelector('i').classList.remove('fa-moon');
                themeToggle.querySelector('i').classList.add('fa-sun');
            }
            
            // Add visual feedback for hover on mic button
            micButton.addEventListener('mouseenter', () => {
                if (!isRecording) {
                    micButton.querySelector('i').classList.add('fa-beat');
                }
            });
            
            micButton.addEventListener('mouseleave', () => {
                micButton.querySelector('i').classList.remove('fa-beat');
            });
            
            // Start polling for Arduino button presses
            startButtonPolling();
        } catch (error) {
            console.error('Error initializing app:', error);
            statusElement.textContent = 'Oops! I can\'t hear you. Please check your microphone permissions.';
            micButton.disabled = true;
        }
    }

    // Function to poll the Arduino button state
    function startButtonPolling() {
        console.log('Starting Arduino button polling...');
        
        // Check for button press every 100ms
        buttonCheckInterval = setInterval(async () => {
            try {
                // Note: Arduino bridge still needs to run locally
                const response = await fetch('http://localhost:3001/button-state');
                if (!response.ok) {
                    // No need to show errors - bridge might not be running yet
                    return;
                }
                
                const data = await response.json();
                
                // Only trigger on state change from released to pressed
                if (data.state === 'pressed' && lastButtonState === 'released') {
                    console.log('Arduino button press detected!');
                    // Simulate a click on the mic button
                    micButton.click();
                }
                
                lastButtonState = data.state;
            } catch (error) {
                // Silently fail if bridge server isn't running
                console.log('Arduino bridge not available');
            }
        }, 100);
    }

    // Toggle dark/light theme
    function toggleTheme() {
        document.body.classList.toggle('dark-theme');
        
        // Toggle icon
        const icon = themeToggle.querySelector('i');
        if (icon.classList.contains('fa-moon')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('darkMode', 'disabled');
        }
    }

    // Toggle recording state
    async function toggleRecording() {
        if (!isRecording) {
            // Start recording
            micButton.classList.add('recording');
            micButton.querySelector('i').classList.remove('fa-microphone');
            micButton.querySelector('i').classList.add('fa-microphone-slash');
            statusElement.innerHTML = '<span class="recording-indicator"></span> Connecting to your homework helper...';
            
            try {
                await startSession();
                isRecording = true;
                statusElement.innerHTML = '<span class="recording-indicator"></span> I\'m listening! Ask your question and click again when you\'re done.';
            } catch (error) {
                console.error('Error starting session:', error);
                statusElement.textContent = `Connection error: ${error.message}. Please try again.`;
                micButton.classList.remove('recording');
                micButton.querySelector('i').classList.remove('fa-microphone-slash');
                micButton.querySelector('i').classList.add('fa-microphone');
            }
        } else {
            // Stop recording immediately
            micButton.classList.remove('recording');
            micButton.querySelector('i').classList.remove('fa-microphone-slash');
            micButton.querySelector('i').classList.add('fa-microphone');
            statusElement.textContent = 'Recording stopped. Click the microphone to ask another question.';
            
            // Close the session completely instead of sending response.create
            closeSession();
            
            isRecording = false;
        }
    }

    // Start a new WebRTC session
    async function startSession() {
        try {
            // Get ephemeral key from server
            console.log('Fetching session token...');
            const tokenResponse = await fetch('/.netlify/functions/session');
            
            if (!tokenResponse.ok) {
                let errorData;
                try {
                    errorData = await tokenResponse.json();
                } catch (e) {
                    const text = await tokenResponse.text();
                    errorData = { error: `Status ${tokenResponse.status}: ${text.substring(0, 100)}` };
                }
                console.error('Session token error:', errorData);
                throw new Error(errorData.error || 'Failed to get session token');
            }
            
            const data = await tokenResponse.json();
            console.log('Session token received');
            
            if (!data.client_secret || !data.client_secret.value) {
                console.error('Invalid session data:', data);
                throw new Error('Invalid session data received from server');
            }
            
            const EPHEMERAL_KEY = data.client_secret.value;
            console.log('Ephemeral key obtained');
            
            // Create a new peer connection
            peerConnection = new RTCPeerConnection();
            console.log('Peer connection created');
            
            // Set up audio element for AI's voice
            audioElement = document.createElement('audio');
            audioElement.autoplay = true;
            
            // Handle incoming audio track
            peerConnection.ontrack = (event) => {
                audioElement.srcObject = event.streams[0];
                console.log('Received audio track');
            };
            
            // Get microphone access
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Microphone access granted');
            
            // Add local audio track
            peerConnection.addTrack(mediaStream.getTracks()[0], mediaStream);
            console.log('Local audio track added');
            
            // Create data channel for events
            dataChannel = peerConnection.createDataChannel('oai-events');
            setupDataChannelListeners();
            console.log('Data channel created');
            
            // Create and set local description (offer)
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            console.log('Local description set');
            
            // Send offer to OpenAI's WebRTC endpoint
            const baseUrl = 'https://api.openai.com/v1/realtime';
            const model = 'gpt-4o-realtime-preview';
            
            console.log('Sending SDP offer to OpenAI...');
            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: 'POST',
                body: offer.sdp,
                headers: {
                    'Authorization': `Bearer ${EPHEMERAL_KEY}`,
                    'Content-Type': 'application/sdp'
                }
            });
            
            if (!sdpResponse.ok) {
                const errorText = await sdpResponse.text();
                console.error('SDP response error:', errorText);
                throw new Error('Failed to establish WebRTC connection');
            }
            
            console.log('SDP response received');
            
            // Set remote description (answer)
            const answer = {
                type: 'answer',
                sdp: await sdpResponse.text()
            };
            
            await peerConnection.setRemoteDescription(answer);
            console.log('Remote description set');
            
            // Clear previous transcripts
            userTranscript.textContent = '';
            aiTranscript.textContent = '';
            
            console.log('WebRTC session established successfully');
            
        } catch (error) {
            console.error('Error in startSession:', error);
            closeSession();
            throw error;
        }
    }

    // Set up data channel event listeners
    function setupDataChannelListeners() {
        dataChannel.onopen = () => {
            console.log('Data channel opened');
        };
        
        dataChannel.onclose = () => {
            console.log('Data channel closed');
        };
        
        dataChannel.onerror = (error) => {
            console.error('Data channel error:', error);
        };
        
        dataChannel.onmessage = (event) => {
            handleDataChannelMessage(event);
        };
    }

    // Handle incoming messages on the data channel
    function handleDataChannelMessage(event) {
        try {
            const message = JSON.parse(event.data);
            console.log('Received message:', message);
            
            // Handle different event types
            switch (message.type) {
                case 'transcript.partial':
                    // Update user transcript with partial results
                    userTranscript.textContent = message.transcript.text;
                    detectLanguage(message.transcript.text);
                    break;
                    
                case 'transcript.complete':
                    // Update user transcript with final results
                    userTranscript.textContent = message.transcript.text;
                    detectLanguage(message.transcript.text);
                    break;
                    
                case 'response.partial':
                    // Update AI transcript with partial response
                    if (message.response.modalities.includes('text')) {
                        aiTranscript.textContent = message.response.text;
                    }
                    break;
                    
                case 'response.complete':
                    // Update AI transcript with final response
                    if (message.response.modalities.includes('text')) {
                        aiTranscript.textContent = message.response.text;
                    }
                    statusElement.textContent = 'All done! Click the microphone to ask another question.';
                    break;
                    
                case 'error':
                    console.error('Error from server:', message);
                    statusElement.textContent = `Oops! Something went wrong. Please try again.`;
                    break;
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }

    // Detect language of the user's question
    function detectLanguage(text) {
        if (!text) return;
        
        // Simple language detection based on script
        // Urdu uses Arabic script, so we can check for Arabic characters
        const urduPattern = /[\u0600-\u06FF]/;
        const hasUrduCharacters = urduPattern.test(text);
        
        if (hasUrduCharacters) {
            currentLanguage = 'urdu';
            englishBadge.classList.remove('active');
            urduBadge.classList.add('active');
        } else {
            currentLanguage = 'english';
            englishBadge.classList.add('active');
            urduBadge.classList.remove('active');
        }
    }

    // Send response.create event to get AI to process the conversation
    function sendResponseCreateEvent() {
        if (dataChannel && dataChannel.readyState === 'open') {
            const responseCreate = {
                type: 'response.create',
                response: {
                    modalities: ['text', 'speech']
                }
            };
            
            dataChannel.send(JSON.stringify(responseCreate));
            console.log('Response create event sent');
        } else {
            console.error('Data channel not open, cannot send response.create event');
            statusElement.textContent = 'Connection issue. Please try again.';
        }
    }

    // Close the WebRTC session
    function closeSession() {
        console.log('Closing session...');
        
        // Stop media tracks
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
            console.log('Media tracks stopped');
        }
        
        // Close data channel
        if (dataChannel) {
            dataChannel.close();
            dataChannel = null;
            console.log('Data channel closed');
        }
        
        // Close peer connection
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
            console.log('Peer connection closed');
        }
        
        // Clean up audio element
        if (audioElement) {
            audioElement.srcObject = null;
            audioElement = null;
            console.log('Audio element cleaned up');
        }
        
        isRecording = false;
        console.log('Session closed');
        
        // Reset language indicators
        englishBadge.classList.remove('active');
        urduBadge.classList.remove('active');
    }

    // Set up activation button event listener
    activateButton.addEventListener('click', submitActivationCode);
    
    // Also submit when pressing Enter in the activation code input
    activationCode.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            submitActivationCode();
        }
    });
    
    // Start by checking activation status
    checkActivation();
}); 