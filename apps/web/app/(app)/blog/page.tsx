import { getPayload } from 'payload'
import config from '@/payload.config'
import { Suspense } from 'react'
import { BlogHeader } from '@/components/blog/blog-header'
import { PostCard } from '@/components/blog/post-card'
import { AuthorCard } from '@/components/blog/author-card'
import { CategoryTabs } from '@/components/blog/category-tabs'

export const metadata = {
  title: 'Blog | Capsule',
  description: 'Articles about mobile development, AI, and building with Flutter',
}

async function getPublishedPosts() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: {
      status: {
        equals: 'published',
      },
    },
    sort: '-publishedAt',
    depth: 2,
  })

  return posts
}

async function getCategories() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs: categories } = await payload.find({
    collection: 'categories',
    depth: 0,
  })

  return categories
}

async function getTrendingAuthors() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs: authors } = await payload.find({
    collection: 'authors',
    where: {
      trending: {
        equals: true,
      },
    },
    depth: 1,
    limit: 4,
  })

  return authors
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams
  const [posts, categories, trendingAuthors] = await Promise.all([
    getPublishedPosts(),
    getCategories(),
    getTrendingAuthors(),
  ])

  // Find featured posts
  const heroPost = posts.find((post: any) => post.featured === 'hero')
  const sidebarPosts = posts.filter((post: any) => post.featured === 'sidebar').slice(0, 2)

  // Regular posts (excluding featured ones)
  const regularPosts = posts.filter(
    (post: any) => post.featured === 'none' || !post.featured
  )

  // Filter by category if specified
  const filteredPosts = params.category && params.category !== 'all'
    ? regularPosts.filter((post: any) => {
        const postCategories = post.categories || []
        return postCategories.some((cat: any) =>
          cat.slug === params.category || cat.id === params.category
        )
      })
    : regularPosts

  return (
    <div className="min-h-screen bg-white">
      <BlogHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Main Hero Post */}
          <div>
            {heroPost ? (
              <PostCard post={heroPost as any} variant="hero" />
            ) : posts[0] ? (
              <PostCard post={posts[0] as any} variant="hero" />
            ) : (
              <div className="aspect-[16/10] bg-gray-100 rounded-xl flex items-center justify-center">
                <p className="text-gray-500">No featured post yet</p>
              </div>
            )}
          </div>

          {/* Sidebar Posts */}
          <div className="flex flex-col gap-6">
            {sidebarPosts.length > 0 ? (
              sidebarPosts.map((post: any) => (
                <PostCard key={post.id} post={post} variant="sidebar" />
              ))
            ) : posts.slice(1, 3).length > 0 ? (
              posts.slice(1, 3).map((post: any) => (
                <PostCard key={post.id} post={post} variant="sidebar" />
              ))
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center flex-1 flex items-center justify-center">
                <p className="text-gray-500 text-sm">More posts coming soon</p>
              </div>
            )}
          </div>
        </section>

        {/* Category Tabs & Posts List */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Suspense fallback={<div className="h-10 bg-gray-100 animate-pulse rounded" />}>
              <CategoryTabs
                categories={categories as any[]}
                currentCategory={params.category}
              />
            </Suspense>

            <div className="divide-y divide-gray-100 mt-6">
              {filteredPosts.length === 0 ? (
                <p className="text-gray-500 text-center py-12">
                  No posts in this category yet. Check back soon!
                </p>
              ) : (
                filteredPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} variant="list" />
                ))
              )}
            </div>
          </div>

          {/* Trending Writers Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trending writers</h2>
              <div className="space-y-2">
                {trendingAuthors.length > 0 ? (
                  trendingAuthors.map((author: any) => (
                    <AuthorCard key={author.id} author={author} />
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No trending writers yet</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
