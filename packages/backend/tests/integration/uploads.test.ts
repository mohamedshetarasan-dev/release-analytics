import path from 'path';
import request from 'supertest';
import { resetDb, initDb } from '../../src/config/database';
import app from '../../src/app';

const FIXTURE_CSV = path.join(__dirname, '../fixtures/sample-export.csv');

beforeEach(async () => {
  resetDb();
  await initDb();
});

describe('POST /api/v1/uploads', () => {
  it('accepts a valid CSV and returns import result', async () => {
    const res = await request(app)
      .post('/api/v1/uploads')
      .attach('file', FIXTURE_CSV);

    expect(res.status).toBe(202);
    expect(res.body).toMatchObject({
      jobId:        expect.any(String),
      rowsImported: expect.any(Number),
      rowsSkipped:  expect.any(Number),
      rowsFailed:   expect.any(Number),
      errors:       expect.any(Array),
    });
    expect(res.body.rowsImported).toBeGreaterThan(0);
  });

  it('returns 400 when no file is attached', async () => {
    const res = await request(app).post('/api/v1/uploads');
    expect(res.status).toBe(400);
  });

  it('returns 400 for unsupported file type', async () => {
    const res = await request(app)
      .post('/api/v1/uploads')
      .attach('file', Buffer.from('not a file'), { filename: 'bad.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/uploads/:jobId', () => {
  it('returns the import job after upload', async () => {
    const uploadRes = await request(app)
      .post('/api/v1/uploads')
      .attach('file', FIXTURE_CSV);

    const jobId = uploadRes.body.jobId;
    const res = await request(app).get(`/api/v1/uploads/${jobId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(jobId);
    expect(res.body.status).toBe('completed');
  });

  it('returns 404 for unknown job ID', async () => {
    const res = await request(app).get('/api/v1/uploads/nonexistent');
    expect(res.status).toBe(404);
  });
});
