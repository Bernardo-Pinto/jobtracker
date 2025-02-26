import { getApplications } from '../lib/db';

async function queryDb() {
    const applications = await getApplications();
    console.log('Applications:', applications);
}

queryDb();