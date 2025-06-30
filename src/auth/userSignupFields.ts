import { defineUserSignupFields } from 'wasp/server/auth';

// Prop functions must be async. See FieldGetter that returns a Promise. 
export const userSignupFields = defineUserSignupFields({
  firstName: async (data) => data.firstName as string,
  // username: async (data) => data.username as string,
  // lastName: (data) => data.lastName as string,
});
