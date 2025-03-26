// Setup script for 5th Grade Homework Helper
// This script helps setup the main application and Arduino bridge

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Print welcome message
console.log(`${colors.blue}
╔════════════════════════════════════════════════════════════╗
║         5th Grade Homework Helper - Setup Script           ║
║                                                            ║
║  This script will help you set up the application and      ║
║  Arduino bridge for the 5th Grade Homework Helper.         ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

// Main setup function
async function setup() {
  try {
    // Check if Node.js is installed
    try {
      const nodeVersion = execSync('node --version').toString().trim();
      console.log(`${colors.green}✓ Node.js ${nodeVersion} is installed${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}✗ Node.js is not installed. Please install Node.js v14 or higher.${colors.reset}`);
      process.exit(1);
    }

    // Setup main application
    console.log(`\n${colors.blue}Setting up main application...${colors.reset}`);
    
    // Install dependencies for main app
    console.log(`${colors.yellow}Installing main application dependencies...${colors.reset}`);
    execSync('npm install', { stdio: 'inherit' });
    
    // Check if .env file exists, create if not
    if (!fs.existsSync('.env')) {
      console.log(`\n${colors.yellow}OpenAI API key is required for this application.${colors.reset}`);
      
      const apiKey = await new Promise(resolve => {
        rl.question('Enter your OpenAI API key: ', (answer) => {
          resolve(answer.trim());
        });
      });
      
      if (apiKey) {
        fs.writeFileSync('.env', `OPENAI_API_KEY=${apiKey}`);
        console.log(`${colors.green}✓ API key saved to .env file${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠ No API key provided. You will need to manually create a .env file later.${colors.reset}`);
      }
    } else {
      console.log(`${colors.green}✓ .env file already exists${colors.reset}`);
    }
    
    // Setup Arduino bridge
    console.log(`\n${colors.blue}Setting up Arduino bridge...${colors.reset}`);
    
    // Check if arduino-bridge directory exists
    if (fs.existsSync('arduino-bridge')) {
      // Install dependencies for Arduino bridge
      console.log(`${colors.yellow}Installing Arduino bridge dependencies...${colors.reset}`);
      execSync('cd arduino-bridge && npm install', { stdio: 'inherit' });
      
      // Create logs directory in arduino-bridge if it doesn't exist
      const logDir = path.join('arduino-bridge', 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
        console.log(`${colors.green}✓ Created Arduino bridge logs directory${colors.reset}`);
      }
    } else {
      console.error(`${colors.red}✗ arduino-bridge directory not found${colors.reset}`);
    }
    
    // Installation complete
    console.log(`\n${colors.green}✓ Setup completed successfully!${colors.reset}`);
    console.log(`\n${colors.blue}To start the application:${colors.reset}`);
    console.log(`1. Upload the ArduinoButtonBridge.ino sketch to your Arduino`);
    console.log(`2. Start the main server: ${colors.yellow}npm start${colors.reset}`);
    console.log(`3. In a separate terminal, start the Arduino bridge: ${colors.yellow}cd arduino-bridge && npm start${colors.reset}`);
    console.log(`4. Open http://localhost:3000 in your browser`);
    console.log(`5. Use activation code: SCHOOL123, EDUCATION456, or HOMEWORK789`);
    
  } catch (error) {
    console.error(`${colors.red}Setup failed: ${error.message}${colors.reset}`);
  } finally {
    rl.close();
  }
}

// Run setup
setup(); 