import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="w-full max-w-md px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">GMAO SaaS</h1>
        <p className="text-slate-500 mt-1">Connectez-vous à votre espace</p>
      </div>
      <LoginForm />
    </div>
  )
}
