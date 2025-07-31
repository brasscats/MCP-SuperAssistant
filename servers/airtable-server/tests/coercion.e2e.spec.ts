import request from 'supertest';
import app from '../../src/app';

const META: any = {
  tables: [
    {
      name: 'Tasks',
      id: 'tblTasks',
      fields: [
        { name: 'Status', id: 'fldStatus', type: 'singleSelect', options: [
          {id:'optTodo',name:'Todo'},{id:'optDone',name:'Done'}]},
        { name: 'Tags', id: 'fldTags', type: 'multipleSelects', options: [
          {id:'optUrg',name:'Urgent'},{id:'optBlk',name:'Blocked'}]},
        { name: 'Done', id: 'fldDone', type: 'checkbox' },
      ],
    },
  ],
};

jest.mock('../../src/metadata', () => ({
  getTableInfo: jest.fn(async () => META.tables[0]),
}));

describe('field coercion', () => {
  it('coerces names → ids for select fields', async () => {
    const res = await request(app)
      .post('/airtable/create_record')
      .send({
        base: 'app123',
        table: 'Tasks',
        fields: { Status: 'Todo', Tags: ['Urgent'] },
      });

    expect(res.status).toBe(200);
    expect(res.body.sentPayload.fields).toEqual({
      Status: 'optTodo',
      Tags: ['optUrg'],
    });
  });

  it('casts checkbox string to boolean', async () => {
    const res = await request(app)
      .post('/airtable/update_record')
      .send({
        base: 'app123',
        table: 'Tasks',
        id: 'rec1',
        fields: { Done: 'true' },
      });

    expect(res.status).toBe(200);
    expect(res.body.sentPayload.fields.Done).toBe(true);
  });
});
