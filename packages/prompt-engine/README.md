# @react-native-vibe-code/prompt-engine

AI prompt templates and guidelines for React Native Vibe Code. This package contains the system prompts that power the AI agent for generating React Native/Expo mobile applications.

## Overview

This package provides:
- Pre-built system prompts for AI-powered code generation
- Convex backend integration guidelines
- Individual prompt sections for customization
- Full documentation of all XML-tagged sections

## Installation

```bash
pnpm add @react-native-vibe-code/prompt-engine
```

## Quick Start

```typescript
import {
  getPromptWithCloudStatus
} from "@react-native-vibe-code/prompt-engine";

// Get prompt with Convex guidelines
const prompt = getPromptWithCloudStatus(true);

// Get prompt without Convex
const basicPrompt = getPromptWithCloudStatus(false);
```

## Prompt Sections

The system prompt is organized into XML-tagged sections. Each section provides specific guidance to the AI:

| Section | XML Tag | Purpose |
|---------|---------|---------|
| **Environment** | `<ENV>` | Flutter v54 constraints, no native packages, no Xcode/simulator, no Git |
| **Code Organization** | `<code_organization>` | TypeScript, project structure, logging, error handling |
| **TypeScript Guidance** | `<typescript_guidance>` | Type safety rules, explicit annotations, null handling |
| **React Optimizations** | `<react_optimizations_guidance>` | Manual optimization with React.memo, useMemo, useCallback |
| **Design** | `<design>` | Mobile-first, beautiful UI, lucide icons (no emojis), responsive design |
| **Tone and Style** | `<tone_and_style>` | Concise, direct communication, minimal output |
| **Proactiveness** | `<proactiveness>` | Behavior guidelines, follow conventions, code style |
| **State Management** | `<state_management>` | React Query, useState, @nkzw/create-context-hook patterns |
| **Stack Info** | `<stack_info>` | Expo Router, StyleSheet, animations, safe area, routing patterns |
| **Web Compatibility** | `<web_compatibility>` | React Native Web API compatibility, Platform checks |
| **Library Docs** | `<docs>` | Usage examples for create-context-hook, expo-camera, etc. |
| **AI Integration** | `<using_ai>` | LLM API endpoints, image generation, speech-to-text |
| **App Store** | `<appstore_submission_instructions>` | EAS restrictions, submission limitations |
| **Artifact Info** | `<artifact_info>` | Code generation format with xArtifact and xAction |
| **First Message** | `<first-message-instructions>` | Initial conversation guidance |

## Using Individual Sections

```typescript
import {
  typescriptSection,
  designSection,
  stateManagementSection,
} from "@react-native-vibe-code/prompt-engine/sections";

// Access section content
console.log(typescriptSection.content);

// Section metadata
console.log(designSection.name);     // "Design"
console.log(designSection.xmlTag);   // "design"
console.log(designSection.required); // true
console.log(designSection.order);    // 5
```

## Creating Custom Prompts

```typescript
import {
  createSystemPrompt,
  sections,
  getSectionById,
} from "@react-native-vibe-code/prompt-engine";

// Create prompt with custom config
const customPrompt = createSystemPrompt({
  prodUrl: "https://myapp.com",
  isFirstMessage: true,
});

// Get specific section
const envSection = getSectionById("env");
```

## Convex Guidelines

When backend is enabled, the Convex guidelines are appended to the prompt:

```typescript
import { convexGuidelines } from "@react-native-vibe-code/prompt-engine";

// Contains comprehensive Convex integration guidelines:
// - Function syntax (query, mutation, action)
// - Validators (v.string, v.number, v.id, etc.)
// - Schema definition with indexes
// - Query/mutation/action patterns
// - Auth integration
// - File storage
// - Scheduling and crons
// - System limits
```

## API Reference

### Main Exports

```typescript
// Pre-built prompts
export const prompt: string;
export function getPromptWithCloudStatus(cloudEnabled: boolean): string;
export function createSystemPrompt(config?: PromptConfig): string;
export const convexGuidelines: string;
```

### Types

```typescript
interface PromptSection {
  id: string;
  name: string;
  xmlTag: string;
  content: string;
  required: boolean;
  order: number;
}

interface PromptConfig {
  prodUrl?: string;
  cloudEnabled?: boolean;
  isFirstMessage?: boolean;
}
```

### Section Utilities

```typescript
import {
  sections,              // Array of all sections
  getSectionById,        // Get section by ID
  getRequiredSections,   // Get only required sections
  getSectionsByOrder,    // Get sections sorted by order
} from "@react-native-vibe-code/prompt-engine";
```

## Section Details

### Environment (`<ENV>`)
- Flutter v54 only
- No custom native packages
- No Xcode/simulator access
- No Git management
- No EAS access
- Text files only (use URLs for images)

### Design (`<design>`)
- Beautiful, production-worthy designs
- Inspiration from iOS, Instagram, Airbnb, Coinbase
- Use lucide-react-native icons (NO emojis)
- Google Fonts via @expo-google-fonts/dev
- Mobile-first with desktop layouts (max 1024px)

### State Management (`<state_management>`)
- React Query for server state
- useState for local state
- @nkzw/create-context-hook for shared state
- AsyncStorage for persistence
- No zustand/jotai/redux unless requested

### Routing (`<stack_info>`)
- Expo Router file-based routing
- Stack and Tabs navigation patterns
- Safe area handling
- Dynamic parameters with useLocalSearchParams

### Web Compatibility (`<web_compatibility>`)
- Platform checks for native-only APIs
- Reanimated limitations on web
- ScrollView setup for web scrolling
- Fallback patterns for unsupported features

## Package Structure

```
packages/prompt-engine/
├── src/
│   ├── index.ts              # Main exports
│   ├── types.ts              # Type definitions
│   └── prompts/
│       ├── index.ts          # Prompt exports
│       ├── system.ts         # System prompt builder
│       ├── convex.ts         # Convex guidelines
│       └── sections/         # Individual sections
│           ├── index.ts
│           ├── env.ts
│           ├── code-organization.ts
│           ├── typescript.ts
│           ├── react-optimizations.ts
│           ├── design.ts
│           ├── tone-and-style.ts
│           ├── proactiveness.ts
│           ├── state-management.ts
│           ├── stack-info.ts
│           ├── web-compatibility.ts
│           ├── docs.ts
│           ├── ai-integration.ts
│           ├── appstore.ts
│           ├── artifact-info.ts
│           └── first-message.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

## License

MIT
