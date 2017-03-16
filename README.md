* Rangenv Chart
The Rangenv Chart widget is a WireCloud widget that lets you visualize
data along a date time and select a time range from it.

* Settings
No settings

* Usage
** Input endpoint
  - inputData: Connect this endpoint to a source of valid data.

    Input data format:

#+BEGIN_SRC json
  {
      "values": [0.3, 0.4, 0.8],
      "key": "My Key",
      "interval": {
          "data_begin": 1432936800000,
          "data_end": 1476452763000,
          "from": 1432936800000,
          "to": 1476452763000
      }
  }
#+END_SRC

  - values :: Data you want to display in the chart.
  - key :: Name is going to appear in the legend.
  - interval :: Interval of time to display the data.
    + - data_begin, from :: Starting date of the interval.
    + - data_end, to :: Ending date of the interval.

** Output endpoint
  - outputData: Sends formated data of the zone selected in the
    widget.

    Output data format:

#+BEGIN_SRC json
  {
      "values": [
          {
              "x": 1473105381230.7715,
              "y": 0.6512108761817217
          },
          {
              "x": 1474779072115.387,
              "y": 0.5203659036196768
          }
      ],
      "key": "Test data"
  }
#+END_SRC

  - values :: List of formated values.
    + - x :: Date related to the value.
    + - y :: Value.
  - key :: Lavel of the graph.

* DEMO
[[https://youtu.be/bxd9hfephaU][Click here to see the demo]]
