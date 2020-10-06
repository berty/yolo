import React from 'react'
import {
  PullToRefresh,
  PullDownContent,
  RefreshContent,
  ReleaseContent,
} from 'react-js-pull-to-refresh'

export const PullToRefreshWrapper = ({ onRefresh, children }) => (
  <PullToRefresh
    pullDownThreshold={80}
    onRefresh={onRefresh}
    triggerHeight={200}
    {...{ PullDownContent, RefreshContent, ReleaseContent }}
  >
    {children}
  </PullToRefresh>
)
