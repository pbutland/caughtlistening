async function addPolls(stateName, polls) {
    if (polls.length === 0) {
        return;
    }

    const uniquePolls = polls.reduce((p, c) => {
        let value = p.get(c.pollster);
        if (value === undefined) {
            value = {
                url: c.url,
                count: 0
            };
        }
        value.count++;
        return p.set(c.pollster, value);
    }, new Map());
    const sortedPolls = new Map([...uniquePolls.entries()].sort((a, b) => b[1].count - a[1].count));

    const cellId = `table-${stateName}`;
    const cell = document.getElementById(cellId);

    const list = document.createElement('ul');

    const span = document.createElement('span');
    const image = document.createElement('img');
    image.className = 'poll-tooltip-icon';
    image.src = 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Eo_circle_teal_letter-p.svg';
    const div = document.createElement('div');
    div.className = 'poll-tooltip';
    span.onmouseenter = (() => {
        div.style.left = span.offsetLeft + 140;
        div.hidden = false;
    });
    span.onmouseleave = (() => {
        div.hidden = true;
    });
    div.hidden = true;
    span.appendChild(image);
    span.appendChild(div);
    const totalNumPolls = Array.from(uniquePolls).reduce((partialSum, a) => partialSum + a[1].count, 0);
    div.innerText = `Polls: (${totalNumPolls.toLocaleString()})`;
    div.appendChild(list);
    Array.from(sortedPolls).forEach(poll => {
        const listItem = document.createElement('li');
        list.appendChild(listItem);
        if (poll[1].url) {
            const anchor = document.createElement('a');
            anchor.href = poll[1].url;
            anchor.innerText = poll[0];
            listItem.appendChild(anchor);
            const count = document.createElement('span');
            count.innerText = ` (${poll[1].count.toLocaleString()})`;
            listItem.appendChild(count);
        } else {
            listItem.innerText = `${poll[0]} (${poll[1].count.toLocaleString()})`;
        }
    });
    cell.appendChild(span);
}

async function addSponsors(stateName, sponsors) {
    const uniqueSponsors = [...new Map(sponsors.map(item => [item['sponsor'], item])).values()];
    if (uniqueSponsors.length === 0) {
        return;
    }

    const cellId = `table-${stateName}`;
    const cell = document.getElementById(cellId);

    const list = document.createElement('ul');

    const span = document.createElement('span');
    const image = document.createElement('img');
    image.className = 'sponsor-tooltip-icon';
    image.src = 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Eo_circle_indigo_letter-s.svg';
    const div = document.createElement('div');
    div.className = 'sponsor-tooltip';
    span.onmouseenter = (() => {
        div.style.left = span.offsetLeft + 140;
        div.hidden = false;
    });
    span.onmouseleave = (() => {
        div.hidden = true;
    });
    div.hidden = true;
    span.appendChild(image);
    span.appendChild(div);
    div.innerText = "Poll sponsors:";
    div.appendChild(list);
    uniqueSponsors.forEach(sponsor => {
        const listItem = document.createElement('li');
        list.appendChild(listItem);
        if (sponsor.url) {
            const anchor = document.createElement('a');
            anchor.href = sponsor.url;
            anchor.innerText = sponsor.sponsor;
            listItem.appendChild(anchor);
        } else {
            listItem.innerText = sponsor.sponsor;
        }
    });
    cell.appendChild(span);
}

async function addVoters(stateName, polls) {
    if (polls.length === 0) {
        return;
    }

    const populations = polls.map(poll => { return { population: poll.population, sampleSize: parseInt(poll.sampleSize) } }).flat();
    const populationCounts = populations.reduce((p, c) => {
        let value = p.get(c.population);
        if (value === undefined) {
            value = 0;
        }
        value += parseInt(c.sampleSize);
        return p.set(c.population, value);
    }, new Map());

    const cellId = `table-${stateName}`;
    const cell = document.getElementById(cellId);

    const list = document.createElement('ul');

    const span = document.createElement('span');
    const image = document.createElement('img');
    image.className = 'voter-tooltip-icon';
    image.src = 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Eo_circle_deep-orange_letter-v.svg';
    const div = document.createElement('div');
    div.className = 'voter-tooltip';
    span.onmouseenter = (() => {
        div.style.left = span.offsetLeft + 100;
        div.hidden = false;
    });
    span.onmouseleave = (() => {
        div.hidden = true;
    });
    div.hidden = true;
    span.appendChild(image);
    span.appendChild(div);
    const totalNumVoters = Array.from(populationCounts).reduce((partialSum, a) => partialSum + a[1], 0);
    div.innerText = `Voters: (${totalNumVoters.toLocaleString()})`;
    div.appendChild(list);

    const types = [{ name: 'Adult', key: 'a', }, { name: 'Voter', key: 'v' }, { name: 'Registered', key: 'rv' }, { name: 'Likely', key: 'lv' }];
    types.forEach(type => {
        const listItem = document.createElement('li');
        list.appendChild(listItem);
        listItem.innerText = `${type.name}: ${populationCounts.get(type.key)?.toLocaleString() || 0}`;
    });
    cell.appendChild(span);
}

async function showChart(stateName, polls) {
    const uniquePolls = [...new Map(polls.map(poll => [poll.endDate, poll])).values()]

    const demData = uniquePolls.map(poll => {
        return [
            new Date(Date.parse(poll.endDate)).getTime(),
            parseInt(poll.answers.find(a => a.party === 'Dem')?.pct)
        ];
    }).sort((lhs, rhs) => rhs[0] - lhs[0]);
    const repData = uniquePolls.map(poll => {
        return [
            new Date(Date.parse(poll.endDate)).getTime(),
            parseInt(poll.answers.find(a => a.party === 'Rep')?.pct)
        ];
    }).sort((lhs, rhs) => rhs[0] - lhs[0]);

    let averageDem = [];
    const rollingAverageDem = uniquePolls.map(poll => {
        const pct = parseInt(poll.answers.find(a => a.party === 'Dem')?.pct);
        const pollSize = parseInt(poll.sampleSize);
        averageDem.push([pct*pollSize/100, pollSize]);
        const totalVotes = averageDem.reduce((partialSum, a) => partialSum + a[0], 0);
        const totalSize = averageDem.reduce((partialSum, a) => partialSum + a[1], 0);
        return [
            new Date(Date.parse(poll.endDate)).getTime(),
            Number(`${Math.round(`${totalVotes*100/totalSize}e2`)}e-2`)
        ];
    }).sort((lhs, rhs) => rhs[0] - lhs[0]);

    let averageRep = [];
    const rollingAverageRep = uniquePolls.map(poll => {
        const pct = parseInt(poll.answers.find(a => a.party === 'Rep')?.pct);
        const pollSize = parseInt(poll.sampleSize);
        averageRep.push([pct*pollSize/100, pollSize]);
        const totalVotes = averageRep.reduce((partialSum, a) => partialSum + a[0], 0);
        const totalSize = averageRep.reduce((partialSum, a) => partialSum + a[1], 0);
        return [
            new Date(Date.parse(poll.endDate)).getTime(),
            Number(`${Math.round(`${totalVotes*100/totalSize}e2`)}e-2`)
        ];
    }).sort((lhs, rhs) => rhs[0] - lhs[0]);
    
    Highcharts.chart(`${stateName}-map-container`, {
        chart: {
            type: 'spline'
        },
        title: {
            text: `${stateName}`,
            align: 'center'
        },
        yAxis: {
            title: {
                text: 'xVotes (%)'
            }
        },
        tooltip: {
            split: true
        },
        xAxis: {
            type: 'datetime',
            accessibility: {
                rangeDescription: 'Date'
            }
        },
        legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom'
        },
        plotOptions: {
            series: {
                label: {
                    connectorAllowed: false
                }
            }
        },
        colors: ['#0913df', '#df1309'],
        series: [{
            name: 'Democrat',
            data: demData,
        },
        {
            name: 'Republican',
            data: repData,
        },
        {
            name: 'Democrat (Avg)',
            data: rollingAverageDem,
            lineWidth: 3,
            dashStyle: 'longdash'
        },
        {
            name: 'Republican (Avg)',
            data: rollingAverageRep,
            lineWidth: 3,
            dashStyle: 'longdash'
        }],
    });
}

async function addTrend(stateName, polls) {
    if (polls.length === 0) {
        return;
    }

    const cellId = `table-${stateName}`;
    const cell = document.getElementById(cellId);

    const container = document.createElement('div');
    container.id = `${stateName}-map-container`;
    const span = document.createElement('span');
    const image = document.createElement('img');
    image.className = 'trend-tooltip-icon';
    image.src = 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Eo_circle_blue-grey_letter-c.svg';
    const div = document.createElement('div');
    div.className = 'trend-tooltip';
    span.onmouseenter = (() => {
        div.style.left = span.offsetLeft + 70;
        div.hidden = false;
        showChart(stateName, polls);
    });
    span.onmouseleave = (() => {
        div.hidden = true;
    });
    div.hidden = true;
    span.appendChild(image);
    span.appendChild(div);
    div.appendChild(container);
    cell.appendChild(span);
}

async function updateDataTableMetaData(data) {
    const table = document.getElementById('data-table-container');
    if (table === null) {
        return;
    }
    data.forEach(state => {
        addPolls(state.ucName, state.polls);
        addSponsors(state.ucName, state.polls.map(poll => poll.sponsors).flat().filter(sponsors => sponsors !== undefined));
        addVoters(state.ucName, state.polls);
        addTrend(state.ucName, state.polls);
    });
}

async function updateDataTable(data) {
    // Add data values to data table
    const table = document.getElementById("data-table")?.getElementsByTagName('tbody')[0];
    if (table === undefined) {
        return;
    }

    table.innerHTML = '';
    data.forEach((item, index) => {
        // Add values to data table
        const newRow = table.insertRow();
        newRow.className = 'datagrid-row';
        const state = newRow.insertCell(0);
        state.id = `table-${item.ucName}`;
        state.className = 'datagrid-cell';
        const democrat = newRow.insertCell(1);
        democrat.className = 'datagrid-cell';
        const republican = newRow.insertCell(2);
        republican.className = 'datagrid-cell';
        const demVotes = newRow.insertCell(3);
        demVotes.className = 'datagrid-cell';
        const repVotes = newRow.insertCell(4);
        repVotes.className = 'datagrid-cell';
        state.innerText = item.ucName;
        democrat.innerText = isNaN(item.custom.votesDem) ? '-' : item.custom.elVotesDem;
        republican.innerText = isNaN(item.custom.votesDem) ? '-' : item.custom.elVotesRep;
        demVotes.innerText = isNaN(item.custom.votesDem) ? '-' : `${item.custom.votesDem}%`;
        repVotes.innerText = isNaN(item.custom.votesRep) ? '-' : `${item.custom.votesRep}%`;
    });
}
