#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Starting EAS authentication...');

async function easLogin() {
  try {
    const { execa } = await import('execa');
    
    const results = {
      success: false,
      steps: []
    };
    
    // Step 1: Check if already authenticated
    console.log('\n🔐 Checking current EAS authentication status...');
    try {
      const whoamiResult = await execa('eas', ['whoami'], {
        reject: false,
        timeout: 10000
      });
      
      if (whoamiResult.exitCode === 0 && whoamiResult.stdout.trim()) {
        const username = whoamiResult.stdout.trim();
        console.log(`✅ Already authenticated as: ${username}`);
        results.username = username;
        results.success = true;
        results.steps.push({
          step: 'auth-check',
          success: true,
          message: `Already authenticated as ${username}`,
          output: whoamiResult.stdout
        });
        return results;
      } else {
        console.log('❌ Not currently authenticated with EAS');
        results.steps.push({
          step: 'auth-check',
          success: false,
          message: 'Not authenticated with EAS'
        });
      }
    } catch (authError) {
      console.error('Auth check failed:', authError.message);
      results.steps.push({
        step: 'auth-check',
        success: false,
        message: 'Failed to check authentication status',
        error: authError.message
      });
    }
    
    // Step 2: Check for environment variables for automatic login
    console.log('\n🔑 Checking for EAS authentication credentials...');
    
    const easToken = process.env.EXPO_TOKEN || process.env.EAS_TOKEN;
    const easEmail = process.env.EAS_EMAIL || process.env.EXPO_EMAIL;
    const easPassword = process.env.EAS_PASSWORD || process.env.EXPO_PASSWORD;
    
    if (easToken) {
      console.log('🎫 Found EAS token in environment variables');
      console.log('🔄 Attempting to authenticate with token...');
      
      try {
        // Set the token for EAS CLI
        process.env.EXPO_TOKEN = easToken;
        
        // Verify the token works
        const tokenResult = await execa('eas', ['whoami'], {
          reject: false,
          timeout: 15000,
          env: { 
            ...process.env, 
            EXPO_TOKEN: easToken,
            EAS_TOKEN: easToken
          }
        });
        
        if (tokenResult.exitCode === 0) {
          const username = tokenResult.stdout.trim();
          console.log(`✅ Successfully authenticated with token as: ${username}`);
          results.username = username;
          results.success = true;
          results.steps.push({
            step: 'token-auth',
            success: true,
            message: `Successfully authenticated with token as ${username}`,
            method: 'token'
          });
          return results;
        } else {
          console.log('❌ Token authentication failed');
          results.steps.push({
            step: 'token-auth',
            success: false,
            message: 'Token authentication failed',
            error: tokenResult.stderr || 'Invalid token'
          });
        }
      } catch (tokenError) {
        console.error('Token authentication error:', tokenError.message);
        results.steps.push({
          step: 'token-auth',
          success: false,
          message: 'Token authentication error',
          error: tokenError.message
        });
      }
    } else if (easEmail && easPassword) {
      console.log('📧 Found email/password credentials in environment variables');
      console.log('⚠️  Note: Email/password authentication is not supported in non-interactive mode');
      console.log('🔍 Please use EXPO_TOKEN for automated authentication');
      
      results.steps.push({
        step: 'email-password-check',
        success: false,
        message: 'Email/password authentication not supported in non-interactive mode',
        recommendation: 'Use EXPO_TOKEN for programmatic access'
      });
    } else {
      console.log('⚠️  No authentication credentials found in environment variables');
      console.log('🔍 Available authentication methods:');
      console.log('   1. Set EXPO_TOKEN or EAS_TOKEN environment variable');
      console.log('   2. Set EAS_EMAIL and EAS_PASSWORD environment variables');
      console.log('   3. Run `eas login` manually before using this script');
      
      results.steps.push({
        step: 'credential-check',
        success: false,
        message: 'No authentication credentials found',
        availableMethods: [
          'EXPO_TOKEN/EAS_TOKEN environment variable',
          'EAS_EMAIL/EAS_PASSWORD environment variables',
          'Manual login with `eas login`'
        ]
      });
    }
    
    // Step 3: Try interactive login as last resort (only if running in terminal)
    if (process.stdout.isTTY && !process.env.CI) {
      console.log('\n💬 Attempting interactive login...');
      console.log('⚠️  This will prompt for credentials in the terminal');
      
      try {
        const interactiveResult = await execa('eas', ['login'], {
          stdio: 'inherit', // Pass through to terminal
          reject: false,
          timeout: 120000 // 2 minutes for user input
        });
        
        if (interactiveResult.exitCode === 0) {
          // Verify the interactive login worked
          const verifyResult = await execa('eas', ['whoami'], {
            reject: false,
            timeout: 10000
          });
          
          if (verifyResult.exitCode === 0) {
            const username = verifyResult.stdout.trim();
            console.log(`✅ Successfully logged in interactively as: ${username}`);
            results.username = username;
            results.success = true;
            results.steps.push({
              step: 'interactive-auth',
              success: true,
              message: `Successfully logged in interactively as ${username}`,
              method: 'interactive'
            });
            return results;
          }
        }
        
        console.log('❌ Interactive login failed or was cancelled');
        results.steps.push({
          step: 'interactive-auth',
          success: false,
          message: 'Interactive login failed or was cancelled'
        });
        
      } catch (interactiveError) {
        console.error('Interactive login error:', interactiveError.message);
        results.steps.push({
          step: 'interactive-auth',
          success: false,
          message: 'Interactive login error',
          error: interactiveError.message
        });
      }
    } else {
      console.log('🤖 Running in non-interactive mode (CI/automated environment)');
      console.log('   Interactive login not available');
      
      results.steps.push({
        step: 'interactive-check',
        success: false,
        message: 'Interactive login not available in CI/automated environment',
        environment: {
          isTTY: process.stdout.isTTY,
          isCI: !!process.env.CI
        }
      });
    }
    
    // If we reach here, all authentication methods failed
    console.log('\n❌ All authentication methods failed');
    console.log('📋 Authentication Summary:');
    results.steps.forEach((step, index) => {
      const status = step.success ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${step.step}: ${step.message}`);
    });
    
    console.log('\n💡 To resolve this issue:');
    console.log('   1. Get your EAS token from: https://expo.dev/accounts/[account]/settings/access-tokens');
    console.log('   2. Set EXPO_TOKEN environment variable with your token');
    console.log('   3. Or run `eas login` manually in your terminal');
    
    return {
      success: false,
      message: 'Failed to authenticate with EAS using all available methods',
      error: 'Authentication required',
      steps: results.steps,
      troubleshooting: [
        'Set EXPO_TOKEN environment variable',
        'Set EAS_EMAIL and EAS_PASSWORD environment variables',
        'Run `eas login` manually',
        'Check EAS CLI installation: npm install -g eas-cli'
      ]
    };
    
  } catch (error) {
    console.error('EAS login error:', error.message);
    return {
      success: false,
      message: 'EAS login failed due to unexpected error',
      error: error.message || 'Unknown error',
      steps: [
        {
          step: 'login-error',
          success: false,
          message: 'Unexpected error during login process',
          error: error.message
        }
      ]
    };
  }
}


// Run if called directly
if (require.main === module) {
  easLogin()
    .then(result => {
      console.log('Login result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Login failed:', error);
      process.exit(1);
    });
}

module.exports = { easLogin };