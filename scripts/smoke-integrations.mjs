import assert from 'node:assert/strict';

const API_BASE = (process.env.API_BASE_URL ?? 'http://localhost:3333/v1').replace(/\/$/, '');
const EXPECT_LOCAL = parseBoolean(process.env.FORCE_LOCAL_EXPECTED ?? 'true');

const PROVIDERS = [
  'linkedin',
  'github',
  'upwork',
  'fiverr',
  'behance',
  'dribbble',
  'figma',
  'coursera',
  'udemy',
];

function parseBoolean(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase().trim());
}

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message ?? `${response.status} ${response.statusText}`;
    throw new Error(`${method} ${path} failed: ${message}`);
  }

  return data;
}

async function main() {
  const now = Date.now();
  const email = `integration-smoke-${now}@example.com`;
  const password = `SmokePass!${now}`;

  console.log(`Using API ${API_BASE}`);
  console.log(`Local-mode expectation: ${EXPECT_LOCAL ? 'enabled' : 'disabled'}`);

  const signup = await request('/auth/signup', {
    method: 'POST',
    body: {
      fullName: 'Integration Smoke',
      email,
      password,
      persona: 'JobSeeker',
    },
  });

  const accessToken = signup?.accessToken;
  assert(accessToken, 'Signup did not return accessToken');

  const listBefore = await request('/integrations', { token: accessToken });
  const providerIds = listBefore.map((row) => row.id);
  assert.deepEqual(providerIds, PROVIDERS, 'Provider catalog/order mismatch');

  for (const provider of PROVIDERS) {
    const connectResult = await request(`/integrations/connect/${provider}`, {
      method: 'POST',
      token: accessToken,
      body: {},
    });

    assert.equal(connectResult.provider, provider, `Unexpected provider in connect response for ${provider}`);

    if (EXPECT_LOCAL) {
      assert.equal(connectResult.authUrl, null, `${provider} returned authUrl in local mode`);
      assert.equal(connectResult.connected, true, `${provider} did not connect in local mode`);
      assert.equal(connectResult.fallbackMode, true, `${provider} did not report fallback mode`);
    }
  }

  const listConnected = await request('/integrations', { token: accessToken });
  for (const provider of PROVIDERS) {
    const row = listConnected.find((item) => item.id === provider);
    assert(row, `Missing provider after connect: ${provider}`);
    assert.equal(row.connected, true, `${provider} should be connected after connect`);
  }

  for (const provider of PROVIDERS) {
    await request(`/integrations/${provider}`, { method: 'DELETE', token: accessToken });
  }

  const listAfterDisconnect = await request('/integrations', { token: accessToken });
  for (const provider of PROVIDERS) {
    const row = listAfterDisconnect.find((item) => item.id === provider);
    assert(row, `Missing provider after disconnect: ${provider}`);
    assert.equal(row.connected, false, `${provider} should be disconnected`);
  }

  console.log('Integration smoke test passed for all providers.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
