import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { authAPI } from '../lib/api/auth';
import { clearTokens } from '../lib/api/client';

export default function Layout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [usersMenuOpen, setUsersMenuOpen] = useState(false);
  const [eventsMenuOpen, setEventsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getProfile();
        if (response.success && response.user) {
          setUser(response.user);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          clearTokens();
          router.push('/login');
        }
      }
    };
    fetchUser();
  }, [router]);

  // Load dropdown state from localStorage on client side only (after hydration)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEventsMenuOpen = localStorage.getItem('eventsMenuOpen') === 'true';
      const savedUsersMenuOpen = localStorage.getItem('usersMenuOpen') === 'true';
      
      if (savedEventsMenuOpen) {
        setEventsMenuOpen(true);
      }
      if (savedUsersMenuOpen) {
        setUsersMenuOpen(true);
      }
    }
  }, []); // Run only once on mount

  // Persist dropdown state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('eventsMenuOpen', eventsMenuOpen.toString());
    }
  }, [eventsMenuOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('usersMenuOpen', usersMenuOpen.toString());
    }
  }, [usersMenuOpen]);

  // Swipe gesture handlers for mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isRightSwipe && !sidebarOpen) {
      setSidebarOpen(true);
    } else if (isLeftSwipe && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        const hamburger = document.getElementById('hamburger-button');
        if (sidebar && !sidebar.contains(event.target) && !hamburger?.contains(event.target)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  const isActive = (path) => {
    return router.pathname === path;
  };

  const isEventsActive = () => {
    return router.pathname === '/dashboard/events' || 
           router.pathname === '/dashboard/events/pending' || 
           router.pathname === '/dashboard/events/approved';
  };

  return (
    <div 
      className="min-h-screen bg-[#0F0F0F] flex relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Mobile Hamburger Button */}
      <button
        id="hamburger-button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-[#1F1F1F] border border-[#374151] p-2 rounded-lg text-white hover:bg-[#2A2A2A] transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside 
        id="sidebar"
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#1F1F1F] border-r border-[#374151] flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-[#374151]">
          <h1 className="text-2xl font-bold text-white">ticketly</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/dashboard"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/dashboard')
                ? 'bg-[#9333EA] text-white'
                : 'text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>

          {/* Events Dropdown */}
          <div className="relative">
            <button
              type="button"
              data-dropdown-button="events"
              onClick={(e) => {
                e.stopPropagation();
                setEventsMenuOpen(!eventsMenuOpen);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                isEventsActive()
                  ? 'bg-[#9333EA] text-white'
                  : 'text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Events
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${eventsMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {eventsMenuOpen && (
              <div 
                data-dropdown-menu="events"
                className="mt-2 ml-4 space-y-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  data-dropdown-link="events"
                  href="/dashboard/events/pending"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Don't close dropdown on link click
                  }}
                  className={`block px-4 py-2 rounded-lg transition-colors ${
                    isActive('/dashboard/events/pending')
                      ? 'bg-[#9333EA] text-white'
                      : 'text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white'
                  }`}
                >
                  Pending
                </Link>
                <Link
                  data-dropdown-link="events"
                  href="/dashboard/events/approved"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Don't close dropdown on link click
                  }}
                  className={`block px-4 py-2 rounded-lg transition-colors ${
                    isActive('/dashboard/events/approved')
                      ? 'bg-[#9333EA] text-white'
                      : 'text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white'
                  }`}
                >
                  Approved
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/dashboard/tickets"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/dashboard/tickets')
                ? 'bg-[#9333EA] text-white'
                : 'text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            Tickets
          </Link>

          {/* Users Dropdown */}
          <div className="relative">
            <button
              type="button"
              data-dropdown-button="users"
              onClick={(e) => {
                e.stopPropagation();
                setUsersMenuOpen(!usersMenuOpen);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                isActive('/dashboard/users')
                  ? 'bg-[#9333EA] text-white'
                  : 'text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Users
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${usersMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {usersMenuOpen && (
              <div 
                data-dropdown-menu="users"
                className="mt-2 ml-4 space-y-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  data-dropdown-link="users"
                  href="/dashboard/users"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Don't close dropdown on link click
                  }}
                  className={`block px-4 py-2 rounded-lg transition-colors ${
                    isActive('/dashboard/users')
                      ? 'bg-[#9333EA] text-white'
                      : 'text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white'
                  }`}
                >
                  All Users
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-[#374151]">
          {user && (
            <div className="mb-4">
              <p className="text-white text-sm font-semibold">{user.fullName || user.name}</p>
              <p className="text-[#9CA3AF] text-xs">{user.email}</p>
              {user.role && (
                <span className="inline-block mt-2 px-2 py-1 bg-[#9333EA] text-white text-xs rounded">
                  {user.role}
                </span>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 bg-[#2A2A2A] text-white rounded-lg hover:bg-[#374151] transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col h-screen">
        {children}
      </main>
    </div>
  );
}

