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
            localStorage.setItem('airtableProjects', JSON.stringify(data.records));
            await displayProjects(data.records);
            
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
            localStorage.setItem('email', data.email);
            return data; // Return the email

        } else {
            console.error('Failed to get Hackatime user data:', data.error || 'Unknown error');
            return null; // Indicate failure
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}



async function displayProjects(records) {
    //records is from AirTable
    const container = document.getElementById('projects-container');
    if (!container) return;

    try {
        const response = await fetch('project-card.html');
        const template = await response.text();
        const storedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
       


        container.innerHTML = records.map(record => {
            const projectData = storedProjects.find(p => (typeof p === 'string' ? p : p.name) === record.fields["Hackatime Project Name"]);
            
            const selectedHTHours = (projectData && projectData.total_seconds !== undefined) ? projectData.total_seconds / 3600: 0;

            let html = template.replace(/{{PROJECT_NAME}}/g, record.fields["Project Name"] || 'Unnamed Project');
            // Inject Email and Hours (or whatever your Airtable field is named, e.g., 'Total Hours')
            html = html.replace(/{{EMAIL}}/g, record.fields["Email"] || 'N/A');
            html = html.replace(/{{HOURS}}/g, selectedHTHours.toFixed(2) || '0'); 
            html = html.replace(/{{PROJECT_ID}}/g, record.id || 'N/Aa');
            html = html.replace(/{{HT_CONNECTED}}/g, projectData?'Yes':'No');
            return html;
        }).join('');
    } catch (error) {
        console.error('Error loading project template:', error);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    handler();
    document.getElementById('load-projects')?.addEventListener('click', (e) => {
        e.preventDefault();
        handler();
    });
});
