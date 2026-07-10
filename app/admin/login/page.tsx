import { AdminLoginForm } from '@/components/admin/AdminLoginForm'
import { Shield } from 'lucide-react'

export const metadata = {
  title: 'DSRT Admin Login',
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(80,50,200,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(200,50,100,0.1)_0%,transparent_60%)]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto shadow-2xl shadow-purple-600/30">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">DSRT Admin</h1>
            <p className="text-sm text-white/50 mt-1">
              Restricted access · Hackathon administration
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-4">
          <AdminLoginForm />
        </div>

        <div className="text-center">
          <p className="text-xs text-white/40">
            Unauthorized access is prohibited and logged.
          </p>
        </div>
      </div>
    </div>
  )
}