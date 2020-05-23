import React from 'react'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import {
  GitBranch, GitMerge, GitCommit,
} from 'react-feather'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { BRANCH_TO_DISPLAY_NAME } from '../../constants'

const vcsIcon = {
  [BRANCH_TO_DISPLAY_NAME.MASTER.toUpperCase()]: () => (<GitBranch />),
  [BRANCH_TO_DISPLAY_NAME.DEVELOP.toUpperCase()]: () => (<GitCommit />),
  [BRANCH_TO_DISPLAY_NAME.ALL.toUpperCase()]: () => (<GitMerge />),
  UnknownBranch: () => (<FontAwesomeIcon icon={faQuestionCircle} size="lg" />),
}

export const getVcsIcon = (branchType = '') => vcsIcon[branchType.toUpperCase()] || vcsIcon.UnknownBranch
