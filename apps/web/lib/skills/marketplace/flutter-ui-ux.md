name: flutter-ui-ux
description: Material Design 3, responsive layouts, animations, and accessibility for beautiful Flutter UIs.

---

# Flutter UI/UX Skill

## Material Design 3

### Theme Setup
`dart
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
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }
}
`

### Responsive Design
`dart
class ResponsiveBuilder extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;
  
  const ResponsiveBuilder({
    required this.mobile,
    this.tablet,
    this.desktop,
  });
  
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
`

## Animations

### Hero Animations
`dart
Hero(
  tag: 'image-',
  child: Image.network(item.imageUrl),
)
`

### Custom Animations
`dart
class FadeSlideTransition extends StatelessWidget {
  final Animation<double> animation;
  final Widget child;
  
  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, 50 * (1 - animation.value)),
          child: Opacity(
            opacity: animation.value,
            child: child,
          ),
        );
      },
      child: child,
    );
  }
}
`

## Accessibility

`dart
Semantics(
  label: 'Login button',
  button: true,
  child: ElevatedButton(
    onPressed: _login,
    child: Text('Login'),
  ),
)
`

## Common UI Patterns

### Loading States
`dart
class LoadingButton extends StatelessWidget {
  final bool isLoading;
  final VoidCallback onPressed;
  final String text;
  
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      child: isLoading
        ? const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          )
        : Text(text),
    );
  }
}
`

### Empty States
`dart
class EmptyState extends StatelessWidget {
  final String message;
  final IconData icon;
  
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          Text(
            message,
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ],
      ),
    );
  }
}
`

## Platform Adaptations

`dart
class PlatformButton extends StatelessWidget {
  final VoidCallback onPressed;
  final Widget child;
  
  @override
  Widget build(BuildContext context) {
    if (Platform.isIOS) {
      return CupertinoButton(
        onPressed: onPressed,
        child: child,
      );
    }
    return ElevatedButton(
      onPressed: onPressed,
      child: child,
    );
  }
}
`
