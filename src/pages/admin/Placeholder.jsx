import AdminLayout from '../../components/admin/AdminLayout'

export default function Placeholder({ titulo }) {
  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-primary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-slate-900 dark:text-white font-semibold text-lg mb-1">{titulo}</h2>
        <p className="text-gray-500 text-sm">Esta sección está en construcción</p>
      </div>
    </AdminLayout>
  )
}
