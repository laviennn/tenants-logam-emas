export const triggerVercelRebuild = async () => {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) {
    console.log('[Webhook] VERCEL_DEPLOY_HOOK_URL not set, skipping rebuild trigger.');
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
    });
    
    if (response.ok) {
      console.log('[Webhook] Successfully triggered Vercel rebuild.');
    } else {
      console.error('[Webhook] Failed to trigger Vercel rebuild:', response.statusText);
    }
  } catch (error) {
    console.error('[Webhook] Error triggering Vercel rebuild:', error);
  }
};
