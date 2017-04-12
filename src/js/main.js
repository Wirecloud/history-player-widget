/* globals $, d3, moment, nv */

(function () {

    "use strict";

    var chart = null;
    var chartData = null;
    var initialData = [];

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

        nv.addGraph(function () {

            // By the moment taking default params
            chart = nv.models.lineChart()
                .useInteractiveGuideline(true)
                .showLegend(false)
                .showYAxis(false)
                .interpolate("monotone")
                .duration(250);

            chart.xAxis.tickFormat((d) => {
                return moment(d).format("L");
            });
            chart.xScale(d3.time.scale());

            // Tooltip
            chart.interactiveLayer.tooltip.contentGenerator((d) => {
                return "<h2>" + moment(d.value).format("llll") + "</h2>";
            });

            chartData = d3.select(svg).datum(initialData);
            chartData.transition().duration(500).call(chart);

            // Event listeners
            chart.lines.dispatch.on("elementClick", function (e) {
                removeLines();
                renderLine(e[0].point.x);
                MashupPlatform.wiring.pushEvent("outputData", e[0].point.data);
            });

            // Call update to update the chart and threfore the context
            chart.update();

            return chart;
        }.bind(this));
    };

    var paint = function paint(data, min, max) {
        if (chartData != null) {
            chart.forceX([min, max]);
            chartData.datum(data).transition().duration(500).call(chart);
        } else {
            initialData = data;
        }
    };

    var normalizeData = function normalizeData(data) {
        if (typeof data == "string") {
            data = JSON.parse(data);
        } else {
            data.series.forEach((serie) => {
                serie.values = Array.prototype.slice.call(serie.values, 0);
                serie.area = true;
            });
        }

        paint(data.series, data.min, data.max);
    };


    var config = function config() {
        // When data is received paint it
        MashupPlatform.wiring.registerCallback('inputData', normalizeData);

        // On resize repaint
        MashupPlatform.widget.context.registerCallback(handleResize);

        // Init moment locale
        moment.locale(MashupPlatform.context.get('language'));

        initChart();
    };

    var handleResize = function handleResize(new_values) {
        if (chart != null && ('heightInPixels' in new_values || 'widthInPixels' in new_values)) {
            chart.update();
            resizeLines();
        }
    };

    config();

})();
