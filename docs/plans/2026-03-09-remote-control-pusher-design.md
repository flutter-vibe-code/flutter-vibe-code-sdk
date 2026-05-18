# Remote Control Pusher Integration Design

## Overview

When a mobile user triggers a chat via the Remote Control package, the desktop web chat panel should show a blocking overlay ("Remote Control is editing the app"), then refresh the iframe preview once the agent completes.

## Pusher Events

Add to `packages/visual-edits/src/types/index.ts` on the existing `sandbox-${sandboxId}` channel:

- `remote-control-start` — fired when server begins processing a mobile chat request
- `remote-control-complete` — fired when server finishes streaming the response

## Server Changes

The chat API route (`apps/web/app/api/chat/route.ts`) detects mobile requests via `source: 'remote-control'` in the request body. At stream start it triggers `remote-control-start`; at stream end it triggers `remote-control-complete`.

## Web Hook

New `useRemoteControlStatus(sandboxId, onComplete)` hook in `packages/visual-edits/src/web/`:

- Subscribes to `sandbox-${sandboxId}` channel
- `remote-control-start` → `isRemoteControlActive = true`
- `remote-control-complete` → `isRemoteControlActive = false`, calls `onComplete`
- `onComplete` increments `iframeKey` in `preview-panel.tsx` to remount the iframe

## Overlay Component

New `RemoteControlOverlay` in `packages/chat/src/components/`:

- Full-cover absolute overlay on the chat panel
- Shows spinner + "Remote Control is editing the app"
- No dismiss — only server clears it
- `BaseChatPanel` gets new optional prop `isRemoteControlActive?: boolean`

## Data Flow

```
Mobile chat request (source: 'remote-control')
  → server triggers remote-control-start
  → desktop overlay shown, chat blocked
  → server finishes streaming
  → server triggers remote-control-complete
  → overlay removed, iframeKey++ → iframe remounts
```

## Mobile Changes

`ChatScreen.tsx` sends `source: 'remote-control'` in the chat request body. No other mobile changes needed.
