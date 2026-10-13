import { createContext, use, useState, type PropsWithChildren } from 'react';

export type Role = 'listener' | 'moderator';

type RoleState = { role: Role; setRole: (role: Role) => void };

const RoleContext = createContext<RoleState | null>(null);

type Props = PropsWithChildren<{ initialRole?: Role }>;

/** Demo-only: there is no login, the role sheet decides what the app shows. */
export function RoleProvider({ initialRole = 'listener', children }: Props) {
  const [role, setRole] = useState(initialRole);
  return <RoleContext value={{ role, setRole }}>{children}</RoleContext>;
}

export function useRole(): RoleState {
  const state = use(RoleContext);
  if (!state) throw new Error('useRole must be used inside RoleProvider');
  return state;
}
