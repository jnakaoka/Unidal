// Run from mobile: node --test tests/face-capture.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/utils/faceCapture.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, context);
const { faceCaptureError } = context.exports;
for (const code of ['ECONNABORTED', 'ETIMEDOUT']) {
  test(`${code} explains timeout without claiming photo was rejected or saved`, () => {
    const result = faceCaptureError({ code });
    assert.equal(result.title, 'Validação demorada');
    assert.match(result.message, /cadastro ainda não foi enviado/);
  });
}
test('connection failure is separate from photo rejection', () => {
  assert.equal(faceCaptureError({ code: 'ERR_NETWORK' }).title, 'Falha de ligação');
});
test('422 preserves detection reason and reference for diagnostics', () => {
  const result = faceCaptureError({ response: { status: 422, data: { detail: 'Nenhum rosto detetado.' }, headers: { 'x-face-request-id': 'abcdef123456' } } });
  assert.equal(result.title, 'Captura rejeitada');
  assert.match(result.message, /Nenhum rosto detetado/);
  assert.match(result.message, /abcdef123456/);
});
for (const status of [500, 503]) {
  test(`${status} identifies server failure, not invalid positioning`, () => {
    assert.equal(faceCaptureError({ response: { status } }).title, 'API indisponível');
  });
}
test('auth failures explain session and permissions', () => {
  assert.equal(faceCaptureError({ response: { status: 401 } }).title, 'Sessão expirada');
  assert.equal(faceCaptureError({ response: { status: 403 } }).title, 'Sem permissão');
});
test('structured validation details and unexpected references are not printed raw', () => {
  const result = faceCaptureError({ response: { status: 422, data: { detail: [{ msg: 'internal' }] }, headers: { 'x-face-request-id': 'unexpected text' } } });
  assert.equal(result.title, 'Captura rejeitada');
  assert.doesNotMatch(result.message, /internal|unexpected|object Object/);
});


test('missing stored refresh token is identified as expired session', () => {
  const result = faceCaptureError({ message: 'Sessão expirada. Volte a iniciar sessão.' });
  assert.equal(result.title, 'Sessão expirada');
});
