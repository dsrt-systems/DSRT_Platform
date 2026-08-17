export const dynamic = 'force-dynamic'
export default function DevelopersPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <div className="text-center py-16 space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Built for Developers
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
          DSRT is being built with a developer-first mindset.
          API access, integrations, and documentation coming soon.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
          <div className="p-6 border rounded-2xl bg-card">
            <h3 className="font-bold mb-2">REST API</h3>
            <p className="text-xs text-muted-foreground">
              Full REST API to interact with your DSRT data.
            </p>
            <p className="text-[10px] text-blue-500 mt-3 font-bold uppercase tracking-wider">
              Coming Q1 2027
            </p>
          </div>
          <div className="p-6 border rounded-2xl bg-card">
            <h3 className="font-bold mb-2">Webhooks</h3>
            <p className="text-xs text-muted-foreground">
              Get real-time events pushed to your endpoint.
            </p>
            <p className="text-[10px] text-blue-500 mt-3 font-bold uppercase tracking-wider">
              Coming Q1 2027
            </p>
          </div>
          <div className="p-6 border rounded-2xl bg-card">
            <h3 className="font-bold mb-2">SDKs</h3>
            <p className="text-xs text-muted-foreground">
              TypeScript, Python, and Go SDKs for easy integration.
            </p>
            <p className="text-[10px] text-blue-500 mt-3 font-bold uppercase tracking-wider">
              Coming Q2 2027
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}