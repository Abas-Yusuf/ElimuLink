import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    const cleanEmail = email.trim().toLowerCase()

    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (error) {
      setLoading(false)
      setMessage('Invalid email or password. Please try again.')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      await supabase.auth.signOut()
      setLoading(false)
      setMessage('Unable to retrieve your account details. Please try again.')
      return
    }

    if (profile.role === 'student' &&
        !cleanEmail.endsWith('@students.kcau.ac.ke')) {
      await supabase.auth.signOut()
      setLoading(false)
      setMessage('Students must use their official KCA student email.')
      return
    }

    if (profile.role !== 'student' && profile.role !== 'admin') {
      await supabase.auth.signOut()
      setLoading(false)
      setMessage('Your account does not have a valid role.')
      return
    }

    setLoading(false)

    if (profile.role === 'admin') {
      navigate('/admin-dashboard', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  async function handleForgotPassword() {
    setMessage('')

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      setMessage('Enter your email address first.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(
      cleanEmail,
      {
        redirectTo: window.location.origin,
      }
    )

    setLoading(false)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password reset instructions have been sent to your email.')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFCF9] flex flex-col">

      <header className="border-b border-[#DCE5D8] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-xl font-bold text-[#345C32]">
            ElimuLink
          </Link>

          <Link
            to="/signup"
            className="text-sm font-semibold text-[#345C32] hover:underline"
          >
            Create account
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <section className="w-full max-w-md border border-[#DCE5D8] bg-white p-7 md:p-9">

          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9CAC54]">
              Welcome back
            </p>

            <h1 className="text-2xl font-bold text-[#263D25]">
              Log in to ElimuLink
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Sign in to access your academic resources and student community.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email address
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email address"
                className="w-full border border-[#DCE5D8] px-4 py-3 text-sm outline-none focus:border-[#345C32]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>

              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full border border-[#DCE5D8] px-4 py-3 text-sm outline-none focus:border-[#345C32]"
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-sm font-medium text-[#345C32] hover:underline disabled:opacity-60"
              >
                Forgot password?
              </button>
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
              {loading ? 'Logging in...' : 'Log In'}
            </button>

          </form>

          <p className="mt-7 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-[#345C32] hover:underline"
            >
              Sign up
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

export default Login