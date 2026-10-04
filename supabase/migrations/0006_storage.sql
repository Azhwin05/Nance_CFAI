-- ============================================================================
-- Clickfield OS — 0006 storage: private documents bucket + object policies
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Authenticated users may read/write within the private documents bucket.
-- Fine-grained per-document authorization is enforced by the public.documents
-- table RLS + signed URLs issued server-side.
create policy "documents_auth_read" on storage.objects
  for select to authenticated using (bucket_id = 'documents');
create policy "documents_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents');
create policy "documents_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'documents') with check (bucket_id = 'documents');
create policy "documents_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'documents');
