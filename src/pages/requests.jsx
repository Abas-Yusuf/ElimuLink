import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

function Requests() {
  const [showForm, setShowForm] = useState(false)
  const [units, setUnits] = useState([])
  const [requests, setRequests] = useState([])
  const [resourceLinks, setResourceLinks] = useState({})
  const [unitId, setUnitId] = useState('')
  const [resourceType, setResourceType] = useState('Lecture Notes')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userId, setUserId] = useState(null)

  const [selectedRequest, setSelectedRequest] = useState(null)
  const [programme, setProgramme] = useState('BSD')
  const [semester, setSemester] = useState('')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [fulfilDescription, setFulfilDescription] = useState('')
  const [fulfilling, setFulfilling] = useState(false)
  const [fulfilMessage, setFulfilMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')

    const { data: { user }, error: authError } =
      await supabase.auth.getUser()

    if (authError || !user) {
      setError('Please log in to view and submit resource requests.')
      setLoading(false)
      return
    }

    setUserId(user.id)

    const [unitsResult, requestsResult] = await Promise.all([
      supabase.from('units').select('*'),
      supabase
        .from('resource_requests')
        .select('*')
        .order('created_at', { ascending: false })
    ])

    if (unitsResult.error || requestsResult.error) {
      setError(
        unitsResult.error?.message ||
        requestsResult.error?.message
      )
      setLoading(false)
      return
    }

    setUnits(unitsResult.data || [])
    setRequests(requestsResult.data || [])

    const fulfilledIds = (requestsResult.data || [])
      .filter(request => request.resource_id)
      .map(request => request.resource_id)

    if (fulfilledIds.length > 0) {
      const { data: resources, error: resourceError } =
        await supabase
          .from('resources')
          .select('id, title, file_path')
          .in('id', fulfilledIds)

      if (!resourceError && resources) {
        const links = {}

        resources.forEach(resource => {
          const { data } = supabase.storage
            .from('academic-resources')
            .getPublicUrl(resource.file_path)

          links[resource.id] = {
            title: resource.title,
            url: data.publicUrl
          }
        })

        setResourceLinks(links)
      }
    }

    setLoading(false)
  }

  function getUnitName(id) {
    const unit = units.find(
      item => String(item.id) === String(id)
    )

    return unit?.unit_code ||
      unit?.code ||
      unit?.name ||
      'Unknown unit'
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!unitId) {
      setError('Please select a unit.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    const selectedUnit = units.find(
      unit => String(unit.id) === String(unitId)
    )

    if (!selectedUnit) {
      setError('Please select a valid unit.')
      setSubmitting(false)
      return
    }

    const unitCode =
      selectedUnit.unit_code ||
      selectedUnit.code ||
      selectedUnit.name

    if (!unitCode) {
      setError('The selected unit has no unit code in the database.')
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase
      .from('resource_requests')
      .insert({
        student_id: userId,
        unit_id: selectedUnit.id,
        unit_code: unitCode,
        resource_type: resourceType,
        description: description.trim(),
        status: 'Pending'
      })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    setUnitId('')
    setResourceType('Lecture Notes')
    setDescription('')
    setShowForm(false)
    setSuccess('Your resource request has been submitted.')

    await loadData()
    setSubmitting(false)
  }

  async function handleFulfil(event) {
    event.preventDefault()

    if (!selectedRequest || !semester || !file || !title.trim()) {
      setFulfilMessage('Please complete all required fields.')
      return
    }

    const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx']
    const extension = file.name.split('.').pop().toLowerCase()

    if (!allowedExtensions.includes(extension)) {
      setFulfilMessage(
        'Please select a PDF, DOC, DOCX, PPT or PPTX file.'
      )
      return
    }

    setFulfilling(true)
    setFulfilMessage('')

    let uploadedPath = null

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError || !userData.user) {
        throw new Error('Please log in before fulfilling a request.')
      }

      const user = userData.user

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
          .eq('code', semester)
          .single()

      if (semesterError) throw semesterError

      const { data: mapping, error: mappingError } =
        await supabase
          .from('programme_units')
          .select('unit_id')
          .eq('programme_id', programmeData.id)
          .eq('semester_id', semesterData.id)
          .eq('unit_id', selectedRequest.unit_id)
          .maybeSingle()

      if (mappingError) throw mappingError

      if (!mapping) {
        throw new Error(
          'This unit does not belong to the selected programme and semester.'
        )
      }

const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`

      const { error: storageError } = await supabase.storage
        .from('academic-resources')
        .upload(filePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false
        })

      if (storageError) throw storageError

      uploadedPath = filePath

      const { data: resource, error: databaseError } =
        await supabase
          .from('resources')
          .insert({
            title: title.trim(),
            description: fulfilDescription.trim(),
            unit_id: selectedRequest.unit_id,
            programme_id: programmeData.id,
            semester_id: semesterData.id,
            category: selectedRequest.resource_type,
            file_path: filePath,
            file_type: extension,
            uploader_id: user.id
          })
          .select('id')
          .single()

      if (databaseError) throw databaseError

      const { error: fulfilError } = await supabase.rpc(
        'fulfil_resource_request',
        {
          p_request_id: selectedRequest.id,
          p_resource_id: resource.id
        }
      )

      if (fulfilError) {
        setFulfilMessage(
          'The resource was uploaded, but the request status could not be updated. Please contact the administrator.'
        )
        await loadData()
        return
      }

      setFulfilMessage('Request successfully fulfilled!')
      setSelectedRequest(null)
      setProgramme('BSD')
      setSemester('')
      setTitle('')
      setFile(null)
      setFulfilDescription('')

      await loadData()

    } catch (error) {
      if (uploadedPath) {
        await supabase.storage
          .from('academic-resources')
          .remove([uploadedPath])
      }

      setFulfilMessage(
        error.message || 'Could not fulfil this request.'
      )
    } finally {
      setFulfilling(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFCF9]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <section className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#9CAC54]">
              Student community
            </p>

            <h1 className="text-3xl font-bold text-[#263D25] md:text-4xl">
              Resource Requests
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-gray-600">
              Looking for a particular learning material? Browse requests
              from other students or ask the community for help.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(!showForm)
              setError('')
              setSuccess('')
            }}
            className="bg-[#345C32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294928]"
          >
            {showForm ? 'Close Form' : 'Make a Request'}
          </button>
        </section>

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {success}
          </div>
        )}

        {showForm && (
          <section className="mb-10 border border-[#DCE5D8] bg-white p-6">
            <h2 className="text-lg font-bold text-[#263D25]">
              Submit a Resource Request
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Tell other students which learning material you need.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Select unit
                </label>

                <select
                  required
                  value={unitId}
                  onChange={event => setUnitId(event.target.value)}
                  className="w-full border border-[#DCE5D8] bg-white px-4 py-3 text-sm"
                >
                  <option value="">Choose a unit</option>

                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unit_code || unit.code || unit.name || 'Unnamed unit'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Resource category
                </label>

                <select
                  value={resourceType}
                  onChange={event => setResourceType(event.target.value)}
                  className="w-full border border-[#DCE5D8] bg-white px-4 py-3 text-sm"
                >
                  <option>Lecture Notes</option>
                  <option>Past Papers</option>
                  <option>Study Guides</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Describe what you need
                </label>

                <textarea
                  required
                  rows="4"
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  placeholder="Give a short description of the material you are looking for..."
                  className="w-full border border-[#DCE5D8] px-4 py-3 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || units.length === 0}
                className="bg-[#345C32] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </section>
        )}

        {selectedRequest && (
          <section className="mb-10 border border-[#DCE5D8] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#263D25]">
                  Fulfil Resource Request
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Upload the requested material for {getUnitName(selectedRequest.unit_id)}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null)
                  setFulfilMessage('')
                }}
                className="text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleFulfil} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Programme
                  </label>

                  <select
                    value={programme}
                    onChange={event => setProgramme(event.target.value)}
                    className="w-full border border-[#DCE5D8] bg-white px-4 py-3 text-sm"
                  >
                    <option value="BSD">BSD</option>
                    <option value="BIT">BIT</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Semester
                  </label>

                  <select
                    required
                    value={semester}
                    onChange={event => setSemester(event.target.value)}
                    className="w-full border border-[#DCE5D8] bg-white px-4 py-3 text-sm"
                  >
                    <option value="">Select semester</option>

                    {['1.1', '1.2', '1.3', '2.1', '2.2', '2.3', '3.1', '3.2', '3.3'].map(item => (
                      <option key={item} value={item}>
                        Semester {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Resource title
                </label>

                <input
                  required
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  placeholder="Enter a clear resource title"
                  className="w-full border border-[#DCE5D8] px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>

                <textarea
                  rows="3"
                  value={fulfilDescription}
                  onChange={event => setFulfilDescription(event.target.value)}
                  placeholder="Briefly describe the uploaded material..."
                  className="w-full border border-[#DCE5D8] px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Select file
                </label>

                <input
                  required
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={event => setFile(event.target.files[0] || null)}
                  className="block w-full text-sm text-gray-600"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Accepted formats: PDF, DOC, DOCX, PPT and PPTX.
                </p>
              </div>

              {fulfilMessage && (
                <p className="border border-[#DCE5D8] bg-[#F1F5ED] p-4 text-sm text-[#345C32]">
                  {fulfilMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={fulfilling}
                className="bg-[#345C32] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {fulfilling ? 'Uploading...' : 'Upload and Fulfil Request'}
              </button>
            </form>
          </section>
        )}

        <section>
          <div className="mb-5 border-b border-[#DCE5D8] pb-4">
            <h2 className="text-xl font-bold text-[#263D25]">
              Student Requests ({requests.length})
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Materials students are currently looking for.
            </p>
          </div>

          {loading ? (
            <p className="py-12 text-center text-gray-500">
              Loading student requests...
            </p>
          ) : requests.length === 0 ? (
            <div className="border border-dashed border-[#C9D8C3] bg-white px-6 py-16 text-center">
              <h3 className="font-semibold text-[#345C32]">
                No requests have been posted yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Be the first to request a learning resource.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#DCE5D8] border-y border-[#DCE5D8] bg-white">
              {requests.map(request => (
                <article key={request.id} className="px-5 py-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-[#345C32]">
                      {request.unit_code || getUnitName(request.unit_id)}
                    </span>

                    <span className="border border-[#DCE5D8] px-3 py-1 text-xs text-gray-600">
                      {request.resource_type}
                    </span>

                    <span className={`px-3 py-1 text-xs font-medium ${
                      request.status === 'Fulfilled'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status}
                    </span>

                    {request.student_id === userId && (
                      <span className="text-xs font-semibold text-[#345C32]">
                        Your request
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {request.description}
                  </p>

                  <p className="mt-3 text-xs text-gray-400">
                    {request.created_at
                      ? new Date(request.created_at).toLocaleDateString()
                      : ''}
                  </p>

                  {request.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRequest(request)
                        setFulfilMessage('')
                        setTitle('')
                        setFile(null)
                        setFulfilDescription('')
                        setSemester('')
                      }}
                      className="mt-4 border border-[#345C32] px-4 py-2 text-sm font-semibold text-[#345C32] hover:bg-[#F1F5ED]"
                    >
                      Fulfil Request
                    </button>
                  )}

                  {request.status === 'Fulfilled' && request.resource_id && (
                    <div className="mt-4">
                      {resourceLinks[request.resource_id] ? (
                        <a
                          href={resourceLinks[request.resource_id].url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[#345C32] underline"
                        >
                          View Resource: {resourceLinks[request.resource_id].title}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-500">
                          The resource is linked to this request.
                        </p>
                      )}
                    </div>
                  )}
                </article>
              ))}
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

export default Requests