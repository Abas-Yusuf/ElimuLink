import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function StudentDashboard() {
  const [student, setStudent] = useState(null)
  const [resources, setResources] = useState([])
  const [requests, setRequests] = useState([])
  const [units, setUnits] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)
      setError('')

      const { data: { user }, error: authError } =
        await supabase.auth.getUser()

      if (authError || !user) {
        setError('Unable to load your account. Please log in again.')
        setLoading(false)
        return
      }

      const [
        profileResult,
        resourcesResult,
        requestsResult,
        unitsResult
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single(),

        supabase
          .from('resources')
          .select('*')
          .eq('uploader_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('resource_requests')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('units')
          .select('*')
      ])

      const firstError =
        profileResult.error ||
        resourcesResult.error ||
        requestsResult.error ||
        unitsResult.error

      if (firstError) {
        setError(firstError.message)
        setLoading(false)
        return
      }

      setStudent(profileResult.data)
      setResources(resourcesResult.data || [])
      setRequests(requestsResult.data || [])

      const unitMap = {}
      unitsResult.data.forEach(unit => {
        unitMap[unit.id] = unit
      })

      setUnits(unitMap)
      setLoading(false)
    }

    loadDashboard()
  }, [])

  function getFileUrl(filePath) {
    return supabase.storage
      .from('academic-resources')
      .getPublicUrl(filePath).data.publicUrl
  }

  return (
    <div className="min-h-screen bg-[#FAFCF9]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-12">

        <section className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#9CAC54]">
            Student area
          </p>

          <h1 className="text-3xl font-bold text-[#263D25]">
            My Dashboard
          </h1>

          <p className="mt-3 text-gray-600">
            Manage your uploads and resource requests.
          </p>
        </section>

        <section className="mb-10 border border-[#DCE5D8] bg-white p-6">
          <p className="text-sm text-gray-500">Welcome back</p>

          <h2 className="mt-1 text-xl font-bold text-[#345C32]">
            {student?.full_name || 'Student'}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {student?.email} · KCA University
          </p>
        </section>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-12 flex flex-wrap gap-3">
          <Link
            to="/upload"
            className="bg-[#345C32] px-5 py-3 text-sm font-semibold text-white hover:bg-[#294928]"
          >
            Upload Resource
          </Link>

          <Link
            to="/requests"
            className="border border-[#345C32] px-5 py-3 text-sm font-semibold text-[#345C32] hover:bg-[#F1F5EF]"
          >
            Make a Request
          </Link>
        </section>

        {/* My uploads */}
        <section className="mb-12">
          <div className="mb-5 flex items-center justify-between border-b border-[#DCE5D8] pb-3">
            <h2 className="text-lg font-bold text-[#263D25]">
              My Uploaded Resources ({resources.length})
            </h2>

            <Link
              to="/upload"
              className="text-sm font-semibold text-[#345C32] hover:underline"
            >
              Upload new
            </Link>
          </div>

          {loading ? (
            <p className="py-8 text-center text-gray-500">
              Loading your uploads...
            </p>
          ) : resources.length === 0 ? (
            <div className="border border-dashed border-[#C9D8C3] bg-white p-8 text-center">
              <p className="font-semibold text-[#345C32]">
                No uploads yet
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Resources you upload will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {resources.map(resource => {
                const unit = units[resource.unit_id]
                const fileUrl = getFileUrl(resource.file_path)

                return (
                  <div
                    key={resource.id}
                    className="border border-[#DCE5D8] bg-white p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {resource.title}
                        </h3>

                        <p className="mt-1 text-sm text-gray-600">
                          Unit: {unit?.unit_code || unit?.name || 'Unknown unit'}
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          Category: {resource.category}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {resource.created_at
                            ? new Date(resource.created_at).toLocaleDateString()
                            : ''}
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="border border-[#345C32] px-4 py-2 text-sm text-[#345C32] hover:bg-[#F1F5EF]"
                        >
                          View
                        </a>

                        <a
                          href={fileUrl}
                          download
                          className="bg-[#345C32] px-4 py-2 text-sm text-white hover:bg-[#294928]"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* My requests */}
        <section className="mb-12">
          <div className="mb-5 flex items-center justify-between border-b border-[#DCE5D8] pb-3">
            <h2 className="text-lg font-bold text-[#263D25]">
              My Resource Requests ({requests.length})
            </h2>

            <Link
              to="/requests"
              className="text-sm font-semibold text-[#345C32] hover:underline"
            >
              View requests
            </Link>
          </div>

          {loading ? (
            <p className="py-8 text-center text-gray-500">
              Loading your requests...
            </p>
          ) : requests.length === 0 ? (
            <div className="border border-dashed border-[#C9D8C3] bg-white p-8 text-center">
              <p className="font-semibold text-[#345C32]">
                No requests submitted
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Resource requests you submit will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(request => {
                const unit = units[request.unit_id]

                return (
                  <div
                    key={request.id}
                    className="border border-[#DCE5D8] bg-white p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {request.unit_code || unit?.unit_code || unit?.name || 'Unknown unit'}
                        </h3>

                        <p className="mt-1 text-sm text-gray-600">
                          Resource type: {request.resource_type}
                        </p>

                        {request.description && (
                          <p className="mt-2 text-sm text-gray-600">
                            {request.description}
                          </p>
                        )}

                        <p className="mt-2 text-xs text-gray-400">
                          {request.created_at
                            ? new Date(request.created_at).toLocaleDateString()
                            : ''}
                        </p>
                      </div>

                      <span className={`self-start px-3 py-1 text-sm font-medium ${
                        request.status === 'Fulfilled'
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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

          <p className="text-sm text-gray-500">
            KCA University · ElimuLink
          </p>
        </div>
      </footer>
    </div>
  )
}

export default StudentDashboard