import type { PromptSection } from "../../types";

export const docsSection: PromptSection = {
  id: "docs",
  name: "Library Documentation",
  xmlTag: "docs",
  required: true,
  order: 11,
  content: `<docs>
  <create-context-hook>
    npm install @nkzw/create-context-hook

    When you create providers, you must use createContextHook instead of raw createContext.
    This wrapper will help you keep types correct without any extra work.

    createContextHook() is a simple wrapper around creating react context and a hook.
    Here is the FULL source code of it, so you have a full picture of what it does:
    <source_code>
    import { createContext, FunctionComponent, ReactNode, useContext } from 'react';

    export default function createContextHook<T>(
      contextInitializer: () => T,
      defaultValue?: T,
    ): [Context: FunctionComponent<{ children: ReactNode }>, useHook: () => T] {
      const Context = createContext<T | undefined>(defaultValue);

      return [
        ({ children }: { children: ReactNode }) => (
          <Context.Provider value={contextInitializer()}>
            {children}
          </Context.Provider>
        ),
        () => useContext(Context) as T,
      ];
    }
    </source_code>

    This is how you use it:
    <example>
    import createContextHook from '@nkzw/create-context-hook';

    export const [TodoContext, useTodos] = createContextHook(() => {
      const [todos, setTodos] = useState<Todo[]>([]);

      const todosQuery = useQuery({
        queryKey: ['todos'],
        queryFn: async () => {
          const stored = await AsyncStorage.getItem('todos');
          return stored ? JSON.parse(stored) : [];
        }
      });

      const syncMutation = useMutation({
        mutationFn: async (todos: Todo[]) => {
          await AsyncStorage.setItem('todos', JSON.stringify(todos));
          return todos;
        }
      });

      useEffect(() => {
        if (todosQuery.data) {
          setTodos(todosQuery.data);
        }
      }, [todosQuery.data]);

      const addTodo = (todo: Todo) => {
        const updated = [...todos, todo];
        setTodos(updated);
        syncMutation.mutate(updated);
      };

      return { todos, addTodo, isLoading: todosQuery.isLoading };
    });

    export function useFilteredTodos(search: string) {
      const { todos } = useTodos();
      return useMemo(() => todos.filter(todo => todo.title.includes(search)), [todos, search]);
    }
    </example>
  </create-context-hook>

  <expo>
    <library>
      <name>expo-camera</name>
      <description>Camera API for React Native</description>
      <expo_sdk_version>52.0.0</expo_sdk_version>
      <supports_web>Yes</supports_web>
      <example>
      import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
      import { useState } from 'react';
      import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

      export default function App() {
      // IMPORTANT: CameraType is a string, not a enum in Expo SDK 52
      // So you can't do CameraType.back or CameraType.front
      // You have to use 'back' or 'front' as a string.
      const [facing, setFacing] = useState<CameraType>('back');
      const [permission, requestPermission] = useCameraPermissions();

      if (!permission) {
        return <View />;
      }

      if (!permission.granted) {
      return (
        <View style={styles.container}>
          <Text style={styles.message}>We need your permission to show the camera</Text>
          <Button onPress={requestPermission} title="grant permission" />
        </View>
        );
      }

      function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
      }

      // CameraView is supported on mobile AND web
      // Do not add a fallback for web.
      return (
          <View style={styles.container}>
            <CameraView style={styles.camera} facing={facing}>
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                  <Text style={styles.text}>Flip Camera</Text>
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        );
      }
      </example>
    </library>
  </expo>

</docs>`,
};
