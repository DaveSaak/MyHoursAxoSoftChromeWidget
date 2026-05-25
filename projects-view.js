'use strict'

function ProjectsView(myHoursApi, options) {
    var _this = this;
    _this.options = options;
    _this.myHoursApi = myHoursApi;

    _this.show = function () {
        const today = new Date();
        const tenDaysAgo = moment(today).add(-10, 'day');

        if (!_this.options.platforms.devops.enabled) {
            return;
        }

        _this.myHoursApi.getActivity(tenDaysAgo, today).then(activityLogs => {
            const totalWorked = activityLogs.reduce((accumulator, log) => accumulator + (log.logDuration / 60), 0);
            $('.projectsItemsTotal').text(minutesToString(totalWorked));

            let projects = activityLogs.reduce((accumulator, log) => {
                const projectId = log.projectId || log.project?.id || log.project?.projectId;
                const projectName = log.projectName || log.project?.name || log.project?.projectName;

                if (!projectId && !projectName) {
                    return accumulator;
                }

                const key = projectId || projectName;
                if (key in accumulator) {
                    accumulator[key].count = accumulator[key].count + 1;
                    accumulator[key].workDone = accumulator[key].workDone + (log.logDuration / 60);
                } else {
                    accumulator[key] = {
                        projectId: projectId,
                        projectName: projectName || 'Unknown project',
                        count: 1,
                        workDone: log.logDuration / 60
                    };
                }

                return accumulator;
            }, {});

            projects = Object.entries(projects).map(x => x[1]);

            const totalWorkedWithProject = projects.reduce((accumulator, project) => accumulator + project.workDone, 0);
            $('#projectsUnassigned').text(minutesToString(totalWorked - totalWorkedWithProject));

            let projectsPercentsBar = $('#projectsSubHeader');
            projectsPercentsBar.empty();

            let projectsStatistics = [...projects];
            projectsStatistics.sort((a, b) => b.workDone - a.workDone);
            if (totalWorked > 0) {
                projectsStatistics.forEach(project => {
                    const percentage = Math.round(project.workDone / totalWorked * 100);
                    let statistics = $('<div>').addClass('statistics-xs');
                    statistics.append($('<div>').text(percentage + '%'));
                    statistics.append($('<div>').text(project.projectName));
                    projectsPercentsBar.append(statistics);
                });
            }

            renderProjectsChart(projects);
        });
    }

    function renderProjectsChart(projects) {
        var data = {
            datasets: [
                {
                    data: projects.map(x => x.workDone),
                    borderWidth: 2,
                    lineTension: 0.5,
                    label: 'ten day overview',
                    backgroundColor: 'rgba(102, 153, 204, 0.2)',
                    borderColor: 'rgba(102, 153, 204, 1)',
                    pointBackgroundColor: 'rgba(102, 153, 204, 1)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(102, 153, 204, 1)'
                }
            ],
            labels: projects.map(x => x.projectName)
        };

        if (_this.projectsChart != undefined) {
            _this.projectsChart.destroy();
        }

        _this.projectsChart = new Chart(document.getElementById('projectsChart').getContext('2d'), {
            type: 'radar',
            data: data,
            options: {
                startAngle: -36,
                legend: {
                    display: false,
                    position: 'right'
                },
                scale: {
                    gridLines: {
                        circular: true
                    },
                    angleLines: {
                        display: true,
                        lineWidth: 0.5,
                        color: 'rgba(128, 128, 128, 0.2)'
                    },
                    pointLabels: {
                        fontSize: 11,
                        fontStyle: '300',
                        fontColor: 'rgba(104, 104, 104, 1)'
                    },
                    ticks: {
                        display: false,
                        stepSize: 120
                    }
                },
                tooltips: {
                    displayColors: false,
                    callbacks: {
                        title: function (tooltipItems, chartData) {
                            if (!tooltipItems || tooltipItems.length === 0) {
                                return '';
                            }

                            const item = tooltipItems[0];
                            return chartData.labels[item.index] || '';
                        },
                        label: function (tooltipItem, chartData) {
                            let value = chartData.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                            const allValues = chartData.datasets[tooltipItem.datasetIndex].data || [];
                            const total = allValues.reduce((sum, current) => sum + (current || 0), 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return [percentage + '%', minutesToString(value)];
                        }
                    }
                }
            }
        });
    }
}
