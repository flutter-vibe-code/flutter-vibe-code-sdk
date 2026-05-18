export const openaiDalle3SkillTemplate = (prodUrl: string, displayName: string, description: string) => `---
name: ${displayName}
description: ${description}
---

# Image Generation Integration (OpenAI DALL-E 3)

## When to Use This Skill

Use this skill when:
- The user wants to add AI image generation to their app
- The user needs to create images from text descriptions
- The user mentions "image generation", "DALL-E", "OpenAI images", "AI art", or "text-to-image"
- The app requires dynamic image creation based on user input
- The user wants avatar generation, artwork creation, or visual content generation

Do NOT use this skill when:
- The user just needs to display static images
- The user wants to edit existing photos (cropping, filters)
- The user needs AI text generation (use anthropic-chat skill instead)

## Instructions

1. Create a custom hook (e.g., \`useImageGeneration\`) to encapsulate the API logic
2. Manage states: \`imageUri\`, \`loading\`, and \`error\`
3. Convert the base64 response to a data URI for display
4. Use \`expo-image\` or React Native's \`Image\` component to display results
5. Show loading state as generation takes several seconds
6. Handle errors gracefully with user feedback

## API Reference

**Endpoint:** \`${prodUrl}/api/toolkit/images\`
**Method:** POST
**Content-Type:** application/json

### Request Schema

\`\`\`typescript
interface ImageGenerateRequest {
  prompt: string        // Description of the image to generate
  size?: string         // Optional: "1024x1024" (default), "512x512", "256x256"
}
\`\`\`

### Response Schema

\`\`\`typescript
interface ImageGenerateResponse {
  image: {
    base64Data: string  // Base64 encoded image data
    mimeType: string    // e.g., "image/png"
  }
  size: string          // The size of the generated image
}
\`\`\`

## Example Implementation

\`\`\`typescript
import { useState } from 'react';

interface GeneratedImage {
  uri: string;
  size: string;
}

const useImageGeneration = () => {
  const [image, setImage] = useState<GeneratedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async (prompt: string, size: string = '1024x1024') => {
    if (!prompt.trim()) {
      setError('Please provide a prompt');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('${prodUrl}/api/toolkit/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size })
      });

      if (!res.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await res.json();
      const uri = \`data:\${data.image.mimeType};base64,\${data.image.base64Data}\`;

      const result = { uri, size: data.size };
      setImage(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Image generation failed';
      setError(errorMessage);
      console.error('Image generation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setError(null);
  };

  return { image, loading, error, generateImage, reset };
};

export default useImageGeneration;
\`\`\`

### Usage in a Component

\`\`\`typescript
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import useImageGeneration from './useImageGeneration';

export default function ImageGeneratorScreen() {
  const [prompt, setPrompt] = useState('');
  const { image, loading, error, generateImage } = useImageGeneration();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    await generateImage(prompt);
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Describe the image you want..."
        multiline
        style={styles.input}
      />

      <TouchableOpacity
        onPress={handleGenerate}
        disabled={loading || !prompt.trim()}
        style={[styles.button, loading && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Generating...' : 'Generate Image'}
        </Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Creating your image...</Text>
        </View>
      )}

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      {image && !loading && (
        <Image
          source={{ uri: image.uri }}
          style={styles.generatedImage}
          contentFit="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  error: {
    color: 'red',
    marginTop: 12,
    textAlign: 'center',
  },
  generatedImage: {
    width: '100%',
    height: 300,
    marginTop: 16,
    borderRadius: 8,
  },
});
\`\`\`

## Image Gallery Example

\`\`\`typescript
import { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface GalleryImage {
  id: string;
  uri: string;
  prompt: string;
}

const useImageGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAndAdd = async (prompt: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('${prodUrl}/api/toolkit/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size: '512x512' })
      });

      if (!res.ok) throw new Error('Generation failed');

      const data = await res.json();
      const uri = \`data:\${data.image.mimeType};base64,\${data.image.base64Data}\`;

      const newImage: GalleryImage = {
        id: Date.now().toString(),
        uri,
        prompt
      };

      setImages(prev => [newImage, ...prev]);
      return newImage;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  return { images, loading, error, generateAndAdd, removeImage };
};
\`\`\`

## Best Practices

1. **Descriptive Prompts**: Guide users to write detailed, specific prompts for better results
2. **Size Selection**: Use smaller sizes (512x512) for thumbnails, larger for hero images
3. **Loading Feedback**: Show progress indicator - image generation takes 5-15 seconds
4. **Caching**: Store generated images to avoid regenerating the same content
5. **Error Messages**: Provide helpful error messages when generation fails
6. **Content Guidelines**: Consider content moderation for user-generated prompts
7. **Memory Management**: Clean up base64 data when images are no longer needed
`
