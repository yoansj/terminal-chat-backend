import { test } from 'tap';
import { build } from '../helper';

test('Create user', async (t) => {
  const app = await build(t);

  const res = await app.inject({
    url: '/users',
    method: 'POST',
    payload: {
      name: 'test',
      email: 'test',
      password: 'test',
    },
  });

  console.log(res.statusCode, '<===');
  console.log(res.payload);
  t.equal(res.statusCode, 201, 'Create user returns 201');
});

test('Dup user', async (t) => {
  const app = await build(t);

  await app.inject({
    url: '/users',
    method: 'POST',
    payload: {
      name: 'test',
      email: 'test',
      password: 'test',
    },
  });

  const res = await app.inject({
    url: '/users',
    method: 'POST',
    payload: {
      name: 'test',
      email: 'test',
      password: 'test',
    },
  });

  console.log(res.statusCode, '<===');
  console.log(res.payload);
  t.equal(res.statusCode, 409, 'Duplicate user returns 409');
});

test('Create user missing infos', async (t) => {
  const app = await build(t);

  const res = await app.inject({
    url: '/users',
    method: 'POST',
    payload: {
      nothing: true,
    },
  });

  console.log(res.statusCode, '<===');
  console.log(res.payload);
  t.equal(res.statusCode, 400, 'Missing infos should return 400');
});
