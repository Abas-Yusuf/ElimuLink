import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Signup() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail.endsWith('@students.kcau.ac.ke')) {
      setMessage('Please use your official KCA student email address.')
      return
    }

    if (password.length < 8) {
      setMessage('Your password must contain at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('The passwords do not match.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: name.trim(),
        },
      },
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    if (data.session) {
      navigate('/dashboard')
    } else {
      setMessage(
        'Account created successfully! Please check your KCA email for a verification link before logging in.'
      )
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFCF9] flex flex-col">
      <header className="border-b border-[#DCE5D8] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-xl font-bold text-[#345C32]">
            ElimuLink
          </Link>

          <Link to="/login" className="text-sm font-semibold text-[#345C32] hover:underline">
            Log in
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <section className="w-full max-w-lg border border-[#DCE5D8] bg-white p-7 md:p-9">
          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9CAC54]">
              Join the community
            </p>

            <h1 className="text-2xl font-bold text-[#263D25]">
              Create your account
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Sign up with your official KCA University student email
              to access ElimuLink.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
                className="w-full border border-[#DCE5D8] px-4 py-3 text-sm outline-none focus:border-[#345C32]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                KCA student email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="e.g. 2300095@students.kcau.ac.ke"
                className="w-full border border-[#DCE5D8] px-4 py-3 text-sm outline-none focus:border-[#345C32]"
              />
              <p className="mt-2 text-xs text-gray-500">
                Use your official student email address.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                className="w-full border border-[#DCE5D8] px-4 py-3 text-sm outline-none focus:border-[#345C32]"
              />
              <p className="mt-2 text-xs text-gray-500">
                At least 8 characters.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter your password again"
                className="w-full border border-[#DCE5D8] px-4 py-3 text-sm outline-none focus:border-[#345C32]"
              />
            </div>

            {message && (
              <p className="border border-[#DCE5D8] bg-[#F1F5ED] p-3 text-sm leading-6 text-[#345C32]">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#345C32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#294928] disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#345C32] hover:underline">
              Log in
            </Link>
          </p>
        </section>
      </main>

      <footer className="border-t border-[#DCE5D8] bg-white px-6 py-5 text-center text-xs text-gray-500">
        KCA University · ElimuLink
      </footer>
    </div>
  )
}

export default Signup