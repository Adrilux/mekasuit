// Page affichée par le service worker quand l'utilisateur est hors ligne
// Doit être 100% statique — aucune dépendance serveur

export default function OfflinePage() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Pas de connexion</h1>
      <p className="text-slate-500">
        Vérifiez votre réseau. Les changements de statut et notes saisis hors ligne
        seront automatiquement synchronisés dès le retour de la connexion.
      </p>
    </div>
  )
}
