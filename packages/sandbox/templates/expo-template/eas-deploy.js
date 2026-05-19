#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Starting EAS deployment process...');

async function easDeploy() {
  try {
    const { execa } = await import('execa');
    
    // Get arguments: [action, appDir, profile]
    const action = process.argv[2] || 'deploy'; // 'init', 'deploy', 'status'
    const appDir = process.argv[3] || process.cwd(); // Use current directory if not specified
    const profile = process.argv[4] || 'preview';
    
    console.log(`Action: ${action}`);
    console.log(`App directory: ${appDir}`);
    console.log(`Profile: ${profile}`);
    
    // Check if app directory exists
    if (!fs.existsSync(appDir)) {
      console.error(`App directory does not exist: ${appDir}`);
      return {
        success: false,
        message: `App directory not found: ${appDir}`,
        error: 'Directory not found'
      };
    }
    
    // Change to app directory
    console.log(`Working in: ${appDir}`);
    
    const results = {
      success: false,
      steps: []
    };
    
    // Step 1: Check EAS authentication
    console.log('\n🔐 Checking EAS authentication...');
    try {
      const whoamiResult = await execa('eas', ['whoami'], {
        cwd: appDir,
        reject: false,
        timeout: 10000
      });
      
      if (whoamiResult.exitCode === 0) {
        const username = whoamiResult.stdout.trim();
        console.log(`✅ Authenticated as: ${username}`);
        results.username = username;
      } else {
        console.log('❌ Not authenticated with EAS');
        return {
          success: false,
          message: 'Not authenticated with EAS. Please login first.',
          error: 'Authentication required'
        };
      }
    } catch (authError) {
      console.error('Auth check failed:', authError.message);
    }
    
    if (action === 'init') {
      // Initialize EAS project
      console.log('\n📝 Initializing EAS project...');
      
      // Check if already initialized
      const projectInfoResult = await execa('eas', ['project:info'], {
        cwd: appDir,
        reject: false,
        timeout: 10000
      });
      
      if (projectInfoResult.exitCode === 0) {
        console.log('✅ Project already initialized');
        results.steps.push({
          step: 'project-init',
          success: true,
          message: 'Project already initialized',
          output: projectInfoResult.stdout
        });
      } else {
        // Initialize the project
        console.log('Initializing new EAS project...');
        const initResult = await execa('eas', ['project:init', '--non-interactive'], {
          cwd: appDir,
          reject: false,
          timeout: 30000,
          env: { ...process.env, CI: 'true' }
        });
        
        if (initResult.exitCode === 0) {
          console.log('✅ Project initialized successfully');
          results.steps.push({
            step: 'project-init',
            success: true,
            message: 'Project initialized successfully',
            output: initResult.stdout
          });
        } else {
          console.error('❌ Failed to initialize project');
          return {
            success: false,
            message: 'Failed to initialize EAS project',
            error: initResult.stderr || initResult.stdout
          };
        }
      }
    }
    
    if (action === 'deploy' || action === 'build') {
      // Deploy web build using EAS hosting with 'eas deploy'
      console.log('\n🚀 Starting EAS web hosting deployment...');
      console.log(`Profile: ${profile}`);
      console.log(`Build directory: ${appDir}/dist`);
      
      // Check if dist directory exists
      const distPath = path.join(appDir, 'dist');
      if (!fs.existsSync(distPath)) {
        console.error(`❌ Build directory not found: ${distPath}`);
        console.error('Please run build first: npm run build:web');
        return {
          success: false,
          message: 'Build directory not found. Run build first.',
          error: 'No dist folder'
        };
      }
      
      // Run EAS deploy for web hosting
      const deployArgs = [
        'deploy',
        '--non-interactive'
      ];
      
      // Add profile if it's not the default
      if (profile && profile !== 'preview') {
        deployArgs.push('--branch', profile);
      }
      
      console.log(`Running: eas ${deployArgs.join(' ')}`);
      console.log('Deploying dist folder to EAS hosting...');
      
      const buildResult = await execa('eas', deployArgs, {
        cwd: appDir,
        reject: false,
        timeout: 300000, // 5 minutes
        env: { 
          ...process.env, 
          CI: 'true',
          EAS_NO_VCS_IGNORE_CHECK: '1' // Skip VCS checks
        }
      });
      
      console.log('Build stdout:', buildResult.stdout);
      if (buildResult.stderr) {
        console.error('Build stderr:', buildResult.stderr);
      }
      
      // Extract deployment URL from EAS hosting output
      const deploymentUrlMatch = buildResult.stdout.match(/URL: (https:\/\/[^\s]+)/) ||
                               buildResult.stdout.match(/Hosted at: (https:\/\/[^\s]+)/) ||
                               buildResult.stdout.match(/(https:\/\/[^\s]+\.expo\.dev[^\s]*)/) ||
                               buildResult.stdout.match(/(https:\/\/[^\s]+)/);
      
      if (buildResult.exitCode === 0) {
        console.log('✅ Deployment successful!');
        
        results.success = true;
        results.steps.push({
          step: 'eas-deploy',
          success: true,
          message: 'Web app deployed to EAS hosting',
          deploymentUrl: deploymentUrlMatch ? deploymentUrlMatch[1] : null,
          output: buildResult.stdout
        });
        
        if (deploymentUrlMatch) {
          console.log(`\n🌐 Deployment URL: ${deploymentUrlMatch[1]}`);
        }
      } else {
        console.error('❌ Deployment failed');
        return {
          success: false,
          message: 'EAS deployment failed',
          error: buildResult.stderr || buildResult.stdout,
          exitCode: buildResult.exitCode
        };
      }
    }
    
    if (action === 'status') {
      // Check build status
      console.log('\n📊 Checking build status...');
      
      const statusResult = await execa('eas', ['build:list', '--platform', 'web', '--limit', '5', '--non-interactive'], {
        cwd: appDir,
        reject: false,
        timeout: 30000
      });
      
      if (statusResult.exitCode === 0) {
        console.log('Recent builds:');
        console.log(statusResult.stdout);
        
        results.success = true;
        results.steps.push({
          step: 'build-status',
          success: true,
          message: 'Build status retrieved',
          output: statusResult.stdout
        });
      } else {
        console.error('Failed to get build status');
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('EAS deployment error:', error.message);
    return {
      success: false,
      message: 'EAS deployment failed',
      error: error.message || 'Unknown error'
    };
  }
}

// Run if called directly
if (require.main === module) {
  easDeploy()
    .then(result => {
      console.log('\nDeployment result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { easDeploy };