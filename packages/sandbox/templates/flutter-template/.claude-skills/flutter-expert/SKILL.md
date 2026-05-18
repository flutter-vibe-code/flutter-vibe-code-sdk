---
name: flutter-expert
description: Expert Flutter development guidance for building high-quality, production-ready mobile and web apps
---

# Flutter Expert

## When to Use
- Building Flutter mobile or web applications
- Implementing responsive UI with Material Design 3
- Managing state with BLoC, Riverpod, or Provider
- Optimizing app performance and reducing rebuilds

## Core Principles

### Widget Design
- Prefer StatelessWidget when possible
- Use const constructors aggressively
- Keep widgets small and focused (Single Responsibility)
- Extract reusable widgets into separate files

### State Management
- Simple local state: setState or ValueNotifier
- Medium complexity: Riverpod or Bloc
- Complex apps: Bloc with Clean Architecture
- Avoid prop drilling - use dependency injection

### Performance
- Use ListView.builder for long lists
- Cache network images with cached_network_image
- Use RepaintBoundary for complex static widgets
- Minimize widget rebuilds with const

### Code Organization
```
lib/
  main.dart
  app.dart
  core/         # Constants, theme, utils
  data/         # Models, repositories
  domain/       # Entities, usecases
  presentation/ # Pages, widgets, blocs
  services/     # External services
```

### Package Recommendations
- HTTP: dio or http
- State Management: flutter_bloc, hooks_riverpod
- Navigation: go_router
- Storage: hive, shared_preferences
- Images: cached_network_image

## Anti-patterns to Avoid
- Business logic in widgets
- Direct API calls from UI
- Hardcoded strings and styles
- Ignoring platform differences
