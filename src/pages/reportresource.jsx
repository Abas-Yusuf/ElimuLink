import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

function ReportResource() {
  const [searchParams] = useSearchParams()

  const resourceId = searchParams.get('id')
  const resourceTitle = searchParams.get('title') || 'Selected Resource'

  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    if (!reason || !resourceId) return

    setSubmitting(true)
    setError('')

    const { data: { user }, error: authError } =
      await supabase.auth.getUser()

    if (authError || !user) {
      setError('Please log in before submitting a report.')
      setSubmitting(false)
      return
    }

    // Verify that the selected resource exists.
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('id, title')
      .eq('id', resourceId)
      .single()

    if (resourceError || !resource) {
      setError('This resource could not be found. It may have been deleted.')
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        resource_id: resource.id,
        resource_title: resource.title,
        reporter_id: user.id,
        reason,
        description: description.trim() || null,
        status: 'Pending'
      })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#FAFCF9]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to="/resources"
          className="text-sm font-semibold text-[#345C32] hover:underline"
        >
          ← Back to Resources
        </Link>

        <section className="mb-8 mt-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#9CAC54]">
            Student reporting
          </p>

          <h1 className="text-3xl font-bold text-[#263D25]">
            Report a Resource
          </h1>

          <p className="mt-3 text-gray-600">
            Tell us about a problem with this resource.
          </p>
        </section>

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="border border-[#DCE5D8] bg-white p-8">
            <h2 className="text-xl font-bold text-[#345C32]">
              Report submitted
            </h2>

            <p className="mt-3 text-sm text-gray-600">
              Your report has been successfully submitted and is now available
              for administrator review.
            </p>

            <Link
              to="/resources"
              className="mt-6 inline-block bg-[#345C32] px-5 py-3 text-sm font-semibold text-white hover:bg-[#294928]"
            >
              Return to Resources
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="border border-[#DCE5D8] bg-white p-6 sm:p-8"
          >
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-[#263D25]">
                Resource being reported
              </label>

              <div className="bg-[#F1F5EF] p-4 text-sm text-gray-700">
                {resourceTitle}
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="reason"
                className="mb-2 block text-sm font-semibold text-[#263D25]"
              >
                Reason for reporting
              </label>

              <select
                id="reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                className="w-full border border-[#C9D8C3] bg-white px-4 py-3 text-sm outline-none focus:border-[#345C32]"
              >
                <option value="">Select a reason</option>
                <option value="Incorrect resource">Incorrect resource</option>
                <option value="Inappropriate content">Inappropriate content</option>
                <option value="Duplicate resource">Duplicate resource</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-7">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-[#263D25]"
              >
                Additional details (optional)
              </label>

              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows="4"
                placeholder="Briefly explain the problem..."
                className="w-full border border-[#C9D8C3] px-4 py-3 text-sm outline-none focus:border-[#345C32]"
              />
            </div>

            <button
              type="submit"
              disabled={!reason || !resourceId || submitting}
              className="bg-[#345C32] px-6 py-3 text-sm font-semibold text-white hover:bg-[#294928] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>

            {!resourceId && (
              <p className="mt-3 text-sm text-red-600">
                No resource was selected. Please return to Resources and select
                Report on a resource.
              </p>
            )}
          </form>
        )}
      </main>

      <footer className="mt-16 border-t border-[#DCE5D8] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h2 className="font-bold text-[#345C32]">ElimuLink</h2>
          <p className="mt-1 text-sm text-gray-500">
            Connecting students through shared knowledge.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default ReportResource