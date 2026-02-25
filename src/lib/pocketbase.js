import PocketBase from 'pocketbase';

const pbUrl = import.meta.env.VITE_POCKETBASE_URL;

if (!pbUrl) {
    console.error('Missing VITE_POCKETBASE_URL environment variable!');
    throw new Error('Missing PocketBase configuration. Check .env file.');
}

export const pb = new PocketBase(pbUrl);

// Disable auto-cancellation so parallel requests work
pb.autoCancellation(false);
