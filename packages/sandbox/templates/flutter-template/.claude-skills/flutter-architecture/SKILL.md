---
name: flutter-architecture
description: MVVM and Clean Architecture patterns with dependency injection and repository pattern
---

# Flutter Architecture

## Clean Architecture Layers

### 1. Presentation Layer (UI)
- Widgets are dumb - only display data
- Controllers/Blocs handle UI logic
- No business logic here

### 2. Domain Layer
- Entities: Core business objects
- Use Cases: Business logic operations
- Repository Interfaces: Abstract data contracts

### 3. Data Layer
- Models: DTOs for API/database
- Repositories: Implementation of domain interfaces
- Data Sources: Remote (API) and Local (DB)

## Repository Pattern

```dart
abstract class UserRepository {
  Future<Either<Failure, User>> getUser(String id);
}

class UserRepositoryImpl implements UserRepository {
  final UserRemoteDataSource _remote;
  final UserLocalDataSource _local;

  @override
  Future<Either<Failure, User>> getUser(String id) async {
    try {
      final cached = await _local.getUser(id);
      if (cached != null) return Right(cached);

      final user = await _remote.getUser(id);
      await _local.cacheUser(user);
      return Right(user);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
```

## Dependency Injection with get_it

```dart
final getIt = GetIt.instance;
void configureDependencies() => getIt.init();
```

## Error Handling with Either
- Use abstract Failure class
- Return Either<Failure, T> from use cases
- Fold to handle success/error in UI
