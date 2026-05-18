import { opencodeEnabled, templateFlag } from '@/flags'
import { ProjectPageWrapper } from './project-page-wrapper'

export default async function Page() {
  const showOpencode = await opencodeEnabled()
  const template = await templateFlag()

  return <ProjectPageWrapper opencodeEnabled={!!showOpencode} template={template as 'flutter' | 'flutter'} />
}
