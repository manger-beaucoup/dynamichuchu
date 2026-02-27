export function toDate(value) {
  return new Date(`${value}T00:00:00`);
}

export function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthToDate(month) {
  return new Date(`${month}-01T00:00:00`);
}

export function enumerateMonths(startMonth, endMonth) {
  const result = [];
  const cursor = monthToDate(startMonth);
  const end = monthToDate(endMonth);

  while (cursor <= end) {
    result.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return result;
}

export function diffDaysInclusive(startDate, endDate) {
  const start = toDate(startDate);
  const end = toDate(endDate);
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}
