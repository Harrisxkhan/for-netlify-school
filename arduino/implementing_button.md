# Implementing an Arduino Button for the 5th Grade Homework Helper

This guide explains how to connect a physical button to your 5th Grade Homework Helper web application. When you press the button, it will activate the microphone in the app, allowing you to ask your question without having to click on the screen.

## Overview

We'll create a system with three components:
1. **Arduino with Button** - The physical hardware you'll press
2. **Serial Bridge** - A Node.js script that communicates between the Arduino and web app
3. **Web App Integration** - Small modifications to your existing web app

## What You'll Need

- Arduino Uno (already set up with button)
- USB cable (to connect Arduino to computer)
- Your existing 5th Grade Homework Helper web application
- Node.js installed on your computer

## Step 1: Arduino Button Code

1. Open the Arduino IDE and create a new sketch:

```cpp
const int buttonPin = 2;      // The pin with the button attached
const int ledPin = 13;        // Built-in LED

void setup() {
  // Initialize serial communication at 9600 baud rate
  Serial.begin(9600);
  
  // Set up the button pin with internal pull-up resistor
  pinMode(buttonPin, INPUT_PULLUP);
  
  // Set up the LED pin
  pinMode(ledPin, OUTPUT);
  
  // Send a message when Arduino starts
  Serial.println("Arduino ready");
}

void loop() {
  // Check if button is pressed (LOW when pressed with INPUT_PULLUP)
  if (digitalRead(buttonPin) == LOW) {
    // Turn on LED
    digitalWrite(ledPin, HIGH);
    
    // Send message to computer
    Serial.println("BUTTON_PRESSED");
    
    // Add delay to prevent multiple triggers
    delay(200);
    
    // Wait for button release
    while (digitalRead(buttonPin) == LOW) {
      // Do nothing, just wait
    }
    
    // Turn off LED
    digitalWrite(ledPin, LOW);
    
    // Send button released message
    Serial.println("BUTTON_RELEASED");
  }
}
```

2. Upload this code to your Arduino using the Upload button (arrow icon) in the Arduino IDE
3. Test it by opening the Serial Monitor (Tools → Serial Monitor) - you should see "BUTTON_PRESSED" when you press the button

## Step 2: Create the Serial Bridge

1. Create a new folder named `arduino-bridge` in your project directory
2. Open a terminal/command prompt and navigate to this folder
3. Initialize a new Node.js project:
```
npm init -y
```

4. Install the required packages:
```
npm install serialport express cors
```

5. Create a new file named `bridge.js` with this code:

```javascript
// Serial Bridge between Arduino and Web App
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const express = require('express');
const cors = require('cors');

// Create Express server
const app = express();
app.use(cors());
app.use(express.json());

// Track button state
let buttonState = 'released';

// Set up Serial connection
// NOTE: You'll need to replace 'COM3' with your actual Arduino port
// On Windows, it's usually COM3, COM4, etc.
// On Mac/Linux, it's usually /dev/ttyACM0 or /dev/cu.usbmodem14201
const port = new SerialPort({
  path: 'COM3', // CHANGE THIS to match your Arduino port
  baudRate: 9600
});

// Create a parser to read lines from Arduino
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Listen for data from Arduino
parser.on('data', (data) => {
  console.log('Arduino says:', data);
  
  if (data === 'BUTTON_PRESSED') {
    buttonState = 'pressed';
    console.log('Button was pressed!');
  } else if (data === 'BUTTON_RELEASED') {
    buttonState = 'released';
  }
});

// API endpoint to get button state
app.get('/button-state', (req, res) => {
  res.json({ state: buttonState });
  
  // Reset button state after it's been read
  if (buttonState === 'pressed') {
    buttonState = 'released';
  }
});

// Start server
const PORT = 3001; // Different from your main app (3000)
app.listen(PORT, () => {
  console.log(`Arduino bridge running on http://localhost:${PORT}`);
  console.log('Waiting for Arduino data...');
});

// Handle errors
port.on('error', (err) => {
  console.error('Serial port error:', err.message);
});
```

6. **Find your Arduino port**:
   - In Arduino IDE, look at Tools → Port → (your Arduino will be listed here)
   - Update the `path: 'COM3'` line in the code above with your actual port

7. Start the bridge:
```
node bridge.js
```

## Step 3: Modify the Web App

Now we need to update your web app to check for button presses. Open `public/app.js` and make these changes:

1. Add a function to poll the button state near the top of your file:

```javascript
// Add this after your existing variables
let buttonCheckInterval = null;

// Add this new function to your code
function startButtonPolling() {
  // Check for button press every 100ms
  buttonCheckInterval = setInterval(async () => {
    try {
      const response = await fetch('http://localhost:3001/button-state');
      const data = await response.json();
      
      if (data.state === 'pressed') {
        console.log('Button press detected!');
        // Trigger the same function as clicking the mic button
        toggleRecording();
      }
    } catch (error) {
      console.error('Error checking button state:', error);
    }
  }, 100);
}
```

2. Call this function in your initialization code to start checking for button presses:

```javascript
// Find the initialize() function in your code and add this line at the end:
async function initialize() {
  // ... your existing code ...
  
  // Add this line at the end of the function:
  startButtonPolling();
}
```

## Step 4: Running Everything Together

To use your physical button with the application:

1. Connect your Arduino to your computer via USB
2. Open a terminal and start your main application:
```
npm start
```

3. Open another terminal and start the Arduino bridge:
```
cd arduino-bridge
node bridge.js
```

4. Open your browser to http://localhost:3000
5. Press your physical button connected to Arduino
6. The web app should respond as if you clicked the mic button

## Troubleshooting

### If the Button Doesn't Work:

1. **Check Arduino Connection**:
   - Make sure the Arduino is connected via USB
   - Verify the correct port in the bridge.js file
   - Check Arduino's Serial Monitor to confirm button messages

2. **Check Bridge Connection**:
   - Confirm the bridge is running without errors
   - Check if it's receiving BUTTON_PRESSED messages from Arduino
   - Try visiting http://localhost:3001/button-state in your browser

3. **Check Web App Integration**:
   - Open your browser's developer console (F12)
   - Look for any error messages
   - Confirm it's successfully polling the bridge at http://localhost:3001/button-state

### Common Errors:

- **"Cannot find port COM3"**: You need to update the port name in bridge.js
- **"Connection refused on localhost:3001"**: Make sure the bridge is running
- **Arduino not responding**: Check your wiring and upload the code again

## Next Steps

Once everything is working, you might want to:

1. Add an LED indicator to show when the app is listening
2. Create a nice enclosure for your button
3. Add additional buttons for other functions

## Why HTTP Polling vs. WebSockets

This implementation uses HTTP polling (checking regularly) to keep things simple. WebSockets would be more efficient but require more complex code. For a beginner setup, polling every 100ms is a good balance of simplicity and responsiveness.

When you're comfortable with this implementation, we can improve it to use WebSockets for a more responsive experience. 