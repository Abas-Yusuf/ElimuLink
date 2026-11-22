import Navbar from '../components/Navbar'

function About() {
  return (
    <div className="min-h-screen bg-[#FAFCF9]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <section className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#9CAC54]">
            About ElimuLink
          </p>

          <h1 className="text-3xl font-bold leading-tight text-[#263D25] md:text-4xl">
            Making academic resources easier to find and share.
          </h1>

          <p className="mt-6 text-base leading-8 text-gray-600">
            ElimuLink is a student-focused academic resource platform
            developed for KCA University. It provides a central place
            where students can discover, access and share learning
            materials related to their academic programmes.
          </p>

          <p className="mt-4 text-base leading-8 text-gray-600">
            Instead of relying on scattered files and informal sharing
            channels, students can browse resources according to their
            programme, semester, study unit and resource category.
          </p>
        </section>

        <section className="mt-16 border-y border-[#DCE5D8] bg-white">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b border-[#DCE5D8] p-7 md:border-b-0 md:border-r">
              <h2 className="text-xl font-bold text-[#345C32]">
                Discover resources
              </h2>

              <p className="mt-3 text-sm leading-7 text-gray-600">
                Browse lecture notes, past papers and study guides
                organised by academic programme, semester and unit.
              </p>
            </div>

            <div className="border-b border-[#DCE5D8] p-7 md:border-b-0">
              <h2 className="text-xl font-bold text-[#345C32]">
                Share knowledge
              </h2>

              <p className="mt-3 text-sm leading-7 text-gray-600">
                Upload useful academic materials to make them accessible
                to other students.
              </p>
            </div>

            <div className="border-b border-[#DCE5D8] p-7 md:border-b-0 md:border-r">
              <h2 className="text-xl font-bold text-[#345C32]">
                Request materials
              </h2>

              <p className="mt-3 text-sm leading-7 text-gray-600">
                Request specific resources when you cannot find the
                material you need.
              </p>
            </div>

            <div className="p-7">
              <h2 className="text-xl font-bold text-[#345C32]">
                Support students
              </h2>

              <p className="mt-3 text-sm leading-7 text-gray-600">
                Encourage collaboration and make it easier for students
                to support one another academically.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold text-[#263D25]">
            Our purpose
          </h2>

          <p className="mt-4 leading-8 text-gray-600">
            ElimuLink aims to improve access to academic learning
            materials by bringing resource discovery and student
            collaboration into one organised platform.
          </p>

          <a
            href="/explore"
            className="mt-7 inline-block bg-[#345C32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#294928]"
          >
            Explore Programmes
          </a>
        </section>
      </main>

      <footer className="mt-16 border-t border-[#DCE5D8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-bold text-[#345C32]">ElimuLink</h2>
            <p className="mt-1 text-sm text-gray-500">
              Connecting students through shared knowledge.
            </p>
          </div>
          <p className="text-sm text-gray-500">KCA University · ElimuLink</p>
        </div>
      </footer>
    </div>
  )
}

export default About