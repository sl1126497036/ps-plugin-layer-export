//js和jsx的交互接口
const cs = new CSInterface();
var fs = require("fs");
var os = require("os");

//导入第三方库方法
loadJSX = (fileName) => {
        const extensionRoot = cs.getSystemPath(SystemPath.EXTENSION) + "/lib/";
        cs.evalScript('$.evalFile("' + extensionRoot + fileName + '")');
    }
    //导入JSON2.jsx
loadJSX("json2.jsx");
//将当前PSD路径作为默认导出路径
getDefaultPath = () => {
    cs.evalScript("getActiveDocumentPath()", (res) => {
        if (resCheck(res)) {
            document.getElementById("exportPath").value = res;
        }
    });
}
getDefaultPath();

selectExportPath = () => {
    const res = cs.evalScript("chooseExportPath()", (res) => {
        if (resCheck(res)) {
            document.getElementById("exportPath").value = res;
        }
    });
}

doExport = () => {
    let exportPath = document.getElementById("exportPath").value;
    if (!exportPath) {
        cs.evalScript("getActiveDocumentPath()", (res) => {
            if (resCheck(res)) {
                document.getElementById("exportPath").value = res;
                exportPath = res;
                exportLayers(exportPath);
                exportJson(exportPath);
            } else {
                alert("必须选择一个导出路径！");
            }
        });
    } else {
        exportLayers(exportPath);
        exportJson(exportPath);
    }
}
exportJson = (exportPath) => {
    cs.evalScript("getArtLayers()", (artLayersStr) => {
        if (resCheck(artLayersStr)) {
            const artLayers = JSON.parse(artLayersStr);
            artLayers && artLayers.length > 0 && cs.evalScript("exportBasePath('" + exportPath + "')", (exportBasePath) => {
                if (resCheck(exportBasePath)) {
                    var jsonFilePath = exportBasePath + "/result.json";
                    if (artLayers) {
                        const jsonData = [];
                        artLayers.map((item, index) => {
                            const bounds = item.bounds.split(",");
                            jsonData.push({
                                layerInfo: {
                                    ...item,
                                    bounds
                                },
                                fileName: index + ".png",
                                x: parseInt(bounds[0]),
                                y: parseInt(bounds[1]),
                                width: parseInt(bounds[2]) - parseInt(bounds[0]),
                                height: parseInt(bounds[3]) - parseInt(bounds[1])
                            });
                        });
                        if (jsonFilePath.startsWith("~")) {
                            jsonFilePath = jsonFilePath.replace("~", os.homedir().toString());
                        }
                        fs.writeFile(jsonFilePath, JSON.stringify(jsonData), 'utf8', (error) => {
                            if (error) {
                                console.log(error);
                                alert('JSON文件导出失败,错误:' + error);
                            }
                        });


                    }
                }
            })
        }
    });
}
exportLayers = (exportPath) => {
    cs.evalScript("exportLayers('" + exportPath + "')");
}
resCheck = (res) => {
    return res && res.toString().indexOf('EvalScript error') <= -1 && res != 'null' && res != 'undefined';
}
alert = (msg) => {
    cs.evalScript("alert('" + msg + "')");
}