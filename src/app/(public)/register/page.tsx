import { RegisterTenantForm } from "@/components/auth/register-tenant-form"

export default function RegisterPage() {
  return (
    <div className="w-full max-w-lg px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Créer votre compte</h1>
        <p className="text-slate-500 mt-1">Démarrez votre essai gratuit</p>
      </div>
      <RegisterTenantForm />
    </div>
  )
}
