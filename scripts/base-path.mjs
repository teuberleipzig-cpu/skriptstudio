export function basePath(value = process.env.BASE_PATH || '/skriptstudio/') {
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(value)) throw new Error('BASE_PATH muss / oder ein Unterpfad mit abschließendem / sein, z. B. /skriptstudio/.');
  return value;
}
