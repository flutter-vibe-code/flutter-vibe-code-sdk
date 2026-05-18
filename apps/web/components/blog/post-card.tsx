import Link from 'next/link'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
  color?: string | null
}

interface Author {
  id: string
  name: string
  role?: string | null
  avatar?: {
    url: string
    alt?: string
  } | null
}

interface PostCardProps {
  post: {
    id: string
    title: string
    slug: string
    subtitle?: string | null
    readingTime?: number | null
    publishedAt?: string | null
    featuredImage?: {
      url: string
      alt?: string
    } | null
    author: Author
    categories?: Category[] | null
  }
  variant?: 'default' | 'hero' | 'sidebar' | 'list'
}

export function PostCard({ post, variant = 'default' }: PostCardProps) {
  const author = post.author
  const featuredImage = post.featuredImage
  const categories = post.categories || []

  if (variant === 'hero') {
    return (
      <article className="group h-full flex flex-col">
        <Link href={`/blog/${post.slug}`} className="block flex-1 flex flex-col">
          {featuredImage?.url && (
            <div className="relative aspect-[16/10] mb-4 overflow-hidden rounded-xl bg-gray-100">
              <Image
                src={featuredImage.url}
                alt={featuredImage.alt || post.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}

          <div className="flex items-center gap-3 mb-3">
            {author?.avatar?.url && (
              <Image
                src={author.avatar.url}
                alt={author.name}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div className="text-sm">
              <span className="font-medium text-gray-900">{author?.name}</span>
              {post.readingTime && (
                <p className="text-gray-500">{post.readingTime} min read</p>
              )}
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors leading-tight">
            {post.title}
          </h2>

          {post.subtitle && (
            <p className="text-gray-600 mb-4 line-clamp-2">{post.subtitle}</p>
          )}

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-auto">
              {categories.map((category) => (
                <span
                  key={category.id}
                  className="px-3 py-1.5 text-sm font-medium rounded-full border border-gray-200"
                  style={{
                    backgroundColor: category.color ? category.color : '#000',
                    color: category.color ? '#fff' : '#fff',
                    borderColor: category.color || '#000',
                  }}
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}
        </Link>
      </article>
    )
  }

  if (variant === 'sidebar') {
    return (
      <article className="group flex-1 flex flex-col">
        <Link href={`/blog/${post.slug}`} className="flex gap-4 flex-1">
          {featuredImage?.url && (
            <div className="relative aspect-square h-full flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
              <Image
                src={featuredImage.url}
                alt={featuredImage.alt || post.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              {author?.avatar?.url && (
                <Image
                  src={author.avatar.url}
                  alt={author.name}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              )}
              <div>
                <span className="text-sm font-medium text-gray-900">{author?.name}</span>
                {post.readingTime && (
                  <p className="text-sm text-gray-500">{post.readingTime} min read</p>
                )}
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors line-clamp-2 leading-snug">
              {post.title}
            </h3>

            {post.subtitle && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.subtitle}</p>
            )}

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {categories.slice(0, 2).map((category) => (
                  <span
                    key={category.id}
                    className="px-3 py-1 text-sm font-medium rounded-full border"
                    style={{
                      backgroundColor: category.color ? category.color : '#000',
                      color: '#fff',
                      borderColor: category.color || '#000',
                    }}
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Link>
      </article>
    )
  }

  if (variant === 'list') {
    return (
      <article className="group flex gap-6 py-6">
        {featuredImage?.url && (
          <Link href={`/blog/${post.slug}`} className="flex-shrink-0">
            <div className="relative w-64 h-40 overflow-hidden rounded-xl bg-gray-100">
              <Image
                src={featuredImage.url}
                alt={featuredImage.alt || post.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </Link>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            {author?.avatar?.url && (
              <Image
                src={author.avatar.url}
                alt={author.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <div className="text-sm">
              <span className="font-medium text-gray-900">{author?.name}</span>
              {post.readingTime && (
                <span className="text-gray-500 ml-2">{post.readingTime} min read</span>
              )}
            </div>
          </div>

          <Link href={`/blog/${post.slug}`}>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors">
              {post.title}
            </h3>
          </Link>

          {post.subtitle && (
            <p className="text-gray-600 mb-3 line-clamp-2">{post.subtitle}</p>
          )}

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category.id}
                  className="px-3 py-1 text-sm font-medium rounded-full border"
                  style={{
                    backgroundColor: category.color ? category.color : '#000',
                    color: '#fff',
                    borderColor: category.color || '#000',
                  }}
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    )
  }

  // Default variant
  return (
    <article className="group">
      <Link href={`/blog/${post.slug}`} className="block">
        {featuredImage?.url && (
          <div className="relative aspect-[3/2] mb-4 overflow-hidden rounded-xl bg-gray-100">
            <Image
              src={featuredImage.url}
              alt={featuredImage.alt || post.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <div className="flex items-center gap-2 mb-2">
          {author?.avatar?.url && (
            <Image
              src={author.avatar.url}
              alt={author.name}
              width={28}
              height={28}
              className="rounded-full"
            />
          )}
          <span className="text-sm font-medium text-gray-900">{author?.name}</span>
          {post.readingTime && (
            <span className="text-sm text-gray-500">{post.readingTime} min read</span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors">
          {post.title}
        </h3>

        {post.subtitle && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.subtitle}</p>
        )}

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category.id}
                className="px-3 py-1 text-sm font-medium rounded-full border"
                style={{
                  backgroundColor: category.color ? category.color : '#000',
                  color: '#fff',
                  borderColor: category.color || '#000',
                }}
              >
                {category.name}
              </span>
            ))}
          </div>
        )}
      </Link>
    </article>
  )
}
