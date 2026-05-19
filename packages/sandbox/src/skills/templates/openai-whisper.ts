export const openaiWhisperSkillTemplate = (prodUrl: string, displayName: string, description: string) => `---
name: ${displayName}
description: ${description}
---

# Speech to Text Integration

## When to Use This Skill

Use this skill when:
- The user wants to add voice input to their app
- The user needs speech-to-text transcription
- The user mentions "voice", "speech", "transcription", "recording", or "dictation"
- The app requires hands-free text input
- The user wants to build a voice notes or voice command feature

Do NOT use this skill when:
- The user needs text-to-speech (audio output from text)
- The user wants AI-generated audio or voice cloning
- The user needs real-time translation (combine with translation skill)

## Instructions

1. Create a custom hook (e.g., \`useSpeechToText\`) to manage recording state
2. Request microphone permissions before recording
3. Configure audio settings properly for iOS and Android
4. Use FormData to send the audio file to the API
5. Handle recording start/stop lifecycle correctly
6. Clean up audio resources after transcription

## API Reference

**Endpoint:** \`${prodUrl}/api/toolkit/stt\`
**Method:** POST
**Content-Type:** multipart/form-data

### Request Format

Send audio file as multipart form data:
- \`audio\`: File (required) - The audio recording
- \`language\`: string (optional) - Language code for better accuracy (e.g., 'en', 'es')

**Supported Audio Formats:** mp3, mp4, mpeg, mpga, m4a, wav, webm

### Response Schema

\`\`\`typescript
interface STTResponse {
  text: string       // Transcribed text
  language: string   // Detected or specified language
}
\`\`\`

## Example Implementation

\`\`\`typescript
import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

interface RecordingConfig {
  android: Audio.RecordingOptions['android'];
  ios: Audio.RecordingOptions['ios'];
  web: Audio.RecordingOptions['web'];
}

const RECORDING_CONFIG: RecordingConfig = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

const useSpeechToText = () => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(RECORDING_CONFIG);
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setDuration(0);

      // Track duration
      durationInterval.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start recording';
      setError(errorMessage);
      console.error('Recording start error:', err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return '';

    // Clear duration timer
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }

    setLoading(true);
    setIsRecording(false);

    try {
      // Stop the recording
      await recordingRef.current.stopAndUnloadAsync();

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recordingRef.current.getURI();
      if (!uri) {
        throw new Error('No recording URI available');
      }

      // Prepare form data
      const formData = new FormData();
      const uriParts = uri.split('.');
      const fileExtension = uriParts[uriParts.length - 1];

      formData.append('audio', {
        uri,
        name: \`recording.\${fileExtension}\`,
        type: \`audio/\${fileExtension === 'wav' ? 'wav' : 'm4a'}\`,
      } as any);

      // Send to API
      const res = await fetch('${prodUrl}/api/toolkit/stt', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Transcription failed');
      }

      const data = await res.json();
      setTranscript(data.text);
      return data.text;

    } catch (err: any) {
      const errorMessage = err.message || 'Transcription failed';
      setError(errorMessage);
      console.error('Transcription error:', err);
      return '';
    } finally {
      setLoading(false);
      recordingRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
    setDuration(0);
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return \`\${mins}:\${secs.toString().padStart(2, '0')}\`;
  }, []);

  return {
    transcript,
    isRecording,
    loading,
    error,
    duration,
    formattedDuration: formatDuration(duration),
    startRecording,
    stopRecording,
    reset,
  };
};

export default useSpeechToText;
\`\`\`

### Usage in a Component

\`\`\`typescript
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import useSpeechToText from './useSpeechToText';

export default function VoiceInputScreen() {
  const {
    transcript,
    isRecording,
    loading,
    error,
    formattedDuration,
    startRecording,
    stopRecording,
    reset,
  } = useSpeechToText();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Input</Text>

      {/* Recording Button */}
      <TouchableOpacity
        onPress={isRecording ? stopRecording : startRecording}
        disabled={loading}
        style={[
          styles.recordButton,
          isRecording && styles.recordingActive,
          loading && styles.buttonDisabled,
        ]}
      >
        <View style={[styles.recordIcon, isRecording && styles.recordingIcon]} />
      </TouchableOpacity>

      {/* Status Text */}
      <Text style={styles.statusText}>
        {loading
          ? 'Transcribing...'
          : isRecording
          ? \`Recording: \${formattedDuration}\`
          : 'Tap to record'}
      </Text>

      {/* Loading Indicator */}
      {loading && (
        <ActivityIndicator style={styles.loader} size="large" color="#ef4444" />
      )}

      {/* Error Message */}
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      {/* Transcript Result */}
      {transcript && !loading && (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptLabel}>Transcript:</Text>
          <Text style={styles.transcriptText} selectable>
            {transcript}
          </Text>
          <TouchableOpacity onPress={reset} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#1e293b',
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ef4444',
  },
  recordingActive: {
    backgroundColor: '#ef4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef4444',
  },
  recordingIcon: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  statusText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  loader: {
    marginTop: 24,
  },
  error: {
    marginTop: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  transcriptContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transcriptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1e293b',
  },
  clearButton: {
    marginTop: 16,
    alignSelf: 'flex-end',
  },
  clearButtonText: {
    color: '#ef4444',
    fontWeight: '500',
  },
});
\`\`\`

## Voice Notes Example

\`\`\`typescript
import { useState } from 'react';

interface VoiceNote {
  id: string;
  transcript: string;
  createdAt: Date;
}

const useVoiceNotes = () => {
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const speechToText = useSpeechToText();

  const saveCurrentTranscript = () => {
    if (speechToText.transcript) {
      const newNote: VoiceNote = {
        id: Date.now().toString(),
        transcript: speechToText.transcript,
        createdAt: new Date(),
      };
      setNotes(prev => [newNote, ...prev]);
      speechToText.reset();
    }
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  return {
    ...speechToText,
    notes,
    saveCurrentTranscript,
    deleteNote,
  };
};
\`\`\`

## Best Practices

1. **Permission Handling**: Always request and verify microphone permissions before recording
2. **Visual Feedback**: Show clear recording state with animation (pulsing indicator)
3. **Duration Display**: Show recording duration so users know it's active
4. **Audio Mode**: Properly configure and reset audio mode for iOS compatibility
5. **Resource Cleanup**: Always clean up recording resources after use
6. **Platform Differences**: Use appropriate audio formats for iOS (.wav) vs Android (.m4a)
7. **Error Recovery**: Provide clear error messages and retry options
8. **Loading States**: Show transcription progress while processing
`
