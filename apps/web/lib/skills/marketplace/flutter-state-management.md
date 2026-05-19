name: flutter-state-management
description: BLoC, Riverpod, and Provider patterns for predictable Flutter state management with best practices.

---

# Flutter State Management Skill

## BLoC Pattern

### When to Use
- Complex business logic
- Need for event-driven architecture
- Team collaboration
- Testing is critical

### Implementation

`dart
// Events
abstract class CounterEvent {}
class CounterIncrementPressed extends CounterEvent {}
class CounterDecrementPressed extends CounterEvent {}

// States
class CounterState {
  final int count;
  final bool isLoading;
  
  const CounterState({this.count = 0, this.isLoading = false});
  
  CounterState copyWith({int? count, bool? isLoading}) {
    return CounterState(
      count: count ?? this.count,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

// Bloc
class CounterBloc extends Bloc<CounterEvent, CounterState> {
  CounterBloc() : super(const CounterState()) {
    on<CounterIncrementPressed>(_onIncrement);
    on<CounterDecrementPressed>(_onDecrement);
  }
  
  void _onIncrement(CounterIncrementPressed event, Emitter<CounterState> emit) {
    emit(state.copyWith(count: state.count + 1));
  }
  
  void _onDecrement(CounterDecrementPressed event, Emitter<CounterState> emit) {
    emit(state.copyWith(count: state.count - 1));
  }
}
`

## Riverpod

### When to Use
- Type-safe dependency injection
- Compile-time safety
- Fine-grained rebuild control
- Testing without BuildContext

### Implementation

`dart
// Provider
final counterProvider = StateNotifierProvider<CounterNotifier, int>((ref) {
  return CounterNotifier();
});

class CounterNotifier extends StateNotifier<int> {
  CounterNotifier() : super(0);
  
  void increment() => state++;
  void decrement() => state--;
}

// Consumer
class CounterWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);
    
    return ElevatedButton(
      onPressed: () => ref.read(counterProvider.notifier).increment(),
      child: Text('Count: '),
    );
  }
}
`

## Provider (Legacy)

### When to Use
- Simple apps
- Learning Flutter
- Quick prototyping

## Best Practices

1. **Immutable State**
   - Always create new state objects
   - Use copyWith methods
   - Avoid mutable state

2. **Single Source of Truth**
   - One state per feature
   - Centralized state for global data
   - Local state for UI-specific data

3. **State Normalization**
   `dart
   // Good
   class AppState {
     final Map<String, User> users;
     final List<String> userIds;
   }
   
   // Bad
   class AppState {
     final List<User> users; // Hard to update specific user
   }
   `

4. **Selective Rebuilds**
   `dart
   // Only rebuild when counter changes
   final counter = context.select((CounterCubit c) => c.state.count);
   `

5. **Dispose Properly**
   `dart
   @override
   void dispose() {
     _bloc.close();
     super.dispose();
   }
   `

## Testing

`dart
blocTest<CounterBloc, CounterState>(
  'emits [1] when CounterIncrementPressed is added',
  build: () => CounterBloc(),
  act: (bloc) => bloc.add(CounterIncrementPressed()),
  expect: () => [const CounterState(count: 1)],
);
`
