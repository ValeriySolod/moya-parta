export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
} as const;

export const XP_PER_LEVEL = 1000;

export const SUBJECT_LABELS: Record<string, string> = {
  math: 'Математика',
  ukrainian: 'Українська мова',
  reading: 'Читання',
  science: 'Я досліджую світ',
  art: 'Мистецтво',
  other: 'Інше',
};
