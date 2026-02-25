const API_URL = 'http://localhost:5000/api';

async function testAuth() {
    try {
        console.log('--- Starting API Verification (Improved) ---');

        // 0. Get a real company ID
        const compRes = await fetch(`${API_URL}/companies?limit=1`);
        const compData = await compRes.json();
        const companyId = compData.companies[0]?.id;
        if (!companyId) throw new Error('No company found to associate application with');
        console.log(`Using Company ID: ${companyId}`);

        // 1. Register User A
        const userA = { email: `userA_${Date.now()}@test.com`, password: 'password123' };
        console.log(`Registering User A: ${userA.email}`);
        const regARes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userA)
        });
        if (!regARes.ok) console.error('Reg A failed:', await regARes.text());

        // 2. Login User A
        console.log('Logging in User A...');
        const loginARes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userA)
        });
        const loginA = await loginARes.json();
        const tokenA = loginA.token;
        if (!tokenA) throw new Error('Login A failed to return token');
        console.log('User A logged in.');

        // 3. Register User B
        const userB = { email: `userB_${Date.now()}@test.com`, password: 'password123' };
        console.log(`Registering User B: ${userB.email}`);
        await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userB)
        });

        // 4. Login User B
        console.log('Logging in User B...');
        const loginBRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userB)
        });
        const loginB = await loginBRes.json();
        const tokenB = loginB.token;
        if (!tokenB) throw new Error('Login B failed to return token');
        console.log('User B logged in.');

        // 5. User A creates an application
        console.log('User A creating an application...');
        const appCreateRes = await fetch(`${API_URL}/applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenA}`
            },
            body: JSON.stringify({
                companyId: companyId,
                jobRole: 'Fullstack Engineer',
                status: 'Applied',
                dateApplied: new Date().toISOString()
            })
        });
        const appCreateData = await appCreateRes.json();
        if (!appCreateRes.ok) throw new Error(`App creation failed: ${JSON.stringify(appCreateData)}`);
        const appId = appCreateData.id;
        console.log(`Application created by User A with ID: ${appId}`);

        // 6. User B fetches their own applications (should be empty)
        console.log('User B fetching their own applications (should be empty)...');
        const appsBRes = await fetch(`${API_URL}/applications`, {
            headers: { 'Authorization': `Bearer ${tokenB}` }
        });
        const appsB = await appsBRes.json();
        if (!Array.isArray(appsB)) throw new Error(`Expected array, got: ${JSON.stringify(appsB)}`);

        console.log(`User B found ${appsB.length} applications.`);
        if (appsB.length === 0) {
            console.log('SUCCESS: Data isolation verified (User B list is empty).');
        } else {
            console.error('FAILURE: User B can see other users data!');
        }

        // 7. User B tries to access User A's application directly
        console.log(`User B trying to access User A's application ${appId} directly...`);
        const blockRes = await fetch(`${API_URL}/applications/${appId}`, {
            headers: { 'Authorization': `Bearer ${tokenB}` }
        });
        if (blockRes.status === 403 || blockRes.status === 404) {
            console.log(`SUCCESS: User B blocked with status ${blockRes.status} (${blockRes.statusText})`);
        } else {
            console.error(`FAILURE: User B accessed User A application with status ${blockRes.status}!`);
        }

        // 8. User A fetches their own list (should have 1)
        console.log('User A fetching their own applications...');
        const appsARes = await fetch(`${API_URL}/applications`, {
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
        const appsA = await appsARes.json();
        console.log(`User A found ${appsA.length} applications.`);
        if (appsA.length === 1 && appsA[0].id === appId) {
            console.log('SUCCESS: User A data retrieval verified.');
        } else {
            console.error('FAILURE: User A data mismatch!');
        }

        console.log('--- Verification Complete ---');
    } catch (error) {
        console.error('Verification failed:', error.message);
    }
}

testAuth();
