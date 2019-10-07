var $ = global.jQuery = require('jquery');
const {dialog} = require('electron').remote;
let { PythonShell } = require('python-shell');
var Plotly = require('plotly.js-dist');
var scale = require('scale-number-range');

var dataPath = 'pyfolder/zorin_testData080511_oneElec.mat'; //path to folder.

var filteredData;
var x_axis_time;
var Fs = 1000

function loadData()
{
    let folderOptions = {
        mode: 'binary',
        pythonOptions: ['-u'], // get print results in real-time
        args: [dataPath, Fs]
      };

    var pyshell = new PythonShell('pyfolder/LoadAndProcessData.py', folderOptions);

    pyshell.stdout.on('data', function (output_data) {
        var string_arr = output_data.toString()
        string_arr = string_arr.split(",")
        filteredData = string_arr.map(Number)
        for( i = 0; i < filteredData.length; i++)
        {
            filteredData[i] = filteredData[i] || 0
        }
        console.log(filteredData.length)
        x_axis_time = Array(filteredData.length).keys();
        var filtered_div = document.getElementById("filterDivPlot");
        graphData(filtered_div, x_axis_time,filteredData, 'Filtered Data', 'Time (s)', 'Amplitude' )
    });
}

function hilbertTransform()
{
    // scale(number, oldMin, oldMax, newMin, newMax);
    filtered_scaled = []
    max_filtered = Math.max(...filteredData)
    min_filtered = Math.min(...filteredData)
    for( i = 0; i < filteredData.length; i++)
    {
        filtered_scaled.push( scale(filteredData[i], min_filtered, max_filtered, -180, 180))
    }
    let inputOptions = {
        mode: 'binary',
        pythonOptions: ['-u'],
        args: [ filteredData]
    }
    var py = new PythonShell('pyfolder/hilbertTransform.py', inputOptions)
    py.stdout.on('data', function (data) {
        dataString = data.toString().split(",")
        hilbertInstantPhase = dataString.map(Number)
        var hilbert_div = document.getElementById("hilbertDivPlot");
        twoPlotHilbertX = [x_axis_time, x_axis_time]
        twoPlotHilbertY = [hilbertInstantPhase, filtered_scaled]
        graphData(hilbert_div, twoPlotHilbertX, twoPlotHilbertY, 'Instantaneous Phase: Hilbert Transform', 'Time (s)', 'Phase & Scaled Amplitude', twoPlot=true )
    });
}
  
function graphData(div, data_x, data_y, title, x_title, y_title, twoPlot =false)
{
    var graphstyleproperties = {
        xaxis: { linecolor: '#460037', linewidth: 1, mirror: true },
        yaxis: { linecolor: '#460037', linewidth: 1, mirror: true },
        plot_bgcolor: '#e1dde6',
        paper_bgcolor: '#e1dde6',
        title: { text: title,
                 font: { family: 'Courier New, monospace', size: 25},
          },
        xaxis: { title: { text: x_title,
              font: { family: 'Courier New, monospace', size: 18 }
            } },
          yaxis: { title: { text: y_title,
              font: { family: 'Courier New, monospace', size: 18 }
            }
          }
    }
    if(twoPlot)
    {
        var organized_data = { x: data_x[0], y: data_y[0], type: 'scatter',   mode: 'markers',
        marker: { size: 3, color: 'black'},  
        }
        var organized_data2 = { x: data_x[1], y: data_y[1], type: 'scatter',   mode: 'markers',
        marker: { size: 2, color: 'blue'},  
        }
          var data_final = [organized_data, organized_data2]
          Plotly.newPlot(div, data_final , graphstyleproperties, {responsive: true});
    }
    else
    {
        var organized_data = { x: data_x, y: data_y, type: 'scatter',   mode: 'markers',
        marker: { size: 3, color: [0]},  
        }
          var data_final = [organized_data]
          Plotly.newPlot(div, data_final , graphstyleproperties, {responsive: true});
    }
}

function getFolder() 
{
    folderPath = dialog.showOpenDialog({
        properties: ['openFile']
    });
    console.log(folderPath.toString())
}

function createListeners()
{
document.getElementById('selectDataButton').addEventListener('click', () => {
    loadData()
})
document.getElementById('processDataButton').addEventListener('click', () => {
    hilbertTransform()
})

} //end createListeners()

$( document ).ready(function()
 {
    createListeners()
});