function lightenColour(colour, percent) {
    var num = parseInt(colour.replace("#", ""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        B = (num >> 8 & 0x00FF) + amt,
        G = (num & 0x0000FF) + amt;

    return (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
}

function setBinValue(bins, idx, item, binRange, numBins) {
    const bin = bins[idx];
    const range = idx === 0 ? `< ${binRange+1}%` : idx === numBins-1 ? `> ${binRange*numBins}%` : `${(binRange*idx)+1} - ${(binRange*(idx+1)+1)}%`;
    if (bin === undefined) {
        bins[idx] = {
            votes: 0,
            range: range,
        };
    }
    bins[idx].votes = bins[idx].votes + item.custom.state_votes;
}

(async () => {

    const topology = await fetch(
        'https://code.highcharts.com/mapdata/countries/us/us-all.topo.json'
    ).then(response => response.json());

    const data = [
        {
            ucName: 'WASHINGTON',
            value: -12,
            custom: {
                winner: 'Democrat',
                elVotesDem: 12,
                elVotesRep: 0,
                votesDem: 48.5,
                votesRep: 36.5,
                state_votes: 12
            }
        },
        {
            ucName: 'ARIZONA',
            value: 2.67,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 11,
                votesDem: 43.5,
                votesRep: 46.17,
                state_votes: 11
            }
        },
        {
            ucName: 'MASSACHUSETTS',
            value: -29.5,
            custom: {
                winner: 'Democrat',
                elVotesDem: 11,
                elVotesRep: 0,
                votesDem: 53.5,
                votesRep: 24,
                state_votes: 11
            }
        },
        {
            ucName: 'MICHIGAN',
            value: 3,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 15,
                votesDem: 42.8,
                votesRep: 45.8,
                state_votes: 15
            }
        },
        {
            ucName: 'NEVADA',
            value: 6,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 6,
                votesDem: 42.4,
                votesRep: 48.4,
                state_votes: 6
            }
        },
        {
            ucName: 'NEW HAMPSHIRE',
            value: -3,
            custom: {
                winner: 'Democrat',
                elVotesDem: 4,
                elVotesRep: 0,
                votesDem: 41,
                votesRep: 38,
                state_votes: 4
            }
        },
        {
            ucName: 'NORTH CAROLINA',
            value: 5.6,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 16,
                votesDem: 40,
                votesRep: 45.6,
                state_votes: 16
            }
        },
        {
            ucName: 'PENNSYLVANIA',
            value: 2.83,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 19,
                votesDem: 43.67,
                votesRep: 46.5,
                state_votes: 19
            }
        },
        {
            ucName: 'RHODE ISLAND',
            value: -19,
            custom: {
                winner: 'Democrat',
                elVotesDem: 4,
                elVotesRep: 0,
                votesDem: 52,
                votesRep: 33,
                state_votes: 4
            }
        },
        {
            ucName: 'WISCONSIN',
            value: -1,
            custom: {
                winner: 'Democrat',
                elVotesDem: 10,
                elVotesRep: 0,
                votesDem: 46.6,
                votesRep: 45.6,
                state_votes: 10
            }
        },
        {
            ucName: 'GEORGIA',
            value: 5.25,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 16,
                votesDem: 41.25,
                votesRep: 46.5,
                state_votes: 16
            }
        },
        {
            ucName: 'NEW YORK',
            value: -14,
            custom: {
                winner: 'Democrat',
                elVotesDem: 28,
                elVotesRep: 0,
                votesDem: 51.5,
                votesRep: 37.5,
                state_votes: 28
            }
        },
        {
            ucName: 'TENNESSEE',
            value: 18,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 11,
                votesDem: 29,
                votesRep: 47,
                state_votes: 11
            }
        },
        {
            ucName: 'TEXAS',
            value: 9,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 40,
                votesDem: 35.5,
                votesRep: 44.5,
                state_votes: 40
            }
        },
        {
            ucName: 'FLORIDA',
            value: 9,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 30,
                votesDem: 41.5,
                votesRep: 50.5,
                state_votes: 30
            }
        },
        {
            ucName: 'MINNESOTA',
            value: -2,
            custom: {
                winner: 'Democrat',
                elVotesDem: 10,
                elVotesRep: 0,
                votesDem: 44,
                votesRep: 42,
                state_votes: 10
            }
        },
        {
            ucName: 'LOUISIANA',
            value: 14,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 8,
                votesDem: 38,
                votesRep: 52,
                state_votes: 8
            }
        },
        {
            ucName: 'MARYLAND',
            value: -21,
            custom: {
                winner: 'Democrat',
                elVotesDem: 10,
                elVotesRep: 0,
                votesDem: 56,
                votesRep: 35,
                state_votes: 10
            }
        },
        {
            ucName: 'UTAH',
            value: 28,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 6,
                votesDem: 26,
                votesRep: 54,
                state_votes: 6
            }
        },
        {
            ucName: 'CALIFORNIA',
            value: -23,
            custom: {
                winner: 'Democrat',
                elVotesDem: 54,
                elVotesRep: 0,
                votesDem: 54,
                votesRep: 31,
                state_votes: 54
            }
        },
        {
            ucName: 'COLORADO',
            value: -10,
            custom: {
                winner: 'Democrat',
                elVotesDem: 10,
                elVotesRep: 0,
                votesDem: 49,
                votesRep: 39,
                state_votes: 10
            }
        },
        {
            ucName: 'NEW JERSEY',
            value: -7,
            custom: {
                winner: 'Democrat',
                elVotesDem: 14,
                elVotesRep: 0,
                votesDem: 46,
                votesRep: 39,
                state_votes: 14
            }
        },
        {
            ucName: 'OHIO',
            value: 10.5,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 17,
                votesDem: 39.25,
                votesRep: 49.75,
                state_votes: 17
            }
        },
        {
            ucName: 'ALASKA',
            value: 12,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 3,
                votesDem: 41,
                votesRep: 53,
                state_votes: 3
            }
        },
        {
            ucName: 'INDIANA',
            value: 21,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 11,
                votesDem: 34,
                votesRep: 55,
                state_votes: 11
            }
        },
        {
            ucName: 'MONTANA',
            value: 21.5,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 4,
                votesDem: 32,
                votesRep: 53.5,
                state_votes: 4
            }
        },
        {
            ucName: 'IOWA',
            value: 12,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 6,
                votesDem: 36.5,
                votesRep: 48.5,
                state_votes: 6
            }
        },
        {
            ucName: 'MAINE',
            value: 6,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 2,
                votesDem: 32,
                votesRep: 38,
                state_votes: 2
            }
        },
        {
            ucName: 'MAINE DIST. 1',
            value: -8,
            custom: {
                winner: 'Democrat',
                elVotesDem: 1,
                elVotesRep: 0,
                votesDem: 39,
                votesRep: 31,
                state_votes: 1
            }
        },
        {
            ucName: 'MAINE DIST. 2',
            value: 20,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 1,
                votesDem: 25,
                votesRep: 45,
                state_votes: 1
            }
        },
        {
            ucName: 'SOUTH CAROLINA',
            value: 16.5,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 9,
                votesDem: 35.75,
                votesRep: 52.25,
                state_votes: 9
            }
        },
        {
            ucName: 'MISSOURI',
            value: 17,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 10,
                votesDem: 32,
                votesRep: 49,
                state_votes: 10
            }
        },
        {
            ucName: 'SOUTH DAKOTA',
            value: 29,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 3,
                votesDem: 26,
                votesRep: 55,
                state_votes: 3
            }
        },
        {
            ucName: 'VIRGINIA',
            value: -6,
            custom: {
                winner: 'Democrat',
                elVotesDem: 13,
                elVotesRep: 0,
                votesDem: 49,
                votesRep: 43,
                state_votes: 13
            }
        },
        {
            ucName: 'WYOMING',
            value: 53,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 3,
                votesDem: 15,
                votesRep: 68,
                state_votes: 3
            }
        },
        {
            ucName: 'ARKANSAS',
            value: 33,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 6,
                votesDem: 24,
                votesRep: 57,
                state_votes: 6
            }
        },
        {
            ucName: 'ILLINOIS',
            value: -9,
            custom: {
                winner: 'Democrat',
                elVotesDem: 19,
                elVotesRep: 0,
                votesDem: 43,
                votesRep: 34,
                state_votes: 19
            }
        },
        {
            ucName: 'NORTH DAKOTA',
            value: 37,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 3,
                votesDem: 17,
                votesRep: 54,
                state_votes: 3
            }
        },
        {
            ucName: 'NEBRASKA',
            value: 16,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 2,
                votesDem: 31,
                votesRep: 47,
                state_votes: 2
            }
        },
        {
            ucName: 'WEST VIRGINIA',
            value: 36,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 4,
                votesDem: 23,
                votesRep: 59,
                state_votes: 4
            }
        },
        {
            ucName: 'KANSAS',
            value: 16,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 6,
                votesDem: 31,
                votesRep: 47,
                state_votes: 6
            }
        },
        {
            ucName: 'IDAHO',
            value: 29,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 4,
                votesDem: 26,
                votesRep: 55,
                state_votes: 4
            }
        },
        {
            ucName: 'OKLAHOMA',
            value: 28,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 7,
                votesDem: 27,
                votesRep: 55,
                state_votes: 7
            }
        },
        {
            ucName: 'KENTUCKY',
            value: 29,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 8,
                votesDem: 26,
                votesRep: 55,
                state_votes: 8
            }
        },
        {
            ucName: 'NEW MEXICO',
            value: -8,
            custom: {
                winner: 'Democrat',
                elVotesDem: 5,
                elVotesRep: 0,
                votesDem: 49,
                votesRep: 41,
                state_votes: 5
            }
        },
        {
            ucName: 'ALABAMA',
            value: 100,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 9,
                votesDem: 0,
                votesRep: 100,
                state_votes: 9
            }
        },
        {
            ucName: 'CONNECTICUT',
            value: -100,
            custom: {
                winner: 'Democrat',
                elVotesDem: 7,
                elVotesRep: 0,
                votesDem: 100,
                votesRep: 0,
                state_votes: 7
            }
        },
        {
            ucName: 'DELAWARE',
            value: -100,
            custom: {
                winner: 'Democrat',
                elVotesDem: 3,
                elVotesRep: 0,
                votesDem: 100,
                votesRep: 0,
                state_votes: 3
            }
        },
        {
            ucName: 'DISTRICT OF COLUMBIA',
            value: -100,
            custom: {
                winner: 'Democrat',
                elVotesDem: 3,
                elVotesRep: 0,
                votesDem: 100,
                votesRep: 0,
                state_votes: 3
            }
        },
        {
            ucName: 'HAWAII',
            value: -100,
            custom: {
                winner: 'Democrat',
                elVotesDem: 4,
                elVotesRep: 0,
                votesDem: 100,
                votesRep: 0,
                state_votes: 4
            }
        },
        {
            ucName: 'MISSISSIPPI',
            value: 100,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 6,
                votesDem: 0,
                votesRep: 100,
                state_votes: 6
            }
        },
        {
            ucName: 'NEBRASKA DIST. 1',
            value: 100,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 1,
                votesDem: 0,
                votesRep: 100,
                state_votes: 1
            }
        },
        {
            ucName: 'NEBRASKA DIST. 2',
            value: -100,
            custom: {
                winner: 'Democrat',
                elVotesDem: 1,
                elVotesRep: 0,
                votesDem: 100,
                votesRep: 0,
                state_votes: 1
            }
        },
        {
            ucName: 'NEBRASKA DIST. 3',
            value: 100,
            custom: {
                winner: 'Republican',
                elVotesDem: 0,
                elVotesRep: 1,
                votesDem: 0,
                votesRep: 100,
                state_votes: 1
            }
        },
        {
            ucName: 'OREGON',
            value: -100,
            custom: {
                winner: 'Democrat',
                elVotesDem: 8,
                elVotesRep: 0,
                votesDem: 100,
                votesRep: 0,
                state_votes: 8
            }
        },
        {
            ucName: 'VERMONT',
            value: -100,
            custom: {
                winner: 'Democrat',
                elVotesDem: 3,
                elVotesRep: 0,
                votesDem: 100,
                votesRep: 0,
                state_votes: 3
            }
        }
    ];

    // Prepare map data for joining
    topology.objects.default.geometries.forEach(function (g) {
        if (g.properties && g.properties.name) {
            g.properties.ucName = g.properties.name.toUpperCase();
        }
    });

    const table = document.getElementById("data-table").
        getElementsByTagName('tbody')[0];
    data.sort((lhs, rhs) => lhs.ucName.localeCompare(rhs.ucName));
    const demVotes = data.reduce((partialSum, a) => partialSum + a.custom.elVotesDem, 0);
    const repVotes = data.reduce((partialSum, a) => partialSum + a.custom.elVotesRep, 0);
    data.unshift({
        ucName: 'NATIONAL',
        value: 1.63,
        custom: {
            winner: 'Republican',
            elVotesDem: demVotes,
            elVotesRep: repVotes,
            votesDem: 43.82,
            votesRep: 45.45,
            state_votes: null
        }
    });

    let element = document.getElementById('info-dem1');
    element.innerHTML = `Biden: ${demVotes}`;

    element = document.getElementById('info-rep1');
    element.innerHTML = `Trump: ${repVotes}`;

    // create histogram for electoral college votes
    const max = 100;
    const min = 1;
    const binRange = 1.5;
    const numberOfBins = 10;
    const demBins = new Array(numberOfBins);
    const repBins = new Array(numberOfBins);
    data.forEach((item, index) => {
        const newRow = table.insertRow();
        newRow.className = 'datagrid-row';
        const state = newRow.insertCell(0);
        state.className = 'datagrid-cell';
        const democrat = newRow.insertCell(1);
        democrat.className = 'datagrid-cell';
        const republican = newRow.insertCell(2);
        republican.className = 'datagrid-cell';
        const demVotes = newRow.insertCell(3);
        demVotes.className = 'datagrid-cell';
        const repVotes = newRow.insertCell(4);
        repVotes.className = 'datagrid-cell';
        state.innerHTML = item.ucName;
        democrat.innerHTML = item.custom.elVotesDem;
        republican.innerHTML = item.custom.elVotesRep;
        demVotes.innerHTML = `${item.custom.votesDem}%`;
        repVotes.innerHTML = `${item.custom.votesRep}%`;

        // ignore national
        if (index > 0) {
            const votes = Math.abs(item.value);
            const idx = Math.min(Math.floor((votes - min) / binRange), numberOfBins - 1);
            if (item.custom.winner === 'Republican') {
                setBinValue(repBins, idx, item, binRange, numberOfBins);
            } else {
                setBinValue(demBins, idx, item, binRange, numberOfBins);
            }
        }
    });

    // create divs for result bar
    let demColour = '#0913df';
    const demResults = document.getElementById("results-bar");
    demBins.reverse().forEach((item, index) => {
        const div = document.createElement('div');
        if (index === 0) {
            div.style.borderRadius = '10px 0px 0px 10px';
        }
        div.style.width = `${item.votes * 100 / 270}%`;
        div.style.background = demColour;
        if (!!item && item.votes !== 0) {
            div.innerText = item.votes;
            const span = document.createElement('span');
            span.className = 'bar-segment-tooltip';
            span.innerText = `${item.range}`;
            div.appendChild(span);
        }
        div.className = 'bar-segment';
        demResults.appendChild(div);
        demColour = `#${lightenColour(demColour, 7)}`;
    });

    let repColour = '#df1309';
    const repDivs = repBins.reverse().map((item, index) => {
        const div = document.createElement('div');
        if (index === 0) {
            div.style.borderRadius = '0px 10px 10px 0px';
        }
        div.style.width = `${item.votes * 100 / 270}%`;
        div.style.background = repColour;
        if (!!item && item.votes !== 0) {
            div.innerText = item.votes;
            const span = document.createElement('span');
            span.className = 'bar-segment-tooltip';
            span.innerText = `${item.range}`;
            div.appendChild(span);
        }
        div.className = 'bar-segment';
        repColour = `#${lightenColour(repColour, 7)}`;
        return div;
    });
    repDivs.reverse().forEach(div => {
        demResults.appendChild(div);
    });

    // Initialize the chart
    Highcharts.mapChart('map-container', {
        title: {
            text: 'US Electoral College Poll - 24th May 2024',
            align: 'center'
        },

        mapNavigation: {
            enabled: true,
            enableButtons: false
        },

        xAxis: {
            labels: {
                enabled: false
            }
        },

        colorAxis: {
            labels: {
                format: '{value}%'
            },
            stops: [
                [0, '#0913df'], // Blue
                [0.5, '#caccfd'], // Light Blue
                [0.51, '#fdccca'], // Light Red
                [1, '#df1309'] // Red
            ],
            min: -20,
            max: 20
        },
        tooltip: {
            useHTML: true,
            headerFormat: '<table class="map-tooltip"><caption>{point.key}</caption><tr><th>Party</th><th>Electors</th><th>Votes</th></tr>',
            pointFormat: '<tr><td>Dem.</td><td>{point.custom.elVotesDem}</td><td>{point.custom.votesDem}%</td></tr>' +
                '<tr><td>Rep.</td><td>{point.custom.elVotesRep}</td><td>{point.custom.votesRep}%</td></tr>' +
                '<tr><th colspan="3">{point.custom.winner}</th></tr>',
            footerFormat: '</table>'
        },
        series: [{
            mapData: topology,
            data,
            joinBy: 'ucName',
            name: 'US Electoral College Poll',
            dataLabels: {
                enabled: true,
                format: '{point.properties.hc-a2} ({point.custom.state_votes})',
                style: {
                    fontSize: '10px'
                }
            },
        }, {
            // The connector lines
            type: 'mapline',
            data: Highcharts.geojson(topology, 'mapline'),
            color: 'silver',
            accessibility: {
                enabled: false
            }
        }]
    });

})();
