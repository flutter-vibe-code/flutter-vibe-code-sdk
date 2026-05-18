import Image from 'next/image'

interface AuthorCardProps {
  author: {
    id: string
    name: string
    role?: string | null
    avatar?: {
      url: string
      alt?: string
    } | null
  }
}

export function AuthorCard({ author }: AuthorCardProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {author.avatar?.url ? (
          <Image
            src={author.avatar.url}
            alt={author.name}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 font-medium">
              {author.name.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <p className="font-medium text-sm text-gray-900">{author.name}</p>
          {author.role && (
            <p className="text-sm text-gray-500">{author.role}</p>
          )}
        </div>
      </div>
      <button className="px-4 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors">
        Follow
      </button>
    </div>
  )
}
