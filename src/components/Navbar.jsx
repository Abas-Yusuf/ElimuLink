import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Navbar() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadUser(session) {
      if (!mounted) return

      if (!session?.user) {
        setUser(null)
        setRole(null)
        setLoading(false)
        return
      }

      setUser(session.user)

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!mounted) return

      if (error) {
        console.error('Navbar profile error:', error.message)
        setRole(null)
      } else {
        setRole(data.role)
      }

      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => {
      loadUser(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => loadUser(session), 0)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error.message)
      return
    }

    navigate('/')
  }

  const isStudent = user && role === 'student'
  const isAdmin = user && role === 'admin'
  const isLoggedIn = isStudent || isAdmin

  const linkStyle = 'text-sm font-medium text-gray-700 hover:text-[#345C32]'

  return (
    <nav className="w-full border-b border-[#DCE5D8] bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">

        <Link to="/" className="text-2xl font-bold text-[#345C32]">
          ElimuLink
        </Link>

        <div className="flex flex-wrap items-center gap-5">

          <Link to="/" className={linkStyle}>
            Home
          </Link>

          <Link to="/about" className={linkStyle}>
            About
          </Link>

          {isStudent && (
            <>
              <Link to="/explore" className={linkStyle}>
                Explore
              </Link>

              <Link to="/resources" className={linkStyle}>
                Resources
              </Link>

              <Link to="/requests" className={linkStyle}>
                Requests
              </Link>

              <Link to="/dashboard" className={linkStyle}>
                Dashboard
              </Link>

              <Link
                to="/upload"
                className="border border-[#9CAC54] px-4 py-2 text-sm font-semibold text-[#345C32] hover:bg-[#EAF3E7]"
              >
                + Upload Resource
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link to="/resources" className={linkStyle}>
                Resources
              </Link>

              <Link to="/requests" className={linkStyle}>
                Requests
              </Link>

              <Link to="/admin-dashboard" className={linkStyle}>
                Dashboard
              </Link>

              <Link to="/admin/moderation" className={linkStyle}>
                Moderation
              </Link>
            </>
          )}

          {!loading && !isLoggedIn && (
            <>
              <Link to="/login" className={linkStyle}>
                Log in
              </Link>

              <Link
                to="/signup"
                className="bg-[#345C32] px-5 py-2 text-sm font-medium text-white hover:bg-[#294A27]"
              >
                Sign up
              </Link>
            </>
          )}

          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="border border-[#DCE5D8] px-4 py-2 text-sm font-semibold text-[#345C32] hover:bg-[#F1F5ED]"
            >
              Log out
            </button>
          )}

        </div>
      </div>
    </nav>
  )
}

export default Navbar