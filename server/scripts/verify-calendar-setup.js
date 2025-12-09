/**
 * Google Calendar Integration - Setup Verification Script
 * Run this to verify your environment is correctly configured
 * 
 * Usage: node scripts/verify-calendar-setup.js
 */

require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkmark(passed) {
  return passed ? '✅' : '❌';
}

async function verifySetup() {
  log('\n========================================', 'cyan');
  log('  Google Calendar Setup Verification', 'cyan');
  log('========================================\n', 'cyan');

  let allPassed = true;

  // Check 1: Environment Variables
  log('1. Checking Environment Variables...', 'blue');
  
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALENDAR_CALLBACK_URL',
    'JWT_SECRET',
    'CLIENT_URL',
    'SERVER_URL',
  ];

  const results = {};
  requiredVars.forEach(varName => {
    const exists = !!process.env[varName];
    results[varName] = exists;
    log(`   ${checkmark(exists)} ${varName}: ${exists ? 'SET' : 'MISSING'}`, exists ? 'green' : 'red');
    if (!exists) allPassed = false;
  });

  // Check 2: Validate Callback URLs
  log('\n2. Validating Callback URLs...', 'blue');
  
  const callbackUrl = process.env.GOOGLE_CALENDAR_CALLBACK_URL;
  const serverUrl = process.env.SERVER_URL;
  
  if (callbackUrl) {
    const isValid = callbackUrl.includes('/api/auth/calendar/callback');
    log(`   ${checkmark(isValid)} Calendar callback URL format: ${isValid ? 'VALID' : 'INVALID'}`, isValid ? 'green' : 'red');
    log(`      → ${callbackUrl}`, 'cyan');
    if (!isValid) {
      allPassed = false;
      log('      Expected format: http://localhost:5000/api/auth/calendar/callback', 'yellow');
    }
  }

  // Check 3: Dependencies
  log('\n3. Checking Required Dependencies...', 'blue');
  
  const dependencies = [
    'googleapis',
    'jsonwebtoken',
    'express',
    'dotenv',
  ];

  dependencies.forEach(dep => {
    try {
      require(dep);
      log(`   ${checkmark(true)} ${dep}: INSTALLED`, 'green');
    } catch (e) {
      log(`   ${checkmark(false)} ${dep}: MISSING`, 'red');
      allPassed = false;
    }
  });

  // Check 4: Database Connection
  log('\n4. Checking Database Connection...', 'blue');
  
  try {
    const mongoose = require('mongoose');
    const dbUrl = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/your-db';
    
    if (mongoose.connection.readyState === 0) {
      log('   ℹ️  Database not connected (this is expected if server is not running)', 'yellow');
    } else {
      log(`   ${checkmark(true)} Database: CONNECTED`, 'green');
    }
  } catch (e) {
    log(`   ${checkmark(false)} Database check failed: ${e.message}`, 'red');
  }

  // Check 5: File Structure
  log('\n5. Checking File Structure...', 'blue');
  
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'controllers/auth/google-calendar-controller.js',
    'routes/auth/google-calendar-routes.js',
    'models/User.js',
    'models/Order.js',
  ];

  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    const exists = fs.existsSync(filePath);
    log(`   ${checkmark(exists)} ${file}: ${exists ? 'EXISTS' : 'MISSING'}`, exists ? 'green' : 'red');
    if (!exists) allPassed = false;
  });

  // Check 6: Google Calendar Controller Exports
  log('\n6. Checking Controller Exports...', 'blue');
  
  try {
    const controller = require('../controllers/auth/google-calendar-controller');
    const requiredExports = [
      'generateCalendarAuthUrl',
      'googleCalendarCallback',
      'getCalendarEmbedUrl',
      'syncSingleDeadlineToCalendar',
      'manualSyncDeadlines',
    ];

    requiredExports.forEach(exportName => {
      const exists = typeof controller[exportName] === 'function';
      log(`   ${checkmark(exists)} ${exportName}: ${exists ? 'EXPORTED' : 'MISSING'}`, exists ? 'green' : 'red');
      if (!exists) allPassed = false;
    });
  } catch (e) {
    log(`   ${checkmark(false)} Failed to load controller: ${e.message}`, 'red');
    allPassed = false;
  }

  // Check 7: User Model Schema
  log('\n7. Checking User Model Schema...', 'blue');
  
  try {
    const User = require('../models/User');
    const schema = User.schema.obj;
    
    const requiredFields = [
      'googleAccessToken',
      'googleRefreshToken',
      'googleTokenExpiry',
      'googleCalendarEnabled',
      'googleCalendarId',
    ];

    requiredFields.forEach(field => {
      const exists = field in schema;
      log(`   ${checkmark(exists)} ${field}: ${exists ? 'EXISTS' : 'MISSING'}`, exists ? 'green' : 'red');
      if (!exists) allPassed = false;
    });
  } catch (e) {
    log(`   ${checkmark(false)} Failed to load User model: ${e.message}`, 'red');
    allPassed = false;
  }

  // Summary
  log('\n========================================', 'cyan');
  if (allPassed) {
    log('  ✅ ALL CHECKS PASSED!', 'green');
    log('  Your setup is ready for Google Calendar integration.', 'green');
    log('\n  Next steps:', 'blue');
    log('  1. Start your server: node server.js', 'cyan');
    log('  2. Start your client: npm run dev', 'cyan');
    log('  3. Connect Google Calendar from the UI', 'cyan');
    log('  4. Test by confirming an order', 'cyan');
  } else {
    log('  ❌ SOME CHECKS FAILED', 'red');
    log('  Please fix the issues above before proceeding.', 'yellow');
    log('\n  Common fixes:', 'blue');
    log('  - Copy environment variables from ENVIRONMENT_SETUP.md', 'cyan');
    log('  - Run: npm install googleapis jsonwebtoken', 'cyan');
    log('  - Check that all files are in correct locations', 'cyan');
  }
  log('========================================\n', 'cyan');

  process.exit(allPassed ? 0 : 1);
}

// Run verification
verifySetup().catch(err => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});

