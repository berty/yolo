import React from 'react'
import BuildList from './BuildList'
import Spinner from './Spinner'

const BuildListContainer = ({ loaded, builds }) => {
  // TODO: Dim stale builds instead of hiding them on quiet refresh
  // const { state: { needsQuietRefresh } } = useContext(ResultContext)
  const Loading = () => (
    <>
      <div className="faded" />
      <Spinner />

    </>
  )
  return <>{!loaded ? <Loading /> : <BuildList builds={builds} />}</>
}

export default BuildListContainer
