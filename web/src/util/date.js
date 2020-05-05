import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

export const checkValidDate = (
  rawDate,
  formatString = 'YYYY-MM-DDTHH:mm:ssZ'
) => {
  dayjs.extend(advancedFormat);
  dayjs.extend(relativeTime);
  return rawDate && dayjs(rawDate, formatString).isValid();
};

export const getRelativeTime = (
  rawDate,
  formatString = 'YYYY-MM-DDTHH:mm:ssZ'
) => {
  dayjs.extend(advancedFormat);
  dayjs.extend(relativeTime);
  const isValid = rawDate && dayjs(rawDate, formatString).isValid();
  return !isValid ? '' : dayjs(dayjs(rawDate, formatString)).fromNow();
};

export const getTimeLabel = (
  label = '',
  rawDate = '',
  formatString = 'YYYY-MM-DDTHH:mm:ssZ'
) => {
  dayjs.extend(advancedFormat);
  dayjs.extend(relativeTime);
  const isValid = rawDate && dayjs(rawDate, formatString).isValid();
  return !isValid
    ? ''
    : label
    ? `${label}: ${dayjs(rawDate, formatString)}`
    : dayjs(rawDate, formatString);
};

export const getTimeDuration = (
  rawDateStart = '',
  rawDateStop = '',
  unit = 'second',
  formatString = 'YYYY-MM-DDTHH:mm:ssZ'
) => {
  const isValid =
    dayjs(rawDateStart, formatString).isValid() &&
    dayjs(rawDateStop, formatString).isValid();
  return !isValid
    ? undefined
    : dayjs(dayjs(rawDateStop, formatString)).diff(
        dayjs(rawDateStart, formatString),
        unit
      );
};
