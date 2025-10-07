## Solution for Vector Search Query Creation in server.js

Replace the placeholder code in the `getStoredEmbeddings` function with the following implementation:

```javascript
async function getStoredEmbeddings(queryEmbedding) {
  const cluster = await init();
  const scope = cluster.bucket(process.env.COUCHBASE_BUCKET).scope('_default');
  const searchIndex = 'vector-search-index';

  let request = couchbase.SearchRequest.create(
    couchbase.VectorSearch.fromVectorQuery(
      couchbase.VectorQuery.create('_default.embedding', queryEmbedding).numCandidates(5)
    )
  );
  
  const result = await scope.search(searchIndex, request);

  return result.rows.map(row => {
    return {
      id: row.id,
      score: row.score
    };
  });
}
```

**Instructions:**
- The placeholder in `server.js` returns a mock response.
- Attendees should replace the placeholder with the above code to enable real vector search using Couchbase.
- Make sure environment variables for Couchbase are set correctly.
