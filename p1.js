const http = require('http');
const url = require('url');

// Import our static data
const teams = require('./teams.json');
const all_standings = require('./standings.json');

// Some basic lists derived from the standings
const years = Array.from(new Set(all_standings.map(s => s.year)));
const leagues = Array.from(new Set(all_standings.map(s => s.league)));
const divisions = Array.from(new Set(all_standings.map(s => s.division)));

const heading = (title) => {
    const html = `
        <!doctype html>
            <html>
                <head>
                    <title>${title}</title>
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.min.css">
                </head>
                <body>
                    <a href='/'>Home</a>
                    <br/>
                    <h1>${title}</h1>
    `;
    return html;
}

const footing = () => {
    return `
        </body>
    </html>
    `;
}

// Helper function to find team info by code
const findTeam = (code) => {
    return teams.find(team => team.code === code);
}

// Filter standings based on year, league, and division
const filterStandings = (year, league, division) => {
    return all_standings.filter(standing => {
        return (!year || standing.year === year) &&
            (!league || standing.league === league) &&
            (!division || standing.division === division);
    });
}

// Merge standings with team info and sort by wins
const buildStandingsData = (standings) => {
    return standings.map(standing => {
        const team = findTeam(standing.team);
        return {
            ...standing,
            ...team,
            wins: parseInt(standing.wins),
            losses: parseInt(standing.losses)
        };
    }).sort((a, b) => b.wins - a.wins); // Sort by wins descending
}

// Generate homepage content
const generateHomepage = () => {
    let content = `
        <a href="/teams">All Teams</a>
        <h2>Standings</h2>
    `;

    // Build nested list structure
    years.sort().reverse().forEach(year => {
        content += `<h3>${year} Season</h3><ul>`;
        content += `<li><a href="/standings/${year}">${year} All Teams</a></li>`;

        leagues.forEach(league => {
            content += `<li>${league}<ul>`;
            content += `<li><a href="/standings/${year}/${league}">${league}</a></li>`;

            // Get divisions for this league from the data
            const leagueDivisions = Array.from(new Set(
                all_standings
                    .filter(s => s.year === year && s.league === league)
                    .map(s => s.division)
            ));

            leagueDivisions.forEach(division => {
                content += `<li><a href="/standings/${year}/${league}/${division}">${division}</a></li>`;
            });

            content += `</ul></li>`;
        });

        content += `</ul>`;
    });

    return content;
}

// Generate teams page content
const generateTeamsPage = () => {
    let content = `
        <table>
            <thead>
                <tr>
                    <th>LOGO</th>
                    <th>CITY</th>
                    <th>NAME</th>
                    <th>CODE</th>
                </tr>
            </thead>
            <tbody>
    `;

    teams.forEach(team => {
        content += `
            <tr>
                <td><img src="${team.logo}" alt="${team.name}" width="50"></td>
                <td>${team.city}</td>
                <td>${team.name}</td>
                <td>${team.code}</td>
            </tr>
        `;
    });

    content += `
            </tbody>
        </table>
    `;

    return content;
}

// Generate standings page content
const generateStandingsPage = (year, league, division) => {
    const filteredStandings = filterStandings(year, league, division);
    const standingsData = buildStandingsData(filteredStandings);

    let content = `
        <table>
            <thead>
                <tr>
                    <th>LOGO</th>
                    <th>CITY</th>
                    <th>NAME</th>
                    <th>WINS</th>
                    <th>LOSSES</th>
                </tr>
            </thead>
            <tbody>
    `;

    standingsData.forEach(team => {
        content += `
            <tr>
                <td><img src="${team.logo}" alt="${team.name}" width="50"></td>
                <td>${team.city}</td>
                <td>${team.name}</td>
                <td>${team.wins}</td>
                <td>${team.losses}</td>
            </tr>
        `;
    });

    content += `
            </tbody>
        </table>
    `;

    return content;
}

// Generate page title based on URL parts
const generateTitle = (parts) => {
    if (parts.length === 0 || parts[0] === '') {
        return 'MLB Standings Home';
    } else if (parts[0] === 'teams') {
        return 'All Teams';
    } else if (parts[0] === 'standings') {
        let title = 'Standings';
        if (parts[1]) title += ` - ${parts[1]}`;
        if (parts[2]) title += ` ${parts[2]}`;
        if (parts[3]) title += ` ${parts[3]}`;
        return title;
    }
    return 'MLB Standings';
}

const serve = (req, res) => {
    const uri = url.parse(req.url).pathname;
    const parts = uri.split('/').filter(part => part !== ''); // Remove empty strings

    let content = '';
    let title = generateTitle(parts);

    try {
        if (parts.length === " - ") {
            // Homepage
            content = generateHomepage();
        } else if (parts[0] === 'teams') {
            // Teams page
            content = generateTeamsPage();
        } else if (parts[0] === 'standings') {
            // Standings pages
            const year = parts[1] || null;
            const league = parts[2] || null;
            const division = parts[3] || null;
            content = generateStandingsPage(year, league, division);
        } else {
            // 404 case
            content = '<p>Page not found</p>';
            title = '404 - Page Not Found';
        }

        const site = `https://project-1-sihc.onrender.com/`;
        const html = heading(title) + content + footing();
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(html);
        res.end();

    } catch (error) {
        console.error('Error serving request:', error);
        const html = heading('Error') + '<p>An error occurred while processing your request.</p>' + footing();
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.write(html);
        res.end();
    }
}

http.createServer(serve).listen(3000);
