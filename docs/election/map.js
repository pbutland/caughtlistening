let topology;
async function initChart(data) {
    if (!topology) {
        topology = await fetch(
            'https://code.highcharts.com/mapdata/countries/us/us-all.topo.json'
        ).then(response => response.json());

        // Prepare map data for joining
        topology.objects.default.geometries.forEach(function (g) {
            if (g.properties && g.properties.name) {
                g.properties.ucName = g.properties.name.toUpperCase();
            }
        });
    }

    Highcharts.mapChart('map-container', {
        title: {
            text: '',
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
        legend: {
            symbolWidth: 300
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
}
