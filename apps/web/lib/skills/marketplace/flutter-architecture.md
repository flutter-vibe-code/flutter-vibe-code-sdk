name: flutter-architecture
description: MVVM and Clean Architecture patterns for Flutter with dependency injection, repository pattern, and layered architecture.

---

# Flutter Architecture Skill

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

## MVVM Pattern

### Model
`dart
class User {
  final String id;
  final String name;
  final String email;
  
  const User({required this.id, required this.name, required this.email});
}
`

### ViewModel (Bloc/Cubit)
`dart
class UserCubit extends Cubit<UserState> {
  final GetUserUseCase _getUser;
  
  UserCubit(this._getUser) : super(UserInitial());
  
  Future<void> loadUser(String id) async {
    emit(UserLoading());
    final result = await _getUser(id);
    result.fold(
      (failure) => emit(UserError(failure.message)),
      (user) => emit(UserLoaded(user)),
    );
  }
}
`

### View
`dart
class UserPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<UserCubit>(),
      child: UserView(),
    );
  }
}
`

## Dependency Injection

Use get_it + injectable:

`dart
// injection.dart
final getIt = GetIt.instance;

@InjectableInit()
void configureDependencies() => getIt.init();

// Register dependencies
@module
abstract class RegisterModule {
  @singleton
  Dio get dio => Dio(BaseOptions(baseUrl: 'https://api.example.com'));
}
`

## Repository Pattern

`dart
// domain/repository/user_repository.dart
abstract class UserRepository {
  Future<Either<Failure, User>> getUser(String id);
}

// data/repository/user_repository_impl.dart
class UserRepositoryImpl implements UserRepository {
  final UserRemoteDataSource _remote;
  final UserLocalDataSource _local;
  
  UserRepositoryImpl(this._remote, this._local);
  
  @override
  Future<Either<Failure, User>> getUser(String id) async {
    try {
      // Try cache first
      final cached = await _local.getUser(id);
      if (cached != null) return Right(cached);
      
      // Fetch from remote
      final user = await _remote.getUser(id);
      await _local.cacheUser(user);
      return Right(user);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
`

## Error Handling with Either

`dart
abstract class Failure {
  final String message;
  const Failure(this.message);
}

class ServerFailure extends Failure {
  const ServerFailure(super.message);
}

class CacheFailure extends Failure {
  const CacheFailure(super.message);
}

// Use case
class GetUserUseCase {
  final UserRepository _repository;
  
  GetUserUseCase(this._repository);
  
  Future<Either<Failure, User>> call(String id) {
    return _repository.getUser(id);
  }
}
`
