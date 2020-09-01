# 仿PhotoshopCC图层批量导出插件

仿Photoshop图层批量导出插件，并支持导出图层信息到JSON文件。
本项目只作为案例参考，需要更多PS插件开发教程请参考：https://github.com/lujingtao/Photoshop-plug-in-development-tutorial

## 前言
由于工作原因，需要从PSD中导出每个图层并获取图层信息到JSON文件。无意间发现PS自带了图层批量导出工具（文件->导出->将图层导出到文件...），很方便，但是没有图层信息，所以打算模仿该功能自己写一个插件。

## 实现
实现思路和PS自带工具的执行过程一样。通过遍历图层，将当前需要导出的图层保留，删除其他图层，将当前图层导出后还原历史，然后导出下一张图层。思路有了，代码就简单了：

JSX:
```javascript
function doExport(exportPath){
    //保存当前历史
    var savedState = app.activeDocument.activeHistoryState;
    var artLayers = app.activeDocument.artLayers;
    //artLayers.length在执行remove之后会变小
    var layerLength = artLayers.length;
    if(artLayers && layerLength>0){
        exportPath = exportBasePath(exportPath);
        app.changeProgressText("开始导出...");
        for(var activeLayerIndex = 0;activeLayerIndex < layerLength; activeLayerIndex++){
            try{
                //更新进度
                app.updateProgress((activeLayerIndex+1),layerLength);
                app.changeProgressText("正在导出"+(activeLayerIndex+1)+"/"+layerLength+"...");
                 //刷新
                app.refresh();
                //artLayers[activeLayerIndex]指向的layer在remove方法之后会变
                var activeLayer = artLayers[activeLayerIndex];
                //跳过隐藏图层
                if(!activeLayer.visible){
                    continue;
                }
                for(var i = 0; i < artLayers.length; i++){//artLayers.length在执行remove之后会变小
                    if(artLayers[i]){
                        artLayers[i].allLocked = false;
                        artLayers[i].unlink();
                        if(artLayers[i].id !== activeLayer.id){//如果不是当前需要保留的图层，则删除
                            artLayers[i].remove();
                            i--;
                        }
                    }
                }
                var pngSaveOptions = new PNGSaveOptions();
		//PNG导出质量，根据需要设置
                pngSaveOptions.compression = 2;
                pngSaveOptions.interlaced = false;
                var layerName = activeLayer.name.replace(/\./g,"_").replace(/\s+/g,"_");
                //裁剪
                app.activeDocument.crop([UnitValue (activeLayer.bounds[0]), UnitValue (activeLayer.bounds[1]), UnitValue (activeLayer.bounds[2]), UnitValue (activeLayer.bounds[3])]);
                //另存为 
		app.activeDocument.saveAs(File(exportPath+"/"+activeLayerIndex),pngSaveOptions,true,Extension.LOWERCASE);
            }catch(e){
                alert("图层"+activeLayer.name+"导出失败"+e);
                return;
            }finally{
                //恢复历史
                app.activeDocument.activeHistoryState = savedState;
            }
        }
        app.purge(PurgeTarget.HISTORYCACHES); //清除历史
        app.changeProgressText("图层导出完毕...");
        alert("保存成功，文件已导出至:" + exportPath);
    }
}
```
接下来是通过外部JS输出图层信息，但是麻烦的是ExtendScript只能返回字符串给外部JS，所以要将图层数组转换成字符串，但是ExtendScript并不支持JSON.stringify()。好在可以通过引入json2.js解决(注意需要将json2.js后缀改为.jsx)：

JS:
```javascript
//js和jsx的交互接口
const cs = new CSInterface();
const fs = require("fs");
const os = require("os");

//导入第三方库方法
loadJSX = (fileName) => {
        const extensionRoot = cs.getSystemPath(SystemPath.EXTENSION) + "/lib/";
        cs.evalScript('$.evalFile("' + extensionRoot + fileName + '")');
    }
    //导入JSON2.jsx
loadJSX("json2.jsx");
```

引入json2.js后js和jsx之间的交互就会方便很多，接下来就是获取图层数组，并交由js处理：

JSX:
```javascript
getArtLayers = function(){
    var artLayers = app.activeDocument.artLayers;
    var layerList = [];
    if(artLayers && artLayers.length>0){
         for(var i=0;i<artLayers.length;i++){
            var artLayer = artLayers[i];
            layerList.push({
                name:artLayer.name,
                kind:artLayer.kind.toString(),
                itemIndex:artLayer.itemIndex,
                visible:artLayer.visible,
                bounds:artLayer.bounds.toString(),
                isBackgroundLayer:artLayer.isBackgroundLayer
                // textItem:artLayer.textItem
            });
        }
    }
    return JSON.stringify(layerList);
}
```
JS:
```javascript
exportJson = (exportPath) => {
    cs.evalScript("getArtLayers()", (artLayersStr) => {
        if (resCheck(artLayersStr)) {
            const artLayers = JSON.parse(artLayersStr);
            artLayers && artLayers.length > 0 && cs.evalScript("exportBasePath('" + exportPath + "')", (exportBasePath) => {
                if (resCheck(exportBasePath)) {
                    let jsonFilePath = exportBasePath + "/result.json";
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
```
以上便是PS图层批量导出的的关键代码，当然也可以再加一些自定义选项，如输出路径，PNG质量等。

## 更多
调试工具使用方法可参考：http://nullice.com/archives/1665#i-5

如果需要更多PS插件开发教程，可参考: https://github.com/lujingtao/Photoshop-plug-in-development-tutorial

