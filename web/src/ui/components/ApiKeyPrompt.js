import classNames from 'classnames'
import React, {
  useContext, useEffect, useRef, useState,
} from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { setAuthCookie } from '../../api/cookies'
import { ThemeContext } from '../../store/ThemeStore'
import { getSafeStr } from '../../util/getters'

const ApiKeyPrompt = ({
  failedKey, authIsPending, updateState,
}) => {
  const { theme: { text: { sectionTitle } } } = useContext(ThemeContext)
  const [formApiKey, updateFormApiKey] = useState('')
  const submitBtnClass = classNames('btn', 'btn-primary', { disabled: authIsPending || !formApiKey })
  const inputEl = useRef(null)
  const history = useHistory()
  const { search: locationSearch } = useLocation()
  useEffect(() => inputEl.current.focus())

  const onFormSubmit = (e) => {
    e.preventDefault()
    setAuthCookie({ apiKey: `${btoa(getSafeStr(formApiKey))}` })
    updateState({
      apiKey: btoa(getSafeStr(formApiKey)),
      needsRefresh: true,
      authIsPending: true,
    })
    inputEl.current.value = ''
    history.push({
      path: '/',
      search: locationSearch,
    })
  }
  useEffect(() => { inputEl.current.focus() })

  return (
    <section>
      <form className="form-group" onSubmit={onFormSubmit}>
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
            placeholder={`Current key: ${(failedKey && getSafeStr(atob(failedKey))) || 'no key set'}`}
            onChange={(e) => {
              updateFormApiKey(e.target.value)
            }}
            disabled={authIsPending}
          />
        </div>
        <button
          type="submit"
          className={submitBtnClass}
          onClick={onFormSubmit}
          disabled={!formApiKey || authIsPending}
        >
          Update
        </button>
      </form>
    </section>
  )
}

export default ApiKeyPrompt
