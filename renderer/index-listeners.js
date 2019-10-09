var $ = global.jQuery = require('jquery');
const {dialog} = require('electron').remote;
let { PythonShell } = require('python-shell');
var Plotly = require('plotly.js-dist');
var scale = require('scale-number-range');

var dataPath = 'pyfolder/zorin_testData080511_oneElec.mat'; //path to folder.

var filteredData;
var filteredDataArr = []; //handling large amounts of data - the python script can only push a certain amount of data to node at a time (~arr size 3288), so handle that by pushing to array.
var scaledFilteredDataArr = [];
var filteredDataDiv;
var x_axis_time;
var x_axis_time_arr = []; //same as ^
var Fs = 1000 //Todo:: get from user.

var hilbertPhaseData = []
var processedDataHolder = []; // array of arrays, each array is like filteredData.
var processedDataDivs = []; //corresponding divs of processedDataHolder divs.
var iterator_position = 0; // keep track of where we are.

function loadData()
{
    let folderOptions = {
        mode: 'binary',
        pythonOptions: ['-u'], // get print results in real-time
        args: [dataPath, Fs]
      };

    var pyshell = new PythonShell('pyfolder/LoadAndProcessData.py', folderOptions);
    // TODO:: move pyfolder to script options.

    pyshell.stdout.on('data', function (output_data) {
        var string_arr = output_data.toString()
        string_arr = string_arr.split(",")
        filteredData = string_arr.map(Number)
        for( var i = 0; i < filteredData.length; i++)
        {
            filteredData[i] = filteredData[i] || 0
            filteredData[0] = 0 //WTF python-shell???
        }
        filteredDataArr.push(filteredData)
    });
    pyshell.end(function (err,code,signal) 
    {
        var overall_iterator = 0;
        //create x axis time for data now that we've processed all the input data.
        for( var i = 0; i < filteredDataArr.length; i++)
        {
            var curr_x_axis_time = []
            for (var j = 0; j < filteredDataArr[i].length; j++)
            {
                curr_x_axis_time.push(overall_iterator);
                overall_iterator = overall_iterator + 1
            }
            x_axis_time_arr.push(curr_x_axis_time)
        }

        filteredDataDiv = document.getElementById("filterDivPlot");
        graphData(filteredDataDiv, x_axis_time_arr[0],filteredDataArr[0], 'Filtered Data', 'Time (s)', 'Amplitude' )

        // create the x axis iterator for the plots.
        createXIterator();
       // scaleFilteredData();
    });
}

function scaleFilteredData()
{
    for( var i = 0 ; i < filteredDataArr.length; i++)
    { 
        max_filtered = Math.max(...filteredDataArr[i])
        min_filtered = Math.min(...filteredDataArr[i])
        var curr_scaled = []
        var curr_unscaled = filteredDataArr[i]
        for( var j = 0 ; i < filteredDataArr[i].length ; j++)
        {
            curr_scaled.push( scale(curr_unscaled[j], min_filtered, max_filtered, -180, 180 ))
        }
        scaledFilteredDataArr.push(curr_arr)
    }
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
        var organized_data = { x: data_x[0], y: data_y[0], type: 'scattergl',   mode: 'markers',
        marker: { size: 3, color: 'black'},  
        }
        var organized_data2 = { x: data_x[1], y: data_y[1], type: 'scattergl',   mode: 'markers',
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

function createXIterator()
{
    var forwardIterator = document.getElementById("forwardButton");
    var backwardIterator = document.getElementById("backwardButton");
    forwardIterator.innerHTML="Forward";
    backwardIterator.innerHTML="Backward";
    forwardIterator.removeAttribute("hidden");
    backwardIterator.removeAttribute("hidden");

    forwardIterator.addEventListener('click', () => {
        if( (iterator_position+1) >= filteredDataArr.length) { }
        else
        {
            iterator_position = iterator_position + 1
            graphData(filteredDataDiv, x_axis_time_arr[iterator_position],filteredDataArr[iterator_position], 'Filtered Data', 'Time (s)', 'Amplitude' )
            batchGraph(iterator_position)
        }
    })
    backwardIterator.addEventListener('click', ()=> {
        if( (iterator_position - 1) < 0) { }
        else
        {
            iterator_position = iterator_position - 1
            graphData(filteredDataDiv, x_axis_time_arr[iterator_position],filteredDataArr[iterator_position], 'Filtered Data', 'Time (s)', 'Amplitude' )
            batchGraph(iterator_position)
        }
    })
}

function batchGraph(iterator_position)
{
    for (var i = 0; i < processedDataDivs.length; i++)
    {
        var twoPlotX = [x_axis_time_arr[iterator_position], x_axis_time_arr[iterator_position]]
        var twoPlotY = [hilbertPhaseData[iterator_position], filteredDataArr[iterator_position]]
        graphData(processedDataDivs[i], twoPlotX, twoPlotY, 'Instantaneous Phase: Hilbert Transform', 'Time ', 'Phase & Scaled Amplitude', twoPlot=true )
    }
}

function getFolder() 
{
    folderPath = dialog.showOpenDialog({
        properties: ['openFile']
    });
    console.log(folderPath.toString())
}






function hilbertTransform()
{
    let inputOptions = {
        mode: 'binary',
        pythonOptions: ['-u'],
        args: [ filteredDataArr[0] ]
    }
    var py = new PythonShell('pyfolder/hilbertTransform.py', inputOptions)
    py.stdout.on('data', function (output_data) 
    {
        var string_arr = output_data.toString().split(",")
        hilbertPhase = string_arr.map(Number)
        for( var i = 0; i < hilbertPhase.length; i++)
        {
            hilbertPhase[i] = hilbertPhase[i] || 0
            hilbertPhase[0] = 0
        }
        hilbertPhaseData.push(hilbertPhase)
    });
    py.end(function (err,code,signal) 
    {
        var hilbert_div = document.getElementById("hilbertDivPlot");
        processedDataDivs.push(hilbert_div)
        twoPlotHilbertX = [x_axis_time_arr[0], x_axis_time_arr[0]]
        twoPlotHilbertY = [hilbertPhaseData[0], filteredDataArr[0]]
        graphData(hilbert_div, twoPlotHilbertX, twoPlotHilbertY, 'Instantaneous Phase: Hilbert Transform', 'Time ', 'Phase & Scaled Amplitude', twoPlot=true )
    });
    for(var i = 1; i < filteredDataArr.length; i++)
    {
    processRemainingData(filteredDataArr[i])
    }
}

function processRemainingData(data_input)
{
    let inputOptions = {
        mode: 'binary',
        pythonOptions: ['-u'],
        args: [ data_input ]
    }
    var py = new PythonShell('pyfolder/hilbertTransform.py', inputOptions)
    py.stdout.on('data', function (output_data) 
    {
        var string_arr = output_data.toString().split(",")
        hilbertPhase = string_arr.map(Number)
        for( var i = 0; i < hilbertPhase.length; i++)
        {
            hilbertPhase[i] = hilbertPhase[i] || 0
            hilbertPhase[0] = 0
        }
        hilbertPhaseData.push(hilbertPhase)
    });
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