import api from '../config/api'

/**
 * Company API service.
 *
 * NOTE: created in M1.1 for API-contract stability ahead of frontend UI work
 * (M6). Not yet imported by any page/component — that wiring happens in M6
 * once the verification submission and admin review UIs are built. Kept as
 * a real, working file now (not a stub) so its shape doesn't need to change
 * later, and so M2 (auth integration) and M6 can rely on a stable contract.
 */
export const companyService = {
  // Get the authenticated user's company (404 if none — e.g. admin accounts)
  getMe: () =>
    api.get('/companies/me'),

  // Update the authenticated user's company profile
  updateMe: (data) =>
    api.patch('/companies/me', data),
}
