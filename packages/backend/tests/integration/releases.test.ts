import request from 'supertest';
import { resetDb, initDb, getDb } from '../../src/config/database';
import { workItems } from '../../src/db/schema';
import app from '../../src/app';
import { createRelease } from '../../src/services/releaseService';
import { v4 as uuidv4 } from 'uuid';

beforeEach(async () => {
  resetDb();
  await initDb();
});

describe('GET /api/v1/releases', () => {
  it('returns empty array when no releases', async () => {
    const res = await request(app).get('/api/v1/releases');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns list of releases', async () => {
    await createRelease('1.0.0');
    await createRelease('2.0.0');
    const res = await request(app).get('/api/v1/releases');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('POST /api/v1/releases', () => {
  it('creates a release', async () => {
    const res = await request(app)
      .post('/api/v1/releases')
      .send({ version: '1.0.0', name: 'First' });
    expect(res.status).toBe(201);
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.name).toBe('First');
  });

  it('returns 400 when version is missing', async () => {
    const res = await request(app).post('/api/v1/releases').send({});
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate version', async () => {
    await createRelease('1.0.0');
    const res = await request(app)
      .post('/api/v1/releases')
      .send({ version: '1.0.0' });
    expect(res.status).toBe(409);
  });
});

describe('GET /api/v1/releases/:id', () => {
  it('returns release by ID', async () => {
    const release = await createRelease('1.0.0');
    const res = await request(app).get(`/api/v1/releases/${release.id}`);
    expect(res.status).toBe(200);
    expect(res.body.version).toBe('1.0.0');
  });

  it('returns 404 for unknown ID', async () => {
    const res = await request(app).get('/api/v1/releases/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/releases/:id', () => {
  it('updates name and status', async () => {
    const release = await createRelease('1.0.0');
    const res = await request(app)
      .put(`/api/v1/releases/${release.id}`)
      .send({ name: 'Updated', status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated');
    expect(res.body.status).toBe('completed');
  });

  it('returns 400 for invalid status', async () => {
    const release = await createRelease('1.0.0');
    const res = await request(app)
      .put(`/api/v1/releases/${release.id}`)
      .send({ status: 'invalid' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/releases/:id', () => {
  it('deletes the release and returns 204', async () => {
    const release = await createRelease('1.0.0');
    const res = await request(app).delete(`/api/v1/releases/${release.id}`);
    expect(res.status).toBe(204);

    const getRes = await request(app).get(`/api/v1/releases/${release.id}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 for unknown ID', async () => {
    const res = await request(app).delete('/api/v1/releases/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/releases/:id/work-items', () => {
  it('returns work items for a release', async () => {
    const release = await createRelease('1.0.0');
    const db = getDb();
    await db.insert(workItems).values([
      { id: uuidv4(), azureId: 'wi-1', releaseVersion: '1.0.0', type: 'bug',  title: 'Bug 1',  state: 'Active' },
      { id: uuidv4(), azureId: 'wi-2', releaseVersion: '1.0.0', type: 'task', title: 'Task 1', state: 'Closed' },
    ]).run();

    const res = await request(app).get(`/api/v1/releases/${release.id}/work-items`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('filters by type', async () => {
    const release = await createRelease('1.0.0');
    const db = getDb();
    await db.insert(workItems).values([
      { id: uuidv4(), azureId: 'wi-1', releaseVersion: '1.0.0', type: 'bug',  title: 'Bug 1',  state: 'Active' },
      { id: uuidv4(), azureId: 'wi-2', releaseVersion: '1.0.0', type: 'task', title: 'Task 1', state: 'Closed' },
    ]).run();

    const res = await request(app).get(`/api/v1/releases/${release.id}/work-items?type=bug`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].type).toBe('bug');
  });
});
