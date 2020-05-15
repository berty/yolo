import { faApple, faAndroid } from '@fortawesome/free-brands-svg-icons'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import { ARTIFACT_KIND_VALUE, ARTIFACT_KIND_NAMES } from '../../constants'

const artifactKindIcon = {
  [ARTIFACT_KIND_NAMES.IPA]: faApple,
  [ARTIFACT_KIND_VALUE.IPA.toString()]: faApple,
  [ARTIFACT_KIND_NAMES.DMG]: faApple,
  [ARTIFACT_KIND_VALUE.DMG.toString()]: faApple,
  [ARTIFACT_KIND_NAMES.APK]: faAndroid,
  [ARTIFACT_KIND_VALUE.APK.toString()]: faAndroid,
  [ARTIFACT_KIND_NAMES.UnknownKind]: faQuestionCircle,
  [ARTIFACT_KIND_VALUE.UnknownKind.toString()]: faQuestionCircle,
}

export const getArtifactKindIcon = (artifactKind = '') => artifactKindIcon[artifactKind.toString()] || artifactKindIcon[ARTIFACT_KIND_NAMES.UnknownKind]
