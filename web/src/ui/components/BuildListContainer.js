import React, { useContext } from 'react'

import { ThemeContext } from '../../store/ThemeStore'
import BuildList from './BuildList'

const BuildListContainer = ({ loaded, builds }) => {
  const { theme } = useContext(ThemeContext)
  const Loading = () => (
    <div style={{ color: theme.text.sectionText }}>Loading...</div>
  )
  return <>{!loaded ? <Loading /> : <BuildList builds={builds} />}</>
}

export default BuildListContainer
