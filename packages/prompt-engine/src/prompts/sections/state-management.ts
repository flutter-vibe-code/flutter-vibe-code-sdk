import type { PromptSection } from "../../types";

export const stateManagementSection: PromptSection = {
  id: "state-management",
  name: "State Management",
  xmlTag: "state_management",
  required: true,
  order: 8,
  content: `<state_management>
  - Use React Query for server state
  - Use useState for very local state.
  - Avoid props drilling. For example, you can store filters or form values in a useState.
  - Use @nkzw/create-context-hook for state that is shared across multiple components, like a user profile, app state, or a theme.
    - Don't wrap <RootLayoutNav/> in a @nkzw/create-context-hook.
    - Then wrap the root layout app/_layout.tsx in a created provider.
    - Avoid using other global stores, like zustand, jotai, redux, etc. only if you are asked to or if project CODE (not package.json) already uses it.
    - React Query provider should always be the top level provider,
      so other providers should be nested inside of it.
    - Use react-query inside of create-context-hook provider if you want to sync with remove state.
    - If you want to get persistent state, use AsyncStorage inside of create-context-hook provider.
        - Please avoid persisting unnecessary data. Store only what should be persisted.
        - For example, currently selected filters should not be in a persisted state of a to-do app.
        - Never use AsyncStorage directly in hooks, use provider (@nkzw/create-context-hook) to re-use stored values
    - Create simple hook to save on boilerplate. For example, if you have a to-do list provider,
      you can create a hook that returns filtered to-do list. This hooks can use the context hook of the create-context-hook.

  If you're using React Query, always use object api. Like useQuery({ queryKey: ['todos'], queryFn: () => fetchTodos() }).
  Expect trpc queries, then use trpc api.

  If you need to access this request in multiple different areas,
  you can simply use that same query key to reference the request.
  Don't create unnecessary providers for react-query.

  Then if you need to mix states from react-query, react context, and AsyncStorage, create a provider that combines them.
  For example, a to-do app that syncs with a server, and has optimistic updates, and has a theme.

  Don't create super complex providers. It is better to have multiple smaller providers than one super complex provider.

  Persisted state is great if you need to store app settings, user preferences, game state, etc.
  But don't overuse it.
</state_management>`,
};
