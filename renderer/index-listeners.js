var $ = global.jQuery = require('jquery');
const {dialog} = require('electron').remote;
let { PythonShell } = require('python-shell');
var Plotly = require('plotly.js-dist');

var folderPath; //path to folder.

function Bananas()
{
    var trace1 = {
        x: [1, 2, 3, 4],
        y: [10, 15, 13, 17],
        type: 'scatter'
      };
      
      var trace2 = {
        x: [1, 2, 3, 4],
        y: [16, 5, 11, 9],
        type: 'scatter'
      };
      
      var data = [trace1, trace2];
      
      Plotly.newPlot('plot-1', data);
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
    Bananas()
})
} //end createListeners()

$( document ).ready(function()
 {
    createListeners()
});