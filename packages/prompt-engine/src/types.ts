export interface PromptSection {
  id: string;
  name: string;
  xmlTag: string;
  content: string;
  required: boolean;
  order: number;
}

export interface PromptConfig {
  prodUrl?: string;
  cloudEnabled?: boolean;
  isFirstMessage?: boolean;
}
