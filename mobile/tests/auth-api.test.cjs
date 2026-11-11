// Run from mobile: node --test tests/auth-api.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const axios = require('axios');

function loadApi(handler, initialTokens = {}, env = {}) {
  const tokens = new Map(Object.entries(initialTokens));
  const calls = [];
  const storageReads = [];
  const adapter = async (config) => {
    calls.push(config);
    const { status = 200, data } = await handler(config);
    const response = { status, data, config, headers: {}, statusText: String(status) };
    if (status >= 400) {
      throw new axios.AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, response);
    }
    return response;
  };
  const http = axios.create({ adapter });
  http.create = (config) => axios.create({ ...config, adapter });
  const secureStore = {
    async getItemAsync(key) { storageReads.push(key); return tokens.get(key) || null; },
    async setItemAsync(key, value) { tokens.set(key, value); },
    async deleteItemAsync(key) { tokens.delete(key); },
  };
  const source = fs.readFileSync(path.join(__dirname, '../src/services/api.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const context = {
    exports: {}, URL, URLSearchParams, console: { log() {} },
    FormData: class {
      fields = [];
      append(name, value) { this.fields.push([name, value]); }
      get [Symbol.toStringTag]() { return 'FormData'; }
      toString() { return '[object FormData]'; }
    },
    process: { env: { EXPO_PUBLIC_API_BASE_URL: 'https://test.invalid', ...env } },
    require(name) {
      if (name === 'axios') return http;
      if (name === 'expo-secure-store') return secureStore;
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  vm.runInNewContext(compiled, context);
  return { ...context.exports, calls, tokens, storageReads };
}

for (const existingTokens of [false, true]) {
  test(`login 401 preserves API error without refresh (existing session: ${existingTokens})`, async () => {
    const app = loadApi(() => ({ status: 401, data: { detail: 'Credenciais inválidas' } }),
      existingTokens ? { unidal_access_token: 'old-access', unidal_refresh_token: 'old-refresh' } : {});
    await assert.rejects(app.authApi.login('test@example.com', 'incorrect'), (error) => {
      assert.equal(error.response.status, 401);
      assert.equal(error.response.data.detail, 'Credenciais inválidas');
      return true;
    });
    assert.equal(app.calls.length, 1);
    assert.equal(app.calls[0].url, '/auth/login/');
    assert.equal(app.calls[0].headers.Authorization, undefined);
    assert.equal(app.storageReads.length, 0);
    if (existingTokens) assert.equal(app.tokens.get('unidal_refresh_token'), 'old-refresh');
  });
}

test('successful login saves both tokens and uses them on protected requests', async () => {
  const app = loadApi((config) => {
    if (config.url === '/auth/login/') {
      assert.deepEqual(JSON.parse(config.data), { email: 'test@example.com', password: 'test-password' });
      assert.equal(config.headers.Authorization, undefined);
      return { data: { access_token: 'new-access', refresh_token: 'new-refresh' } };
    }
    assert.equal(config.url, '/auth/me/');
    assert.equal(config.headers.Authorization, 'Bearer new-access');
    return { data: { id: 12 } };
  }, { unidal_access_token: 'old-access' });
  await app.authApi.login('test@example.com', 'test-password');
  assert.equal(app.tokens.get('unidal_access_token'), 'new-access');
  assert.equal(app.tokens.get('unidal_refresh_token'), 'new-refresh');
  assert.equal((await app.authApi.me()).id, 12);
});

test('expired access token refreshes and retries a protected request', async () => {
  const app = loadApi((config) => {
    if (config.url === '/auth/refresh') {
      assert.equal(config.headers.Authorization, undefined);
      assert.equal(new URLSearchParams(config.data).get('refresh_token'), 'refresh');
      return { data: { access_token: 'renewed' } };
    }
    return config.headers.Authorization === 'Bearer renewed'
      ? { data: { id: 12 } }
      : { status: 401, data: { detail: 'Token expirado' } };
  }, { unidal_access_token: 'expired', unidal_refresh_token: 'refresh' });
  assert.equal((await app.authApi.me()).id, 12);
  assert.equal(app.calls.length, 3);
  assert.equal(app.tokens.get('unidal_refresh_token'), 'refresh');
});

test('missing refresh token clears expired session and asks for login', async () => {
  const app = loadApi(() => ({ status: 401, data: {} }), { unidal_access_token: 'expired' });
  await assert.rejects(app.authApi.me(), /Sessão expirada/);
  assert.equal(app.calls.length, 1);
  assert.equal(app.tokens.size, 0);
});

test('rejected refresh clears tokens without a refresh loop', async () => {
  const app = loadApi(() => ({ status: 401, data: { detail: 'Token inválido ou expirado' } }),
    { unidal_access_token: 'expired', unidal_refresh_token: 'expired-refresh' });
  await assert.rejects(app.authApi.me());
  assert.equal(app.calls.length, 2);
  assert.equal(app.tokens.size, 0);
});

test('network failure during login does not attempt refresh', async () => {
  const app = loadApi(() => { throw new axios.AxiosError('Network Error', 'ERR_NETWORK'); });
  await assert.rejects(app.authApi.login('test@example.com', 'test-password'), /Network Error/);
  assert.equal(app.calls.length, 1);
  assert.equal(app.tokens.size, 0);
});


test('verification uploads one new selfie to the selected ID and returns non-match normally', async () => {
  const app = loadApi((config) => {
    assert.equal(config.url, '/biometrics/users/2/verify');
    assert.equal(config.timeout, 60000);
    assert.equal(config.headers.Authorization, 'Bearer access');
    assert.equal(config.data.fields.length, 1);
    assert.equal(config.data.fields[0][0], 'image');
    assert.equal(config.data.fields[0][1].uri, 'file:///selfie.jpg');
    return { data: { matched: false, user_id: 2, similarity: .1, threshold: .5 } };
  }, { unidal_access_token: 'access' }, { EXPO_PUBLIC_FACE_BIOMETRICS_ENABLED: 'true' });
  const result = await app.biometricsApi.verify(2, 'file:///selfie.jpg');
  assert.equal(result.matched, false);
  assert.equal(app.calls.length, 1);
});

test('verification remains disabled outside experimental APK', async () => {
  const app = loadApi(() => { throw new Error('Must not send'); });
  await assert.rejects(app.biometricsApi.verify(2, 'file:///selfie.jpg'), /desativada/);
  assert.equal(app.calls.length, 0);
});

test('verification cannot send a selfie to production API', async () => {
  const app = loadApi(() => { throw new Error('Must not send'); }, {}, {
    EXPO_PUBLIC_FACE_BIOMETRICS_ENABLED: 'true', EXPO_PUBLIC_API_BASE_URL: 'https://api.unidal.pt',
  });
  await assert.rejects(app.biometricsApi.verify(2, 'file:///selfie.jpg'), /produção/);
  assert.equal(app.calls.length, 0);
});
