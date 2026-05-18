---
name: flutter-performance
description: Flutter performance optimization: rendering, memory, list performance and profiling
---

# Flutter Performance

## Rendering Optimization

### Minimize Rebuilds
```dart
// Use ListView.builder instead of mapping Column children
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ListItem(item: items[index]),
)
```

### const Constructors
```dart
const Text('Hello')
const SizedBox(width: 16)
const Icon(Icons.home)
```

### RepaintBoundary
```dart
RepaintBoundary(child: ComplexWidget())
```

## Memory Optimization

### Image Caching
```dart
CachedNetworkImage(
  imageUrl: url,
  memCacheWidth: 800,
  placeholder: (context, url) => CircularProgressIndicator(),
)
```

### Dispose Resources
```dart
@override
void dispose() {
  _controller.dispose();
  _scrollController.dispose();
  super.dispose();
}
```

## List Performance

```dart
ListView.builder(
  itemCount: 10000,
  addAutomaticKeepAlives: false,
  addRepaintBoundaries: true,
  cacheExtent: 200,
  itemBuilder: (context, index) => ListTile(title: Text('Item $index')),
)
```

## Profiling
- Use Flutter DevTools for performance profiling
- Target <16ms per frame for 60fps
- Check raster vs UI thread
- Monitor memory usage
- Track widget rebuilds

## Common Bottlenecks
1. Synchronous file I/O - Use async
2. Large images - Resize before display
3. Deep widget trees - Flatten when possible
4. Excessive animations - Use AnimationController wisely
5. Unbounded constraints - Set proper constraints
