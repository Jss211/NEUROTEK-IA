export default function TiendaPlaceholder({ titulo }) {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-900 dark:text-white flex flex-col items-center justify-center">
      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-primary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-2">{titulo}</h1>
      <p className="text-gray-400">Esta sección es para clientes y está en construcción.</p>
    </div>
  )
}
