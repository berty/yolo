import React, { useContext } from 'react'

import { ThemeContext } from '../../store/ThemeStore'
import BuildList from './BuildList'
import { ResultContext } from '../../store/ResultStore'

const BuildListContainer = ({ loaded, builds, collapseCondition }) => {
  const { theme } = useContext(ThemeContext)
  const { buildsByMr } = useContext(ResultContext)
  const Loading = () => (
    <div style={{ color: theme.text.sectionText }}>Loading...</div>
  )
  return (
    <>
      {!loaded ? (
        <Loading />
      ) : (
        <BuildList
          builds={builds}
          buildsByMr={buildsByMr}
          collapseCondition={collapseCondition}
        />
      )}
    </>
  )
}

export default BuildListContainer
