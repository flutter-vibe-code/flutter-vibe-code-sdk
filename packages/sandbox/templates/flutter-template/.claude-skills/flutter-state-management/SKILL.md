---
name: flutter-state-management
description: BLoC, Riverpod, and Provider patterns with best practices for predictable state
---

# Flutter State Management

## BLoC Pattern (for complex apps)

```dart
// Events
abstract class CounterEvent {}
class CounterIncrementPressed extends CounterEvent {}

// States  
class CounterState {
  final int count;
  const CounterState({this.count = 0});
  CounterState copyWith({int? count}) => CounterState(count: count ?? this.count);
}

// Bloc
class CounterBloc extends Bloc<CounterEvent, CounterState> {
  CounterBloc() : super(const CounterState()) {
    on<CounterIncrementPressed>(_onIncrement);
  }
  void _onIncrement(event, emit) => emit(state.copyWith(count: state.count + 1));
}
```

## Riverpod (recommended for new projects)

```dart
final counterProvider = StateNotifierProvider<CounterNotifier, int>((ref) {
  return CounterNotifier();
});

class CounterNotifier extends StateNotifier<int> {
  CounterNotifier() : super(0);
  void increment() => state++;
}

class CounterWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);
    return ElevatedButton(
      onPressed: () => ref.read(counterProvider.notifier).increment(),
      child: Text('Count: $count'),
    );
  }
}
```

## Best Practices
1. Immutable State - Always create new state objects
2. Single Source of Truth - One state per feature
3. Selective Rebuilds - Use select to minimize rebuilds
4. Dispose Properly - Always close blocs and dispose controllers
