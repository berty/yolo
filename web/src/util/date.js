import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import isToday from 'dayjs/plugin/isToday'

dayjs.extend(localizedFormat)
dayjs.extend(advancedFormat)
dayjs.extend(relativeTime)
dayjs.extend(isToday)

const getDay = (rawDate, formatString = 'YYYY-MM-DDTHH:mm:ssZ') => {
  const isValid = dayjs(rawDate, formatString).isValid()
  return isValid
    ? dayjs(dayjs(rawDate, formatString).format('YYYY-MM-DD'))
    : null
}

export const getIsNextDay = (
  rawDateItem = '',
  rawDateItemPrevious = '',
  formatString = 'YYYY-MM-DDTHH:mm:ssZ',
) => {
  const dayItem = getDay(rawDateItem, formatString)
  const dayItemPrevious = getDay(rawDateItemPrevious, formatString)
  if (!dayItem || !dayItemPrevious) return false
  return dayItem && dayItemPrevious
    ? dayjs(dayItem).isBefore(dayItemPrevious)
    : false
}

export const getDayFormat = (
  rawDate = '',
  formatString = 'YYYY-MM-DDTHH:mm:ssZ',
) => {
  const date = dayjs(rawDate, formatString)
  const today = () => date.isToday() ? 'Today' : ''
  const dayFormatted = () => date.format('LL')
  return date.isValid() && (today() || dayFormatted())
}

export const getRelativeTime = (
  rawDate = '',
  formatString = 'YYYY-MM-DDTHH:mm:ssZ',
) => {
  const isValid = rawDate && dayjs(rawDate, formatString).isValid()
  return !isValid ? '' : dayjs(dayjs(rawDate, formatString)).fromNow()
}

export const getTimeLabel = (
  label = '',
  rawDate = '',
  formatString = 'YYYY-MM-DDTHH:mm:ssZ',
) => {
  const isValid = rawDate && dayjs(rawDate, formatString).isValid()
  return !isValid
    ? ''
    : label
      ? `${label}: ${dayjs(rawDate, formatString)}`
      : dayjs(rawDate, formatString)
}

export const getTimeDuration = (
  rawDateStart = '',
  rawDateStop = '',
  unit = 'second',
  formatString = 'YYYY-MM-DDTHH:mm:ssZ',
) => {
  const isValid = dayjs(rawDateStart, formatString).isValid()
    && dayjs(rawDateStop, formatString).isValid()
  return !isValid
    ? undefined
    : dayjs(dayjs(rawDateStop, formatString)).diff(
      dayjs(rawDateStart, formatString),
      unit,
    )
}
