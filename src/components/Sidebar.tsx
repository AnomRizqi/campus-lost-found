import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { 
  Home, 
  User, 
  ShieldCheck, 
  LogOut, 
  Moon, 
  Sun, 
  Sparkles,
  Plus
} from 'lucide-react'

interface SidebarProps {
  onCreatePostClick: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ onCreatePostClick }) => {
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { label: 'Beranda', path: '/', icon: Home, show: true },
    { label: 'Profil', path: `/profile/${profile?.id}`, icon: User, show: !!profile },
    { 
      label: 'Admin', 
      path: '/admin', 
      icon: ShieldCheck, 
      show: profile?.role === 'admin' 
    },
  ]

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Desktop Sidebar (md and up) */}
      <aside className="hidden md:flex flex-col justify-between h-screen sticky top-0 w-64 xl:w-72 px-4 py-6 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-black text-gray-900 dark:text-zinc-100 transition-colors duration-200">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 px-3 py-2 text-primary dark:text-primary font-bold text-xl hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full w-fit transition duration-200">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="hidden xl:inline tracking-wide bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent font-extrabold">Lost & Found Platform</span>
          </Link>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              if (!item.show) return null
              const Active = isActive(item.path)
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3 text-lg font-medium rounded-full transition duration-200 hover:bg-gray-100 dark:hover:bg-zinc-900 ${
                    Active ? 'font-bold text-black dark:text-white' : 'text-gray-700 dark:text-zinc-400'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${Active ? 'text-primary dark:text-white stroke-[2.5px]' : 'stroke-[2px]'}`} />
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              )
            })}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-4 px-4 py-3 text-lg font-medium text-gray-700 dark:text-zinc-400 rounded-full transition duration-200 hover:bg-gray-100 dark:hover:bg-zinc-900 text-left w-full cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-6 w-6 text-amber-500" />
                  <span className="hidden xl:inline">Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="h-6 w-6 text-indigo-600" />
                  <span className="hidden xl:inline">Mode Gelap</span>
                </>
              )}
            </button>
          </nav>

          {/* Create Post Button */}
          {profile && profile.role !== 'admin' && (
            <button
              onClick={onCreatePostClick}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-full shadow-md transition duration-200 cursor-pointer"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden xl:inline">Laporkan Barang</span>
            </button>
          )}
        </div>

        {/* Profile Info / Logout */}
        {profile && (
          <div className="flex items-center justify-between p-3 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 transition duration-200">
            <Link to={`/profile/${profile.id}`} className="flex items-center gap-3 min-w-0">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.full_name)}`}
                alt={profile.full_name}
                className="h-10 w-10 rounded-full object-cover border-2 border-primary"
              />
              <div className="hidden xl:flex flex-col text-left min-w-0">
                <span className="font-bold text-sm truncate">{profile.full_name}</span>
                <span className="text-xs text-gray-500 dark:text-zinc-500 truncate">{profile.email}</span>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Keluar"
              className="p-2 text-gray-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 transition duration-200 cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar (md and below) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-black border-t border-gray-200 dark:border-zinc-800 flex items-center justify-around px-4 z-40 transition-colors duration-200">
        {navItems.map((item) => {
          if (!item.show) return null
          const Active = isActive(item.path)
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center p-2 rounded-full transition duration-200 ${
                Active ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-zinc-500'
              }`}
            >
              <Icon className={`h-6 w-6 ${Active ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
            </Link>
          )
        })}

        {/* Mobile Quick Create Post floating button overlay or bottom nav item */}
        {profile && profile.role !== 'admin' && (
          <button
            onClick={onCreatePostClick}
            className="flex items-center justify-center h-10 w-10 bg-primary text-white rounded-full shadow-lg transition duration-200 cursor-pointer"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}

        {/* Mobile Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center p-2 text-gray-500 dark:text-zinc-500 cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="h-6 w-6 text-amber-500" />
          ) : (
            <Moon className="h-6 w-6 text-indigo-600" />
          )}
        </button>

        {/* Mobile Logout */}
        {profile && (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center p-2 text-gray-500 dark:text-zinc-500 hover:text-red-500 cursor-pointer"
          >
            <LogOut className="h-6 w-6" />
          </button>
        )}
      </div>
    </>
  )
}
