name: flutter-performance
description: Performance optimization techniques for Flutter apps including rendering, memory, and startup optimization.

---

# Flutter Performance Skill

## Rendering Optimization

### 1. Minimize Rebuilds
`dart
// Bad - rebuilds entire list
class BadList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: items.map((item) => ExpensiveWidget(item)).toList(),
    );
  }
}

// Good - only rebuilds changed items
class GoodList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: items.length,
      itemBuilder: (context, index) {
        return ListItem(item: items[index]);
      },
    );
  }
}
`

### 2. Use const Constructors
`dart
// Good
const Text('Hello')
const SizedBox(width: 16)
const Icon(Icons.home)

// Bad
Text('Hello') // Creates new instance every build
`

### 3. RepaintBoundary
`dart
RepaintBoundary(
  child: ComplexWidget(), // Isolates from parent repaints
)
`

## Memory Optimization

### 1. Image Caching
`dart
CachedNetworkImage(
  imageUrl: url,
  memCacheWidth: 800, // Resize to display size
  placeholder: (context, url) => const CircularProgressIndicator(),
  errorWidget: (context, url, error) => const Icon(Icons.error),
)
`

### 2. Dispose Resources
`dart
class _MyPageState extends State<MyPage> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  
  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
`

## Startup Optimization

### 1. Defer Initialization
`dart
void main() {
  // Bad - blocks UI
  await initializeEverything();
  
  // Good
  runApp(const App());
  await initializeInBackground();
}
`

### 2. Lazy Loading
`dart
@lazySingleton
class AnalyticsService {
  // Only created when first used
}
`

## List Performance

`dart
ListView.builder(
  itemCount: 10000,
  addAutomaticKeepAlives: false, // Disable if not needed
  addRepaintBoundaries: true,    // Enable for complex items
  cacheExtent: 200,              // Preload distance
  itemBuilder: (context, index) {
    return ListTile(
      title: Text('Item '),
    );
  },
)
`

## Shader Compilation

### Precompile Shaders (iOS)
`ash
flutter build ios --bundle-sksl-path flutter_01.sksl.json
`

## Performance Profiling

### DevTools
1. Open DevTools: lutter pub global activate devtools
2. Run: lutter run --profile
3. Check:
   - Raster thread vs UI thread
   - Frame times (target: <16ms for 60fps)
   - Memory usage
   - Widget rebuilds

### Performance Overlay
`dart
MaterialApp(
  showPerformanceOverlay: true, // Enable in debug
)
`

## Common Bottlenecks

1. **Synchronous file I/O** - Use async
2. **Large images** - Resize before display
3. **Deep widget trees** - Flatten when possible
4. **Excessive animations** - Use AnimationController wisely
5. **Unbounded constraints** - Set proper constraints

## Benchmarking

`dart
testWidgets('Scroll performance', (tester) async {
  await tester.pumpWidget(MyApp());
  
  final stopwatch = Stopwatch()..start();
  await tester.fling(find.byType(ListView), Offset(0, -300), 1000);
  await tester.pumpAndSettle();
  stopwatch.stop();
  
  expect(stopwatch.elapsedMilliseconds, lessThan(100));
});
`
