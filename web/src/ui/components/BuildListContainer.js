import React from 'react'
import BuildList from './BuildList'
import Spinner from './Spinner/Spinner'
import ConditionallyWrappedComponent from './ConditionallyWrappedComponent'

const BuildListContainer = ({ loaded, builds }) => {
  const Loading = ({ children }) => (
    <>
      <div className="faded" />
      <Spinner />
      {children}
    </>
  )
  const WithLoading = () => (
    <ConditionallyWrappedComponent condition={!loaded} wrapper={(children) => <Loading>{children}</Loading>}>
      <BuildList builds={builds} loaded={loaded} />
    </ConditionallyWrappedComponent>
  )
  return <WithLoading />
}

export default BuildListContainer
