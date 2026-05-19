import Link from 'next/link'
import Image from 'next/image'

interface BlogHeaderProps {
  userAvatar?: string | null
}

export function BlogHeader({ userAvatar }: BlogHeaderProps) {
  return (
    <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/blog" className="flex items-center gap-2">
              <span className="text-xl font-semibold text-black">the vibe coder report</span>
              <span className="text-xs font-semibold text-black relative -top-3">by Capsule</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 ml-6">
              <Link href="/blog" className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors">
                Home
              </Link>
              <Link href="/blog?category=stories" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Stories
              </Link>
              <Link href="/blog?category=interviews" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Interviews
              </Link>
              <Link href="/blog?category=most-viewed" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Most Viewed
              </Link>
              <Link href="/blog/archive" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Archive
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {userAvatar ? (
              <Image
                src={userAvatar}
                alt="User avatar"
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500" />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
