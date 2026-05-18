import { z } from 'zod'

// Enhanced schema for full application operations
export const appOperationSchema = z.object({
  commentary: z
    .string()
    .describe(
      'Detailed explanation of what you plan to do, including architectural decisions and how it integrates with existing code.'
    ),
  
  template: z
    .string()
    .describe('Template/framework being used (react-native-expo, nextjs, etc.)'),
  
  operationType: z
    .enum(['create', 'enhance', 'refactor', 'debug'])
    .describe('Type of operation being performed on the application'),
  
  title: z
    .string()
    .describe('Brief title describing the changes being made'),
  
  description: z
    .string()
    .describe('Detailed description of the functionality being added/modified'),
  
  // File operations
  fileOperations: z.array(
    z.object({
      action: z.enum(['create', 'modify', 'delete']).describe('Action to perform on the file'),
      filePath: z.string().describe('Relative path to the file'),
      content: z.string().optional().describe('File content (required for create/modify)'),
      reason: z.string().describe('Why this file operation is necessary'),
    })
  ).describe('List of file operations to be performed'),
  
  // Dependencies management
  dependencies: z.object({
    add: z.array(z.string()).describe('New dependencies to install'),
    remove: z.array(z.string()).describe('Dependencies to remove'),
    update: z.array(z.string()).describe('Dependencies to update'),
  }).optional(),
  
  // Architecture considerations
  architecture: z.object({
    patterns: z.array(z.string()).describe('Architecture patterns being implemented or modified'),
    components: z.array(z.string()).describe('New or modified components'),
    services: z.array(z.string()).describe('New or modified services/utilities'),
    routing: z.array(z.string()).describe('New or modified routes/screens'),
  }).optional(),
  
  // Integration points
  integration: z.object({
    existingComponents: z.array(z.string()).describe('Existing components this integrates with'),
    stateManagement: z.string().optional().describe('How this affects application state'),
    navigation: z.string().optional().describe('Navigation changes required'),
    styling: z.string().optional().describe('Styling approach and theme integration'),
  }).optional(),
  
  // Testing considerations
  testing: z.object({
    testFiles: z.array(z.string()).describe('Test files to create or modify'),
    testingStrategy: z.string().describe('Testing approach for the changes'),
  }).optional(),
  
  // Performance considerations
  performance: z.object({
    optimizations: z.array(z.string()).describe('Performance optimizations implemented'),
    bundleImpact: z.string().optional().describe('Expected impact on bundle size'),
  }).optional(),
  
  // Port for web preview (if applicable)
  port: z.number().nullable().describe('Port for web preview, null if not applicable'),
  
  // Success criteria
  successCriteria: z.array(z.string()).describe('How to verify the implementation was successful'),
  
  // Next steps
  nextSteps: z.array(z.string()).optional().describe('Recommended next development steps'),
})

export type AppOperationSchema = z.infer<typeof appOperationSchema>

// Simplified schema for backward compatibility with fragments
export const fragmentCompatibilitySchema = z.object({
  commentary: z.string(),
  template: z.string(),
  title: z.string(),
  description: z.string(),
  additional_dependencies: z.array(z.string()),
  has_additional_dependencies: z.boolean(),
  install_dependencies_command: z.string(),
  port: z.number().nullable(),
  file_path: z.string(),
  code: z.string(),
})

// Union schema that can handle both approaches
export const hybridSchema = z.union([
  appOperationSchema,
  fragmentCompatibilitySchema,
])

export type HybridSchema = z.infer<typeof hybridSchema>

// Type guards
export function isAppOperation(data: HybridSchema): data is AppOperationSchema {
  return 'fileOperations' in data
}

export function isFragmentOperation(data: HybridSchema): data is z.infer<typeof fragmentCompatibilitySchema> {
  return 'code' in data && 'file_path' in data
}

// Conversion utilities
export function convertFragmentToAppOperation(fragment: z.infer<typeof fragmentCompatibilitySchema>): AppOperationSchema {
  return {
    commentary: fragment.commentary,
    template: fragment.template,
    operationType: 'create',
    title: fragment.title,
    description: fragment.description,
    fileOperations: [{
      action: 'create',
      filePath: fragment.file_path,
      content: fragment.code,
      reason: 'Creating new component based on user request',
    }],
    dependencies: fragment.has_additional_dependencies ? {
      add: fragment.additional_dependencies,
      remove: [],
      update: [],
    } : undefined,
    port: fragment.port,
    successCriteria: ['File created successfully', 'Application runs without errors'],
  }
}

export function convertAppOperationToFragment(appOp: AppOperationSchema): z.infer<typeof fragmentCompatibilitySchema> {
  const mainFile = appOp.fileOperations.find(op => op.action === 'create' || op.action === 'modify')
  
  return {
    commentary: appOp.commentary,
    template: appOp.template,
    title: appOp.title,
    description: appOp.description,
    additional_dependencies: appOp.dependencies?.add || [],
    has_additional_dependencies: (appOp.dependencies?.add || []).length > 0,
    install_dependencies_command: appOp.dependencies?.add.length ? 
      `bun install ${appOp.dependencies.add.join(' ')}` : '',
    port: appOp.port,
    file_path: mainFile?.filePath || 'App.tsx',
    code: mainFile?.content || '',
  }
}