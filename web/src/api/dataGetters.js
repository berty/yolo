import { getStrUpperCase } from '../util/getters'
import { BRANCH } from '../constants'

export const buildBranchIsMaster = (build) => getStrUpperCase(build.branch) === BRANCH.MASTER

export const oneBuildResultHasBranchMaster = (builds) => !!Array.isArray(builds) && builds.find((build) => buildBranchIsMaster(build))
