import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { Dispatch, ReactNode } from 'react';
import { clearState, loadState, saveState } from '@/lib/storage';
import type { AppState } from '@/types';
import type { Action } from './actions';
import { reducer } from './reducer';

const StateContext = createContext<AppState | null>(null);
const DispatchContext = createContext<Dispatch<Action> | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    const id = window.setTimeout(() => saveState(state), 120);
    return () => window.clearTimeout(id);
  }, [state]);

  const stableDispatch = useMemo(() => dispatch, [dispatch]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={stableDispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState(): AppState {
  const state = useContext(StateContext);
  if (!state) throw new Error('useAppState вызван вне AppProvider');
  return state;
}

export function useDispatch(): Dispatch<Action> {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) throw new Error('useDispatch вызван вне AppProvider');
  return dispatch;
}

export function resetDemoData(dispatch: Dispatch<Action>): void {
  clearState();
  dispatch({ type: 'state/reset' });
}
