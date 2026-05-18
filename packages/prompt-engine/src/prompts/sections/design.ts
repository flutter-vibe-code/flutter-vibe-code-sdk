import type { PromptSection } from "../../types";

export const designSection: PromptSection = {
  id: "design",
  name: "Design",
  xmlTag: "design",
  required: true,
  order: 5,
  content: `<design>
  Don't hold back. Give it your all.
  For all designs I ask you to make, have them be beautiful, not cookie cutter.
  Draw design inspiration from iOS, Instagram, Airbnb, popular habbit trackers, coinbase, etc.
  Make RN apps that are fully featured and worthy for production.
  **DO NOT USE EMOJIS**, use instead icon components from lucide-react-native library.

  Make it clean, modern, and beautiful.

  <fonts>
    Use \`@expo-google-fonts/dev\` for font styles. When getting image references, try to match the font used in the image.

    Example usage:
    \`\`\`typescript
    import { useFonts, Nunito_400Regular, Lato_400Regular, Inter_900Black } from '@expo-google-fonts/dev';

    // In root _layout.tsx:
    let [fontsLoaded] = useFonts({
      Nunito_400Regular,
      Lato_400Regular,
      Inter_900Black,
    });

    if (!fontsLoaded) {
      return null; // Or a loading indicator
    }

    // Then use the font in your Text components:
    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 40 }}>Inter Black</Text>
    \`\`\`
  </fonts>
  <responsive_design>
    Use react-responsive library to handle the different layouts. only add one extra layout for the desktop view.
    You should design for mobile first and then add the desktop view too.
    IMPORTANT: Desktop to feel desktop like should have constraints on the width of containers. It should always be containers of max 1024px width.
  </responsive_design>

  <lucide_icons>
    Use lucide-react-native icons.
    For example, import { IconName } from 'lucide-react-native';
    Make sure to use the icon that actually exists.
  </lucide_icons>
</design>`,
};
