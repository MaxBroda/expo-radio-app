import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { RoleProvider, useRole } from './role-provider';

test('starts as listener and switches role', async () => {
  const { result } = await renderHook(() => useRole(), {
    wrapper: ({ children }: PropsWithChildren) => <RoleProvider>{children}</RoleProvider>,
  });

  expect(result.current.role).toBe('listener');
  await act(() => result.current.setRole('moderator'));
  expect(result.current.role).toBe('moderator');
});

test('throws outside the provider', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(renderHook(() => useRole())).rejects.toThrow('RoleProvider');
});
