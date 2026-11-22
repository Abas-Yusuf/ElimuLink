import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

const categories = [
  { label: 'All Resources', value: 'all' },
  { label: 'Lecture Notes', value: 'Lecture Notes' },
  { label: 'Past Papers', value: 'Past Papers' },
  { label: 'Study Guides', value: 'Study Guides' },
]

function ResourceIcon({ type }) {
  if (type === 'view') return '👁️'
  if (type === 'download') return '↓'
  return '⚑'
}

export default function Resources() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const search = searchParams.get('q') || ''
  const category = searchParams.get('category') || 'all'

  useEffect(() => {
    async function loadResources() {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('resources')
        .select(`
          id,
          title,
          description,
          category,
          file_type,
          file_path,
          created_at,
          units (code, name),
          programmes (code),
          semesters (code)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
        setResources([])
      } else {
        const formatted = (data || []).map(resource => {
          const { data: fileData } = supabase.storage
            .from('academic-resources')
            .getPublicUrl(resource.file_path)

          return {
            id: resource.id,
            title: resource.title,
            description: resource.description,
            category: resource.category,
            fileType: resource.file_type,
            fileUrl: fileData.publicUrl,
            unit: resource.units?.code || 'Unknown unit',
            unitName: resource.units?.name || '',
            programme: resource.programmes?.code || '',
            semester: resource.semesters?.code || '',
          }
        })

        setResources(formatted)
      }

      setLoading(false)
    }

    loadResources()
  }, [])

  function updateSearch(value) {
    const params = new URLSearchParams(searchParams)

    if (value) params.set('q', value)
    else params.delete('q')

    setSearchParams(params)
  }

  function updateCategory(value) {
    const params = new URLSearchParams(searchParams)

    if (value === 'all') params.delete('category')
    else params.set('category', value)

    setSearchParams(params)
  }

  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      const matchesCategory =
        category === 'all' || resource.category === category

      const searchText = search.toLowerCase()

      const matchesSearch =
        resource.title.toLowerCase().includes(searchText) ||
        resource.unit.toLowerCase().includes(searchText) ||
        resource.unitName.toLowerCase().includes(searchText) ||
        resource.programme.toLowerCase().includes(searchText)

      return matchesCategory && matchesSearch
    })
  }, [resources, category, search])

  return (
    <div className="min-h-screen bg-[#F7F8F4]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-[#66804D]">
            ELIMULINK / LIBRARY
          </p>

          <h1 className="text-3xl font-bold text-[#263B27]">
            Academic Resources
          </h1>

          <p className="mt-2 text-gray-600">
            Find notes, past papers and study materials shared by students.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <input
            type="text"
            value={search}
            onChange={event => updateSearch(event.target.value)}
            placeholder="Search by title, unit or programme..."
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#345C32]"
          />

          <Link
            to="/upload"
            className="rounded-md bg-[#345C32] px-6 py-3 text-center font-medium text-white hover:bg-[#294929]"
          >
            Upload Resource
          </Link>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          {categories.map(item => (
            <button
              key={item.value}
              onClick={() => updateCategory(item.value)}
              className={`rounded-md border px-4 py-2 text-sm ${
                category === item.value
                  ? 'border-[#345C32] bg-[#345C32] text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#345C32]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-12 text-center text-gray-600">
            Loading resources...
          </p>
        ) : error ? (
          <p className="rounded-md bg-red-50 p-4 text-red-700">
            Could not load resources: {error}
          </p>
        ) : filteredResources.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-semibold text-[#263B27]">
              No resources available
            </h2>
            <p className="mt-2 text-gray-600">
              No resources match your search or category yet.
            </p>
            <Link
              to="/upload"
              className="mt-5 inline-block font-medium text-[#345C32] underline"
            >
              Upload a resource
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map(resource => (
              <article
                key={resource.id}
                className="rounded-lg border border-gray-200 bg-white p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span className="rounded bg-[#EDF2E8] px-3 py-1 text-xs font-medium text-[#345C32]">
                    {resource.category}
                  </span>

                  <span className="text-xs uppercase text-gray-500">
                    {resource.fileType}
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-[#263B27]">
                  {resource.title}
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  {resource.unit} {resource.unitName && `- ${resource.unitName}`}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {resource.programme} · Semester {resource.semester}
                </p>

                {resource.description && (
                  <p className="mt-3 text-sm text-gray-600">
                    {resource.description}
                  </p>
                )}

                <div className="mt-5 flex items-center gap-4 border-t border-gray-100 pt-4 text-sm">
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[#345C32] hover:underline"
                  >
                    <ResourceIcon type="view" /> View
                  </a>

                  <a
                   href={`${resource.fileUrl}?download`}
                    className="font-medium text-[#345C32] hover:underline"
                  >
                    <ResourceIcon type="download" /> Download
                  </a>

                  <Link
                    to={`/report?id=${encodeURIComponent(resource.id)}&title=${encodeURIComponent(resource.title)}`}
                    className="font-medium text-red-600 hover:underline"
                  >
                    <ResourceIcon type="report" /> Report
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}