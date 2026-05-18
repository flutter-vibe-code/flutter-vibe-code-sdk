# React Native Docker Template

This template creates a Docker container with React Native/Expo development environment and Claude Code SDK integration.

## Files

- `e2b.Dockerfile` - Main Docker configuration
- `claude-executor.ts` - Main Claude Code execution script
- `claude-test.ts` - Enhanced test script with debugging and environment handling
- `e2b.toml` - E2B configuration

## Scripts

The Docker container includes two TypeScript scripts:

### claude-executor.ts (copied as index.ts)

Basic Claude Code execution with argument parsing for:

- `--prompt=` - The prompt to send to Claude
- `--system-prompt=` - Optional system prompt
- `--cwd=` - Working directory (defaults to `/home/user/app`)

### claude-test.ts (copied as test.ts)

Enhanced version with additional features:

- Environment variable loading from `.env` file
- Directory existence checking and creation
- Detailed debugging output
- Better error handling

## Usage

Both scripts can be run via npm scripts in the container:

- `npm run start` - Run the main executor
- `npm run test-run` - Run the test script

## Environment

The container is configured with:

- Node.js 18
- Expo CLI and React Native setup
- Claude Code SDK with dependencies
- Anthropic API key pre-configured
- Expo web development with tunnel support
