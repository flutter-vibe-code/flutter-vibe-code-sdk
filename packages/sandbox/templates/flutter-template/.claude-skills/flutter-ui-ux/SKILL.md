---
name: flutter-ui-ux
description: Material Design 3, responsive layouts, animations, accessibility and common UI patterns
---

# Flutter UI/UX

## Material Design 3

```dart
class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: Colors.blue,
        brightness: Brightness.light,
      ),
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}
```

## Responsive Design

```dart
class ResponsiveBuilder extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;

  static bool isMobile(BuildContext context) =>
    MediaQuery.of(context).size.width < 650;
  static bool isTablet(BuildContext context) =>
    MediaQuery.of(context).size.width >= 650 &&
    MediaQuery.of(context).size.width < 1100;
  static bool isDesktop(BuildContext context) =>
    MediaQuery.of(context).size.width >= 1100;

  @override
  Widget build(BuildContext context) {
    if (isDesktop(context)) return desktop ?? tablet ?? mobile;
    if (isTablet(context)) return tablet ?? mobile;
    return mobile;
  }
}
```

## Animations
- Use Hero for shared element transitions
- Use AnimatedContainer for simple property animations
- Use AnimationController for complex custom animations

## Accessibility
```dart
Semantics(
  label: 'Login button',
  button: true,
  child: ElevatedButton(onPressed: _login, child: Text('Login')),
)
```

## Common Patterns
- LoadingButton: Show spinner while loading
- EmptyState: Show message with icon when list is empty
- ErrorView: Show error with retry button
- Platform adaptations for iOS/Android differences
