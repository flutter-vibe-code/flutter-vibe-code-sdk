export { envSection } from "./env";
export { codeOrganizationSection } from "./code-organization";
export { typescriptSection } from "./typescript";
export { reactOptimizationsSection } from "./react-optimizations";
export { designSection } from "./design";
export { toneAndStyleSection } from "./tone-and-style";
export { proactivenessSection } from "./proactiveness";
export { stateManagementSection } from "./state-management";
export { stackInfoSection } from "./stack-info";
export { webCompatibilitySection } from "./web-compatibility";
export { docsSection } from "./docs";
export { aiIntegrationSection, createAiIntegrationSection } from "./ai-integration";
export { appstoreSection } from "./appstore";
export { artifactInfoSection } from "./artifact-info";
export { firstMessageSection } from "./first-message";

import { envSection } from "./env";
import { codeOrganizationSection } from "./code-organization";
import { typescriptSection } from "./typescript";
import { reactOptimizationsSection } from "./react-optimizations";
import { designSection } from "./design";
import { toneAndStyleSection } from "./tone-and-style";
import { proactivenessSection } from "./proactiveness";
import { stateManagementSection } from "./state-management";
import { stackInfoSection } from "./stack-info";
import { webCompatibilitySection } from "./web-compatibility";
import { docsSection } from "./docs";
import { aiIntegrationSection } from "./ai-integration";
import { appstoreSection } from "./appstore";
import { artifactInfoSection } from "./artifact-info";
import { firstMessageSection } from "./first-message";
import type { PromptSection } from "../../types";

export const sections: PromptSection[] = [
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
  appstoreSection,
  artifactInfoSection,
  firstMessageSection,
];

export function getSectionById(id: string): PromptSection | undefined {
  return sections.find((s) => s.id === id);
}

export function getRequiredSections(): PromptSection[] {
  return sections.filter((s) => s.required);
}

export function getSectionsByOrder(): PromptSection[] {
  return [...sections].sort((a, b) => a.order - b.order);
}
