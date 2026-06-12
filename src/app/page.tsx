import SpottedForm from '@/components/SpottedForm'
import SpottedList from '@/components/SpottedList'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Spotted Anônimo
          </h1>
          <p className="text-gray-600">
            Envie sua mensagem de forma anônima
          </p>
        </header>

        {/* Main Content */}
        <main className="flex flex-col items-center gap-12">
          {/* Formulário */}
          <section className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Enviar Spotted
            </h2>
            <SpottedForm />
          </section>

          {/* Lista */}
          <section className="w-full max-w-lg">
            <SpottedList />
          </section>
        </main>

        {/* Footer */}
        <footer className="text-center mt-16 py-8 text-gray-500 text-sm">
          <p>Seu spotted é anônimo e será revisado antes de ser publicado.</p>
        </footer>
      </div>
    </div>
  )
}
