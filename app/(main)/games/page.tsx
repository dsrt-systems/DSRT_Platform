import Link from 'next/link'

export default function GamesPage() {
  const games = [
    {
      id: 'pingpong',
      name: 'Emoji PingPong',
      emoji: '🏓',
      description: 'Classic ping pong with emoji paddles. Take a quick break.',
      gradient: 'from-purple-500/20 to-pink-500/20',
      href: '/games/pingpong',
    },
    {
      id: 'blockcube',
      name: 'Block Cube',
      emoji: '🎲',
      description: 'Stack the blocks, beat the clock.',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      href: '/games/blockcube',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6">
        <h1 className="text-2xl font-bold">Mini Games</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Take a quick break between builds. More games coming.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {games.map((game) => (
          <Link
            key={game.id}
            href={game.href}
            className={`rounded-2xl border border-border/40 bg-gradient-to-br ${game.gradient} backdrop-blur-sm p-6 hover:border-border transition-all group`}
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
              {game.emoji}
            </div>
            <h3 className="font-bold text-lg">{game.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {game.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}