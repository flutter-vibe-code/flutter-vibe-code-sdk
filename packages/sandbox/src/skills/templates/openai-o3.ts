export const openaiO3SkillTemplate = (prodUrl: string, displayName: string, description: string) => `---
name: ${displayName}
description: ${description}
---

# Advanced Reasoning Integration

## When to Use This Skill

Use this skill when:
- The user wants advanced AI reasoning for complex problems
- The user needs multi-step analysis or problem decomposition
- The user mentions "reasoning", "analysis", "problem-solving", or "complex thinking"
- The app requires mathematical reasoning, logic puzzles, or strategic analysis
- The user wants to build an educational tutor or expert advisor feature

Do NOT use this skill when:
- Simple Q&A or basic chat is sufficient (use ai-chat skill instead)
- The user needs image generation (use image-generation skill instead)
- Quick, simple responses are preferred over detailed analysis

## Instructions

1. Create a custom hook (e.g., \`useAdvancedReasoning\`) for complex analysis
2. Use a reasoning-focused system prompt that encourages step-by-step thinking
3. Allow for optional context to provide background information
4. Handle longer response times as reasoning takes more processing
5. Format results to highlight the reasoning process
6. Consider breaking complex problems into sub-questions

## API Reference

**Endpoint:** \`${prodUrl}/api/toolkit/llm\`
**Method:** POST
**Content-Type:** application/json

This skill uses the AI endpoint with a reasoning-optimized system prompt.

### Request Schema

\`\`\`typescript
interface ReasoningRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
}
\`\`\`

### Response Schema

\`\`\`typescript
interface ReasoningResponse {
  completion: string  // Detailed reasoning and analysis
}
\`\`\`

## Example Implementation

\`\`\`typescript
import { useState, useCallback } from 'react';

interface ReasoningResult {
  analysis: string;
  timestamp: Date;
}

const REASONING_SYSTEM_PROMPT = \`You are an advanced reasoning AI assistant specializing in complex problem-solving.

Your approach:
1. Break down complex problems into smaller, manageable steps
2. Analyze data and identify patterns systematically
3. Consider multiple perspectives before reaching conclusions
4. Provide clear explanations for your reasoning process
5. Highlight key insights and potential implications

Format your response with clear sections:
- **Analysis**: Your step-by-step reasoning
- **Conclusion**: Your final answer or recommendation
- **Considerations**: Any caveats or alternative viewpoints\`;

const useAdvancedReasoning = () => {
  const [result, setResult] = useState<ReasoningResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (problem: string, context?: string) => {
    if (!problem.trim()) {
      setError('Please provide a problem to analyze');
      return null;
    }

    setLoading(true);
    setError(null);

    const systemPrompt = context
      ? \`\${REASONING_SYSTEM_PROMPT}\\n\\nContext: \${context}\`
      : REASONING_SYSTEM_PROMPT;

    try {
      const res = await fetch('${prodUrl}/api/toolkit/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: problem }
          ]
        })
      });

      if (!res.ok) {
        throw new Error('Analysis failed');
      }

      const data = await res.json();
      const reasoningResult: ReasoningResult = {
        analysis: data.completion,
        timestamp: new Date()
      };

      setResult(reasoningResult);
      return reasoningResult;
    } catch (err: any) {
      const errorMessage = err.message || 'Analysis failed';
      setError(errorMessage);
      console.error('Reasoning error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, analyze, reset };
};

export default useAdvancedReasoning;
\`\`\`

### Usage in a Component

\`\`\`typescript
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import useAdvancedReasoning from './useAdvancedReasoning';

export default function ReasoningScreen() {
  const [problem, setProblem] = useState('');
  const [context, setContext] = useState('');
  const { result, loading, error, analyze } = useAdvancedReasoning();

  const handleAnalyze = () => {
    if (problem.trim()) {
      analyze(problem, context || undefined);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Advanced Reasoning</Text>
      <Text style={styles.subtitle}>
        Get step-by-step analysis for complex problems
      </Text>

      {/* Context Input (Optional) */}
      <Text style={styles.label}>Context (optional)</Text>
      <TextInput
        value={context}
        onChangeText={setContext}
        placeholder="Provide any relevant background information..."
        multiline
        style={styles.contextInput}
      />

      {/* Problem Input */}
      <Text style={styles.label}>Problem or Question</Text>
      <TextInput
        value={problem}
        onChangeText={setProblem}
        placeholder="Describe the problem you want to analyze..."
        multiline
        style={styles.problemInput}
      />

      {/* Analyze Button */}
      <TouchableOpacity
        onPress={handleAnalyze}
        disabled={loading || !problem.trim()}
        style={[styles.analyzeButton, loading && styles.buttonDisabled]}
      >
        <Text style={styles.analyzeButtonText}>
          {loading ? 'Analyzing...' : 'Analyze Problem'}
        </Text>
      </TouchableOpacity>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>
            Performing deep analysis...
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      {/* Result */}
      {result && !loading && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Analysis Result</Text>
          <Text style={styles.timestamp}>
            {result.timestamp.toLocaleString()}
          </Text>
          <Text style={styles.analysisText} selectable>
            {result.analysis}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  contextInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    backgroundColor: 'white',
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  problemInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    backgroundColor: 'white',
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  analyzeButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#6366f1',
    fontSize: 14,
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
  },
  resultContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 16,
  },
  analysisText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#334155',
  },
});
\`\`\`

## Structured Reasoning Example

\`\`\`typescript
interface StructuredAnalysis {
  steps: string[];
  conclusion: string;
  confidence: 'high' | 'medium' | 'low';
  considerations: string[];
}

const useStructuredReasoning = () => {
  const [analysis, setAnalysis] = useState<StructuredAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async (problem: string) => {
    setLoading(true);

    const systemPrompt = \`Analyze this problem step by step. Respond in JSON format:
{
  "steps": ["step 1", "step 2", ...],
  "conclusion": "your final answer",
  "confidence": "high" | "medium" | "low",
  "considerations": ["caveat 1", "caveat 2", ...]
}
Only respond with valid JSON.\`;

    try {
      const res = await fetch('${prodUrl}/api/toolkit/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: problem }
          ]
        })
      });

      const data = await res.json();
      const parsed: StructuredAnalysis = JSON.parse(data.completion);
      setAnalysis(parsed);
      return parsed;
    } catch (err) {
      console.error('Structured reasoning error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analysis, loading, analyze };
};
\`\`\`

## Best Practices

1. **Clear Problem Statements**: Encourage users to provide detailed, well-defined problems
2. **Context Matters**: Offer an optional context field for background information
3. **Processing Time**: Set expectations - complex reasoning takes longer than simple chat
4. **Structured Output**: Consider parsing structured responses for better UI presentation
5. **Follow-up Questions**: Allow users to ask clarifying questions about the analysis
6. **Save Analyses**: Implement history saving for users to revisit past reasoning
7. **Visual Hierarchy**: Use formatting to distinguish steps, conclusions, and caveats
`
