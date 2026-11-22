import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

function AdminModeration() {
  const [resources, setResources] = useState([])
  const [reports, setReports] = useState([])
  const [profiles, setProfiles] = useState({})
  const [units, setUnits] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')

    const [
      resourcesResult,
      reportsResult,
      profilesResult,
      unitsResult
    ] = await Promise.all([
      supabase.from('resources').select('*').order('created_at', { ascending: false }),
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, email'),
      supabase.from('units').select('*')
    ])

    const firstError =
      resourcesResult.error ||
      reportsResult.error ||
      profilesResult.error ||
      unitsResult.error

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    setResources(resourcesResult.data || [])
    setReports(reportsResult.data || [])

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

  useEffect(() => {
    loadData()
  }, [])

  async function deleteResource(resource) {
       const confirmed = window.confirm(
      'Are you sure you want to delete "' + resource.title + '"?'
    )

    if (!confirmed) return

    const { error: storageError } = await supabase.storage
      .from('academic-resources')
      .remove([resource.file_path])

    if (storageError) {
         setError('Could not delete the resource file: ' + storageError.message)
      return
    }

    const { error: deleteError } = await supabase
      .from('resources')
      .delete()
      .eq('id', resource.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    await loadData()
  }

  async function resolveReport(reportId) {
    const { data: { user } } = await supabase.auth.getUser()

    const { error: updateError } = await supabase
      .from('reports')
      .update({
        status: 'Resolved',
        resolved_by: user.id,
        resolved_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await loadData()
  }

  return (
    <div className="min-h-screen bg-[#FAFCF9]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <Link
          to="/admin-dashboard"
          className="text-sm text-[#345C32] hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6 mb-10">
          <h1 className="text-3xl font-semibold text-gray-900">
            Resource Moderation
          </h1>
          <p className="mt-2 text-gray-600">
            Manage uploaded academic resources and review student reports.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-12">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              All Uploaded Resources ({resources.length})
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Review and manage resources uploaded by students.
            </p>
          </div>

          {loading ? (
            <p className="py-10 text-center text-gray-500">Loading resources...</p>
          ) : resources.length === 0 ? (
            <div className="mt-5 rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
              <h3 className="font-medium text-gray-800">No resources to display</h3>
              <p className="mt-2 text-sm text-gray-500">
                Uploaded resources will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {resources.map(resource => {
                const uploader = profiles[resource.uploader_id]
                const unit = units[resource.unit_id]

                return (
                  <div
                    key={resource.id}
                    className="rounded-lg border border-gray-200 bg-white p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {resource.title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                          Unit: {unit?.unit_code || unit?.name || 'Unknown unit'}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          Category: {resource.category}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          Uploaded by: {uploader?.full_name || uploader?.email || 'Unknown student'}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {resource.created_at
                            ? new Date(resource.created_at).toLocaleString()
                            : ''}
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <a
                          href={supabase.storage
                            .from('academic-resources')
                            .getPublicUrl(resource.file_path).data.publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          View File
                        </a>

                        <button
                          onClick={() => deleteResource(resource)}
                          className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Student Reports ({reports.filter(report => report.status === 'Pending').length} pending)
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Review resources that students have reported.
            </p>
          </div>

          {loading ? (
            <p className="py-10 text-center text-gray-500">Loading reports...</p>
          ) : reports.length === 0 ? (
            <div className="mt-5 rounded-lg border border-gray-200 bg-white px-6 py-12 text-center">
              <h3 className="font-medium text-gray-800">No reports to review</h3>
              <p className="mt-2 text-sm text-gray-500">
                Reports submitted by students will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {reports.map(report => (
                <div
                  key={report.id}
                  className="rounded-lg border border-gray-200 bg-white p-5"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {report.resource_title || 'Resource report'}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Reason: {report.reason}
                      </p>
                      {report.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          Details: {report.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-gray-400">
                        Reported by: {profiles[report.reporter_id]?.full_name || profiles[report.reporter_id]?.email || 'Unknown student'}
                      </p>
                      <p className="mt-2 text-sm text-gray-600">
                        Status: {report.status}
                      </p>
                    </div>

                    {report.status === 'Pending' && (
                      <button
                        onClick={() => resolveReport(report.id)}
                        className="self-start rounded-md bg-[#345C32] px-4 py-2 text-sm text-white hover:bg-[#294927]"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        © 2026 ElimuLink. All rights reserved.
      </footer>
    </div>
  )
}

export default AdminModeration