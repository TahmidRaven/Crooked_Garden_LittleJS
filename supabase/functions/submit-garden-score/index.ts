import {createSubmitHandler} from './handler.js';

Deno.serve(createSubmitHandler({
  url:Deno.env.get('SUPABASE_URL'),
  key:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
}));
