// Reinicia las fases 6–9 de una instancia de pruebas.
const assert = require('node:assert/strict');
const base = process.env.TEST_BASE_URL || 'http://localhost:5080';
let count = 0;
async function call(path, method = 'GET', data, status = 200, message) {
  const response = await fetch(`${base}/api/pilas/${path}`, { method, headers: data === undefined ? {} : { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
  assert.equal(response.status, status, `${method} ${path}`);
  const result = await response.json(); assert.equal(result.success, status < 400);
  if (message) assert.equal(result.message, message);
  count++; return result.data;
}
(async () => {
  for (let fase = 6; fase <= 9; fase++) await call(`${fase}/reiniciar`, 'DELETE');
  for (const path of ['invertir', 'palindromo', 'suma']) assert.equal(await call(path), null);
  assert.deepEqual((await call('valores')).elementos, []);
  await call('invertir', 'POST', {}, 400, 'Hay datos faltantes');
  await call('invertir', 'POST', { texto: 'dos palabras' }, 400, 'Introduce una sola palabra, sin espacios');
  let state = await call('invertir', 'POST', { texto: 'UTM' }); assert.equal(state.invertida, 'MTU');
  state = await call('invertir', 'POST', { texto: 'a👩‍💻b' }); assert.equal(state.invertida, 'b👩‍💻a');
  await call('invertir', 'POST', { texto: 'a'.repeat(81) }, 400, 'La palabra admite hasta 80 caracteres visibles');
  assert.equal((await call('invertir')).invertida, 'b👩‍💻a');
  for (const texto of ['ana', 'Malayalam', 'Oruro', 'sometemos', 'Anita lava la tina', 'Dábale arroz a la zorra el abad', '12321', 'aÑa']) {
    state = await call('palindromo', 'POST', { texto }); assert.equal(state.esPalindromo, true, texto);
    assert.ok(state.pasos.every(p => p.coincide));
  }
  state = await call('palindromo', 'POST', { texto: 'nñ' }); assert.equal(state.esPalindromo, false);
  await call('palindromo', 'POST', { texto: '!!!' }, 400, 'Introduce al menos una letra o un número');
  await call('palindromo', 'POST', { texto: '' }, 400, 'Hay datos faltantes');
  await call('palindromo', 'POST', { texto: 'a'.repeat(121) }, 400, 'El texto admite hasta 120 letras o números normalizados');
  for (const [operando1, operando2, resultado] of [['592', '3784', '4376'], ['999', '1', '1000'], ['000', '000', '0'], ['0', '123456789012345678901234567890', '123456789012345678901234567890']]) {
    state = await call('suma', 'POST', { operando1, operando2 }); assert.equal(state.resultado, resultado);
    assert.equal(state.pasos.map(p => p.digito).reverse().join(''), resultado);
  }
  state = await call('suma', 'POST', { operando1: '9'.repeat(1000), operando2: '1' });
  assert.equal(state.resultado, '1' + '0'.repeat(1000)); assert.equal(state.pasos.length, 1001);
  for (const operando1 of ['abc', '-1', '1.5', '1e3', '١']) await call('suma', 'POST', { operando1, operando2: '1' }, 400, 'Introducir sólo números');
  await call('suma', 'POST', { operando1: '1', operando2: '' }, 400, 'Hay datos faltantes');
  await call('suma', 'POST', { operando1: '1'.repeat(1001), operando2: '1' }, 400, 'Cada operando admite hasta 1000 dígitos');
  assert.equal((await call('suma')).resultado.length, 1001);
  await call('valores/tope', 'DELETE', undefined, 409, 'La pila está vacía');
  await call('valores', 'PUT', { viejo: '1', nuevo: '2' }, 409, 'La pila está vacía');
  for (const valor of ['abc', '1.5', '2147483648', '-2147483649']) await call('valores', 'POST', { valor }, 400, 'Introducir sólo números');
  await call('valores', 'POST', {}, 400, 'Hay datos faltantes');
  for (const valor of ['2', '-2147483648', '2', '2147483647', '2']) await call('valores', 'POST', { valor });
  state = await call('valores', 'PUT', { viejo: '2', nuevo: '-5' });
  assert.deepEqual(state.elementos, [-5, 2147483647, -5, -2147483648, -5]); assert.equal(state.reemplazos, 3);
  await call('valores', 'PUT', { viejo: '2', nuevo: '' }, 400, 'Hay datos faltantes');
  state = await call('valores', 'PUT', { viejo: '99', nuevo: '0' }); assert.equal(state.reemplazos, 0); assert.equal(state.tope, -5);
  state = await call('valores/tope', 'DELETE'); assert.equal(state.ultimoRetirado, -5); assert.equal(state.tope, 2147483647);
  await call('6/reiniciar', 'DELETE'); assert.equal(await call('invertir'), null); assert.equal((await call('valores')).cantidad, 4);
  await call('5/reiniciar', 'DELETE', undefined, 404, 'El ejercicio no existe');
  const malformed = await fetch(`${base}/api/pilas/suma`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(malformed.status, 400); assert.equal((await malformed.json()).success, false); count++;
  for (let fase = 6; fase <= 9; fase++) await call(`${fase}/reiniciar`, 'DELETE');
  console.log(`Pilas API: ${count} solicitudes verificadas correctamente.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
