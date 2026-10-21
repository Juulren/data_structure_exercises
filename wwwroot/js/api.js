export async function request(path, method = 'GET', data) {
  const response = await fetch(`/api/listas/${path}`, {
    method,
    headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data)
  });
  let result;
  try { result = await response.json(); }
  catch { throw new Error('El servidor devolvió una respuesta no válida'); }
  if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo completar la operación');
  return result.data;
}
