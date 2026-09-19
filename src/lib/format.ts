export const formatRelativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return 'щойно';
  }

  if (minutes < 60) {
    return `${minutes} хв тому`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} год тому`;
  }

  const days = Math.floor(hours / 24);
  return `${days} дн тому`;
};

export const formatDate = (iso: string): string => {
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));
};

export const formatDateTime = (iso: string): string => {
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
};

export const formatEventRange = (startsAt: string, endsAt: string): string => {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    const day = new Intl.DateTimeFormat('uk-UA', {
      day: 'numeric',
      month: 'long',
    }).format(start);
    const time = new Intl.DateTimeFormat('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${day}, ${time.format(start)} — ${time.format(end)}`;
  }

  return `${formatDateTime(startsAt)} — ${formatDateTime(endsAt)}`;
};

export const toLocalDateTimeInput = (iso?: string): string => {
  const d = iso ? new Date(iso) : new Date(Date.now() + 86400000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const getRoleHomePath = (role: string): string => {
  return role === 'teacher' ? '/teacher' : '/desk';
};
