export default function SecurityPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-white">
      <h1 className="text-3xl font-bold mb-8">Security at DSRT</h1>
      <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-white/70">
        <p className="mb-6 text-lg text-white/90">Enterprise-grade protection for builders and ventures.</p>
        
        <h2 className="text-xl font-semibold text-white mt-8 mb-4">Data Encryption</h2>
        <p className="mb-4">All data is encrypted at rest and in transit. We utilize AES-256 encryption for database storage and TLS 1.3 for all network communication.</p>
        
        <h2 className="text-xl font-semibold text-white mt-8 mb-4">Authentication</h2>
        <p className="mb-4">We employ secure OAuth 2.0 flows, salted password hashing (Argon2), and secure HttpOnly cookie session management to ensure account integrity.</p>

        <h2 className="text-xl font-semibold text-white mt-8 mb-4">Infrastructure</h2>
        <p className="mb-4">DSRT operates on world-class cloud infrastructure with continuous monitoring, automated backups, and strict access controls.</p>
      </div>
    </div>
  )
}