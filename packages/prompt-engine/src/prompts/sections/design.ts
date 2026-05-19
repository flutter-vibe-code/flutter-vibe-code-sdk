import type { PromptSection } from "../../types";

export const designSection: PromptSection = {
  id: "design",
  name: "Design",
  xmlTag: "design",
  required: true,
  order: 5,
  content: `<design>
  Don't hold back. Ship beautiful, polished Flutter UIs — not template-grade default screens.
  Draw inspiration from iOS Human Interface Guidelines, Material 3, Airbnb, Linear, Stripe,
  Notion, Apple Reminders. Make it feel premium.
  NEVER use emoji characters as UI elements — always use proper icon components.

  <flutter_theme>
    Use Material 3 (\`useMaterial3: true\`) with a custom \`ColorScheme.fromSeed\` and BOTH light and dark themes.
    Wrap MaterialApp with \`themeMode: ThemeMode.system\` so the app respects OS preference.
    Define typography with \`TextTheme\` and use the \`google_fonts\` package for the brand font
    (Inter, Plus Jakarta Sans, Manrope, Geist, or whatever fits the app's personality).
    Use rounded corners on Cards/Buttons (12-16 radius) and \`elevation: 0-2\` (modern flat look).

    Example:
    \`\`\`dart
    import 'package:google_fonts/google_fonts.dart';

    final lightTheme = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF6750A4),
        brightness: Brightness.light,
      ),
      textTheme: GoogleFonts.interTextTheme(),
      cardTheme: CardTheme(
        elevation: 0,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        ),
      ),
    );
    \`\`\`
  </flutter_theme>

  <icons>
    Material Icons (built-in, no import): \`Icon(Icons.<name>)\`.
    Richer iconography: \`font_awesome_flutter\` package — \`FaIcon(FontAwesomeIcons.heart)\`.
    iOS-style: \`CupertinoIcons.<name>\` from \`package:flutter/cupertino.dart\`.
    Lucide-style outlined icons: \`flutter_lucide\` package.
    NEVER use emoji glyphs as icons — always a real icon widget.
  </icons>

  <responsive>
    Use \`LayoutBuilder\` + breakpoints for adaptive layouts. 600 dp = phone→tablet,
    1024 dp = tablet→desktop break.
    Mobile-first. On medium+ screens swap BottomNavigationBar for \`NavigationRail\`.
    On wide screens add a side panel via \`Row\` + \`Expanded\`.
    Constrain max content width on web/desktop to ~1200 dp via \`ConstrainedBox\` +
    \`Center\` — content should not stretch across a 4K monitor.
  </responsive>

  <animations>
    Use \`AnimatedSwitcher\`, \`AnimatedContainer\`, \`Hero\`, \`TweenAnimationBuilder\`
    for smooth transitions. For one-liners use \`flutter_animate\`:
    \`Text("Hi").animate().fadeIn(duration: 300.ms).slideY(begin: 0.2)\`.
    Page transitions: default MaterialPageRoute is fine; use \`Hero\` for shared
    elements between list and detail.
    Durations: 150-250 ms micro, 250-400 ms page. Curves: \`Curves.easeOutCubic\`
    or \`Curves.fastOutSlowIn\` — never linear.
  </animations>

  <accessibility>
    Wrap every IconButton + interactive image in \`Semantics(label: '...')\`.
    Tap targets >= 48x48 dp. Color contrast >= 4.5:1.
    Support Dynamic Type: use \`Theme.of(context).textTheme.<style>\` not hardcoded sizes.
    Test mentally with TalkBack/VoiceOver — every interactive element needs a label.
  </accessibility>

  <empty_states>
    Every list/grid screen MUST have a designed empty state (centered icon +
    heading + body + CTA) — never a blank screen.
    Loading: \`CircularProgressIndicator\` for < 1s, \`Skeletonizer\` for longer.
    Errors: actionable message + retry button. Say what failed and what the user
    can do. Never just "Something went wrong".
  </empty_states>

  <visual_polish>
    Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48. No arbitrary values.
    Material 3 prefers surface tint over shadows — use the surface palette for
    backgrounds: \`colorScheme.surfaceContainerLow\` / \`surfaceContainerHighest\`.
    Color hierarchy: primary for CTAs, secondary for accents, tertiary for highlights.
    Use \`FilledButton\` (not ElevatedButton) for primary actions; \`OutlinedButton\`
    or \`TextButton\` for secondary; \`IconButton\` for compact.
    Lists: \`ListView.separated\` + \`Divider(height: 1)\` for grouped feel, or
    \`ListView\` with \`Card\` items for floating-card feel.
    Use Material 3 \`SegmentedButton\`, \`FilterChip\`, \`SearchBar\` widgets.
  </visual_polish>

  <ios_feel_when_appropriate>
    If iOS-native feel is requested or the app targets iPhone primarily, consider
    Cupertino widgets: \`CupertinoApp\`, \`CupertinoTabScaffold\`, \`CupertinoListSection\`,
    \`CupertinoButton\`. Use SF Pro via \`GoogleFonts.notoSans()\` as fallback or
    \`fontFamily: '.SF Pro Display'\` for native iOS.
  </ios_feel_when_appropriate>

  <forbidden>
    - No Material 2 styles (\`primarySwatch\`).
    - No legacy widgets: \`RaisedButton\`, \`FlatButton\`, \`OutlineButton\`.
    - No hardcoded English strings in user-facing UI when the app targets another language.
    - No \`print()\` left in production code — use \`debugPrint()\` or a logger.
  </forbidden>
</design>`,
};
