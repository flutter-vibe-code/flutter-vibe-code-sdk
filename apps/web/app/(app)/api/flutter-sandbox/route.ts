import { FragmentSchema } from '@/lib/schema'
import { ExecutionResultWeb } from '@/lib/types'
import { Sandbox } from '@e2b/code-interpreter'
import { globalFileWatcher } from '@/lib/sandbox-file-watcher'
import { globalFileChangeStream } from '@/lib/file-change-stream'

const sandboxTimeout = parseInt(process.env.E2B_SANDBOX_TIMEOUT_MS || '3600000') // Use env var, default to 1 hour

export const maxDuration = 120

export async function POST(req: Request) {
  // Try to parse request body, but use defaults if empty
  let reqData: any = {}
  try {
    const body = await req.text()
    if (body.trim()) {
      reqData = JSON.parse(body)
    }
  } catch (error) {
    console.log('No valid JSON in request body, using hardcoded fragment')
  }

  let { userID, teamID, accessToken } = {
    userID: reqData.userID || 'test-user',
    teamID: reqData.teamID,
    accessToken: reqData.accessToken,
  }

  const fragment: FragmentSchema = {
    commentary:
      "I'll create a simple Todo app using Flutter Expo with the following features:\n" +
      '1. Input field to add new todos\n' +
      '2. List of todos with checkboxes to mark them as complete\n' +
      '3. Delete functionality for todos\n' +
      '4. Basic styling for a clean look\n' +
      '\n' +
      "I'll use React's useState hook to manage the todos state and create components for the input and todo items.",
    template: 'flutter',
    title: 'Todo App',
    description:
      'A simple todo list application with add, complete, and delete functionality.',
    additional_dependencies: [],
    has_additional_dependencies: false,
    install_dependencies_command: '',
    port: 8081,
    file_path: 'App.tsx',
    code:
      "import React, { useState } from 'react';\n" +
      'import {\n' +
      '  StyleSheet,\n' +
      '  Text,\n' +
      '  View,\n' +
      '  TextInput,\n' +
      '  TouchableOpacity,\n' +
      '  FlatList,\n' +
      '  KeyboardAvoidingView,\n' +
      '  Platform,\n' +
      "} from 'react-native';\n" +
      "import { StatusBar } from 'expo-status-bar';\n" +
      '\n' +
      'interface Todo {\n' +
      '  id: string;\n' +
      '  text: string;\n' +
      '  completed: boolean;\n' +
      '}\n' +
      '\n' +
      'export default function App() {\n' +
      "  const [todo, setTodo] = useState('');\n" +
      '  const [todos, setTodos] = useState<Todo[]>([]);\n' +
      '\n' +
      '  const addTodo = () => {\n' +
      '    if (todo.trim().length > 0) {\n' +
      '      setTodos([\n' +
      '        ...todos,\n' +
      '        {\n' +
      '          id: Math.random().toString(),\n' +
      '          text: todo.trim(),\n' +
      '          completed: false,\n' +
      '        },\n' +
      '      ]);\n' +
      "      setTodo('');\n" +
      '    }\n' +
      '  };\n' +
      '\n' +
      '  const toggleTodo = (id: string) => {\n' +
      '    setTodos(\n' +
      '      todos.map((todo) =>\n' +
      '        todo.id === id ? { ...todo, completed: !todo.completed } : todo\n' +
      '      )\n' +
      '    );\n' +
      '  };\n' +
      '\n' +
      '  const deleteTodo = (id: string) => {\n' +
      '    setTodos(todos.filter((todo) => todo.id !== id));\n' +
      '  };\n' +
      '\n' +
      '  const renderItem = ({ item }: { item: Todo }) => (\n' +
      '    <View style={styles.todoItem}>\n' +
      '      <TouchableOpacity\n' +
      '        style={[styles.checkbox, item.completed && styles.checked]}\n' +
      '        onPress={() => toggleTodo(item.id)}\n' +
      '      />\n' +
      '      <Text\n' +
      '        style={[\n' +
      '          styles.todoText,\n' +
      '          item.completed && styles.completedTodoText,\n' +
      '        ]}\n' +
      '      >\n' +
      '        {item.text}\n' +
      '      </Text>\n' +
      '      <TouchableOpacity\n' +
      '        style={styles.deleteButton}\n' +
      '        onPress={() => deleteTodo(item.id)}\n' +
      '      >\n' +
      '        <Text style={styles.deleteButtonText}>×</Text>\n' +
      '      </TouchableOpacity>\n' +
      '    </View>\n' +
      '  );\n' +
      '\n' +
      '  return (\n' +
      '    <KeyboardAvoidingView\n' +
      "      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}\n" +
      '      style={styles.container}\n' +
      '    >\n' +
      '      <StatusBar style="auto" />\n' +
      '      <Text style={styles.title}>Todo List</Text>\n' +
      '      <View style={styles.inputContainer}>\n' +
      '        <TextInput\n' +
      '          style={styles.input}\n' +
      '          value={todo}\n' +
      '          onChangeText={setTodo}\n' +
      '          placeholder="Add a new todo"\n' +
      '          onSubmitEditing={addTodo}\n' +
      '        />\n' +
      '        <TouchableOpacity style={styles.addButton} onPress={addTodo}>\n' +
      '          <Text style={styles.addButtonText}>+</Text>\n' +
      '        </TouchableOpacity>\n' +
      '      </View>\n' +
      '      <FlatList\n' +
      '        data={todos}\n' +
      '        renderItem={renderItem}\n' +
      '        keyExtractor={(item) => item.id}\n' +
      '        style={styles.list}\n' +
      '      />\n' +
      '    </KeyboardAvoidingView>\n' +
      '  );\n' +
      '}\n' +
      '\n' +
      'const styles = StyleSheet.create({\n' +
      '  container: {\n' +
      '    flex: 1,\n' +
      "    backgroundColor: '#f5f5f5',\n" +
      '    paddingTop: 50,\n' +
      '  },\n' +
      '  title: {\n' +
      '    fontSize: 24,\n' +
      "    fontWeight: 'bold',\n" +
      "    textAlign: 'center',\n" +
      '    marginBottom: 20,\n' +
      '  },\n' +
      '  inputContainer: {\n' +
      "    flexDirection: 'row',\n" +
      '    paddingHorizontal: 20,\n' +
      '    marginBottom: 20,\n' +
      '  },\n' +
      '  input: {\n' +
      '    flex: 1,\n' +
      '    height: 40,\n' +
      "    backgroundColor: 'white',\n" +
      '    borderRadius: 10,\n' +
      '    paddingHorizontal: 15,\n' +
      '    marginRight: 10,\n' +
      "    shadowColor: '#000',\n" +
      '    shadowOffset: {\n' +
      '      width: 0,\n' +
      '      height: 2,\n' +
      '    },\n' +
      '    shadowOpacity: 0.25,\n' +
      '    shadowRadius: 3.84,\n' +
      '    elevation: 5,\n' +
      '  },\n' +
      '  addButton: {\n' +
      '    width: 40,\n' +
      '    height: 40,\n' +
      "    backgroundColor: '#007AFF',\n" +
      '    borderRadius: 10,\n' +
      "    justifyContent: 'center',\n" +
      "    alignItems: 'center',\n" +
      "    shadowColor: '#000',\n" +
      '    shadowOffset: {\n' +
      '      width: 0,\n' +
      '      height: 2,\n' +
      '    },\n' +
      '    shadowOpacity: 0.25,\n' +
      '    shadowRadius: 3.84,\n' +
      '    elevation: 5,\n' +
      '  },\n' +
      '  addButtonText: {\n' +
      "    color: 'white',\n" +
      '    fontSize: 24,\n' +
      "    fontWeight: 'bold',\n" +
      '  },\n' +
      '  list: {\n' +
      '    paddingHorizontal: 20,\n' +
      '  },\n' +
      '  todoItem: {\n' +
      "    flexDirection: 'row',\n" +
      "    alignItems: 'center',\n" +
      "    backgroundColor: 'white',\n" +
      '    padding: 15,\n' +
      '    borderRadius: 10,\n' +
      '    marginBottom: 10,\n' +
      "    shadowColor: '#000',\n" +
      '    shadowOffset: {\n' +
      '      width: 0,\n' +
      '      height: 1,\n' +
      '    },\n' +
      '    shadowOpacity: 0.22,\n' +
      '    shadowRadius: 2.22,\n' +
      '    elevation: 3,\n' +
      '  },\n' +
      '  checkbox: {\n' +
      '    width: 24,\n' +
      '    height: 24,\n' +
      '    borderWidth: 2,\n' +
      "    borderColor: '#007AFF',\n" +
      '    borderRadius: 12,\n' +
      '    marginRight: 10,\n' +
      '  },\n' +
      '  checked: {\n' +
      "    backgroundColor: '#007AFF',\n" +
      '  },\n' +
      '  todoText: {\n' +
      '    flex: 1,\n' +
      '    fontSize: 16,\n' +
      '  },\n' +
      '  completedTodoText: {\n' +
      "    textDecorationLine: 'line-through',\n" +
      "    color: '#888',\n" +
      '  },\n' +
      '  deleteButton: {\n' +
      '    padding: 5,\n' +
      '  },\n' +
      '  deleteButtonText: {\n' +
      "    color: '#FF3B30',\n" +
      '    fontSize: 24,\n' +
      "    fontWeight: 'bold',\n" +
      '  },\n' +
      '});',
  }

  //   console.log('Flutter Expo fragment', fragment)
  //   console.log('userID', userID)

  // Create Flutter Expo sandbox
  const sbx = await Sandbox.create('sce6zutko6kvhyhza4n8', {
    metadata: {
      template: 'sce6zutko6kvhyhza4n8',
      userID: userID ?? '',
      teamID: teamID ?? '',
    },
    timeoutMs: sandboxTimeout,
  })

  console.log(`Flutter Expo sandbox created: ${sbx.sandboxId}`)

  console.log(
    `Checking Flutter Expo development server in sandbox ${sbx.sandboxId}`,
  )

  // Check current directory
  const currentDirResult = await sbx.commands.run('pwd')
  console.log(`Current directory:`, currentDirResult.stdout)

  // cd to home/user/app and list files
  //   const listFilesResult = await sbx.commands.run('cd /home/user/app && ls -la')
  //   console.log(`Files in /home/user/app:`, listFilesResult.stdout)

  // Check package.json to verify it's a Flutter app
  //   const packageJsonResult = await sbx.commands.run(
  //     'cd /home/user/app && cat package.json',
  //   )
  //   console.log(`Package.json content:`, packageJsonResult.stdout)

  // Check what scripts are available
  const scriptsResult = await sbx.commands.run('cd /home/user/app && bun run')
  console.log(`Available scripts:`, scriptsResult.stdout)

  // Check if the server is running
  const statusResult = await sbx.commands.run(
    'curl -s http://localhost:8081 || echo "Server not ready"',
  )

  console.log(`Server status check: ${statusResult.stdout}`)

  // Run npm run start:web:tunnel command
  // Check node_modules contents
  //   const nodeModulesResult = await sbx.commands.run(
  //     'cd /home/user/app && ls -la node_modules',
  //   )
  //   console.log(`Node modules:`, nodeModulesResult.stdout)
  // Start Expo web server (no tunnel needed - e2b provides public access)
  console.log('Starting Expo web server...')

  let serverOutput = ''
  let webBundled = false

  // Start the web server in background
  sbx.commands
    .run('cd /home/user/app && flutter start --web', {
      requestTimeoutMs: 300000,
      timeoutMs: 300000,
      background: true,
      onStdout: (data) => {
        console.log('SERVER STDOUT:', data)
        serverOutput += data

        // Check for Web Bundled specifically
        if (data.includes('Web Bundled')) {
          console.log('Web Bundled: true')
          webBundled = true
        }
      },
      onStderr: (data) => {
        console.log('SERVER STDERR:', data)
        serverOutput += data
      },
    })
    .catch((err) => console.log('Server process error:', err))

  console.log('Waiting for server to start...')

  // Wait for webBundled with timeout and health checks
  const maxWaitTime = 120000 // 120 seconds (webpack can be slow)
  const checkInterval = 3000 // 3 seconds
  let waitTime = 0

  while (!webBundled && waitTime < maxWaitTime) {
    await new Promise((resolve) => setTimeout(resolve, checkInterval))
    waitTime += checkInterval

    // Also try to ping the server directly
    try {
      const healthCheck = await sbx.commands.run(
        'curl -s -o /dev/null -w "%{http_code}" http://localhost:8081 || echo "000"',
        { timeoutMs: 13000 },
      )

      if (
        healthCheck.stdout.includes('200') ||
        healthCheck.stdout.includes('404')
      ) {
        console.log('Server responding to HTTP requests')
        webBundled = true
        break
      }
    } catch (error) {
      console.log('Health check failed:', error)
    }

    console.log(`Still waiting for webBundled... ${waitTime}ms elapsed`)
  }

  // Get the public URL using e2b's getHost method
  const publicHost = sbx.getHost(8081)
  const publicUrl = `https://${publicHost}`

  console.log('E2B public URL:', publicUrl)

  if (!webBundled) {
    console.warn('WebBundled not detected, but proceeding with URL')
  }

  // Check if Expo process is running
  let processCheck = ''
  try {
    const processResult = await sbx.commands.run(
      'pgrep -f "expo.*start" | wc -l || echo "0"',
      { timeoutMs: 13000 },
    )
    processCheck = processResult.stdout.trim()
  } catch (error) {
    console.log('Error checking process:', error)
    processCheck = 'Error checking'
  }

  console.log('Final server output:', serverOutput)
  console.log('Public URL:', publicUrl)

  return new Response(
    JSON.stringify({
      url: publicUrl,
    }),
  )
}
