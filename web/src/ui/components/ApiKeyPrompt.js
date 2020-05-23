import React, {
  useState, useRef, useEffect,
} from 'react'
import { setAuthCookie } from '../../api/auth'
import withTheme from '../helpers/withTheme'

const ApiKeyPrompt = ({ failedKey, updateState, ...injectedProps }) => {
  const { theme: { text: { sectionTitle } } } = injectedProps
  const [formApiKey, updateFormApiKey] = useState(failedKey)
  const inputEl = useRef(null)
  useEffect(() => inputEl.current.focus())

  return (
    <section>
      <div className="form-group">
        <label className="mt-3 form-label mb-2">
          Enter an API key in the form of
          {' '}
          <strong
            style={{ fontFamily: 'monospace', color: sectionTitle }}
          >
            :password
          </strong>
        </label>
        <div className="input mb-3">
          <input
            ref={inputEl}
            type="text"
            className="form-control"
            placeholder={
              `Current key: ${(failedKey && atob(failedKey)) || 'no key set'}`
            }
            onChange={(e) => {
              updateFormApiKey(e.target.value)
            }}
          />
        </div>
        <button
          className="btn"
          onClick={() => {
            setAuthCookie({ apiKey: `${formApiKey}` })
            updateState({
              apiKey: btoa(formApiKey),
              needsProgrammaticQuery: true,
            })
          }}
          disabled={!formApiKey}
        >
          Update
        </button>
      </div>
    </section>
  )
}

export default withTheme(ApiKeyPrompt)
