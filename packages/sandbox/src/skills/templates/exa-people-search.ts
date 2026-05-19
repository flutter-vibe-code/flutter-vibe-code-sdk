export const exaPeopleSearchTemplate = (prodUrl: string, displayName: string, description: string) => `---
name: ${displayName}
description: ${description}
---

# Exa People Search Integration

## When to Use This Skill

Use this skill when:
- The user needs to find specific executives or professionals at companies (e.g., "VP of product at Figma")
- The user wants to discover candidates by role, location, and expertise (e.g., "Director of sales operations in Chicago SaaS")
- The user needs to search for individuals by name and company (e.g., "Jane Smith at Acme Corp")
- The app requires people search or talent discovery features
- The user wants to build a recruiting, networking, or professional research tool

Do NOT use this skill when:
- Simple web search is sufficient (use google-search skill instead)
- The user needs to search for general information, not people
- The user wants image generation or AI chat features

## Instructions

1. Create a custom hook (e.g., \`useExaPeopleSearch\`) for searching people
2. Handle loading and error states appropriately
3. Display search results with profile information
4. Consider pagination for large result sets
5. Format queries for optimal results
6. Provide clear UI for users to refine searches

## API Reference

**Endpoint:** \`${prodUrl}/api/toolkit/exa-search\`
**Method:** POST
**Content-Type:** application/json

This skill uses the Exa People Search API powered by 1B+ indexed people profiles.

### Request Schema

\`\`\`typescript
interface ExaSearchRequest {
  query: string           // The search query (required)
  numResults?: number     // Number of results to return (default: 10)
}
\`\`\`

### Response Schema

\`\`\`typescript
interface ExaSearchResult {
  title: string           // Person's name and title
  url: string            // URL to profile
  publishedDate?: string // Date information was published
  author?: string        // Author of the content
  score?: number         // Relevance score
  id: string             // Unique result ID
}

interface ExaSearchResponse {
  results: ExaSearchResult[]  // Array of search results
  requestId?: string          // Request tracking ID
}
\`\`\`

## Example Implementation

\`\`\`typescript
import { useState, useCallback } from 'react';

interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  score?: number;
  id: string;
}

interface SearchResults {
  results: ExaSearchResult[];
  query: string;
  timestamp: Date;
}

const useExaPeopleSearch = () => {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, numResults: number = 10) => {
    if (!query.trim()) {
      setError('Please provide a search query');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('${prodUrl}/api/toolkit/exa-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          numResults
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Search failed');
      }

      const data = await res.json();
      const searchResults: SearchResults = {
        results: data.results,
        query,
        timestamp: new Date()
      };

      setResults(searchResults);
      return searchResults;
    } catch (err: any) {
      const errorMessage = err.message || 'Search failed';
      setError(errorMessage);
      console.error('Exa search error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return { results, loading, error, search, reset };
};

export default useExaPeopleSearch;
\`\`\`

### Usage in a Component

\`\`\`typescript
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ScrollView, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import useExaPeopleSearch from './useExaPeopleSearch';

export default function PeopleSearchScreen() {
  const [query, setQuery] = useState('');
  const [numResults, setNumResults] = useState(10);
  const { results, loading, error, search } = useExaPeopleSearch();

  const handleSearch = () => {
    if (query.trim()) {
      search(query, numResults);
    }
  };

  const openProfile = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>People Search</Text>
      <Text style={styles.subtitle}>
        Find professionals by role, company, or expertise
      </Text>

      {/* Search Input */}
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="e.g., VP of product at Figma"
        style={styles.searchInput}
        placeholderTextColor="#94a3b8"
      />

      {/* Search Button */}
      <TouchableOpacity
        onPress={handleSearch}
        disabled={loading || !query.trim()}
        style={[styles.searchButton, loading && styles.buttonDisabled]}
      >
        <Text style={styles.searchButtonText}>
          {loading ? 'Searching...' : 'Search People'}
        </Text>
      </TouchableOpacity>

      {/* Example Queries */}
      <View style={styles.examplesContainer}>
        <Text style={styles.examplesTitle}>Example queries:</Text>
        <TouchableOpacity onPress={() => setQuery('VP of product at Figma')}>
          <Text style={styles.exampleQuery}>• VP of product at Figma</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setQuery('Director of sales operations in Chicago SaaS')}>
          <Text style={styles.exampleQuery}>• Director of sales operations in Chicago SaaS</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setQuery('Senior software engineer at Google')}>
          <Text style={styles.exampleQuery}>• Senior software engineer at Google</Text>
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>
            Searching 1B+ people profiles...
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      {/* Results */}
      {results && !loading && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            Found {results.results.length} results for "{results.query}"
          </Text>
          <Text style={styles.timestamp}>
            {results.timestamp.toLocaleString()}
          </Text>

          {results.results.map((result, index) => (
            <TouchableOpacity
              key={result.id}
              style={styles.resultCard}
              onPress={() => openProfile(result.url)}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultNumber}>{index + 1}</Text>
                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle} numberOfLines={2}>
                    {result.title}
                  </Text>
                  <Text style={styles.resultUrl} numberOfLines={1}>
                    {result.url}
                  </Text>
                  {result.publishedDate && (
                    <Text style={styles.resultDate}>
                      Published: {result.publishedDate}
                    </Text>
                  )}
                  {result.score && (
                    <Text style={styles.resultScore}>
                      Relevance: {(result.score * 100).toFixed(1)}%
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  searchInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    marginBottom: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  searchButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  examplesContainer: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  examplesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  exampleQuery: {
    fontSize: 13,
    color: '#6366f1',
    marginBottom: 4,
    textDecorationLine: 'underline',
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
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
  },
  resultsContainer: {
    marginTop: 24,
  },
  resultsTitle: {
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
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resultNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
    marginRight: 12,
    minWidth: 24,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 20,
  },
  resultUrl: {
    fontSize: 13,
    color: '#6366f1',
    marginBottom: 4,
  },
  resultDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  resultScore: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
});
\`\`\`

## Query Examples

### Role-based Lookup
Find specific executives at particular organizations:
- \`"VP of product at Figma"\`
- \`"Chief Technology Officer at Stripe"\`
- \`"Head of Engineering at Airbnb"\`

### Discovery by Expertise
Locate candidates matching role, location, and skills:
- \`"Director of sales operations in Chicago SaaS"\`
- \`"Senior software engineer specializing in React Native in San Francisco"\`
- \`"Product designer with AI experience in New York"\`

### Individual Identification
Name-based searches with optional company:
- \`"Jane Smith at Acme Corp"\`
- \`"John Doe software engineer"\`
- \`"Sarah Johnson Figma"\`

## Best Practices

1. **Specific Queries**: More specific queries yield better results. Include role, company, location, or expertise.

2. **Result Limits**: Start with 10 results. Increase if needed, but avoid requesting too many at once.

3. **Error Handling**: Always handle network errors and empty result sets gracefully.

4. **User Experience**:
   - Show loading states during searches
   - Provide example queries to guide users
   - Make result URLs clickable for easy profile access
   - Display relevance scores when available

5. **Privacy & Ethics**:
   - Only use publicly available profile information
   - Respect user privacy and data protection laws
   - Implement appropriate use policies

6. **Performance**:
   - Debounce search input to avoid excessive API calls
   - Cache recent search results
   - Consider implementing pagination for large result sets

7. **Result Formatting**:
   - Display person's name and title prominently
   - Show company information when available
   - Include profile links for more details
   - Use relevance scores to rank results

## Advanced Usage

### Search with Retry Logic

\`\`\`typescript
const searchWithRetry = async (query: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await search(query);
      return result;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
\`\`\`

### Batch Search

\`\`\`typescript
const batchSearch = async (queries: string[]) => {
  const results = await Promise.allSettled(
    queries.map(q => search(q))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value);
};
\`\`\`

## Technical Details

- **Powered by**: Exa's hybrid retrieval system with fine-tuned embeddings
- **Index Size**: 1B+ people profiles
- **Update Frequency**: 50M+ updates weekly
- **Search Types**: Role-based, expertise discovery, individual identification
- **Data Sources**: Verifiable public profiles across the web
`
