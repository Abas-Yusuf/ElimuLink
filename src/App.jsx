import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'

import Navbar from './components/Navbar'

import Explore from './pages/Explore'
import Resources from './pages/resources'
import Requests from './pages/requests'
import About from './pages/about'
import Upload from './pages/upload'
import Signup from './pages/signUp'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminModeration from './pages/AdminModeration'
import ReportResource from './pages/reportresource'
function Home() {
  return (
    <div className="min-h-screen bg-[#FAFCF9]">

      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-14">

        {/* Welcome and search */}
        <section className="grid items-center gap-12 lg:grid-cols-[1.4fr_0.8fr]">

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#78916A]">
              KCA University Resource Hub
            </p>

            <h1 className="mb-5 max-w-2xl text-4xl font-bold leading-tight text-[#263D25] md:text-5xl">
              Find the resources you need to move forward.
            </h1>

            <p className="max-w-xl text-lg leading-7 text-gray-600">
              Discover lecture notes, past papers and academic resources
              shared by fellow students.
            </p>

            <form
              action="/resources"
              method="GET"
              className="mt-8 flex max-w-2xl border border-[#DCE5D8] bg-white"
            >
              <input
                type="text"
                name="q"
                placeholder="Search courses, notes or past papers..."
                className="min-w-0 flex-1 px-4 py-4 text-sm outline-none"
              />

              <button
                type="submit"
                className="bg-[#345C32] px-7 text-white transition hover:bg-[#294A27]"
              >
                Search
              </button>
            </form>
          </div>

          {/* Explore resources */}
          <section className="border border-[#DCE5D8] bg-white p-7">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#9CAC54]">
              Find study materials
            </p>

            <h2 className="mb-5 text-xl font-bold text-[#263D25]">
              Explore resources
            </h2>

            <div className="divide-y divide-gray-200">

              <a
                href="/resources?category=lecture-notes"
                className="group flex items-center justify-between py-5"
              >
                <div>
                  <h3 className="font-semibold text-[#345C32] group-hover:text-[#78916A]">
                    Lecture Notes
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Materials shared by fellow students.
                  </p>
                </div>
                <span className="text-[#9CAC54]">→</span>
              </a>

              <a
                href="/resources?category=past-papers"
                className="group flex items-center justify-between py-5"
              >
                <div>
                  <h3 className="font-semibold text-[#345C32] group-hover:text-[#78916A]">
                    Past Papers
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Mock exams and practice questions.
                  </p>
                </div>
                <span className="text-[#9CAC54]">→</span>
              </a>

              <a
                href="/resources?category=study-guides"
                className="group flex items-center justify-between py-5"
              >
                <div>
                  <h3 className="font-semibold text-[#345C32] group-hover:text-[#78916A]">
                    Study Guides
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Additional material to support your learning.
                  </p>
                </div>
                <span className="text-[#9CAC54]">→</span>
              </a>

            </div>

            <a
              href="/resources"
              className="mt-3 inline-block text-sm font-semibold text-[#345C32] hover:underline"
            >
              Explore all resources →
            </a>
          </section>

        </section>

        {/* Upload resource section */}
        <section className="mt-20">
          <div className="grid items-center gap-6 border border-[#DCE5D8] bg-[#EAF3E7] p-8 md:grid-cols-[1fr_auto] md:p-10">

            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#78916A]">
                Contribute to the community
              </p>

              <h2 className="text-2xl font-bold text-[#263D25] md:text-3xl">
                Have useful study materials?
              </h2>

              <p className="mt-3 max-w-xl leading-7 text-gray-600">
                Share your lecture notes, past papers and study guides.
                Help other students find the materials they need.
              </p>
            </div>

            <a
              href="/upload"
              className="inline-flex items-center justify-center gap-2 bg-[#345C32] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#294A27]"
            >
              <span>＋</span>
              Upload a resource
            </a>

          </div>
        </section>

        {/* Browse by programme */}
        <section className="mt-20">

          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#9CAC54]">
              Academic programmes
            </p>

            <h2 className="text-2xl font-bold text-[#263D25]">
              Browse by programme
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Select your programme to find its semesters and study units.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">

            {/* BSD */}
            <a
              href="/explore?programme=BSD"
              className="group border border-[#DCE5D8] border-t-4 border-t-[#345C32] bg-white p-7 transition hover:border-[#9CAC54]"
            >
              <p className="mb-4 text-xs font-semibold tracking-wider text-[#78916A]">
                SCHOOL OF TECHNOLOGY
              </p>

              <h3 className="text-2xl font-bold text-[#345C32]">
                BSD
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Bachelor of Science in Software Development
              </p>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#345C32]">
                  View programme
                </span>
                <span className="text-[#9CAC54] transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </a>

            {/* BIT */}
            <a
              href="/explore?programme=BIT"
              className="group border border-[#DCE5D8] border-t-4 border-t-[#9CAC54] bg-white p-7 transition hover:border-[#345C32]"
            >
              <p className="mb-4 text-xs font-semibold tracking-wider text-[#78916A]">
                SCHOOL OF TECHNOLOGY
              </p>

              <h3 className="text-2xl font-bold text-[#345C32]">
                BIT
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Bachelor of Information Technology
              </p>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#345C32]">
                  View programme
                </span>
                <span className="text-[#9CAC54] transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </a>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-[#DCE5D8] bg-white">
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

function ProtectedRoute({ user, role, allowedRoles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFCF9]">
        <p className="text-sm text-red-700">
          Unable to load your account role. Check the browser console.
        </p>
      </div>
    )
  }

  if (!allowedRoles.includes(role)) {
    return (
      <Navigate
        to={role === 'admin' ? '/admin-dashboard' : '/dashboard'}
        replace
      />
    )
  }

  return children
}

function GuestRoute({ user, role, children }) {
  if (user && role) {
    return (
      <Navigate
        to={role === 'admin' ? '/admin-dashboard' : '/dashboard'}
        replace
      />
    )
  }

  return children
}

function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
  let mounted = true
  let requestNumber = 0

  async function loadSession(session) {
    const currentRequest = ++requestNumber

    if (!mounted) return

    if (!session?.user) {
      setUser(null)
      setRole(null)
      setAuthLoading(false)
      return
    }
    setAuthLoading(true)
    setUser(session.user)

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!mounted || currentRequest !== requestNumber) return

    if (error) {
      console.error('Could not load user role:', error.message)
      setAuthLoading(false)
      return
    }

    setRole(data.role)
    setAuthLoading(false)
  }

  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Session error:', error.message)
      setAuthLoading(false)
      return
    }

    loadSession(data.session)
  })

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => {
      loadSession(session)
    }, 0)
  })

  return () => {
    mounted = false
    subscription.unsubscribe()
  }
}, [])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFCF9]">
        <p className="text-sm text-[#345C32]">
          Loading ElimuLink...
        </p>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />

      <Route
        path="/login"
        element={
          <GuestRoute user={user} role={role}>
            <Login />
          </GuestRoute>
        }
      />

      <Route
        path="/signup"
        element={
          <GuestRoute user={user} role={role}>
            <Signup />
          </GuestRoute>
        }
      />

      {/* Pages available to students and admins */}
      <Route
        path="/resources"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={['student', 'admin']}>
            <Resources />
          </ProtectedRoute>
        }
      />

      <Route
        path="/requests"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={['student', 'admin']}>
            <Requests />
          </ProtectedRoute>
        }
      />

      {/* Student-only pages */}
      <Route
        path="/explore"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={['student']}>
            <Explore />
          </ProtectedRoute>
        }
      />

      <Route
        path="/upload"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={['student']}>
            <Upload />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/report"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={['student']}>
            <ReportResource />
          </ProtectedRoute>
        }
      />

      {/* Admin-only pages */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/moderation"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={['admin']}>
            <AdminModeration />
          </ProtectedRoute>
        }
      />

      {/* Unknown addresses */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App