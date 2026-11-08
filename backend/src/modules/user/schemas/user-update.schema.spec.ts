import { z } from 'zod';

import { UpdateUserSchema } from './user-update.schema';

describe('UpdateUserSchema', () => {
  it('can be represented as JSON Schema for Swagger', () => {
    expect(() => z.toJSONSchema(UpdateUserSchema)).not.toThrow();
  });
});
