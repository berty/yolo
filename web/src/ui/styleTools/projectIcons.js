import React from 'react'
import { faQuestionCircle, faCube } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { PROJECT } from '../../constants'
import IconProjectBertyMessenger from '../../assets/svg/IconProjectBertyMessenger'

const projectIcon = {
  [PROJECT.messenger]: () => (<IconProjectBertyMessenger size="20px" />),
  [PROJECT['gomobile-ipfs-demo']]: () => (<FontAwesomeIcon icon={faCube} size="lg" />),
  [PROJECT.UnknownProject]: () => (<FontAwesomeIcon icon={faQuestionCircle} size="lg" />),
}

export const getProjectIcon = (project = '') => projectIcon[project] || projectIcon[PROJECT.UnknownProject]
