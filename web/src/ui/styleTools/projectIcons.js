import React from 'react'
import { faQuestionCircle, faCube } from '@fortawesome/free-solid-svg-icons'
import { MessageCircle } from 'react-feather'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { PROJECT } from '../../constants'

const projectIcon = {
  [PROJECT.chat]: () => (<MessageCircle />),
  [PROJECT['gomobile-ipfs-demo']]: () => (<FontAwesomeIcon icon={faCube} size="lg" />),
  [PROJECT.UnknownProject]: () => (<FontAwesomeIcon icon={faQuestionCircle} size="lg" />),
}

export const getProjectIcon = (project = '') => projectIcon[project] || projectIcon[PROJECT.UnknownProject]
