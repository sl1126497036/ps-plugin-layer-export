
getActiveDocumentPath = function(){
    return app.activeDocument.path;
}
chooseExportPath = function(){
   return Folder.selectDialog('请选择要存储的路径');
}
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
exportLayers = function(exportPath){
    //quickExportPng(app.activeDocument.path,true);
    //useSystemExport(app.activeDocument.path+"/3_psd_export");
     try{
         app.doProgress("正在准备导出，隐藏的图层将被忽略...","doExport('"+exportPath+"')");
     }catch(e){
         alert(e);
     }
    //doExport(exportPath);
     
    
}
function exportBasePath(exportPath){
    var documentName = app.activeDocument.name.replace(/\./g,"_").replace(/\s+/g,"_");
    exportPath +=  "/"+documentName+"_export";
    var folder = new Folder(exportPath); 
    folder.create();//创建路径
    return exportPath;
}
function doExport(exportPath){
    //报错当前历史
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
//快速导出为png命令，该方法权限不足
function quickExportPng(path, layer){
    try{
        if (layer == undefined){
            layer = false;   
        } 
        var actionDescriptor = new ActionDescriptor();
        var actionReference = new ActionReference();
        actionReference.putEnumerated(stringIDToTypeID("layer"), stringIDToTypeID("ordinal"), stringIDToTypeID("targetEnum"));
        actionDescriptor.putReference(stringIDToTypeID("null"), actionReference);
        actionDescriptor.putString(stringIDToTypeID("fileType"), "png");
        actionDescriptor.putInteger(stringIDToTypeID("quality"), 32);
        actionDescriptor.putInteger(stringIDToTypeID("metadata"), 0);
        actionDescriptor.putString(stringIDToTypeID("destFolder"), path);
        actionDescriptor.putBoolean(stringIDToTypeID("sRGB"), true);
        actionDescriptor.putBoolean(stringIDToTypeID("openWindow"), false);
        executeAction(stringIDToTypeID(layer?"exportSelectionAsFileTypePressed":"exportDocumentAsFileTypePressed"), actionDescriptor, DialogModes.ERROR);
    }catch (e) { 
        alert(e); 
    }
}
//使用软件自带的命令批量导出
function useSystemExport(path){
    try{
        var sysExportLayerToFiles = stringIDToTypeID( "6f1c2cf5-4a97-4e32-8f59-f5d7a087adef" );
        var desc2 = new ActionDescriptor();
        var idmessage = stringIDToTypeID( "message" );
        desc2.putString( idmessage, "" );
        var iddestination = stringIDToTypeID( "destination" );
        desc2.putString( iddestination,path );
        var idfileNamePrefix = stringIDToTypeID( "fileNamePrefix" );
        desc2.putString( idfileNamePrefix,"" );
        var idvisibleOnly = stringIDToTypeID( "visibleOnly" );
        desc2.putBoolean( idvisibleOnly, true );
        var idfileType = stringIDToTypeID( "fileType" );
        desc2.putDouble( idfileType, 7.000000 );
        var idicc = stringIDToTypeID( "icc" );
        desc2.putBoolean( idicc, true );
        var idjpegQuality = stringIDToTypeID( "jpegQuality" );
        desc2.putString( idjpegQuality,"8");
        var idpsdMaxComp = stringIDToTypeID( "psdMaxComp" );
        desc2.putBoolean( idpsdMaxComp, true );
        var idtiffCompression = stringIDToTypeID( "tiffCompression" );
        desc2.putString( idtiffCompression, "TIFFEncoding.NONE" );
        var idtiffJpegQuality = stringIDToTypeID( "tiffJpegQuality" );
        desc2.putString( idtiffJpegQuality, "8" );
        var idpdfEncoding = stringIDToTypeID( "pdfEncoding" );
        desc2.putString( idpdfEncoding, "PDFEncoding.JPEG" );
        var idpdfJpegQuality = stringIDToTypeID( "pdfJpegQuality" );
        desc2.putString( idpdfJpegQuality, "8" );
        var idtargaDepth = stringIDToTypeID( "targaDepth" );
        desc2.putString( idtargaDepth, "TargaBitsPerPixels.TWENTYFOUR");
        var idbmpDepth = stringIDToTypeID( "bmpDepth" );
        desc2.putString( idbmpDepth, "BMPDepthType.TWENTYFOUR" );
        var idpngtwofourTransparency = stringIDToTypeID( "png24Transparency" );
        desc2.putBoolean( idpngtwofourTransparency, true );
        var idpngtwofourInterlaced = stringIDToTypeID( "png24Interlaced" );
        desc2.putBoolean( idpngtwofourInterlaced, true );
        var idpngtwofourTrim = stringIDToTypeID( "png24Trim" );
        desc2.putBoolean( idpngtwofourTrim, true );
        var idpngeightTransparency = stringIDToTypeID( "png8Transparency" );
        desc2.putBoolean( idpngeightTransparency, true );
        var idpngeightInterlaced = stringIDToTypeID( "png8Interlaced" );
        desc2.putBoolean( idpngeightInterlaced, false );
        var idpngeightTrim = stringIDToTypeID( "png8Trim" );
        desc2.putBoolean( idpngeightTrim, true );
        executeAction( sysExportLayerToFiles , desc2, DialogModes.NO );
    }catch(e){
        alert(e);
    }
    
}
