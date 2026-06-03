async function handler() {
    try {
        const HTUserDataResponse = await getHackatimeUserData();
        if (HTUserDataResponse && HTUserDataResponse.success) {
            fetchProjects(HTUserDataResponse.email);
        }


    } catch (error) {
        console.error('Error in projects handler:', error);
    }
}
async function fetchProjects(email) {
    if (!email) return;
    localStorage.setItem('email', email);
    try {
        const response = await fetch('/api/project-scripts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        const data = await response.json();

        if (data.success) {
            console.log('Airtable Records:', data.records);
            displayProjects(data.records);
            
        } else {
            console.error('Failed to load projects:', data.error);
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}
async function getHackatimeUserData() {
    try {
        const response = await fetch('/api/project-scripts?action=getUserData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: localStorage.getItem('htaccessToken')}),
        });
        const data = await response.json();

        if (data.success) {
            if (!data.email){
                 console.log({ error: 'No email returned' });
                 console.log({ data: data });
                 return null;
            }
            console.log('Hackatime User Data', data.success, data.email);
            return data; // Return the email
        } else {
            console.error('Failed to get Hackatime user data:', data.error || 'Unknown error');
            return null; // Indicate failure
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}



function displayProjects(records) {
    const container = document.getElementById('projects-container');
    if (!container) return;
    
    container.innerHTML = records.map(record => `
        <div class="project-card">${record.fields["Project Name"] || 'Unnamed Project'}</div>
    `).join('');
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('load-projects')?.addEventListener('click', (e) => {
        e.preventDefault();
        handler();
    });
});
