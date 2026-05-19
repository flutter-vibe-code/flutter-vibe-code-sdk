import { Sandbox } from '@e2b/code-interpreter'

export interface ProjectFile {
  path: string
  content: string
  type: 'tsx' | 'ts' | 'js' | 'jsx' | 'json' | 'md' | 'other'
  size: number
  lastModified: string
}

export interface ProjectStructure {
  files: ProjectFile[]
  dependencies: string[]
  components: string[]
  screens: string[]
  utilities: string[]
  architecture: 'expo-router' | 'navigation' | 'nextjs' | 'other'
  framework: string
}

export class ProjectScanner {
  constructor(private sandbox: Sandbox) {}

  async scanProject(): Promise<ProjectStructure> {
    const files = await this.getAllFiles()
    const dependencies = await this.extractDependencies()
    const components = this.extractComponents(files)
    const screens = this.extractScreens(files)
    const utilities = this.extractUtilities(files)
    const architecture = this.detectArchitecture(files)
    const framework = this.detectFramework(files)

    return {
      files,
      dependencies,
      components,
      screens,
      utilities,
      architecture,
      framework,
    }
  }

  private async getAllFiles(): Promise<ProjectFile[]> {
    try {
      // Get all relevant files excluding node_modules and common build dirs
      const findResult = await this.sandbox.commands.run(
        `find /home/user -type f \\( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" \\) -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" -not -path "*/.expo/*" | sort`
      )

      const filePaths = findResult.stdout.trim().split('\n').filter(Boolean)
      const files: ProjectFile[] = []

      for (const path of filePaths) {
        try {
          // Get file stats
          const statResult = await this.sandbox.commands.run(
            `stat -c '%s %Y' "${path}" 2>/dev/null || echo "0 0"`
          )
          const [size, timestamp] = statResult.stdout.trim().split(' ')
          
          // Read file content (limit to reasonable size)
          const sizeNum = parseInt(size) || 0
          if (sizeNum > 100000) continue // Skip files > 100KB
          
          const content = await this.sandbox.files.read(path)
          const type = this.getFileType(path)
          
          files.push({
            path: path.replace('/home/user/', ''),
            content,
            type,
            size: sizeNum,
            lastModified: new Date(parseInt(timestamp) * 1000).toISOString(),
          })
        } catch (error) {
        }
      }

      return files
    } catch (error) {
      return []
    }
  }

  private async extractDependencies(): Promise<string[]> {
    try {
      const packageJson = await this.sandbox.files.read('/home/user/package.json')
      const parsed = JSON.parse(packageJson)
      return [
        ...Object.keys(parsed.dependencies || {}),
        ...Object.keys(parsed.devDependencies || {}),
      ]
    } catch (error) {
      return []
    }
  }

  private extractComponents(files: ProjectFile[]): string[] {
    const components: string[] = []
    
    files.forEach(file => {
      if ((file.type === 'tsx' || file.type === 'ts') && 
          (file.path.includes('component') || file.path.includes('Component'))) {
        // Extract component names from file content
        const componentMatches = file.content.match(/(?:export\s+(?:default\s+)?(?:function|const|class)\s+)([A-Z][a-zA-Z0-9]+)/g)
        if (componentMatches) {
          componentMatches.forEach(match => {
            const name = match.replace(/export\s+(?:default\s+)?(?:function|const|class)\s+/, '')
            if (name && !components.includes(name)) {
              components.push(name)
            }
          })
        }
      }
    })

    return components
  }

  private extractScreens(files: ProjectFile[]): string[] {
    const screens: string[] = []
    
    files.forEach(file => {
      if (file.path.includes('screen') || file.path.includes('Screen') || 
          file.path.includes('pages/') || file.path.includes('app/')) {
        const screenMatches = file.content.match(/(?:export\s+(?:default\s+)?(?:function|const|class)\s+)([A-Z][a-zA-Z0-9]+)/g)
        if (screenMatches) {
          screenMatches.forEach(match => {
            const name = match.replace(/export\s+(?:default\s+)?(?:function|const|class)\s+/, '')
            if (name && !screens.includes(name)) {
              screens.push(name)
            }
          })
        }
      }
    })

    return screens
  }

  private extractUtilities(files: ProjectFile[]): string[] {
    const utilities: string[] = []
    
    files.forEach(file => {
      if (file.path.includes('util') || file.path.includes('helper') || 
          file.path.includes('lib/') || file.path.includes('services/')) {
        const utilMatches = file.content.match(/(?:export\s+(?:function|const|class)\s+)([a-zA-Z][a-zA-Z0-9]+)/g)
        if (utilMatches) {
          utilMatches.forEach(match => {
            const name = match.replace(/export\s+(?:function|const|class)\s+/, '')
            if (name && !utilities.includes(name)) {
              utilities.push(name)
            }
          })
        }
      }
    })

    return utilities
  }

  private detectArchitecture(files: ProjectFile[]): ProjectStructure['architecture'] {
    const hasExpoRouter = files.some(f => 
      f.content.includes('expo-router') || f.path.includes('app/') && f.path.includes('layout')
    )
    const hasReactNavigation = files.some(f => 
      f.content.includes('@react-navigation/')
    )
    const hasNextJs = files.some(f => 
      f.path.includes('pages/') || f.content.includes('next/')
    )

    if (hasExpoRouter) return 'expo-router'
    if (hasReactNavigation) return 'navigation'
    if (hasNextJs) return 'nextjs'
    return 'other'
  }

  private detectFramework(files: ProjectFile[]): string {
    const hasReactNative = files.some(f => 
      f.content.includes('react-native') || f.content.includes('expo')
    )
    const hasNext = files.some(f => 
      f.content.includes('next/') || f.path.includes('pages/')
    )
    const hasReact = files.some(f => 
      f.content.includes('react') && !f.content.includes('react-native')
    )

    if (hasReactNative) return 'react-native'
    if (hasNext) return 'nextjs'
    if (hasReact) return 'react'
    return 'unknown'
  }

  private getFileType(path: string): ProjectFile['type'] {
    const ext = path.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'tsx': return 'tsx'
      case 'ts': return 'ts'
      case 'js': return 'js'
      case 'jsx': return 'jsx'
      case 'json': return 'json'
      case 'md': return 'md'
      default: return 'other'
    }
  }

  async getProjectSummary(): Promise<string> {
    const structure = await this.scanProject()
    
    return `
# Project Structure Summary

## Framework: ${structure.framework}
## Architecture: ${structure.architecture}

## Files (${structure.files.length}):
${structure.files.map(f => `- ${f.path} (${f.type})`).join('\n')}

## Components (${structure.components.length}):
${structure.components.join(', ')}

## Screens (${structure.screens.length}):
${structure.screens.join(', ')}

## Utilities (${structure.utilities.length}):
${structure.utilities.join(', ')}

## Key Dependencies:
${structure.dependencies.filter(dep => 
  !dep.startsWith('@types/') && 
  !['react', 'react-dom', 'typescript'].includes(dep)
).slice(0, 10).join(', ')}
`.trim()
  }
}