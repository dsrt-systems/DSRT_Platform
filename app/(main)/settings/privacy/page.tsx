import { ShieldCheck, Eye, EyeOff, Lock, Users } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Privacy Manifesto</h1>
        <p className="text-sm text-muted-foreground mt-1">
          How DSRT handles your data across integrations
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-2xl p-6">
        <ShieldCheck className="w-8 h-8 text-blue-500 mb-3" />
        <h2 className="text-lg font-bold">Our Frontier Policy</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          DSRT operates on a principle of <strong className="text-foreground">behavioral analysis, not content mining</strong>.
          We look at how you build, when you ship, and what patterns emerge — never at the substance of your work itself.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Eye className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold">What we DO access</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Metadata: commit counts, post frequencies, engagement metrics</li>
            <li>• Patterns: when you work, how often you ship, streak data</li>
            <li>• Public info: profile bios, work history, skills endorsements</li>
            <li>• Aggregated stats: total stars, followers, published content</li>
          </ul>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <EyeOff className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold">What we NEVER access</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Your actual code (GitHub file contents)</li>
            <li>• Private messages (DMs on any platform)</li>
            <li>• Draft content that hasn't been published</li>
            <li>• Full connection lists or contact books</li>
            <li>• Financial or sensitive personal information</li>
          </ul>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Lock className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold">Your Data Controls</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Disconnect any integration at any time</li>
            <li>• Export all your data in machine-readable format</li>
            <li>• Delete your account and all associated data permanently</li>
            <li>• Choose which repositories, accounts, or feeds to sync</li>
            <li>• View access logs of every data pull</li>
          </ul>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold">Universal Access</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            DSRT is not just for developers. Integrations serve every domain:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• <strong className="text-foreground">Developers</strong>: GitHub for code contributions</li>
            <li>• <strong className="text-foreground">Designers</strong>: Behance, Dribbble for portfolios</li>
            <li>• <strong className="text-foreground">Creators</strong>: YouTube, Instagram for content</li>
            <li>• <strong className="text-foreground">Musicians</strong>: Spotify for releases</li>
            <li>• <strong className="text-foreground">Founders</strong>: ProductHunt for launches</li>
            <li>• <strong className="text-foreground">All Professionals</strong>: LinkedIn for career</li>
          </ul>
        </div>
      </div>

      <div className="text-xs text-muted-foreground/70 pt-6 border-t">
        <p>
          Last updated: {new Date().toLocaleDateString()}. Questions? Contact privacy@dsrt.app
        </p>
      </div>
    </div>
  )
}