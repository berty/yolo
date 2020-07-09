import React from 'react'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import BintrayIconOnLight from '../../assets/svg/bintray_svg.svg'
import BintrayIconOnDark from '../../assets/svg/bintray_svg_white.svg'
import BuildKite from '../../assets/svg/bkbw.svg'
import CircleCiOnLight from '../../assets/img/cci_black.png'
import CircleCiOnDark from '../../assets/img/cci_white.png'
import { BUILD_DRIVER_NAMES } from '../../constants'

export const fromBlack = ({ themeName = 'dark' }) => {
  const toFilterAccentColor = themeName === 'dark'
    ? 'invert(54%) sepia(98%) saturate(3041%) hue-rotate(216deg) brightness(96%) contrast(102%)'
    : 'invert(28%) sepia(90%) saturate(5298%) hue-rotate(236deg) brightness(96%) contrast(91%)'

  return {
    toFilterAccentColor,
  }
}

// TODO: Refactor
const buildDriverIcon = {
  light: {
    [BUILD_DRIVER_NAMES.Bintray.toUpperCase()]: ({ styles = {} }) => (
      <img
        src={BintrayIconOnLight}
        style={{ height: '1rem', ...styles }}
        alt={`${BUILD_DRIVER_NAMES.Bintray} logo`}
        title={`${BUILD_DRIVER_NAMES.Bintray}`}
      />
    ),
    [BUILD_DRIVER_NAMES.Buildkite.toUpperCase()]: ({ styles = {} }) => (
      <img
        src={BuildKite}
        style={{ height: '1rem', ...styles }}
        alt={`${BUILD_DRIVER_NAMES.Buildkite} logo`}
        title={`${BUILD_DRIVER_NAMES.Buildkite}`}
      />
    ),
    [BUILD_DRIVER_NAMES.CircleCI.toUpperCase()]: ({ styles = {} }) => (
      <img
        style={{ height: '1rem', ...styles }}
        src={CircleCiOnLight}
        alt={`${BUILD_DRIVER_NAMES.CircleCI} logo`}
        title={`${BUILD_DRIVER_NAMES.CircleCI}`}
      />
    ),
    [BUILD_DRIVER_NAMES.GitHub.toUpperCase()]: ({ styles = {} }) => (
      <FontAwesomeIcon
        icon={faGithub}
        color="black"
        size="lg"
        style={{
          ...styles,
        }}
        title={`${BUILD_DRIVER_NAMES.GitHub}`}
      />
    ),
    [BUILD_DRIVER_NAMES.UnknownDriver.toUpperCase()]: ({ styles = {} }) => (
      <FontAwesomeIcon
        icon={faQuestionCircle}
        color="black"
        size="lg"
        style={{ ...styles }}
        title={`${BUILD_DRIVER_NAMES.UnknownDriver}`}
      />
    ),
  },
  dark: {
    [BUILD_DRIVER_NAMES.Bintray.toUpperCase()]: ({ styles = {} }) => (
      <img
        src={BintrayIconOnDark}
        style={{ height: '1rem', ...styles }}
        alt={`${BUILD_DRIVER_NAMES.Bintray} logo`}
        title={`${BUILD_DRIVER_NAMES.Bintray}`}
      />
    ),
    [BUILD_DRIVER_NAMES.Buildkite.toUpperCase()]: ({ styles = {} }) => (
      <img
        src={BuildKite}
        style={{ height: '1rem', ...styles }}
        alt={`${BUILD_DRIVER_NAMES.Buildkite} logo`}
        title={`${BUILD_DRIVER_NAMES.Buildkite}`}
      />
    ),
    [BUILD_DRIVER_NAMES.CircleCI.toUpperCase()]: ({ styles = {} }) => (
      <img
        src={CircleCiOnDark}
        style={{ height: '1rem', ...styles }}
        alt={`${BUILD_DRIVER_NAMES.CircleCI} logo`}
        title={`${BUILD_DRIVER_NAMES.CircleCI}`}
      />
    ),
    [BUILD_DRIVER_NAMES.GitHub.toUpperCase()]: ({ styles = {} }) => (
      <FontAwesomeIcon
        icon={faGithub}
        color="white"
        size="lg"
        style={{ ...styles }}
        title={`${BUILD_DRIVER_NAMES.GitHub}`}
      />
    ),
    [BUILD_DRIVER_NAMES.UnknownDriver.toUpperCase()]: ({ styles = {} }) => (
      <FontAwesomeIcon
        icon={faQuestionCircle}
        color="white"
        size="lg"
        style={{ ...styles }}
        title={`${BUILD_DRIVER_NAMES.UnknownDriver}`}
      />
    ),
  },
}

export const getThemedBuildDriverIcon = ({ themeName = 'dark', logo = '' }) => {
  const icon = buildDriverIcon[themeName][logo.toString().toUpperCase()]
    || buildDriverIcon[BUILD_DRIVER_NAMES.UnknownDriver.toUpperCase()]
  return icon
}
