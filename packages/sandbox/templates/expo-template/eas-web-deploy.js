#!/usr/bin/env node

/**
 * EAS Web Deployment Script
 * Deploys the web build to Expo hosting
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function easWebDeploy(appDirectory = '/home/user/app') {
  console.log('Starting EAS web deployment...');
  console.log('App directory:', appDirectory);
  
  try {
    // Check if dist directory exists
    const distPath = path.join(appDirectory, 'dist');
    if (!fs.existsSync(distPath)) {
      console.error('❌ No dist directory found. Please build first.');
      return {
        success: false,
        message: 'No dist directory found. Run build first.',
        error: 'DIST_NOT_FOUND'
      };
    }
    
    console.log('✅ Found dist directory');
    
    // Read app.json to get project configuration
    const appJsonPath = path.join(appDirectory, 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    const slug = appJson.expo?.slug || 'app';
    const owner = appJson.expo?.owner || appJson.expo?.extra?.eas?.owner || 'anonymous';
    const projectId = appJson.expo?.extra?.eas?.projectId;
    
    console.log('📱 App configuration:');
    console.log(`   Slug: ${slug}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Project ID: ${projectId}`);
    
    // Use actual EAS deploy command
    console.log('\n🚀 Running eas deploy...');
    
    const { stdout: deployOutput, stderr: deployError } = await execAsync(`eas deploy --prod --non-interactive`, {
      cwd: appDirectory,
      timeout: 120000, // 2 minutes
      env: { ...process.env }
    });
    
    console.log('EAS deploy output:', deployOutput);
    if (deployError) {
      console.error('EAS deploy error:', deployError);
    }
    
    // Extract the deployment URL from the output
    // Look for patterns from EAS deploy output
    const deploymentUrlMatch = deployOutput.match(/Deployment URL\s+(https:\/\/[^\s]+)/i);
    const productionUrlMatch = deployOutput.match(/Production URL\s+(https:\/\/[^\s]+)/i);
    
    let deploymentUrl = null;
    let productionUrl = null;
    
    if (deploymentUrlMatch) {
      deploymentUrl = deploymentUrlMatch[1];
      console.log(`✅ Deployment URL: ${deploymentUrl}`);
    }
    
    if (productionUrlMatch) {
      productionUrl = productionUrlMatch[1];
      console.log(`✅ Production URL: ${productionUrl}`);
    }
    
    // Use deployment URL as the primary URL (the unique one with hash)
    const primaryUrl = deploymentUrl || productionUrl;
    
    if (primaryUrl) {
      console.log(`✅ Deployment successful! Primary URL: ${primaryUrl}`);
    } else {
      console.log('⚠️  Could not extract deployment URL from output');
    }
    
    const deploymentInfo = {
      success: true,
      message: 'EAS web deployment completed successfully',
      buildPath: distPath,
      buildUrl: primaryUrl,
      deploymentUrl: deploymentUrl,
      productionUrl: productionUrl,
      projectInfo: {
        slug: slug,
        owner: owner,
        projectId: projectId,
        fullName: `@${owner}/${slug}`
      },
      deployOutput: deployOutput,
      deployError: deployError
    };
    
    return deploymentInfo;
    
  } catch (error) {
    console.error('Deployment error:', error.message);
    return {
      success: false,
      message: 'Failed to prepare deployment',
      error: error.message
    };
  }
}

// Run if called directly
if (require.main === module) {
  const appDir = process.argv[2] || '/home/user/app';
  
  easWebDeploy(appDir)
    .then(result => {
      console.log('\nDeployment result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Deploy failed:', error);
      process.exit(1);
    });
}

module.exports = { easWebDeploy };