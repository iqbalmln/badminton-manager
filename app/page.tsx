import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">Badminton Manager</h1>
      <p className="text-gray-500">Kelola sesi badminton komunitas secara otomatis dan adil.</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/dashboard"
          className="rounded-lg bg-blue-600 px-6 py-3 text-center text-lg font-semibold text-white shadow hover:bg-blue-700 active:scale-95 transition"
        >
          Dashboard
        </Link>
        <Link
          href="/players"
          className="rounded-lg border border-gray-300 px-6 py-3 text-center text-lg font-semibold text-gray-700 hover:bg-gray-100 active:scale-95 transition"
        >
          Pemain
        </Link>
        <Link
          href="/ranking"
          className="rounded-lg border border-gray-300 px-6 py-3 text-center text-lg font-semibold text-gray-700 hover:bg-gray-100 active:scale-95 transition"
        >
          Ranking Bulanan
        </Link>
      </div>
    </main>
  )
}
