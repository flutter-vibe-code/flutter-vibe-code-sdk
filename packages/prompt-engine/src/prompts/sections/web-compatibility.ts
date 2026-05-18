import type { PromptSection } from "../../types";

export const webCompatibilitySection: PromptSection = {
  id: "web-compatibility",
  name: "Web Compatibility",
  xmlTag: "web_compatibility",
  required: true,
  order: 10,
  content: `<web_compatibility>
You must write code that does not crash in React Native Web.
When generating React Native code, strictly account for platform-specific compatibility, especially for web.
React Native Web and Expo have partial or no support for many APIs.

Use this list of Expo APIs without full web support:
1. Partial Web Support:
- expo-camera (no switch camera button, no .recordAsync())
- expo-clipboard
- expo-file-system (basic operations)
- expo-image (basic features)
- expo-notifications (limited)
- expo-screen-orientation
- expo-secure-store
- expo-sqlite (via SQL.js)
- expo-system-ui
- expo-video
- react-native-reanimated (IMPORTANT web limitations):
  - Layout animations don't work on web (element.getBoundingClientRect errors)
  - Native driver animations are not supported
  - Shared element transitions crash on web
  - Use conditional rendering for animated components on web
  - Consider using React Native's Animated API for web or CSS animations as fallback
  <example>
    import { Platform } from 'react-native';
    import Animated from 'react-native-reanimated';

    // For components using layout animations
    {Platform.OS !== 'web' ? (
      <Animated.View layout={...}>
        {/* Content */}
      </Animated.View>
    ) : (
      <View>
        {/* Non-animated fallback for web */}
      </View>
    )}
  </example>
- react-native-svg with react-native-reanimated (CRITICAL web limitation):
  - Animated SVG components crash on web with "Indexed property setter is not supported" error
  - Never use Animated.createAnimatedComponent with SVG elements (Circle, Path, etc.) on web
  - Always use Platform checks for animated SVG components

2. No Web Support:
- expo-av (audio recording)
- expo-barcode-scanner
- expo-battery
- expo-brightness
- expo-contacts
- expo-device
- expo-face-detector
- expo-fingerprint
- expo-haptics
- expo-local-authentication
- expo-location (use web geolocation API)
- expo-media-library
- expo-sensors
- expo-sharing
- expo-application
- expo-background-fetch
- expo-blur (use CSS backdrop-filter)
- expo-intent-launcher
- expo-keep-awake
- expo-task-manager

You must write workarounds for React Native Web like this:
Example 1:
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
...
if (Platform.OS !== 'web') {
  // Native-only code
  await Haptics.selectionAsync();
} else {
  // Web alternative
  console.log('Feature not available on web');
}
Example 2:
const storage = Platform.select({
  web: webStorage,
  default: ExpoSecureStore
});

  <scrolling_setup>
  ScrollView requires a parent View with flex: 1 to enable scrolling on web:
  Add scrolling ALL the time on screen components.

    <example>
    import { View, ScrollView } from 'react-native'
    export default function ArtistPage() {
      return (
        <View style={{ flexGrow: 1, flexBasis: 0 }}>
          <ScrollView>
            <ContentThatShouldScroll />
          </ScrollView>
        </View>
      )
    }
    </example>
  </scrolling_setup>
</web_compatibility>`,
};
