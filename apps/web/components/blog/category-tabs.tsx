'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
}

interface CategoryTabsProps {
  categories: Category[]
  currentCategory?: string | null
}

const defaultTabs = [
  { id: 'all', name: 'View all', slug: 'all' },
  { id: 'editors-pick', name: "Editor's pick", slug: 'editors-pick' },
  { id: 'most-discussed', name: 'Most discussed', slug: 'most-discussed' },
  { id: 'deep-dives', name: 'Deep dives', slug: 'deep-dives' },
  { id: 'short-reads', name: 'Short reads', slug: 'short-reads' },
  { id: 'for-you', name: 'For you', slug: 'for-you' },
]

export function CategoryTabs({ categories, currentCategory }: CategoryTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeCategory = currentCategory || searchParams.get('category') || 'all'

  const handleCategoryChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (slug === 'all') {
      params.delete('category')
    } else {
      params.set('category', slug)
    }
    router.push(`/blog?${params.toString()}`)
  }

  // Combine default tabs with dynamic categories
  const allTabs = [...defaultTabs, ...categories.filter(c => !defaultTabs.some(t => t.slug === c.slug))]

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex gap-6 overflow-x-auto scrollbar-hide">
        {allTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleCategoryChange(tab.slug)}
            className={`
              whitespace-nowrap pb-3 text-sm font-medium transition-colors
              ${activeCategory === tab.slug
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  )
}
