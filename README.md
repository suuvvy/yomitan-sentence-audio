![Cloudflare Worker](img/worker.png)

# Cloudflare Worker Yomitan Sentence Audio Source

**!! Japanese Only !!**

Adapted from <https://github.com/friedrich-de/yomitan-ultimate-audio>.

## Setup

### Requirements

1. Ensure `npm` and `rclone` are installed on your system.

### Cloudflare

1. Create a Cloudflare account → https://dash.cloudflare.com/sign-up

2. Create a worker and select the "Hello World" template.

    ![Worker Setup](img/add_worker.png)

    ![Hello World](img/helloworld.png)

3. Name your worker `yomitan-sentence-audio-worker` and deploy it.

    ![Worker Name](img/worker_name.png)

4. Go to `R2 Project Storage` in the left sidebar and create a new bucket named `yomitan-sentence-audio-bucket`.

5. Go to `Storage & Database` → `D1 SQL Database` and create a new database called `yomitan-sentence-audio-db`.

### Locally

1. Clone the repository and run the following commands:

    - `npm install` to install the dependencies.
    - `npx wrangler login` to authenticate with your Cloudflare account.

2. Copy `wrangler.toml.example` to `wrangler.toml` and replace the `database_id` entry with the ID of your previously created R2 bucket. Also adjust:

    - `AUTHENTICATION_ENABLED` if you want the endpoints to be protected by a password **(STRONGLY RECOMMENDED)**.

    If you change these also run `npx wrangler types` to update the types.

3. Copy `.dev.vars.example` to `.dev.vars` and replace the following:

    - `API_KEYS` with a comma separated list of API keys that will be used to authenticate requests.

4. Download the audio data and put it into the repository folder. (You should have a bunch of folders ending with `_files` in `data`.)

5. Import the entries data into your D1 database by running the following command:

    - `npx wrangler d1 execute yomitan-sentence-audio-db --remote --file=data/entry_db.sql`

6. Go [here](https://dash.cloudflare.com/?to=/:account/r2/api-tokens) and create an API Token to access your R2 bucket.

    ![API Token](img/api_key.png)

7. Upload the audio files to your R2 bucket by running the following command, replacing the placeholders with your own values from the previous step:

    - `R2_ACCESS_KEY_ID="your_access_key" R2_SECRET_ACCESS_KEY="your_secret_key" R2_ACCOUNT_ID="your_cloudflare_account_id" bash scripts/upload-to-r2.sh`

8. Upload the variables in `.dev.vars` to Cloudflare by running the following command:

    - `npx wrangler secret put API_KEYS`

9. Deploy the worker by running the following command:

    - `npx wrangler deploy`

### Yomitan

1. Go to the Yomitan settings and set the `Audio Source URL` to your worker URL and `audio/list?term={term}&reading={reading}&apiKey=yourApiKey` so for example `https://yomitan-sentence-audio-worker.friedrichde.workers.dev/audio/list?term={term}&reading={reading}&apiKey=m9NixGU7qtWv4SYr`

    ![Yomitan Settings](img/yomitan_settings.png)

Your worker should be up and running now and you should be getting Yomitan sentence audio through your worker!

[^1]: Note that you will still need to add a payment method to your Cloudflare account to create some rescoures, but you will not be charged for using this worker for yourself.
