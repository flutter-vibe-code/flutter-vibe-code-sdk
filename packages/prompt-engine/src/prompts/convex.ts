export const convexGuidelines = `
<convex_guidelines>
You MUST use Convex for the database, realtime, file storage, functions, scheduling, and search functionality.
Convex is realtime by default, so you never need to manually refresh subscriptions.

## Function Guidelines

### Function Syntax
ALWAYS use the new function syntax for Convex functions:

\`\`\`ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const f = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return "Hello " + args.name;
  },
});
\`\`\`

### Validators
Valid Convex validators:
- \`v.string()\`, \`v.number()\`, \`v.boolean()\`, \`v.null()\`
- \`v.id(tableName)\` - for document IDs
- \`v.array(values)\` - arrays (max 8192 elements)
- \`v.object({property: value})\` - objects (max 1024 entries)
- \`v.optional(validator)\` - optional fields
- \`v.union(v1, v2)\` - union types
- \`v.literal("value")\` - literal values

IMPORTANT: \`v.map()\` and \`v.set()\` are NOT supported.

### Function Registration
- Use \`query\`, \`mutation\`, \`action\` for public functions
- Use \`internalQuery\`, \`internalMutation\`, \`internalAction\` for private functions
- ALWAYS include argument validators for all functions

### Function References
- Use \`api\` object for public functions: \`api.messages.list\`
- Use \`internal\` object for internal functions: \`internal.functions.helper\`
- Import from \`./_generated/api\`

### Function Calling
- \`ctx.runQuery\` - call a query from query/mutation/action
- \`ctx.runMutation\` - call a mutation from mutation/action
- \`ctx.runAction\` - call an action from action

## Schema Guidelines

Define schema in \`convex/schema.ts\`:

\`\`\`ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    content: v.string(),
    authorId: v.id("users"),
  }).index("by_author", ["authorId"]),
});
\`\`\`

### Index Rules
- System provides built-in \`by_id\` and \`by_creation_time\` indexes - NEVER define these
- Do NOT include \`_creationTime\` as the last column in any index
- Index fields must be queried in the order they are defined

## Query Guidelines

- Do NOT use \`.filter()\` - use \`.withIndex()\` instead
- Use \`.collect()\` to get all results as array
- Use \`.take(n)\` to limit results
- Use \`.unique()\` for single document (throws if multiple match)
- Use \`.order("asc")\` or \`.order("desc")\` for ordering

\`\`\`ts
const messages = await ctx.db
  .query("messages")
  .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
  .order("desc")
  .take(10);
\`\`\`

## Mutation Guidelines

- \`ctx.db.insert(table, doc)\` - insert new document
- \`ctx.db.patch(id, fields)\` - shallow merge update
- \`ctx.db.replace(id, doc)\` - full replace
- \`ctx.db.delete(id)\` - delete document

## Action Guidelines

- Add \`"use node";\` at top of files using Node.js modules
- Files with \`"use node";\` should NEVER contain queries or mutations
- Actions don't have \`ctx.db\` access - use \`ctx.runQuery\`/\`ctx.runMutation\`

## Client Integration (React Native)

\`\`\`tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export default function App() {
  const messages = useQuery(api.messages.list) || [];
  const sendMessage = useMutation(api.messages.send);

  // useQuery is live-updating! Component rerenders on data changes
  return (
    <View>
      {messages.map((msg) => (
        <Text key={msg._id}>{msg.content}</Text>
      ))}
    </View>
  );
}
\`\`\`

### Conditional Queries
NEVER use hooks conditionally. Use "skip" pattern:

\`\`\`tsx
// WRONG
const data = userId ? useQuery(api.users.get, { userId }) : null;

// CORRECT
const data = useQuery(api.users.get, userId ? { userId } : "skip");
\`\`\`

## Auth Guidelines

Use \`getAuthUserId\` to get the logged-in user:

\`\`\`ts
import { getAuthUserId } from "@convex-dev/auth/server";

export const currentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});
\`\`\`

## File Storage

- Use \`ctx.storage.generateUploadUrl()\` to get upload URL
- Store \`Id<"_storage">\` in your documents, NOT the URL
- Use \`ctx.storage.getUrl(storageId)\` to get signed URL

\`\`\`ts
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.db.insert("files", { storageId: args.storageId });
  },
});
\`\`\`

## Scheduling

\`\`\`ts
// Schedule a function to run later
await ctx.scheduler.runAfter(0, internal.functions.process, { id });

// Cron jobs in convex/crons.ts
const crons = cronJobs();
crons.interval("cleanup", { hours: 24 }, internal.tasks.cleanup, {});
export default crons;
\`\`\`

IMPORTANT: Auth does NOT propagate to scheduled jobs - use internal functions.

## Limits

- Arguments/returns: max 8 MiB
- Arrays: max 8192 elements
- Objects: max 1024 entries
- Documents: max 1 MiB
- Query/mutation timeout: 1 second
- Action timeout: 10 minutes
- Queries can read max 16384 documents
- Mutations can write max 8192 documents

</convex_guidelines>
`;
