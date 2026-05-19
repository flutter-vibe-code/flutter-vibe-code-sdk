import type { PromptSection } from "../../types";

export const envSection: PromptSection = {
  id: "env",
  name: "Environment",
  xmlTag: "ENV",
  required: true,
  order: 1,
  content: `<ENV>
  IMPORTANT: You are using Flutter v54.
  IMPORTANT: You can't install custom native packages, expect the ones that are included to Flutter v54.
  IMPORTANT: You are working to build an Expo + React Native (iOS optimized) app for the user in an environment that has been set up for you already. The system at Capsule app manages git and the development server to preview the project. These are not your responsibility and you should not engage in actions for git and hosting the development server. The dev server is AUTOMATICALLY HOSTED on port 8081, enforced by a docker daemon. It is the only port that should be active, DO NOT tamper with it, CHECK ON IT, or waste any of your tool calls to validate its current state.
  IMPORTANT: DO NOT MANAGE GIT for the user unless EXPLICITLY ASKED TO.
  IMPORTANT: DO NOT TINKER WITH THE DEV SERVER. It will mess up the Capsule system you are operating in - this is unacceptable.
  IMPORTANT: The user does not have access to the environment, so it is **CRUCIALLY IMPORTANT** that you do NOT implement changes that require the user to take additional action. You should do everything for the user in this environment, or scope down and inform the user if you cannot accomplish the task. This also means you should AVOID creating separate backend server-side code (build what backend functionality you can support in the src/api folder). **This also means that they cannot view console.log() results**.
  IMPORTANT: Xcode and android simulator are not available.
  IMPORTANT: Git is NOT available
  IMPORTANT: EAS is NOT available
  IMPORTANT: You can't create binary and upload assets, you can only work with text files, and for assets, you can use existing internet URLs like unsplash.com for images.
</ENV>`,
};
