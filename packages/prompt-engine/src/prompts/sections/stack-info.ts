import type { PromptSection } from "../../types";

export const stackInfoSection: PromptSection = {
  id: "stack-info",
  name: "Stack Info",
  xmlTag: "stack_info",
  required: true,
  order: 9,
  content: `<stack_info>
  Never delete or refactor <RootLayoutNav/> from _layout.tsx. It should always be used in what is default component.

  <gestures>
    Please use PanResponder from 'react-native';
  </gestures>

  <animations>
    Avoid using react-native-reanimated for animations if possible.
    Only when performance is critical, use react-native-reanimated.

    In other cases, use react-native's Animated API.
  </animations>

  <tsconfig>
    You can import using @/ to avoid relative paths.
    For example, import { Button } from '@/components/Button'
  </tsconfig>

  <styling>
    For styling, you have to use react-native's StyleSheet
  </styling>

  Best Practices:
  - Avoid using expo-font if not asked
  - Keep mock data and constants in dedicated files
    For example, store a list of colors in /constants/colors.ts or a list of cuisines in /mocks/cuisines.ts

  <toasts>
  For toast UI generation use the sonner-native package.
  </toasts>

  <routing>
    - We use Expo Router for file-based routing. Very similar to Next.js Pages routing.
    - Every file in app directory and nested directories becomes a route.

    <stack_router>
      app/ (non-tab routing)
        _layout.tsx (Root layout)
        index.tsx (matches '/')
        home/
          _layout.tsx (Home layout)
          index.tsx (matches '/home')
          details.tsx (matches '/home/details')
        settings/
          _layout.tsx (Settings layout)
          index.tsx (matches '/settings')
      ----
      - Use <Stack.Screen options={{ title, headerRight, headerStyle, ...}} /> for header names
        You just put it inside the page and it will change the header.
    </stack_router>

    <tabs_router>
    When you use tabs router, only files explicitly registered in app/(tabs)/_layout.tsx become actual tabs.
    Files placed in the (tabs) directory that are NOT registered in _layout.tsx are regular routes that exist within the tab navigation structure but do not appear as separate tabs.
    For example:
    - app/(tabs)/profile.tsx + registered in _layout.tsx = becomes a tab
    - app/(tabs)/[profileId].tsx + NOT registered in _layout.tsx = just a route within tabs, not a tab itself
    So you should avoid this pattern and create stack routes outside of tabs (then opening the page will overlay the tabs screen).
    Or you can create a stack inside of a tab where you want to have a header + nested navigation.
    Then this screen will be inside of a tab, and when you switch between tabs, the stack will persist.

    Then when you use a nested stack, it will create a double header, so it is recommended to remove header from tabs.
    And insert a stack router inside EACH tab. This is the recommended pattern.
    But you can break this rule if you need to achieve what user wants.

    ----
    Example structure:
    components/ (Shared components)
    app/
      _layout.tsx (Root layout)
      (tabs)/
        _layout.tsx (Tab layout)
        (home)/
          _layout.tsx (Home tab inner stack layout)
          index.tsx (matches '/', because text inside of (parentheses) is not used for routing and index is ignored.)
          details.tsx (matches '/details')
        settings/
          _layout.tsx (Settings tab inner stack layout)
          index.tsx (matches '/settings' because settings it is nested in settings but index is ignored)
          details.tsx (matches '/settings/details')
        chats/
          _layout.tsx (Chat tab inner stack layout)
          index.tsx (matches '/chats' because chats it is nested in chats but index is ignored)
          [chatId].tsx (matches '/chats/[chatId]'. [chatId] is a dynamic route parameter)

      You need to create a layout file inside this directory (tabs)/_layout.
      <Tabs screenOptions={{
        headerShown: false, // IMPORTANT: header is owned by the tab itself
      }}>
        <Tabs.Screen name="(home)" />
        <Tabs.Screen name="settings" />
        <Tabs.Screen name="chats" />
      </Tabs>
    </tabs_router>

    <selecting_router_system>
      It is very important to select the right router design.
      1. First of all, when you do games, you want to avoid tabs router.
      Games are usually full screen, so you don't need a tab bar.
      You are allowed to remove the tab bar if it is in a default template.

      Also you might want to remove header from the gaming screen, so there is no back button and header.

      2. When you want to have a full screen experience, that is not nested inside of tabs,
        you can create the route OUTSIDE of tabs.
        For example, if tabs are in app/(tabs), you can create a route app/login.tsx.
        This will open a new screen outside of tabs. You can also customize the way the screen is opened in app/_layout.tsx.
        You can do modals that open from bottom of the screen, you can do pages that are inside of a stack, etc.
        Just add this to the app/_layout.tsx:
          <Stack.Screen name="page name is here" options={{ presentation: "modal" }} />

      3. Don't customize insets in tabs and header. It will break the tab bar and header. Only do it if required.
          Same with height and paddingBottom. Just avoid touching it.
          If you really really need to customize it, take insets into account. but still avoid setting up height directly.

      4. When you create an app with 1 tab it looks shitty, so always create at least 2 tabs, or don't use tabs at all.
    </selecting_router_system>

    <general_rules>
    - For dynamic parameters use "const { id } = useLocalSearchParams()" from "expo-router";
    - IMPORTANT: Only one page should be opened to "/". For example, you are not allowed to have /app/index.tsx and /app/(anything)/index.tsx as both of them will open "/".
    </general_rules>
    <safe_area_view>
      <when_to_use_safe_area_view>
        1. Built-in tabs or header: Don't add <SafeAreaView /> to the page
           - Tabs automatically handle bottom insets
           - Headers automatically handle top insets
           - Example: Inner stack of a tab doesn't need <SafeAreaView />

        2. Custom header: Add <SafeAreaView /> to the header component
           - Enable/disable specific insets based on position (top/bottom)

        3. Removed header:
          - Add <SafeAreaView /> to the page
          - Please add <SafeAreaView /> to an inner View and design what is visible behind the safe area.
            Because otherwise it will be just white space.
            For example, make a View with background color and put safe area view inside of it.
          - Configure insets based on what UI elements are present

        4. Pages inside stacks: Don't add <SafeAreaView /> if parent _layout.tsx has header enabled
           - Adding it will create inset bugs
      </when_to_use_safe_area_view>

      <games_and_absolute_positioning>
        1. Account for safe area insets in positioning calculations
           - Game physics should calculate positions considering insets
           - Common mistake: Physics calculates position X, but rendering uses X +- insets

        2. Best practices for games:
           - Use safe area insets hook to get inset values
           - Calculate positions and borders using these insets
           - Avoid using SafeAreaView in game screens
           - For absolute positioning, factor insets into your game loop physics

        3. Example approach:
           - Get insets from useSafeAreaInsets() hook
           - Apply insets to your positioning calculations
           - Maintain consistent coordinate system between physics and rendering
      </games_and_absolute_positioning>
    </safe_area_view>
  </routing>
</stack_info>`,
};
