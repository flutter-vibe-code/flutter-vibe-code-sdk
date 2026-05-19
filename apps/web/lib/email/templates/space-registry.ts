import SpaceLaunchEmail from './space-launch'

export interface SpaceTemplate {
  name: string
  subject: string
  component: typeof SpaceLaunchEmail
}

export const spaceTemplates: SpaceTemplate[] = [
  {
    name: 'space_launch',
    subject: 'Flutter Space is live',
    component: SpaceLaunchEmail,
  },
]

export function getSpaceTemplate(name: string) {
  return spaceTemplates.find((t) => t.name === name)
}
