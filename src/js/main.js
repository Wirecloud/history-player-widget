/* globals $, d3, moment, nv, StyledElements */

(function (se) {

    "use strict";

    var DEFAULT_HISTROY_KEYS = [
        "temperature",
        "relativeHumidity",
        "SO2",
        "CO",
        "NO",
        "NO2",
        "PM2.5",
        "PM10",
        "NOx",
        "O3",
        "TOL",
        "BEN",
        "EBE",
        "TCH",
        "CH4",
        "NHMC",
    ];

    var chart = null;
    var chartData = null;
    var initialData = [];
    var initialMin = null;
    var initialMax = null;
    var currentMoment = null;
    var currentStep = null;
    var interval = null;
    var playbutton = null;
    var historykeys = null;
    var historydata = null;

    var resizeLines = function removeLines() {
        d3.select(chart.container).selectAll(".history-current-value line")
            .attr("y1", chart.interactiveLayer.height());
    };

    var removeLines = function removeLines() {
        d3.select(chart.container).selectAll(".history-current-value").remove();
    };

    var renderLine = function renderLine(x) {
        x = chart.xAxis.scale()(x);
        var wrap = d3.select(chart.container).select(".nv-interactive g.nv-wrap.nv-interactiveLineLayer");
        var group = wrap.append("g").attr("class", "history-current-value");
        group
            .append("line")
            .attr("x1", x)
            .attr("x2", x)
            .attr("y1", chart.interactiveLayer.height())
            .attr("y2", 0);
    };

    var initChart = function initChart() {

        // Creates the svg
        var element = $(document.body);
        element.append('<svg id="chart" class="blurable"></svg>');
        var svg = element.children("svg").get(0);
        d3.select("#chart").classed("svg-content-responsive", true);

        playbutton = new se.ToggleButton({iconClass: "fa fa-play"});
        playbutton.addEventListener('click', () => {
            if (playbutton.active) {
                play();
            } else {
                stop();
            }
        });
        playbutton.appendTo(document.body);

        nv.addGraph(function () {

            // By the moment taking default params
            chart = nv.models.lineChart()
                .useInteractiveGuideline(true)
                .showYAxis(false)
                .interpolate("monotone")
                .margin({top: 30, right: 10, bottom: 25, left: 40})
                .duration(125);

            chart.xAxis.tickFormat((d) => {
                return moment(d).format("L");
            });
            chart.xScale(d3.time.scale());

            chart.forceY(0);

            // Tooltip
            chart.interactiveLayer.tooltip.contentGenerator((d) => {
                return "<h2>" + moment(d.value).format("llll") + "</h2>";
            });

            if (initialMin != null && initialMax != null) {
                chart.forceX([initialMin, initialMax]);
            }
            chartData = d3.select(svg).datum(initialData);
            chartData.transition().duration(125).call(chart);

            // Event listeners
            chart.lines.dispatch.on("elementClick", function (e) {
                removeLines();
                currentMoment = e[0].point.x;
                currentStep = e[0].pointIndex;
                renderLine(e[0].point.x);
                MashupPlatform.wiring.pushEvent("outputData", e[0].point.data);
            });

            // Call update to update the chart and threfore the context
            chart.update();

            return chart;
        }.bind(this));
    };

    var nextStep = function nextStep() {
        var data = chartData.datum()[0].values;

        currentStep += 1;
        if (currentStep < data.length) {
            currentMoment = data[currentStep].x;
            removeLines();
            renderLine(currentMoment);
            MashupPlatform.wiring.pushEvent("outputData", data[currentStep].data);
        } else {
            stop();
        }
    };

    var play = function play() {
        var data = chartData.datum()[0].values;
        if (currentStep >= data.length) {
            currentStep = 0;
        } else if (data.length == 0) {
            playbutton.active = false;
            return;
        }
        interval = setInterval(nextStep, 1000);
        nextStep();
    };

    var stop = function stop() {
        if (interval != null) {
            clearInterval(interval);
            interval = null;
        }
        playbutton.active = false;
    };

    var paint = function paint(data, min, max) {

        if (chartData != null) {
            chart.forceX([min, max]);
            chartData.datum(data).transition().duration(125).call(chart);
            if (currentMoment == null) {
                currentStep = nv.interactiveBisect(data[0].values, max, chart.x());
                currentMoment = data[0].values[currentStep].x;
                renderLine(currentMoment);
                MashupPlatform.wiring.pushEvent("outputData", data[0].values[currentStep].data);
            } else {
                currentStep = nv.interactiveBisect(data[0].values, currentMoment, chart.x());
                currentMoment = data[0].values[currentStep].x;
                removeLines();
                renderLine(currentMoment);
            }
        } else {
            initialData = data;
            initialMin = min;
            initialMax = max;
        }
    };

    var addValue = function addValue(key, dateObserved, entity) {
        var value = Number(entity[key]);
        if (!Number.isFinite(value)) {
            return;
        }

        var entry;
        if (!(dateObserved in historydata.keys[key])) {
            entry = {
                x: dateObserved,
                y: 0,
                data: []
            };
            var keyindex = historykeys.indexOf(key);
            historydata.keys[key][dateObserved] = entry;
            historydata.chartData[keyindex].values.unshift(entry);
        } else {
            entry = historydata.keys[key][dateObserved];
        }

        entry.data.push(entity);
        entry.y = entry.y + (value - entry.y) / (entry.data.length);
    };

    var normalizeData = function normalizeData(data) {
        if (typeof data == "string") {
            data = JSON.parse(data);
        }

        if (!Array.isArray(data)) {
            data = [data];
        }

        data.forEach((element) => {
            var dateObserved = new Date(element.validity.from).getTime();
            historykeys.forEach((key) => {
                addValue(key, dateObserved, element);
            });
        });

        historydata.chartData.forEach((serie) => {serie.values.sort((a, b) => {return a.x - b.x});});
        paint(
            historydata.chartData.filter((serie) => {return serie.values.length > 0;}),
            data.min,
            data.max
        );
    };


    var updateHistoryKeys = function updateHistoryKeys() {
        historykeys = MashupPlatform.prefs.get('keys').trim();
        if (historykeys === "") {
            historykeys = DEFAULT_HISTROY_KEYS;
        } else {
            historykeys = historykeys.split(new RegExp(',\\s*'));
        }

        // Init history structures
        historydata = {
            keys: {},
            chartData: []
        };
        historykeys.forEach((key) => {
            historydata.keys[key] = {};
            historydata.chartData.push({
                key: key,
                values: []
            });
        });

        initChart();
    };

    var config = function config() {
        // When data is received paint it
        MashupPlatform.wiring.registerCallback('inputData', normalizeData);

        // On resize repaint
        MashupPlatform.widget.context.registerCallback(handleResize);

        // Init moment locale
        moment.locale(MashupPlatform.context.get('language'));

        MashupPlatform.prefs.registerCallback(updateHistoryKeys);
        updateHistoryKeys();
    };

    var handleResize = function handleResize(new_values) {
        if (chart != null && ('heightInPixels' in new_values || 'widthInPixels' in new_values)) {
            chart.update();
            resizeLines();
        }
    };

    config();

})(StyledElements);
