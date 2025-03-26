# 5th Grade Homework Helper with Activation System

A voice-based homework helper for elementary students supporting English and Urdu, with a physical Arduino button interface and a one-time activation system.

## Project Overview

This application helps elementary school students with their homework by providing voice-based assistance in both English and Urdu. It features:

- Voice interaction using OpenAI's GPT-4o Realtime API
- Physical Arduino button interface for easy interaction
- One-time activation system for school deployments
- Support for both English and Urdu languages
- Dark/light theme switching

## Repository Structure

```
/
├── arduino/                  # Arduino sketches and documentation
│   ├── ArduinoButtonBridge.ino  # Main Arduino sketch for the button
│   ├── ButtonTest.ino        # Test sketch for button functionality
│   └── implementing_button.md # Documentation for button implementation
├── arduino-bridge/           # Node.js bridge between Arduino and web app
│   ├── bridge.js             # Bridge application
│   └── package.json          # Bridge dependencies
├── public/                   # Frontend files
│   ├── app.js                # Frontend JavaScript
│   ├── index.html            # Main HTML page
│   └── styles.css            # CSS styles
├── server.js                 # Main Express server
├── setup.js                  # Setup script for installation
├── package.json              # Main application dependencies
└── README.md                 # This file
```

## Deployment Instructions

### Requirements

- Node.js (v14 or higher)
- Arduino board with button connected to pin 2
- Web browser (Chrome recommended)
- Internet connection
- OpenAI API key with GPT-4o Realtime access

### Basic Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/5th-grade-homework-helper.git
   cd 5th-grade-homework-helper
   ```

2. Run the setup script for automatic installation:
   ```
   npm run setup
   ```
   Or install dependencies manually:
   ```
   npm install
   cd arduino-bridge && npm install
   ```

3. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. Start the server:
   ```
   npm start
   ```

### Arduino Setup

1. Connect your Arduino with a button attached to pin 2
2. Open the Arduino IDE and load `arduino/ArduinoButtonBridge.ino`
3. Upload the sketch to your Arduino board
4. Run the Arduino bridge (in a separate terminal):
   ```
   cd arduino-bridge && npm start
   ```

### Activation System

The application includes a one-time activation system that administrators can use to permanently activate the application on a PC:

1. On first visit, you'll see an activation screen
2. Enter one of the following activation codes:
   - `SCHOOL123`
   - `EDUCATION456`
   - `HOMEWORK789`
3. The activation will be stored permanently in the local browser storage
4. All future visits will bypass the activation screen

## Usage Instructions

1. Connect the Arduino to your computer via USB
2. Start both the main application and Arduino bridge
3. Open a web browser to http://localhost:3000
4. If not already activated, enter an activation code
5. Press the physical button or click the mic button on screen to ask a question
6. Ask your homework question in English or Urdu
7. The AI will respond with audio and text

## Troubleshooting

### Arduino Connection Issues

- Ensure the Arduino is properly connected via USB
- Check that the Arduino IDE's Serial Monitor is closed
- The bridge application will automatically try to detect the Arduino port
- Check the logs in arduino-bridge/logs for connection details

### Activation Issues

- If you can't activate, verify your internet connection
- Try a different activation code from the list
- If you still can't activate, check your browser's local storage and clear it
- Restart your browser and try again

### Voice Recognition Issues

- Ensure your microphone is working properly
- Check browser permissions for microphone access
- Try speaking clearly and at a normal pace
- If speaking Urdu, pronounce words clearly

## For Developers

### Project Structure

- `server.js` - Main Express server
- `public/` - Frontend files
- `arduino-bridge/` - Arduino communication bridge
- `arduino/` - Arduino sketches and documentation

### Adding New Activation Codes

Edit the `validActivationCodes` array in `server.js`:

```javascript
const validActivationCodes = [
  "SCHOOL123",
  "EDUCATION456",
  "HOMEWORK789",
  "YOUR_NEW_CODE_HERE"
];
```

## Deploying to a Free Hosting Platform

You can deploy this application to free hosting platforms like:

### 1. Replit
1. Create a new Repl and import from GitHub
2. Set up environment variables for your OpenAI API key
3. Run the application with `npm start`

### 2. Glitch
1. Create a new project and import from GitHub
2. Add your OpenAI API key in the .env file
3. The project will automatically start

### 3. Firebase
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize your project: `firebase init`
4. Deploy your application: `firebase deploy`

Note: For all these platforms, you will still need to run the Arduino bridge locally.

## License

MIT 