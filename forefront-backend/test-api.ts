import fetch from 'node-fetch';

async function testApi() {
    try {
        const id = '3a5766c1-4851-4e22-a5b3-807e2740a09f';
        console.log(`Sending DELETE to http://localhost:3001/knowledge/sources/${id}`);
        const res = await fetch(`http://localhost:3001/knowledge/sources/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const text = await res.text();
        console.log('STATUS:', res.status);
        console.log('BODY:', text);
    } catch (error) {
        console.error('ERROR:', error);
    }
}

testApi();
