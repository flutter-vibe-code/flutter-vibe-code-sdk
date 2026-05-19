import type { PromptSection } from "../../types";

export const reactOptimizationsSection: PromptSection = {
  id: "react-optimizations",
  name: "React Optimizations",
  xmlTag: "react_optimizations_guidance",
  required: true,
  order: 4,
  content: `<react_optimizations_guidance>
  This project does NOT use React Compiler. Use manual optimization: React.memo(), useMemo(), useCallback() with explicit dependencies. No automatic optimization assumptions - all performance optimizations must be explicit.
</react_optimizations_guidance>`,
};
