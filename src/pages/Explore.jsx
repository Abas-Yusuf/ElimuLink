import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { programmes } from '../data/programmes'
import { supabase } from '../lib/supabase'

const resourceCategories = [
  'Lecture Notes',
  'Past Papers',
  'Study Guides',
]

function Explore() {
  const [searchParams, setSearchParams] = useSearchParams()

  const programme = searchParams.get('programme') === 'BIT' ? 'BIT' : 'BSD'

  const [selectedSemester, setSelectedSemester] = useState(null)
  const [expandedUnit, setExpandedUnit] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [resources, setResources] = useState([])
  const [loadingResources, setLoadingResources] = useState(false)
  const [resourceError, setResourceError] = useState('')

  const programmeDetails = {
    BSD: {
      name: 'Bachelor of Science in Software Development',
      abbreviation: 'BSD',
    },
    BIT: {
      name: 'Bachelor of Information Technology',
      abbreviation: 'BIT',
    },
  }

  const semesters = Object.entries(programmes[programme])

  useEffect(() => {
    async function loadResources() {
      if (!selectedSemester) {
        setResources([])
        return
      }

      setLoadingResources(true)
      setResourceError('')
      setResources([])

      try {
        const semesterCode = selectedSemester.replace('_', '.')

        const { data: programmeData, error: programmeError } =
          await supabase
            .from('programmes')
            .select('id')
            .eq('code', programme)
            .single()

        if (programmeError) throw programmeError

        const { data: semesterData, error: semesterError } =
          await supabase
            .from('semesters')
            .select('id')
            .eq('code', semesterCode)
            .single()

        if (semesterError) throw semesterError

        const { data, error } = await supabase
          .from('resources')
          .select(`
            id,
            title,
            description,
            category,
            file_type,
            file_path,
            unit_id,
            units (code, name)
          `)
          .eq('programme_id', programmeData.id)
          .eq('semester_id', semesterData.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        const formattedResources = (data || []).map(resource => {
          const { data: fileData } = supabase.storage
            .from('academic-resources')
            .getPublicUrl(resource.file_path)

          return {
            ...resource,
            fileUrl: fileData.publicUrl,
            unitCode: resource.units?.code || '',
          }
        })

        setResources(formattedResources)
      } catch (error) {
        setResourceError(error.message || 'Could not load resources.')
      } finally {
        setLoadingResources(false)
      }
    }

    loadResources()
  }, [programme, selectedSemester])

  function changeProgramme(newProgramme) {
    setSearchParams({ programme: newProgramme })
    setSelectedSemester(null)
    setExpandedUnit(null)
    setExpandedCategory(null)
  }

  function selectSemester(semester) {
    setSelectedSemester(semester)
    setExpandedUnit(null)
    setExpandedCategory(null)
  }

  function toggleUnit(unitCode) {
    setExpandedUnit(expandedUnit === unitCode ? null : unitCode)
    setExpandedCategory(null)
  }

  function toggleCategory(unitCode, category) {
    const key = `${unitCode}-${category}`

    setExpandedCategory(expandedCategory === key ? null : key)
  }

  function getCategoryResources(unitCode, category) {
    return resources.filter(resource =>
      resource.unitCode === unitCode &&
      resource.category === category
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFCF9]">

      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-12">

        <section className="mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#9CAC54]">
            Academic resources
          </p>

          <h1 className="text-3xl font-bold text-[#263D25] md:text-4xl">
            Explore Programmes
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-gray-600">
            Browse academic programmes, select your semester and
            find learning materials shared by fellow students.
          </p>
        </section>

        {/* Programme selection */}
        <section className="mb-12">

          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#263D25]">
              Select your programme
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Choose a programme to view its semesters and units.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">

            {Object.entries(programmeDetails).map(([key, details]) => (
              <button
                key={key}
                type="button"
                onClick={() => changeProgramme(key)}
                className={`border border-t-4 bg-white p-6 text-left transition ${
                  programme === key
                    ? 'border-[#9CAC54] border-t-[#345C32]'
                    : 'border-[#DCE5D8] border-t-[#DCE5D8] hover:border-[#9CAC54]'
                }`}
              >
                <div className="flex items-center justify-between">

                  <p className="text-xs font-semibold uppercase tracking-wider text-[#78916A]">
                    School of Technology
                  </p>

                  {programme === key && (
                    <span className="text-sm font-semibold text-[#345C32]">
                      Selected
                    </span>
                  )}

                </div>

                <h3 className="mt-4 text-2xl font-bold text-[#345C32]">
                  {details.abbreviation}
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  {details.name}
                </p>

                <p className="mt-5 text-sm font-semibold text-[#345C32]">
                  View semesters →
                </p>

              </button>
            ))}

          </div>
        </section>

        {/* Semester selection */}
        <section className="mb-12">

          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9CAC54]">
              {programme} programme
            </p>

            <h2 className="text-xl font-bold text-[#263D25]">
              Select a semester
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Choose a semester to see the units offered.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

            {semesters.map(([semester, units]) => {
              const semesterLabel = semester.replace('_', '.')

              return (
                <button
                  key={semester}
                  type="button"
                  onClick={() => selectSemester(semester)}
                  className={`border p-5 text-left transition ${
                    selectedSemester === semester
                      ? 'border-[#345C32] bg-[#EAF3E7]'
                      : 'border-[#DCE5D8] bg-white hover:border-[#9CAC54]'
                  }`}
                >
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[#78916A]">
                    Semester
                  </span>

                  <span className="mt-2 block text-2xl font-bold text-[#345C32]">
                    {semesterLabel}
                  </span>

                  <span className="mt-2 block text-xs text-gray-500">
                    {units.length} {units.length === 1 ? 'unit' : 'units'}
                  </span>
                </button>
              )
            })}

          </div>
        </section>

        {/* Units */}
        {selectedSemester && (
          <section>

            <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[#DCE5D8] pb-5">

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9CAC54]">
                  {programme} / Semester {selectedSemester.replace('_', '.')}
                </p>

                <h2 className="text-xl font-bold text-[#263D25]">
                  Study Units
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Select a unit to explore its available resources.
                </p>
              </div>

              <span className="text-sm text-gray-500">
                {programmes[programme][selectedSemester].length} units
              </span>

            </div>

            {loadingResources && (
              <p className="py-6 text-sm text-gray-600">
                Loading available resources...
              </p>
            )}

            {resourceError && (
              <p className="mb-5 bg-red-50 p-4 text-sm text-red-700">
                Could not load resources: {resourceError}
              </p>
            )}

            <div className="divide-y divide-[#DCE5D8] border-y border-[#DCE5D8] bg-white">

              {programmes[programme][selectedSemester].map(unit => (

                <div key={unit.code}>

                  <button
                    type="button"
                    onClick={() => toggleUnit(unit.code)}
                    aria-expanded={expandedUnit === unit.code}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-[#F6F9F4]"
                  >

                    <div className="min-w-0">

                      <p className="mb-1 text-xs font-semibold tracking-wider text-[#78916A]">
                        {unit.code}
                      </p>

                      <h3 className="font-semibold leading-6 text-[#263D25]">
                        {unit.name}
                      </h3>

                    </div>

                    <span className="shrink-0 text-xl text-[#9CAC54]">
                      {expandedUnit === unit.code ? '−' : '+'}
                    </span>

                  </button>

                  {expandedUnit === unit.code && (
                    <div className="border-t border-[#E5EBE1] bg-[#FAFCF9] px-5 py-5">

                      <div className="mb-4">
                        <h4 className="font-semibold text-[#345C32]">
                          Learning Resources
                        </h4>

                        <p className="mt-1 text-sm text-gray-500">
                          Browse materials shared for this unit.
                        </p>
                      </div>

                      <div className="divide-y divide-[#E5EBE1] border-y border-[#E5EBE1]">

                        {resourceCategories.map(category => {
                          const categoryResources = getCategoryResources(
                            unit.code,
                            category
                          )

                          const categoryKey = `${unit.code}-${category}`

                          return (
                            <div key={category}>

                              <button
                                type="button"
                                onClick={() => toggleCategory(unit.code, category)}
                                className="flex w-full flex-wrap items-center justify-between gap-3 py-4 text-left"
                              >

                                <span className="text-sm font-medium text-gray-700">
                                  {category}
                                </span>

                                {categoryResources.length > 0 ? (
                                  <span className="bg-[#EAF3E7] px-3 py-1 text-xs font-semibold text-[#345C32]">
                                    {categoryResources.length} Available
                                  </span>
                                ) : (
                                  <span className="border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500">
                                    Not Available
                                  </span>
                                )}

                              </button>

                              {expandedCategory === categoryKey && (
                                <div className="pb-4">

                                  {categoryResources.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                      No resources have been uploaded in this category yet.
                                    </p>
                                  ) : (

                                    <div className="space-y-3">

                                      {categoryResources.map(resource => (
                                        <div
                                          key={resource.id}
                                          className="border border-[#DCE5D8] bg-white p-4"
                                        >

                                          <div className="flex flex-wrap items-start justify-between gap-3">

                                            <div>
                                              <h5 className="font-semibold text-[#263D25]">
                                                {resource.title}
                                              </h5>

                                              <p className="mt-1 text-xs uppercase text-gray-500">
                                                {resource.file_type}
                                              </p>

                                              {resource.description && (
                                                <p className="mt-2 text-sm text-gray-600">
                                                  {resource.description}
                                                </p>
                                              )}
                                            </div>

                                          </div>

                                          <div className="mt-4 flex flex-wrap gap-4 text-sm">

                                            <a
                                              href={resource.fileUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="font-medium text-[#345C32] hover:underline"
                                            >
                                              View
                                            </a>

                                            <a
                                              href={`${resource.fileUrl}?download`}
                                              className="font-medium text-[#345C32] hover:underline"
                                            >
                                              Download
                                            </a>

                                            <Link
                                              to={`/report?id=${encodeURIComponent(resource.id)}&title=${encodeURIComponent(resource.title)}`}
                                              className="font-medium text-red-600 hover:underline"
                                            >
                                              Report
                                            </Link>

                                          </div>

                                        </div>
                                      ))}

                                    </div>

                                  )}

                                </div>
                              )}

                            </div>
                          )
                        })}

                      </div>

                    </div>
                  )}

                </div>

              ))}

            </div>

          </section>
        )}

        {!selectedSemester && (
          <section className="border border-dashed border-[#C9D8C3] bg-white px-6 py-12 text-center">

            <h2 className="font-semibold text-[#345C32]">
              Choose a semester to get started
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              The units belonging to your selected semester will appear here.
            </p>

          </section>
        )}

      </main>

      <footer className="mt-16 border-t border-[#DCE5D8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="text-lg font-bold text-[#345C32]">
              ElimuLink
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Connecting students through shared knowledge.
            </p>
          </div>

          <p className="text-sm text-gray-500">
            KCA University · ElimuLink
          </p>

        </div>
      </footer>

    </div>
  )
}

export default Explore