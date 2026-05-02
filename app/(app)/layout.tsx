import { Header } from '@/components/layout/Header'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Created by{' '}
          <a
            href="https://iqbalmln.space"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline underline-offset-4"
          >
            Iqbal Maulana
          </a>
        </p>
      </footer>
    </div>
  )
}
