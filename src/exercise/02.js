// useCallback: custom hooks
// http://localhost:3000/isolated/exercise/02.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonForm,
  PokemonDataView,
  PokemonInfoFallback,
  PokemonErrorBoundary,
} from '../pokemon'

// 🐨 this is going to be our generic asyncReducer
function pokemonInfoReducer(state, action) {
  switch (action.type) {
    case 'pending': {
      return {...state, status: 'pending', data: null, error: null}
    }
    case 'resolved': {
      return {...state, status: 'resolved', data: action.data, error: null}
    }
    case 'rejected': {
      return {...state, status: 'rejected', data: null, error: action.error}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

function useAsync(initialState, abort) {
  const [state, dispatch] = React.useReducer(pokemonInfoReducer, {
    data: null,
    error: null,
    ...initialState,
  })

  const run = React.useCallback((promise) => { 
    if (!promise) {
      return;
    }
    
    dispatch({type: 'pending'})

    if (!abort) {
      promise.then(
        pokemon => {
          dispatch({type: 'resolved', data: pokemon})
        },
        error => {
          dispatch({type: 'rejected', error})
        },
      )
    }
  }, [abort]);

  return { ...state, run};
}

function PokemonInfo({pokemonName, abort}) {
  const {data, status, error, run} = useAsync({
    status: pokemonName ? 'pending' : 'idle',
  }, abort)

  React.useEffect(() => {
    if (!pokemonName) {
      return;
    }

    run(fetchPokemon(pokemonName))
  },[run, pokemonName])

  if (status === 'idle' || !pokemonName) {
    return 'Submit a pokemon'
  } else if (status === 'pending') {
    return <PokemonInfoFallback name={pokemonName} />
  } else if (status === 'rejected') {
    throw error
  } else if (status === 'resolved') {
    return <PokemonDataView pokemon={data} />
  }

  throw new Error('This should be impossible')
}

function App() {
  const [shouldAbort, setShouldAbort] = React.useState(false);
  const [pokemonName, setPokemonName] = React.useState('')

  React.useEffect(() => {
    return () => {
      setShouldAbort(true);
    }
  }, [])

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleReset() {
    setPokemonName('')
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <div className="pokemon-info">
        <PokemonErrorBoundary onReset={handleReset} resetKeys={[pokemonName]}>
          <PokemonInfo pokemonName={pokemonName} abort={shouldAbort}/>
        </PokemonErrorBoundary>
      </div>
    </div>
  )
}

function AppWithUnmountCheckbox() {
  const [mountApp, setMountApp] = React.useState(true)


  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={mountApp}
          onChange={e => setMountApp(e.target.checked)}
        />{' '}
        Mount Component
      </label>
      <hr />
      {mountApp ? <App /> : null}
    </div>
  )
}

export default AppWithUnmountCheckbox
