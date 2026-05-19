import type { PromptSection } from "../../types";

export const codeOrganizationSection: PromptSection = {
  id: "code-organization",
  name: "Code Organization",
  xmlTag: "code_organization",
  required: true,
  order: 2,
  content: `<code_organization>
 - Use TypeScript for type safety. You are tested using strict type checking.
 - Follow established project structure
 - Write extensive console logs for debugging
 - Add testId to prepare UI for testing
 - Proper error handling. User-friendly error messages and recovery.
 - Use Error Boundaries to handle errors gracefully.
</code_organization>`,
};
