import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

function AdminDashboard() {
  const [admin, setAdmin] = useState(null)
  const [resourceCount, setResourceCount] = useState(0)
  const [pendingReports, setPendingReports] = useState(0)
  const [requests, setRequests] = useState([])
  const [profiles, setProfiles] = useState({})
  const [units, setUnits] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)
      setError('')

      const { data: { user } } = await supabase.auth.getUser()
      setAdmin(user)

      const [
        resourcesResult,
        reportsResult,
        requestsResult,
        profilesResult,
        unitsResult
      ] = await Promise.all([
        supabase.from('resources').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('resource_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, email'),
        supabase.from('units').select('*')
      ])

      const firstError =
        resourcesResult.error ||
        reportsResult.error ||
        requestsResult.error ||
        profilesResult.error ||
        unitsResult.error

      if (firstError) {
        setError(firstError.message)
        setLoading(false)
        return
      }

      setResourceCount(resourcesResult.count || 0)
      setPendingReports(reportsResult.count || 0)
      setRequests(requestsResult.data || [])

      const profileMap = {}
      profilesResult.data.forEach(profile => {
        profileMap[profile.id] = profile
      })
      setProfiles(profileMap)

      const unitMap = {}
      unitsResult.data.forEach(unit => {
        unitMap[unit.id] = unit
      })
      setUnits(unitMap)

      setLoading(false)
    }

    loadDashboard()
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFCF9]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <section className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#9CAC54]">
            Administration
          </p>

          <h1 className="text-3xl font-bold text-[#263D25]">
            Admin Dashboard
          </h1>

          <p className="mt-3 text-gray-600">
            Manage uploaded resources and review student requests and reports.
          </p>
        </section>

        <section className="mb-10 border border-[#DCE5D8] bg-white p-6">
          <p className="text-sm text-gray-500">Administrator account</p>

          <h2 className="mt-1 text-xl font-bold text-[#345C32]">
            {admin?.user_metadata?.full_name || admin?.email || 'Administrator'}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            KCA University · Administrator
          </p>
        </section>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-12 grid gap-4 sm:grid-cols-3">
          <div className="border border-[#DCE5D8] bg-white p-6">
            <p className="text-sm text-gray-500">Uploaded Resources</p>
            <p className="mt-3 text-3xl font-bold text-[#345C32]">
              {loading ? '...' : resourceCount}
            </p>
          </div>

          <div className="border border-[#DCE5D8] bg-white p-6">
            <p className="text-sm text-gray-500">Pending Reports</p>
            <p className="mt-3 text-3xl font-bold text-[#345C32]">
              {loading ? '...' : pendingReports}
            </p>
          </div>

          <div className="border border-[#DCE5D8] bg-white p-6">
            <p className="text-sm text-gray-500">Student Requests</p>
            <p className="mt-3 text-3xl font-bold text-[#345C32]">
              {loading ? '...' : requests.length}
            </p>
          </div>
        </section>

        <section className="mb-12">
          <div className="mb-5 flex items-center justify-between border-b border-[#DCE5D8] pb-3">
            <div>
              <h2 className="text-lg font-bold text-[#263D25]">
                Student Resource Requests
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Requests submitted by all students.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-gray-500">Loading requests...</p>
          ) : requests.length === 0 ? (
            <div className="border border-[#DCE5D8] bg-white px-6 py-12 text-center">
              <h3 className="font-medium text-gray-800">No requests yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Student resource requests will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(request => {
                const student = profiles[request.student_id]
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
                            Details: {request.description}
                          </p>
                        )}

                        <p className="mt-2 text-sm text-gray-500">
                          Requested by: {student?.full_name || student?.email || 'Unknown student'}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {request.created_at
                            ? new Date(request.created_at).toLocaleString()
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

        <section>
          <h2 className="mb-5 border-b border-[#DCE5D8] pb-3 text-lg font-bold text-[#263D25]">
            Administration
          </h2>

          <div className="border border-[#DCE5D8] bg-white p-6">
            <h3 className="font-bold text-[#345C32]">
              Resource Moderation
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Review uploaded resources and student reports.
            </p>

            <Link
              to="/admin/moderation"
              className="mt-5 inline-block bg-[#345C32] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#294928]"
            >
              Manage Resources and Reports
            </Link>
          </div>
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

export default AdminDashboard