export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-6xl font-bold tracking-tight text-black dark:text-zinc-50">
          404
        </h1>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          This page does not exist.
        </p>
      </main>
    </div>
  )
}