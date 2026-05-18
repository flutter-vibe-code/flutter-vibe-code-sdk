export const googleSearchSkillTemplate = (prodUrl: string, displayName: string, description: string) => `---
name: ${displayName}
description: ${description}
---

# Google Search Integration (SerpAPI)

## When to Use This Skill

Use this skill when:
- The user wants to add real Google search functionality to their app
- The user needs to retrieve web search results
- The user mentions "Google search", "web search", "search results", or "find on Google"
- The app requires access to current web information
- The user wants to build a search interface with actual Google data

Do NOT use this skill when:
- The user needs a conversational AI (use anthropic-chat skill instead)
- The user needs image generation (use openai-dalle-3 skill instead)

## Instructions

1. Create a custom hook (e.g., \`useGoogleSearch\`) to manage search state
2. Handle the SerpAPI response structure with organic results, knowledge graphs, etc.
3. Parse and display results in a user-friendly format
4. Show loading states and handle errors gracefully
5. Consider implementing debounced search for search-as-you-type
6. Display rich results including titles, snippets, and URLs

## API Reference

**Endpoint:** \`${prodUrl}/api/toolkit/search\`
**Method:** POST
**Content-Type:** application/json

This skill uses SerpAPI to provide real Google search results.

### Request Schema

\`\`\`typescript
interface SearchRequest {
  query: string       // Required: The search query
  gl?: string        // Optional: Geographic location (default: "us")
  hl?: string        // Optional: Language (default: "en")
  num?: number       // Optional: Number of results (default: 10)
}
\`\`\`

### Response Schema

\`\`\`typescript
interface SearchResponse {
  searchMetadata: {
    status: string
    created_at: string
    processed_at: string
    total_time_taken: number
  }
  searchInformation: {
    total_results: string
    time_taken_displayed: number
  }
  organicResults: Array<{
    position: number
    title: string
    link: string
    displayed_link: string
    snippet: string
    snippet_highlighted_words?: string[]
    cached_page_link?: string
    related_pages_link?: string
  }>
  knowledgeGraph?: {
    title: string
    type: string
    description: string
    source?: {
      name: string
      link: string
    }
    image?: string
  }
  relatedSearches?: Array<{
    query: string
    link: string
  }>
  localResults?: Array<{
    position: number
    title: string
    address: string
    phone?: string
    rating?: number
  }>
  shoppingResults?: Array<{
    position: number
    title: string
    link: string
    price: string
    source: string
  }>
}
\`\`\`

## Example Implementation

\`\`\`typescript
import { useState, useCallback } from 'react';

interface OrganicResult {
  position: number;
  title: string;
  link: string;
  displayed_link: string;
  snippet: string;
}

interface SearchResponse {
  organicResults: OrganicResult[];
  searchInformation: {
    total_results: string;
    time_taken_displayed: number;
  };
  knowledgeGraph?: {
    title: string;
    description: string;
  };
}

const useGoogleSearch = () => {
  const [results, setResults] = useState<OrganicResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInfo, setSearchInfo] = useState<any>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('${prodUrl}/api/toolkit/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          gl: 'us',  // Geographic location
          hl: 'en',  // Language
          num: 10    // Number of results
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const data: SearchResponse = await res.json();
      setResults(data.organicResults || []);
      setSearchInfo(data.searchInformation);
      return data.organicResults;
    } catch (err: any) {
      const errorMessage = err.message || 'Search failed';
      setError(errorMessage);
      console.error('Search error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setSearchInfo(null);
  }, []);

  return { results, loading, error, searchInfo, search, clearResults };
};

export default useGoogleSearch;
\`\`\`

### Usage in a Component

\`\`\`typescript
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, FlatList, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import useGoogleSearch from './useGoogleSearch';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { results, loading, error, searchInfo, search } = useGoogleSearch();

  const handleSearch = () => {
    if (query.trim()) {
      search(query);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Google..."
          style={styles.input}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          onPress={handleSearch}
          disabled={loading}
          style={styles.searchButton}
        >
          <Text style={styles.searchButtonText}>
            {loading ? '...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      {searchInfo && (
        <Text style={styles.searchInfo}>
          About {searchInfo.total_results} results ({searchInfo.time_taken_displayed}s)
        </Text>
      )}

      {loading && (
        <ActivityIndicator style={styles.loader} size="large" color="#4285f4" />
      )}

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => \`\${item.position}-\${item.link}\`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultCard}
            onPress={() => openLink(item.link)}
          >
            <Text style={styles.displayedLink}>{item.displayed_link}</Text>
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text style={styles.resultSnippet} numberOfLines={3}>
              {item.snippet}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && query ? (
            <Text style={styles.emptyText}>No results found</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f3f4',
    borderRadius: 24,
    padding: 12,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 24,
    borderRadius: 24,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  searchInfo: {
    fontSize: 13,
    color: '#70757a',
    marginBottom: 12,
  },
  loader: {
    marginVertical: 20,
  },
  error: {
    color: '#d93025',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultCard: {
    marginBottom: 20,
  },
  displayedLink: {
    fontSize: 12,
    color: '#202124',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 20,
    color: '#1a0dab',
    marginBottom: 4,
    fontWeight: '400',
  },
  resultSnippet: {
    fontSize: 14,
    color: '#4d5156',
    lineHeight: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#70757a',
    marginTop: 40,
    fontSize: 16,
  },
});
\`\`\`

## Debounced Search Example

\`\`\`typescript
import { useState, useEffect, useRef } from 'react';

const useDebouncedGoogleSearch = (delay: number = 500) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('${prodUrl}/api/toolkit/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });

        const data = await res.json();
        setResults(data.organicResults || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, delay]);

  return { query, setQuery, results, loading };
};
\`\`\`

## Best Practices

1. **Debouncing**: Implement debounce for search-as-you-type to reduce API calls
2. **Loading States**: Show skeleton loaders or spinners during search
3. **Error Handling**: Provide clear error messages for API failures
4. **Result Display**: Use Google's design patterns for familiarity
5. **Deep Linking**: Allow users to open results in their browser
6. **Search History**: Consider saving recent searches locally
7. **Rate Limiting**: Be mindful of SerpAPI rate limits
8. **Caching**: Cache results to reduce API calls for repeated queries
9. **Empty States**: Show helpful messages when no results are found
10. **Accessibility**: Ensure search interface is screen reader friendly
`
