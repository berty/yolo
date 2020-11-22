/**
 * https://stackoverflow.com/a/21742107
 *
 * Determine the mobile operating system.
 * This function returns one of 'iOS', 'Android', 'Windows Phone', or 'unknown'.
 */
export const getMobileOperatingSystem = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (/android/i.test(userAgent)) {
    return "Android";
  }

  // iOS detection from: http://stackoverflow.com/a/9039885/177710
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return "iOS";
  }

  return "Unknown OS";
};

export const onAccessibleClickHandler = (onClick) =>
  !onClick
    ? undefined
    : (e) => {
        e.stopPropagation();
        if (e.type === "click" || e.key === "Enter") {
          return onClick(e);
        }
      };
