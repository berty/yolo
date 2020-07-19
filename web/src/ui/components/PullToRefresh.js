import React from 'react'
import { PullToRefresh } from 'react-js-pull-to-refresh'

const RefreshContent = () => (
  <div
    style={{
      backgroundColor: 'transparent',
      textAlign: 'center',
      height: 75,
      width: '100vw',
    }}
  />
)

const ReleaseContent = () => (
  <div
    style={{
      height: 75,
      width: '100vw',
    }}
  />
)

const PullDownContent = () => (
  <div
    style={{
      textAlign: 'center',
      height: 75,
      width: '100vw',
    }}
  />
)

const PullToRefreshWrapper = ({
  onRefresh, children, isAuthed, isMobile,
}) => (
  <PullToRefresh
    pullDownContent={<PullDownContent />}
    releaseContent={<ReleaseContent />}
    refreshContent={<RefreshContent />}
    pullDownThreshold={50}
    onRefresh={onRefresh}
    triggerHeight={isAuthed && isMobile ? 200 : 0}
    // startInvisible
    backgroundColor="invisible"
  >
    {children}
  </PullToRefresh>
)

export default PullToRefreshWrapper
