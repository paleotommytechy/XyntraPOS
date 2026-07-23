import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../stores/auth.store';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('initializes with logged-out state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.business).toBeNull();
  });

  it('sets user session correctly', () => {
    const mockUser = { id: 'usr-1', email: 'owner@xyntra.com' };
    const mockProfile = {
      id: 'usr-1',
      full_name: 'John Owner',
      role: 'owner',
      phone: '08012345678',
      created_at: '2026-07-23T00:00:00Z',
      updated_at: '2026-07-23T00:00:00Z',
    };
    const mockBusiness = {
      id: 'biz-1',
      name: 'SuperMart',
      slug: 'supermart',
      currency: 'NGN',
      country: 'Nigeria',
      address: 'Lagos',
      phone: '08000000000',
      owner_id: 'usr-1',
      created_at: '2026-07-23T00:00:00Z',
      updated_at: '2026-07-23T00:00:00Z',
    };

    useAuthStore.getState().setSession(mockUser, mockProfile as any, mockBusiness as any);
    const state = useAuthStore.getState();

    expect(state.user).toEqual(mockUser);
    expect(state.profile).toEqual(mockProfile);
    expect(state.business).toEqual(mockBusiness);
    expect(state.isLoading).toBe(false);
  });

  it('clears state on logout', () => {
    useAuthStore.getState().setSession({ id: 'usr-1' }, {} as any, {} as any);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.business).toBeNull();
  });
});
