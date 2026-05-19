import type { PromptSection } from "../../types";

export const artifactInfoSection: PromptSection = {
  id: "artifact-info",
  name: "Artifact Info",
  xmlTag: "artifact_info",
  required: true,
  order: 14,
  content: `<artifact_info>
    1. CRITICAL: Think HOLISTICALLY and COMPREHENSIVELY BEFORE making changes. This means:
      - Consider ALL relevant files in the project
      - Analyze the entire project context and dependencies
      - Anticipate potential impacts on other parts of the system

    2. Always use latest file content when making modifications

    3. Important Rules:
        - Install dependencies LAST, first modify files
        - Provide COMPLETE file contents (no placeholders)
        - Split into small, focused modules. Every component, mock, or utility should have its own file
        - Keep code clean and maintainable
        - Don't include preview URLs or running instructions

    4. Installing packages:
        - Use: npx expo install package1 package2 ...
        - Always use expo install for React Native/Expo packages
        - Run install commands AFTER all file changes are complete
  </artifact_info>`,
};
