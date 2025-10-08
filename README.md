# Vector Search Workshop with Couchbase and Node.js - Part 2
![Couchbase Capella](https://img.shields.io/badge/Couchbase_Capella-Enabled-red)
[![License: MIT](https://cdn.prod.website-files.com/5e0f1144930a8bc8aace526c/65dd9eb5aaca434fac4f1c34_License-MIT-blue.svg)](/LICENSE)


Welcome to the 2nd part of the workshop. This workshop is designed to help you get started with vector search using Couchbase and Node.js. We will be using the [Couchbase Node.js SDK](https://docs.couchbase.com/nodejs-sdk/current/hello-world/start-using-sdk.html) and [Couchbase Capella](https://www.couchbase.com/products/cloud) managed database service.

The workshop will be run from inside a GitHub Codespace, which is a cloud-based development environment that is pre-configured with all the necessary tools and services. You don't need to install anything on your local machine.

> [!IMPORTANT]
> Key information needed for running this workshop in GitHub Codespaces can be found [here](#running-in-github-codespaces).

## Prerequisites

### Option A: Couchbase Capella (Cloud)
- A GitHub account
- A Couchbase Capella account

### Option B: Local Couchbase Server
- Couchbase Server Enterprise Edition 7.6+ installed locally
- [Couchbase Shell (cbsh)](https://couchbase.sh) installed
- OpenAI API key for embeddings

## Workshop Outline

### For Capella Users
1. [Create a Capella Account](#create-a-capella-account)
2. [Create a Couchbase Cluster (Capella)](#create-a-couchbase-cluster-capella)
3. [Configure Couchbase Shell for Capella](#configure-couchbase-shell-for-capella)

### For Local Couchbase Server Users
1. [Setup Local Couchbase Server](#setup-local-couchbase-server-enterprise-edition)
2. [Configure Couchbase Shell for Local Server](#configure-couchbase-shell-for-local-server)
3. [Create Bucket and Collections](#create-bucket-and-collections-local)

### Common Steps
4. [Setting up OpenAI API](#setting-up-openai-api)
5. [Import Data](#import-data)
6. [Query the Data](#query-the-data)

---

## Setup Local Couchbase Server Enterprise Edition

This section covers setting up Couchbase Server locally for development.

### 1. Install Couchbase Server Enterprise Edition

Download and install Couchbase Server Enterprise Edition from the [official website](https://www.couchbase.com/downloads):

- **macOS**: Download the `.dmg` file and follow the installation wizard
- **Linux**: Use the package manager or download the appropriate package
- **Windows**: Download the `.exe` installer

### 2. Initialize Your Local Cluster

After installation, open your browser and navigate to `http://localhost:8091` to complete the setup wizard:

1. Click "Setup New Cluster"
2. Set a cluster name (e.g., "local")
3. Create an administrator username and password (e.g., `admin` / `password`)
4. Accept the terms and conditions
5. Configure memory quotas (defaults are fine for development)
6. Complete the setup

### 3. Verify Server is Running

Test that your Couchbase Server is accessible:

```bash
curl -u admin:password http://127.0.0.1:8091/pools/default
```

You should see a JSON response with cluster information.

---

## Configure Couchbase Shell for Local Server

### 1. Install Couchbase Shell

Download and install cbsh from [couchbase.sh](https://couchbase.sh):

```bash
# macOS/Linux
curl -sSL https://sh.couchbase.com/install | sh

# Or download from GitHub releases
# https://github.com/couchbaselabs/couchbase-shell/releases
```

### 2. Configure cbsh for Local Cluster

Edit your cbsh configuration file at `~/.cbsh/config`:

```toml
version = 1

[[cluster]]
identifier = "local"
connstr = "couchbase://127.0.0.1"
user-display-name = "couchbase"
username = "admin"
password = "password"
default-bucket = "shared"
default-scope = "public"
default-collection = "documentation"
tls-enabled = false

[[llm]]
identifier = "OpenAI-small"
provider = "OpenAI"
embed_model = "text-embedding-3-small"
chat_model = "gpt-3.5-turbo"
api_key = "your-openai-api-key-here"
```

**Important**: Replace:
- `username` and `password` with your Couchbase admin credentials
- `api_key` with your actual OpenAI API key

### 3. Verify cbsh Connection

Open cbsh and test the connection:

```bash
cbsh
```

In the cbsh prompt:

```
cb-env cluster local
cb-env
```

You should see output showing your cluster connection is active.

---

## Create Bucket and Collections (Local)

You can create the required bucket structure either through the Web UI or using cbsh.

### Option A: Using Couchbase Web UI

1. Navigate to `http://localhost:8091`
2. Go to "Buckets" → "Add Bucket"
3. Create a bucket named `shared` with at least 100MB RAM quota
4. In the bucket, create a scope named `public`
5. In the scope, create a collection named `documentation`

### Option B: Using Couchbase Shell

In cbsh, run the following commands:

```
cb-env cluster local

# Create bucket
buckets create shared 100 --replicas 0

# Create scope
scopes create --bucket shared public

# Create collection
collections create --bucket shared --scope public documentation

# Create vector index for embeddings (1536 dimensions for OpenAI)
vector create-index --bucket shared --scope public --collection documentation --similarity-metric dot_product documentation vector 1536
```

### Verify Setup

Check that everything was created:

```
# List buckets
buckets

# List scopes
scopes --bucket shared

# List collections
collections --bucket shared --scope public

# List indexes
query indexes | where type == 'fts'
```

---

## Create a Capella Account

Couchbase Capella is a fully managed database service that provides a seamless experience for developers to build modern applications. You can sign up for a free account at [https://cloud.couchbase.com/signup](https://cloud.couchbase.com/signup).

## Create a Couchbase Cluster (Capella)

Once you have created an account, you can create a new Couchbase cluster by following the steps below:

1. Click on the "Create Cluster" button on the Capella dashboard.

2. Choose a cloud provider, name and region for your cluster and click on the "Create Cluster" button.

## Create an API Key

After creating a cluster, you can create an API Key. This will be used by Couchbase Shell for various cluster management operations.

1. Go to Organization Setting.

2. Click on "API Keys", "Generate Key"

3. Choose a Key Name, enter a description to remember why you created the key, check all Organization Roles and click on "Generate Key".

4. Make sure you copy the API Key and API Secret

## Configure Couchbase Shell for Capella

Couchbase Shell provides a direct way to interact with your Couchbase Capella clusters.

### 1. Configure Capella Organization

Open `~/.cbsh/config` and add your Capella organization credentials:

```toml
version = 1

[[capella-organization]]
identifier = "yourOrgIdentifier"
access-key = "yourAccessKey"
secret-key = "yourSecretKey"
default-project = "Trial - Project"
```

### 2. Register Your Capella Cluster

Run `cbsh` in the terminal to open [Couchbase Shell](https://couchbase.sh):

```bash
cbsh
```

In cbsh, register your trial cluster:

```
clusters | clusters get $in.0.name | cb-env register $in.name $in."connection string" --capella-organization "yourOrgIdentifier" --project "Trial - Project" --save --default-bucket shared --default-scope public --username cbsh --password yourPassword
```

### 3. Set Default Cluster

Verify `~/.cbsh/config` has been modified with the cluster definition. Copy the cluster identifier and set it as default:

```
cb-env cluster <your-cluster-identifier>
```

This tells cbsh that the default cluster for all future operations in this session is your Capella cluster.

### 4. Create Credentials

Create database access credentials:

```
credentials create --read --write --username cbsh --password yourPassword
```

### 5. Configure Your Capella Cluster

After creating a cluster, create a new bucket:

1. Click on the "+ Create" button from inside the cluster dashboard
2. Create a bucket named `shared` 
3. Define the options for your bucket and click on the "Create" button
4. Create a scope named `public`
5. Create a collection named `documentation`

---

## Setting up OpenAI API

This workshop uses OpenAI's embedding API to generate vector embeddings from your documents. You need to configure your OpenAI API key.

### Get Your OpenAI API Key

1. Visit the [OpenAI API dashboard](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (you won't be able to see it again)

### Configure OpenAI for Couchbase Shell

Make sure your `~/.cbsh/config` includes the LLM configuration block:

```toml
[[llm]]
identifier = "OpenAI-small"
provider = "OpenAI"
embed_model = "text-embedding-3-small"
chat_model = "gpt-3.5-turbo"
api_key = "sk-your-actual-openai-api-key-here"
```

**Replace** `api_key` with your actual OpenAI API key from the previous step.

---

## Import Data

Now we'll import markdown documentation files and create vector embeddings.

### 1. Open Couchbase Shell

```bash
cd workshop-step-2
cbsh
```

### 2. Set Your Cluster

Choose the appropriate command based on your setup:

**For Local Server:**
```
cb-env cluster local
```

**For Capella:**
```
cb-env cluster <your-capella-cluster-identifier>
```

### 3. Load the Import Scripts

Source the required Nushell modules:

```
use scripts/couchbase.nu *
use scripts/importers.nu *
```

### 4. Import the Documentation

This will process markdown files, generate embeddings, and import them into Couchbase:

```
import_markdown_in_folder scripts/content/files/en-us/glossary1/ "glossary" "a glossary of IT terms"
```

**Note**: This process may take several minutes depending on:
- Number of files to process
- OpenAI API rate limits
- Your network speed

The import function will:
1. Read all markdown files from the specified folder
2. Chunk the content into manageable pieces
3. Generate vector embeddings using OpenAI
4. Store the chunks and embeddings in Couchbase

---

## Query the Data

Once the import is complete, you can perform semantic searches on your data.

### Simple Vector Search Query

```
let query = "What is an array?"
let vectorized_query = $query | vector enrich-text 
let context = vector search documentation vector $vectorized_query.content.vector.0 | get id | subdoc get content | select content
$context | ask $vectorized_query.content.text.0
```

### What's Happening?

1. **`let query = "What is an array?"`** - Your search question
2. **`vector enrich-text`** - Converts your query to a vector embedding
3. **`vector search documentation`** - Searches the vector index for similar content
4. **`subdoc get content`** - Retrieves the actual document content
5. **`ask`** - Uses OpenAI to generate a natural language answer based on the context

### Try Different Queries

```
# Query about authentication
let query = "How does authentication work?"
let vectorized_query = $query | vector enrich-text 
let context = vector search documentation vector $vectorized_query.content.vector.0 | get id | subdoc get content | select content
$context | ask $vectorized_query.content.text.0
```

```
# Query about arrays
let query = "What are the different types of arrays?"
let vectorized_query = $query | vector enrich-text 
let context = vector search documentation vector $vectorized_query.content.vector.0 | get id | subdoc get content | select content
$context | ask $vectorized_query.content.text.0
```

---

## Troubleshooting

### Connection Errors

If you see errors like `Failed to load cluster config`:

1. **Verify your cluster is running** (for local: `http://localhost:8091`)
2. **Check cbsh is using the correct cluster**: Run `cb-env` to see current settings
3. **Switch clusters**: Use `cb-env cluster <identifier>` to switch

### OpenAI API Errors

If embeddings fail:

1. **Verify API key**: Check `~/.cbsh/config` has the correct OpenAI key
2. **Check rate limits**: OpenAI has rate limits on API usage
3. **Verify balance**: Ensure your OpenAI account has credits

### Import Takes Too Long

The import process uses OpenAI's API which has rate limits:

- Be patient during large imports
- The function processes files in batches
- Consider importing a smaller folder first for testing

---

## Next Steps

After completing this workshop, you can:

1. **Import more data**: Try importing other markdown folders
2. **Build an application**: Use the Couchbase Node.js SDK to build a RAG application
3. **Explore vector search**: Learn about different similarity metrics and search parameters
4. **Scale up**: Move from local development to Couchbase Capella for production

---

**Note**: The content folder used in this workshop is a subset of the Mozilla Developer Network documentation, used for educational purposes.
