var $ = global.jQuery = require('jquery');
const {dialog} = require('electron').remote;
let { PythonShell } = require('python-shell');
var Plotly = require('plotly.js-dist');

var dataPath = 'pyfolder/zorin_testData080511_oneElec.mat'; //path to folder.

var filteredData;
var x_axis_time;

function loadData()
{
    let folderOptions = {
        mode: 'binary',
        pythonOptions: ['-u'], // get print results in real-time
        args: [dataPath]
      };

    var pyshell = new PythonShell('pyfolder/LoadAndProcessData.py', folderOptions);

    pyshell.stdout.on('data', function (output_data) {
        string_arr = output_data.toString()
        string_arr = string_arr.split(",")
        console.log(string_arr)
        filteredData = string_arr.map(Number)
        //x_axis_time = Array.from(output_data[1])
        console.log(filteredData.length)

        x_axis_time = Array(filteredData.length).keys();
        graphFilteredData(filteredData)
    });
}

function graphFilteredData(data)
{
    var graphstyleproperties = {
        xaxis: { linecolor: '#460037', linewidth: 1, mirror: true },
        yaxis: { linecolor: '#460037', linewidth: 1, mirror: true },
        plot_bgcolor: '#9789a4',
        paper_bgcolor: '#9789a4'
      }

    var organized_data = { x: x_axis_time, y: filteredData, type: 'scatter' }
    var trace1 = {
        x: [1, 2, 3, 4],
        y: [10, 15, 13, 17],
        type: 'line'
      };
      
      var data_final = [organized_data]
      var plot1Div = document.getElementById("plot1");
      Plotly.newPlot(plot1Div, data_final , graphstyleproperties);
}

function getFolder() 
{
    folderPath = dialog.showOpenDialog({
        properties: ['openFile']
    });
    console.log(folderPath.toString())
}

function processImages(imageType="RIBBON")
{
    let folderOptions = {
        mode: 'text',
        pythonOptions: ['-u'], // get print results in real-time
       // scriptPath: 'path/to/my/scripts',
        args: [folderPath, imageType] // ### argv[1] = folderpath, argv[2] = imagetype, argv[0] is the python script itself, for some reason.
      };

    var pyshell = new PythonShell('pyfolder/processFile.py', folderOptions);
  

    var checkprocessing = false;

    pyshell.on('message', function (message) 
    {
    // received a message sent from the Python script (a simple "print" statement
    var div = document.getElementById('terminalExtraContentDiv');
    var processingDiv = document.getElementById('processingDiv');
    var blockCursor = document.getElementById('blockCursor')

    if(message == "PROCESSING") {
        checkprocessing = true
        message = "Processing first image..."
    }
    if(checkprocessing) {
        processingDiv.innerHTML = message;
        div.appendChild(processingDiv)
        processingDiv.append(blockCursor);
    } else {
        div.innerHTML += message;
        div.appendChild(document.getElementById('blockCursor'));
        div.innerHTML += "<br>";
    }
    console.log(message);
    });

    // end the input stream and allow the process to exit
    pyshell.end(function (err) 
    {
        if (err)
        {
            throw err;
    };

    console.log('finished');
});
}

function createListeners()
{
document.getElementById('selectDataButton').addEventListener('click', () => {
    loadData()
})

} //end createListeners()

$( document ).ready(function()
 {
    createListeners()
});