const int buttonPin = 2;  // Pin connected to the pushbutton
const int ledPin    = 13; // Built-in LED pin on Arduino

void setup() {
  Serial.begin(9600);
  pinMode(buttonPin, INPUT_PULLUP); // Use internal pull-up
  pinMode(ledPin, OUTPUT);
}

void loop() {
  // Read the button
  int buttonState = digitalRead(buttonPin);

  // Check if button is pressed (LOW because of INPUT_PULLUP)
  if (buttonState == LOW) {
    // Turn the LED on
    digitalWrite(ledPin, HIGH);

    // Print while the button is held down
    Serial.println("Button pressed!");

    // Delay to avoid flooding the Serial Monitor
    delay(200);

  } else {
    // Turn the LED off
    digitalWrite(ledPin, LOW);
  }
}
