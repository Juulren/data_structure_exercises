export async function request(path, method = 'GET', data) {
  return apiRequest('listas', path, method, data);
}

export async function apiRequest(module, path, method = 'GET', data, signal) {
  const response = await fetch(`/api/${module}/${path}`, {
    method,
    headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
    signal
  });
  let result;
  try { result = await response.json(); }
  catch { throw new Error('El servidor devolvió una respuesta no válida'); }
  if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo completar la operación');
  return result.data;
}
