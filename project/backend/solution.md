# RAG Solution for Workshop

This file contains the full solution for implementing Retrieval-Augmented Generation (RAG) in your backend. Use this as a reference after attempting the exercise yourself!

---

## 1. `project/backend/services/couchbaseService.js`

```js
import { connect, SearchRequest, VectorSearch, VectorQuery } from 'couchbase'
import dotenv from 'dotenv'
dotenv.config()

const {
  COUCHBASE_CONNECTION_STRING,
  COUCHBASE_USERNAME,
  COUCHBASE_PASSWORD,
  COUCHBASE_BUCKET_NAME,
  COUCHBASE_SEARCH_INDEX_NAME
} = process.env

const COUCHBASE_SCOPE_NAME = 'public'
const full_idx_name = `${COUCHBASE_BUCKET_NAME}.${COUCHBASE_SCOPE_NAME}.${COUCHBASE_SEARCH_INDEX_NAME}`

let cluster

async function initCouchbase() {
  if (!cluster) {
    cluster = await connect(COUCHBASE_CONNECTION_STRING, {
      username: COUCHBASE_USERNAME,
      password: COUCHBASE_PASSWORD,
      configProfile: 'wanDevelopment',
    })
  }
  return cluster
}

export async function getRelevantDocumentIdsBySourceName(embedding, sourceName) {
  const cluster = await initCouchbase()
  const scope = cluster.bucket(COUCHBASE_BUCKET_NAME).scope(COUCHBASE_SCOPE_NAME);
  
   const query = `
    SELECT SEARCH_META(d.out) hits FROM \`documentation\` d
    JOIN \`documentation\` m ON d.metaId = META(m).id
    WHERE m.name=$SOURCE AND
      SEARCH(\`d\`, {
      "query": {
          "match_none": {}
      },
      "knn": [
        {
          "k": 4,
          "field": "vector",
          "vector": $VECTOR
        }
      ]
    },
    {
    "index" : "${full_idx_name}"
    }
   )
  `
  const options = { parameters: { SOURCE: sourceName, VECTOR: embedding, COUCHBASE_SEARCH_INDEX_NAME : full_idx_name } }

  const result = await scope.query(query, options)
  
  result.rows.slice(0, 3).forEach((row, index) => {
    console.log(`${index + 1}. ID: ${row.hits.id}`)
    console.log(`   Score: ${row.hits.score.toFixed(4)}`)
    console.log(`   ---`)
  })

  return result.rows.map(row => {
    return {
        id: row.hits.id,
        score: row.hits.score
    };
  });
}

export async function getRelevantDocumentIds(embedding) {
  const cluster = await initCouchbase()
  const scope = cluster.bucket(COUCHBASE_BUCKET_NAME).scope('public');
  
  let request = SearchRequest.create(
    VectorSearch.fromVectorQuery(
        VectorQuery.create('vector', embedding).numCandidates(4)
    )
  );

  const result = await scope.search(COUCHBASE_SEARCH_INDEX_NAME, request);
  
  result.rows.slice(0, 3).forEach((row, index) => {
    console.log(`${index + 1}. ID: ${row.id}`)
    console.log(`   Score: ${row.score.toFixed(4)}`)
    console.log(`   ---`)
  })

  return result.rows.map(row => {
    return {
        id: row.id,
        score: row.score
    };
  });
}

export async function getRelevantDocuments(embedding, name) {
  const cluster = await initCouchbase();
  const bucket = cluster.bucket(COUCHBASE_BUCKET_NAME);
  
  // Try different collection approaches
  let collection;
  try {
    collection = bucket.scope('public').collection('documentation');
  } catch (error) {
    console.log('📄 Falling back to default collection')
    collection = bucket.defaultCollection();
  }
let storedEmbeddings = []
  if (!name || name.trim() === '') {
    storedEmbeddings = await getRelevantDocumentIds(embedding);
  } else {
    storedEmbeddings = await getRelevantDocumentIdsBySourceName(embedding, name);
  }

  console.log(`\n📄 Retrieving ${storedEmbeddings.length} documents...`)

  const results = await Promise.all(
    storedEmbeddings.map(async ({ id, score }, index) => {
      try {
        const result = await collection.get(id);
        const content = result.content;
        
        // Remove embedding from content
        if (content && content.embedding) {
          delete content.embedding;
        }

        // Extract filepath for logging and response
        const filepath = content.filepath || 'No filepath available';
        
        console.log(`${index + 1}. Document ID: ${id}`)
        console.log(`   Filepath: ${filepath}`)
        console.log(`   Score: ${score.toFixed(4)}`)

        return {
          id: id,
          filepath: filepath,
          content: content,
          score: score 
        };
      } catch (err) {
        console.error(`Error fetching document with ID ${id}:`, err);
        return null;
      }
    })
  );

  return results.filter(doc => doc !== null); 
}
```

---

## 2. `project/backend/routes/query.js`

```js
import { Router } from 'express'
import { getEmbedding, getCompletionStream } from '../services/openaiService.js'
import { getRelevantDocuments } from '../services/couchbaseService.js'

const router = Router()

router.post('/', async (req, res) => {
  const { q } = req.body

  if (!q || q.trim() === '') {
    return res.status(400).json({ error: 'Query is required.' })
  }
  const { name } = req.query

  try {
    const embedding = await getEmbedding(q)

    const documents = await getRelevantDocuments(embedding, name)

    // Step 3: Construct the prompt with document info
    const documentList = documents.map((doc, index) => 
      `Document ${index + 1}:
       ID: ${doc.id}
       Filepath: ${doc.filepath}
       Score: ${doc.score}
       Content: ${JSON.stringify(doc.content)}`
    ).join('\n\n');

    const prompt = `You are a Web MDN Documentation expert.
Given the user query and the following relevant documents, provide a helpful and accurate answer.

${documentList}

User Query: ${q}

Please provide a helpful response based on these documentation pages. Include references to the document IDs and filepaths when relevant.`

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Transfer-Encoding', 'chunked')

    // Step 4: Get a streaming completion
    const stream = await getCompletionStream(prompt)

    // Iterate over the streamed chunks and send them to the client as they arrive
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content
      if (token) {
        res.write(token)
      }
    }

    // When the stream ends, end the response
    res.end()
  } catch (error) {
    console.error(error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred while processing your request.' })
    } else {
      res.end()
    }
  }
})

export default router
```

---

## How to use
- Try implementing the logic in the actual files first (with placeholders).
- When ready, check this solution for the full code and explanations.
- Replace the placeholder code with the real logic to enable RAG functionality!
