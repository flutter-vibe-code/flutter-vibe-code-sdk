export const anthropicChatSkillTemplate = (prodUrl: string, displayName: string, description: string) => `---
name: ${displayName}
description: ${description}
---

# AI Chat Integration

## When to Use This Skill

Use this skill when:
- The user wants to add AI text generation to their app
- The user needs a chatbot or conversational AI feature
- The user wants to build an AI assistant or Q&A system
- The app requires natural language processing or text completion
- The user mentions "ChatGPT", "AI chat", "text generation", or "conversational AI"

Do NOT use this skill when:
- The user needs image generation (use image-generation skill instead)
- The user needs speech-to-text (use speech-to-text skill instead)
- The user needs translation only (use translation skill instead)

## Instructions

1. Create a custom hook (e.g., \`useAIChat\`) to encapsulate the API logic
2. Manage three states: \`response\`, \`loading\`, and \`error\`
3. Always provide a system prompt to define the AI's behavior
4. Use the messages array format with \`role\` and \`content\`
5. Handle errors gracefully and show user-friendly error messages
6. Display loading state while waiting for response

## API Reference

**Endpoint:** \`${prodUrl}/api/toolkit/llm\`
**Method:** POST
**Content-Type:** application/json

### Request Schema

\`\`\`typescript
interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
}
\`\`\`

### Response Schema

\`\`\`typescript
interface ChatResponse {
  completion: string
}
\`\`\`

## Example Implementation

\`\`\`typescript
import { useState } from 'react';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const useAIChat = () => {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (userMessage: string, systemPrompt?: string) => {
    setLoading(true);
    setError(null);

    try {
      const messages: Message[] = [
        {
          role: 'system',
          content: systemPrompt || 'You are a helpful assistant.'
        },
        { role: 'user', content: userMessage }
      ];

      const res = await fetch('${prodUrl}/api/toolkit/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });

      if (!res.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await res.json();
      setResponse(data.completion);
      return data.completion;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      console.error('AI Chat error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResponse('');
    setError(null);
  };

  return { response, loading, error, sendMessage, reset };
};

export default useAIChat;
\`\`\`

### Usage in a Component

\`\`\`typescript
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import useAIChat from './useAIChat';

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const { response, loading, error, sendMessage } = useAIChat();

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input, 'You are a friendly assistant for a mobile app.');
    setInput('');
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Ask something..."
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />
      <TouchableOpacity
        onPress={handleSend}
        disabled={loading}
        style={{ backgroundColor: '#007AFF', padding: 12, borderRadius: 8, marginTop: 8 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {loading ? 'Thinking...' : 'Send'}
        </Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
      {error && <Text style={{ color: 'red', marginTop: 16 }}>{error}</Text>}
      {response && (
        <Text style={{ marginTop: 16, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
          {response}
        </Text>
      )}
    </View>
  );
}
\`\`\`

## Multi-turn Conversation Example

\`\`\`typescript
import { useState } from 'react';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const useConversation = (systemPrompt: string) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: systemPrompt }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (userMessage: string) => {
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage }
    ];

    setMessages(newMessages);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('${prodUrl}/api/toolkit/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!res.ok) throw new Error('Failed to get response');

      const data = await res.json();

      setMessages([
        ...newMessages,
        { role: 'assistant', content: data.completion }
      ]);

      return data.completion;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([{ role: 'system', content: systemPrompt }]);
    setError(null);
  };

  return {
    messages: messages.filter(m => m.role !== 'system'),
    loading,
    error,
    sendMessage,
    clearConversation
  };
};
\`\`\`

## Best Practices

1. **System Prompts**: Always define a system prompt that matches your app's purpose
2. **Error Handling**: Show user-friendly error messages, not technical details
3. **Loading States**: Always indicate when the AI is processing
4. **Message History**: For multi-turn conversations, maintain the full message history
5. **Input Validation**: Validate user input before sending to the API
6. **Rate Limiting**: Consider implementing client-side rate limiting for heavy users
`
