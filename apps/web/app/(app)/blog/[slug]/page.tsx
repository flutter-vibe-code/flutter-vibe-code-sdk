import { getPayload } from 'payload'
import config from '@/payload.config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { RichText } from '@/components/blog/rich-text'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const post = docs[0]
  if (!post) return { title: 'Post Not Found' }

  return {
    title: `${post.title} | Capsule Blog`,
    description: post.subtitle || `Read ${post.title} on the Capsule blog`,
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })

  const post = docs[0] as any
  if (!post) notFound()

  const author = post.author as any
  const featuredImage = post.featuredImage as any

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/blog" className="text-xl font-serif font-medium tracking-tight">
            Capsule
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/blog" className="text-sm text-gray-600 hover:text-black">
              Blog
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6">
        {/* Featured Image */}
        {featuredImage?.url && (
          <div className="mt-8">
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={featuredImage.url}
                alt={featuredImage.alt || post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
            {post.featuredImageCaption && (
              <p className="mt-2 text-sm text-gray-500 italic">
                {post.featuredImageCaption}
              </p>
            )}
          </div>
        )}

        {/* Author Info */}
        <div className="flex items-center gap-3 mt-8 mb-6">
          {author?.avatar?.url && (
            <Image
              src={author.avatar.url}
              alt={author.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">BY {author?.name?.toUpperCase()}</span>
              {author?.role && (
                <span className="text-gray-500 uppercase text-xs tracking-wide">
                  {author.role}
                </span>
              )}
            </div>
            {author?.bio && (
              <p className="text-sm text-gray-600 mt-1 max-w-md">{author.bio}</p>
            )}
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-4xl md:text-5xl font-serif font-medium leading-tight mb-4">
          {post.title}
        </h1>

        {post.subtitle && (
          <p className="text-xl text-gray-600 mb-6 font-serif italic">
            {post.subtitle}
          </p>
        )}

        {/* Meta & Actions */}
        <div className="flex items-center justify-between py-4 border-y border-gray-200 mb-8">
          <div className="flex items-center gap-4">
            {post.publishedAt && (
              <time dateTime={post.publishedAt} className="text-sm text-gray-600">
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Share buttons */}
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Copy link">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Share on X">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Share on LinkedIn">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Share on Facebook">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            {post.likes > 0 && (
              <span className="flex items-center gap-1 px-3 py-1 border border-gray-200 rounded-full text-sm">
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                {post.likes}
              </span>
            )}
          </div>
        </div>

        {/* Newsletter CTA */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 text-center italic text-gray-600">
          Was this newsletter forwarded to you?{' '}
          <Link href="/blog" className="underline">
            Sign up
          </Link>{' '}
          to get it in your inbox.
        </div>

        {/* Content */}
        <article className="prose prose-lg max-w-none mb-16">
          <RichText content={post.content} />
        </article>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8 mb-8">
          <Link href="/blog" className="text-sm text-gray-600 hover:text-black">
            &larr; Back to all posts
          </Link>
        </footer>
      </main>
    </div>
  )
}
