// BP Tracker - Chart Logic

let bpChart = null;
let currentRange = 7;

// Chart.js dark theme configuration
Chart.defaults.color = '#a0a0a0';
Chart.defaults.borderColor = '#2a2a4e';

// Note: initChart() and initChartControls() are called from app.js after unlock

function initChartControls() {
    const buttons = document.querySelectorAll('.chart-controls .btn-sm');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const range = btn.dataset.range;
            currentRange = range === 'all' ? 'all' : parseInt(range);
            updateChart();
        });
    });
}

function initChart() {
    const ctx = document.getElementById('bp-chart').getContext('2d');

    bpChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Systolic',
                    data: [],
                    borderColor: '#f87171',
                    backgroundColor: 'rgba(248, 113, 113, 0.1)',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Diastolic',
                    data: [],
                    borderColor: '#4a9eff',
                    backgroundColor: 'rgba(74, 158, 255, 0.1)',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Pulse',
                    data: [],
                    borderColor: '#a78bfa',
                    backgroundColor: 'rgba(167, 139, 250, 0.1)',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    hidden: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: '#1a1a2e',
                    titleColor: '#eaeaea',
                    bodyColor: '#a0a0a0',
                    borderColor: '#2a2a4e',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label;
                            const value = context.parsed.y;
                            const unit = label === 'Pulse' ? 'bpm' : 'mmHg';
                            return `${label}: ${value} ${unit}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(42, 42, 78, 0.5)'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(42, 42, 78, 0.5)'
                    },
                    beginAtZero: false,
                    suggestedMin: 40,
                    suggestedMax: 180
                }
            }
        }
    });

    updateChart();
}

function updateChart() {
    const readings = getReadings();
    const chartContainer = document.querySelector('.chart-container');
    const noDataMsg = document.getElementById('no-chart-data');

    if (readings.length === 0) {
        chartContainer.style.display = 'none';
        noDataMsg.style.display = 'block';
        return;
    }

    chartContainer.style.display = 'block';
    noDataMsg.style.display = 'none';

    let filteredReadings = [...readings];

    if (currentRange !== 'all') {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - currentRange);

        filteredReadings = readings.filter(r => new Date(r.timestamp) >= cutoffDate);
    }

    // Sort by date ascending for chart display
    filteredReadings.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const labels = filteredReadings.map(r => {
        const date = new Date(r.timestamp);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });

    bpChart.data.labels = labels;
    bpChart.data.datasets[0].data = filteredReadings.map(r => r.systolic);
    bpChart.data.datasets[1].data = filteredReadings.map(r => r.diastolic);
    bpChart.data.datasets[2].data = filteredReadings.map(r => r.pulse);

    bpChart.update();
}

// Make updateChart available globally
window.updateChart = updateChart;
