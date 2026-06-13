-- Up Migration

WITH new_accounts AS (
  INSERT INTO accounts (handle)
  VALUES ('alice'), ('bob')
  RETURNING id, handle
)

INSERT INTO channels (account_id, slug, title)

SELECT id,
       handle || 's-channel',
       initcap(handle) || '''s channel'
       
FROM new_accounts;

-- Down Migration

DELETE FROM channels WHERE slug IN ('alices-channel', 'bobs-channel');
DELETE FROM accounts WHERE handle IN ('alice', 'bob');