import {BRANCH} from '../constants';

export const queryHasMaster = {
  condition: (builds) =>
    builds &&
    Array.isArray(builds) &&
    builds.find(
      (build) =>
        build.branch &&
        typeof build === 'string' &&
        build.branch.toUpperCase() === BRANCH.MASTER
    )
      ? false
      : true,
  toCollapse: (build) => {
    return (
      (build && !build.branch) ||
      (build && build.branch && build.branch.toUpperCase() !== BRANCH.MASTER)
    );
  },
};
