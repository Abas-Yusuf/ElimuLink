import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

function Upload() {
  const [programme, setProgramme] = useState('BSD')
  const [semester, setSemester] = useState('')
  const [unitId, setUnitId] = useState('')
  const [units, setUnits] = useState([])
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [unitError, setUnitError] = useState('')

  const [category, setCategory] = useState('Lecture Notes')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadUnits() {
      setUnits([])
      setUnitId('')
      setUnitError('')

      if (!semester) return

      setLoadingUnits(true)

      try {
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

        const { data: mappings, error: mappingError } =
          await supabase
            .from('programme_units')
            .select('unit_id')
            .eq('programme_id', programmeData.id)
            .eq('semester_id', semesterData.id)

        if (mappingError) throw mappingError

        const unitIds = (mappings || []).map(item => item.unit_id)

        if (unitIds.length === 0) {
          if (!cancelled) {
            setUnitError('No units were found for this semester.')
          }
          return
        }

        const { data: unitData, error: unitError } =
          await supabase
            .from('units')
            .select('id, code, name')
            .in('id', unitIds)
            .order('code')

        if (unitError) throw unitError

        if (!cancelled) {
          setUnits(unitData || [])

          if (!unitData || unitData.length === 0) {
            setUnitError('No study units were found.')
          }
        }
      } catch (error) {
        if (!cancelled) {
          setUnitError(error.message || 'Could not load study units.')
        }
      } finally {
        if (!cancelled) {
          setLoadingUnits(false)
        }
      }
    }

    loadUnits()

    return () => {
      cancelled = true
    }
  }, [programme, semester])

  async function handleSubmit(event) {
  event.preventDefault()
  setMessage('')

  if (!unitId || !file || !semester) {
    setMessage('Please select a programme, semester, study unit and file.')
    return
  }

  const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx']
  const extension = file.name.split('.').pop().toLowerCase()

  if (!allowedExtensions.includes(extension)) {
    setMessage('Please select a PDF, DOC, DOCX, PPT or PPTX file.')
    return
  }

  setUploading(true)
  let uploadedPath = null

  try {
    const { data: userData, error: userError } =
      await supabase.auth.getUser()

    if (userError || !userData.user) {
      throw new Error('Please log in before uploading.')
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

  const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`

    const { error: storageError } = await supabase.storage
      .from('academic-resources')
      .upload(filePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (storageError) throw storageError

    uploadedPath = filePath

    const { error: databaseError } = await supabase
      .from('resources')
      .insert({
        title: title.trim(),
        description: description.trim(),
        unit_id: Number(unitId),
        programme_id: programmeData.id,
        semester_id: semesterData.id,
        category,
        file_path: filePath,
        file_type: extension,
        uploader_id: user.id,
      })

    if (databaseError) throw databaseError

    setMessage('Resource uploaded successfully!')

    setTitle('')
    setDescription('')
    setFile(null)
    setUnitId('')
    event.target.reset()

  } catch (error) {
    if (uploadedPath) {
      await supabase.storage
        .from('academic-resources')
        .remove([uploadedPath])
    }

    setMessage(error.message || 'Upload failed. Please try again.')
  } finally {
    setUploading(false)
  }
}

  return (
    <div className="min-h-screen bg-[#FAFCF9]">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <section className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#9CAC54]">
            Contribute to ElimuLink
          </p>

          <h1 className="text-3xl font-bold text-[#263D25] md:text-4xl">
            Upload a Resource
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-gray-600">
            Share useful academic materials with other KCA University
            students. Make sure your resource is placed under the correct
            programme, semester and study unit.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="border border-[#DCE5D8] bg-white p-6 md:p-8"
        >
          <div className="mb-7 border-b border-[#DCE5D8] pb-4">
            <h2 className="text-lg font-bold text-[#263D25]">
              Resource details
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Provide the academic details of the material.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Programme
              </label>

              <select
                required
                value={programme}
                onChange={event => {
                  setProgramme(event.target.value)
                  setSemester('')
                  setUnitId('')
                }}
                className="w-full border border-[#DCE5D8] bg-white px-4 py-3 text-sm"
              >
                <option value="BSD">Bachelor of Science in Software Development (BSD)</option>
                <option value="BIT">Bachelor of Information Technology (BIT)</option>
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

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Study unit
              </label>

              <select
                required
                value={unitId}
                onChange={event => setUnitId(event.target.value)}
                disabled={!semester || loadingUnits}
                className="w-full border border-[#DCE5D8] bg-white px-4 py-3 text-sm disabled:bg-gray-100"
              >
                <option value="">
                  {!semester
                    ? 'Select a semester first'
                    : loadingUnits
                    ? 'Loading study units...'
                    : 'Select study unit'}
                </option>

                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} - {unit.name}
                  </option>
                ))}
              </select>

              {unitError && (
                <p className="mt-2 text-sm text-red-600">
                  {unitError}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Resource category
              </label>

              <select
                value={category}
                onChange={event => setCategory(event.target.value)}
                className="w-full border border-[#DCE5D8] bg-white px-4 py-3 text-sm"
              >
                <option>Lecture Notes</option>
                <option>Past Papers</option>
                <option>Study Guides</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Resource title
            </label>

            <input
              required
              type="text"
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="Give your resource a clear title"
              className="w-full border border-[#DCE5D8] px-4 py-3 text-sm"
            />
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              rows="4"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Briefly describe the contents of this resource..."
              className="w-full border border-[#DCE5D8] px-4 py-3 text-sm"
            />
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select file
            </label>

            <div className="border border-dashed border-[#B9CBB2] bg-[#FAFCF9] p-6">
              <input
                required
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={event => setFile(event.target.files[0] || null)}
                className="block w-full text-sm text-gray-600 file:mr-4 file:border-0 file:bg-[#EAF3E7] file:px-4 file:py-2 file:font-semibold file:text-[#345C32]"
              />

              <p className="mt-3 text-xs text-gray-500">
                Accepted formats: PDF, DOC, DOCX, PPT and PPTX.
              </p>

              {file && (
                <p className="mt-3 text-sm font-medium text-[#345C32]">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>

          {message && (
            <p className="mt-6 border border-[#DCE5D8] bg-[#F1F5ED] p-4 text-sm text-[#345C32]">
              {message}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#DCE5D8] pt-6">
            <p className="max-w-sm text-xs leading-5 text-gray-500">
              Only share materials you are permitted to distribute.
              Check that the file is relevant to the selected unit.
            </p>

            <button
              type="submit"
              disabled={uploading || loadingUnits}
              className="bg-[#345C32] px-6 py-3 text-sm font-semibold text-white hover:bg-[#294928] disabled:opacity-60"
            >
              {uploading ? 'Uploading...' : 'Submit Resource'}
            </button>
          </div>
        </form>
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

export default Upload