// Types
export type { PromptSection, PromptConfig } from "./types";

// Main prompt exports — switched from RN system.ts to Flutter system-flutter.ts.
// The legacy "system" module still exists in src/prompts/ for reference but
// is no longer wired in.
export { prompt, createSystemPrompt } from "./prompts/system-flutter";
export { convexGuidelines } from "./prompts/convex";

// Section re-exports kept for backward compatibility with any external caller
// that imports them. They contain RN-flavored strings — DO NOT use them in
// new code; the Flutter system prompt is fully self-contained.
export {
  sections,
  getSectionById,
  getRequiredSections,
  getSectionsByOrder,
  envSection,
  codeOrganizationSection,
  typescriptSection,
  reactOptimizationsSection,
  designSection,
  toneAndStyleSection,
  proactivenessSection,
  stateManagementSection,
  stackInfoSection,
  webCompatibilitySection,
  docsSection,
  aiIntegrationSection,
  createAiIntegrationSection,
  appstoreSection,
  artifactInfoSection,
  firstMessageSection,
} from "./prompts/sections";

const noCloudNote = `
<cloud_disabled>
IMPORTANT: Cloud/Backend (Convex) is NOT enabled for this project.
- Do NOT generate any Convex functions, schemas, or queries.
- Do NOT add convex_flutter or convex client packages to pubspec.yaml.
- If the user asks for backend or realtime functionality, tell them to enable Cloud first by clicking the "Cloud" button in the toolbar.
- For local persistence use shared_preferences (KV) or drift / isar (relational). For ephemeral state use Riverpod providers.
- Ignore any pre-existing convex folder in the template — it is not active.
</cloud_disabled>
`;

/**
 * Get the system prompt with optional Convex guidelines.
 * Loads the Flutter prompt at request time so an in-process change in
 * system-flutter.ts is picked up without re-importing.
 *
 * @param cloudEnabled Whether Convex is enabled for this project.
 * @returns The Flutter system prompt, with Convex guidelines or a no-cloud note appended.
 */
export function getPromptWithCloudStatus(cloudEnabled: boolean): string {
  const { prompt } = require("./prompts/system-flutter");
  const { convexGuidelines } = require("./prompts/convex");

  if (cloudEnabled) {
    return prompt + "\n\n" + convexGuidelines;
  }
  return prompt + "\n\n" + noCloudNote;
}
