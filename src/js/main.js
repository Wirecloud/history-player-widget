/* globals $, d3, nv */

(function () {

    "use strict";

    var chart = null;
    var chartData = null;
    var initialData = [];

    var initChart = function initChart() {

        // Creates the svg
        var element = $(document.body);
        element.append('<svg id="chart" class="blurable"></svg>');
        var svg = element.children("svg").get(0);
        d3.select("#chart").classed("svg-content-responsive", true);

        nv.addGraph(function () {

            // By the moment taking default params
            chart = nv.models.lineChart()
                .useInteractiveGuideline(true)
                .showLegend(false)
                .interpolate("linear")
                .duration(250);

            chart.xAxis.tickFormat((d) => {
                var dat = new Date(d);
                return [dat.getFullYear(), dat.getMonth(), dat.getDate()].join('-');
            });

            chart.x2Axis.tickFormat((d) => {
                var dat = new Date(d);
                return [dat.getFullYear(), dat.getMonth(), dat.getDate()].join('-');
            });

            chart.yAxis.tickFormat((d) => {
                // Truncate decimals
                var pow =  Math.pow(10, 2);
                d = Math.floor(d * pow) / pow;


                if (d >= 1000 || d <= -1000) {
                    return Math.abs(d / 1000) + " K";
                } else {
                    return Math.abs(d);
                }
            });

            chart.y2Axis.tickFormat((d) => {
                // Truncate decimals
                var pow =  Math.pow(10, 2);
                d = Math.floor(d * pow) / pow;


                if (d >= 1000 || d <= -1000) {
                    return Math.abs(d / 1000) + " K";
                } else {
                    return Math.abs(d);
                }
            });

            chartData = d3.select(svg).datum(initialData);
            chartData.transition().duration(500).call(chart);

            // Call update to update the chart and threfore the context
            chart.update();

            return chart;
        }.bind(this));
    };

    var paint = function paint(data) {
        if (chartData != null) {
            chartData.datum(data).transition().duration(500).call(chart);
        } else {
            initialData = data;
        }
    };

    var normalizeData = function normalizeData(data) {
        if (typeof data == "string") {
            data = JSON.parse(data);
        } else {
            data = Array.prototype.slice.call(data, 0);
        }

        var normalized_data = [{
            values: data,
            area: true
        }];

        paint(normalized_data);
    };


    var config = function config() {
        // When data is received paint it
        MashupPlatform.wiring.registerCallback('inputData', normalizeData);

        // On resize repaint
        MashupPlatform.widget.context.registerCallback(handleResize);

        initChart();
    };

    var handleResize = function handleResize(new_values) {
        if (chart != null && ('heightInPixels' in new_values || 'widthInPixels' in new_values)) {
            chart.update();
        }
    };

    config();

})();
