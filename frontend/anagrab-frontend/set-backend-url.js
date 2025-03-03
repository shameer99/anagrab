const fs = require('fs');
const { execSync } = require('child_process');
const prNumber = process.env.VERCEL_GIT_PULL_REQUEST_ID; // e.g., "55"

// Production backend URL
const PROD_BACKEND_URL = 'https://anagrab.onrender.com';

if (prNumber) {
  try {
    // Check if there are changes in the backend directory
    // This assumes we're comparing against the main branch
    const hasBackendChanges = checkForBackendChanges();

    if (hasBackendChanges) {
      // If there are backend changes, use the PR-specific URL
      const backendUrl = `https://anagrab-pr-${prNumber}.onrender.com`;
      fs.writeFileSync('.env.preview', `VITE_BACKEND_URL=${backendUrl}`);
      console.log(`Set VITE_BACKEND_URL to ${backendUrl} (PR has backend changes)`);
    } else {
      // If no backend changes, use the production URL
      fs.writeFileSync('.env.preview', `VITE_BACKEND_URL=${PROD_BACKEND_URL}`);
      console.log(`Set VITE_BACKEND_URL to ${PROD_BACKEND_URL} (PR has no backend changes)`);
    }
  } catch (error) {
    console.error('Error checking for backend changes:', error);
    // Fallback to production URL in case of error
    fs.writeFileSync('.env.preview', `VITE_BACKEND_URL=${PROD_BACKEND_URL}`);
    console.log(`Set VITE_BACKEND_URL to ${PROD_BACKEND_URL} (fallback due to error)`);
  }
} else {
  console.log('No PR number found, skipping VITE_BACKEND_URL setup');
}

// Function to check if there are changes in the backend directory
function checkForBackendChanges() {
  try {
    // This command checks if there are any changes in the backend directory
    // between the current branch and the main branch
    // Note: This assumes Vercel has git history available
    const baseBranch = process.env.VERCEL_GIT_COMMIT_REF || 'main';
    const diffOutput = execSync(
      `git diff --name-only origin/${baseBranch}...HEAD | grep "^backend/"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );

    // If there's any output, it means there are changes in the backend directory
    return diffOutput.trim().length > 0;
  } catch (error) {
    // If the grep command fails (no matches), it will throw an error
    // This means there are no backend changes
    if (error.status === 1) {
      return false;
    }
    // For any other error, rethrow
    throw error;
  }
}
