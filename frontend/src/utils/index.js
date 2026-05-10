import {
  format,
  formatDistanceToNow,
  differenceInDays
} from 'date-fns';

export const formatDate = (
  date,
  fmt = 'MMM d, yyyy'
) => {
  if (!date) {
    return '';
  }

  return format(
    new Date(date),
    fmt
  );
};

export const formatRelative = (date) => {
  if (!date) {
    return '';
  }

  return formatDistanceToNow(
    new Date(date),
    {
      addSuffix: true
    }
  );
};

export const tripDuration = (
  start,
  end
) => {
  if (!start || !end) {
    return 0;
  }

  return (
    differenceInDays(
      new Date(end),
      new Date(start)
    ) + 1
  );
};

export const formatCurrency = (
  amount,
  currency = 'USD'
) => {
  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency
    }
  ).format(amount);
};

export const initials = (
  name = ''
) =>
  name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const statusColors = {
  planning:
    'text-amber bg-amber/10',

  upcoming:
    'text-sage bg-sage/10',

  ongoing:
    'text-amber bg-amber/10',

  completed:
    'text-sand-400 bg-sand-400/10',

  cancelled:
    'text-terracotta bg-terracotta/10',

  confirmed:
    'text-sage bg-sage/10',

  pending:
    'text-amber/80 bg-amber/10',

  not_booked:
    'text-sand-500 bg-sand-500/10',
};

export const categoryIcons = {
  transport: '✈️',
  accommodation: '🏨',
  food: '🍜',
  attraction: '🏛️',
  activity: '🎿',
  shopping: '🛍️',
  health: '💊',
  other: '📌',
};

export const clamp = (
  value,
  min,
  max
) =>
  Math.min(
    Math.max(value, min),
    max
  );

export const truncate = (
  str,
  len = 60
) =>
  str && str.length > len
    ? str.slice(0, len) + '…'
    : str;
