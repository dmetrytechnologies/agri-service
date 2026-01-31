# Deploying Agri-Service to Railway

Your application is ready to be deployed! Since your code is already pushed to GitHub, follow these steps to deploy it on Railway.

## Prerequisites
- A [Railway](https://railway.app/) account.
- Your Supabase project URL and Keys.

## Steps

1. **Log in to Railway**
   - Go to [railway.app](https://railway.app/).
   - Log in with your GitHub account.

2. **Create a New Project**
   - Click **+ New Project**.
   - Select **Deploy from GitHub repo**.
   - Choose your repository: `dmetrytechnologies/agri-service`.
   - Click **Deploy Now**.

3. **Configure Environment Variables**
   - Once the deployment starts (or fails due to missing variables), go to the **Settings** or **Variables** tab of your new service.
   - You need to add the following variables (copy them from your `.env.local` or Supabase dashboard):

   | Variable Name | Description |
   | :--- | :--- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key (public) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key (secret) |

   > **Note:** The `SUPABASE_SERVICE_ROLE_KEY` is required for the IVR booking API to work, as it bypasses Row Level Security.

4. **Verify Deployment**
   - After adding the variables, Railway will automatically trigger a redeploy (or you can manually click **Redeploy**).
   - Wait for the build to complete.
   - Once "Active", click the generated URL to open your app.
   - Test the IVR API endpoint using Postman or Twilio pointing to `https://<your-railway-url>/api/ivr`.

## Troubleshooting
- If the build fails, check the **Build Logs** in Railway.
- If the app shows runtime errors, check the **Deploy Logs**.
- Ensure you have not committed any `.env` files with conflicting values (your `.gitignore` already handles this).
