import type { PromptSection } from "../../types";

export const typescriptSection: PromptSection = {
  id: "typescript",
  name: "TypeScript Guidance",
  xmlTag: "typescript_guidance",
  required: true,
  order: 3,
  content: `<typescript_guidance>
  When writing TypeScript code, you MUST follow these fundamental rules:

  - TypeScript first: Proper typing with interfaces and type safety
  - Explicit Type Annotations for useState: Always use explicit types: "useState<Type[]>([])" not "useState([])"
  - Type Verification: Before using any property or method, verify it exists in the type definition
  - Null/Undefined Handling: Use optional chaining (?.) and nullish coalescing (??)
  - Complete Object Creation: Include ALL required properties when creating objects
  - Import Verification: Only import from modules that exist in the project
  - Style Properties: Use literal values for variables that are used in styles.
    For example: const fontWeight = "bold" as const;

  <common_typescript_errors_to_avoid>
    Make sure to avoid these errors in your implementation.

    # Common errors when using StyleSheet
    - error TS1117: An object literal cannot have multiple properties with the same name
  </common_typescript_errors_to_avoid>

</typescript_guidance>`,
};
