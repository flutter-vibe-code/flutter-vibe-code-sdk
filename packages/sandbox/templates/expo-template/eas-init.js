#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Starting EAS project initialization...');

async function easInit() {
  try {
    const { execa } = await import('execa');
    
    // Get app directory
    const appDir = process.argv[2] || '/home/user/app';
    
    console.log(`App directory: ${appDir}`);
    
    // Check if app directory exists
    if (!fs.existsSync(appDir)) {
      console.error(`App directory does not exist: ${appDir}`);
      return {
        success: false,
        message: `App directory not found: ${appDir}`,
        error: 'Directory not found'
      };
    }
    
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
        results.steps.push({
          step: 'auth-check',
          success: true,
          message: `Authenticated as ${username}`
        });
      } else {
        console.log('❌ Not authenticated with EAS');
        return {
          success: false,
          message: 'Not authenticated with EAS. Please login first.',
          error: 'Authentication required',
          needsAuth: true
        };
      }
    } catch (authError) {
      console.error('Auth check failed:', authError.message);
      return {
        success: false,
        message: 'EAS authentication check failed',
        error: authError.message
      };
    }
    
    // Step 2: Check if project is already initialized
    console.log('\n🔍 Checking if EAS project is already initialized...');
    
    const appJsonPath = path.join(appDir, 'app.json');
    let appJsonContent = null;
    
    if (fs.existsSync(appJsonPath)) {
      try {
        appJsonContent = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
        console.log('📋 Found app.json');
        
        // Check if EAS project ID exists
        if (appJsonContent.expo && appJsonContent.expo.extra && appJsonContent.expo.extra.eas) {
          console.log('✅ EAS configuration already exists in app.json');
          
          // Still check with EAS to make sure it's properly linked
          const projectInfoResult = await execa('eas', ['project:info'], {
            cwd: appDir,
            reject: false,
            timeout: 15000
          });
          
          if (projectInfoResult.exitCode === 0) {
            console.log('✅ Project is already linked to EAS');
            console.log(projectInfoResult.stdout);
            
            results.steps.push({
              step: 'project-check',
              success: true,
              message: 'Project already initialized and linked',
              output: projectInfoResult.stdout
            });
            
            results.success = true;
            return results;
          }
        }
      } catch (jsonError) {
        console.error('Error reading app.json:', jsonError.message);
      }
    } else {
      console.error('❌ app.json not found in project directory');
      return {
        success: false,
        message: 'app.json not found. Not a valid Expo project.',
        error: 'Missing app.json'
      };
    }
    
    // Step 3: Prepare unique project configuration
    console.log('\n📝 Preparing unique project configuration...');
    
    // Generate a unique slug based on timestamp to ensure each deployment gets its own project
    const timestamp = Date.now();
    const originalSlug = appJsonContent.expo.slug || 'app';
    const uniqueSlug = `${originalSlug}-${timestamp}`;
    
    // Update app.json with unique slug
    const updatedAppJson = {
      ...appJsonContent,
      expo: {
        ...appJsonContent.expo,
        slug: uniqueSlug,
        name: `${appJsonContent.expo.name || originalSlug}-${timestamp}`
      }
    };
    
    console.log(`📝 Setting unique slug: ${uniqueSlug}`);
    fs.writeFileSync(appJsonPath, JSON.stringify(updatedAppJson, null, 2));
    
    // Step 4: Initialize EAS project with unique configuration
    console.log('\n📝 Initializing EAS project...');
    console.log('This will create a new EAS project with unique ID');
    const owner = appJsonContent.expo.owner || 'default';
    console.log(`Creating project: @${owner}/${uniqueSlug}`);
    
    // First attempt without --force
    let initResult = await execa('eas', ['project:init', '--non-interactive'], {
      cwd: appDir,
      reject: false,
      timeout: 60000, // 1 minute
      env: { 
        ...process.env, 
        CI: 'true',
        EAS_NO_VCS_IGNORE_CHECK: '1'
      }
    });
    
    // If project doesn't exist, we need to create it with --force
    if (initResult.exitCode !== 0 && initResult.stdout && initResult.stdout.includes('Project does not exist')) {
      console.log('📝 Project does not exist, creating new project...');
      
      // Create the project with --force since it's genuinely new
      initResult = await execa('eas', ['project:init', '--non-interactive', '--force'], {
        cwd: appDir,
        reject: false,
        timeout: 60000, // 1 minute
        env: { 
          ...process.env, 
          CI: 'true',
          EAS_NO_VCS_IGNORE_CHECK: '1'
        }
      });
    }
    
    console.log('Init stdout:', initResult.stdout);
    if (initResult.stderr) {
      console.error('Init stderr:', initResult.stderr);
    }
    
    if (initResult.exitCode === 0) {
      console.log('✅ EAS project initialized successfully');
      
      // Check if app.json was updated
      try {
        const updatedAppJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
        const hasEasConfig = updatedAppJson.expo && updatedAppJson.expo.extra && updatedAppJson.expo.extra.eas;
        
        console.log(`📋 app.json updated: ${hasEasConfig ? 'Yes' : 'No'}`);
        
        results.steps.push({
          step: 'project-init',
          success: true,
          message: 'EAS project initialized successfully',
          output: initResult.stdout,
          appJsonUpdated: hasEasConfig
        });
        
        // Step 5: Verify initialization by checking project info
        console.log('\n✅ Verifying initialization...');
        const verifyResult = await execa('eas', ['project:info'], {
          cwd: appDir,
          reject: false,
          timeout: 15000
        });
        
        if (verifyResult.exitCode === 0) {
          console.log('✅ Project verification successful');
          console.log(verifyResult.stdout);
          
          results.steps.push({
            step: 'project-verify',
            success: true,
            message: 'Project initialization verified',
            output: verifyResult.stdout
          });
        }
        
        results.success = true;
        
      } catch (jsonError) {
        console.error('Error verifying app.json update:', jsonError.message);
        results.steps.push({
          step: 'project-init',
          success: true,
          message: 'EAS project initialized (could not verify app.json update)',
          output: initResult.stdout
        });
        results.success = true;
      }
      
    } else {
      console.error('❌ EAS project initialization failed');
      return {
        success: false,
        message: 'EAS project initialization failed',
        error: initResult.stderr || initResult.stdout,
        exitCode: initResult.exitCode
      };
    }
    
    return results;
    
  } catch (error) {
    console.error('EAS initialization error:', error.message);
    return {
      success: false,
      message: 'EAS initialization failed',
      error: error.message || 'Unknown error'
    };
  }
}

// Run if called directly
if (require.main === module) {
  easInit()
    .then(result => {
      console.log('\nInitialization result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { easInit };