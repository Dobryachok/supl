let counter = 0;

export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

const letters = 'ABCDEFGHKMNPRSTUVXZ';

/** Номер заявки в формате SS-YYMMDD-1055C. */
export function orderNumber(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const digits = String(1000 + Math.floor(Math.random() * 9000));
  const letter = letters[Math.floor(Math.random() * letters.length)];
  return `SS-${yy}${mm}${dd}-${digits}${letter}`;
}

/** Номер акта расхождений в формате АКТ-260904-014. */
export function actNumber(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `АКТ-${yy}${mm}${dd}-${seq}`;
}
