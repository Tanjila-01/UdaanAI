/**
 * Resolves account action button label and destination based on auth state.
 *
 * States:
 * - Loading: prevents flashing the wrong button state during auth initialization
 * - Guest: "Create Free Account" -> /register
 * - Student with incomplete profile: "Complete Your Profile" -> /onboarding
 * - Student with complete profile: "Go to Dashboard" -> /dashboard
 * - Admin: "Admin Dashboard" -> /admin
 *
 * @param {Object|null} user
 * @param {Object|null} profile
 * @param {boolean} loading
 * @returns {{ label: string, destination: string|null, isLoading: boolean, isGuest: boolean, isAdmin: boolean, isStudent: boolean }}
 */
export const getAccountAction = (user, profile, loading) => {
  if (loading) {
    return {
      label: 'Loading...',
      destination: null,
      isLoading: true,
      isGuest: false,
      isAdmin: false,
      isStudent: false,
    };
  }

  if (!user) {
    return {
      label: 'Create Free Account',
      destination: '/register',
      isLoading: false,
      isGuest: true,
      isAdmin: false,
      isStudent: false,
    };
  }

  if (user.role === 'admin') {
    return {
      label: 'Admin Dashboard',
      destination: '/admin',
      isLoading: false,
      isGuest: false,
      isAdmin: true,
      isStudent: false,
    };
  }

  if (!profile || !profile.is_complete) {
    return {
      label: 'Complete Your Profile',
      destination: '/onboarding',
      isLoading: false,
      isGuest: false,
      isAdmin: false,
      isStudent: true,
    };
  }

  return {
    label: 'Go to Dashboard',
    destination: '/dashboard',
    isLoading: false,
    isGuest: false,
    isAdmin: false,
    isStudent: true,
  };
};
