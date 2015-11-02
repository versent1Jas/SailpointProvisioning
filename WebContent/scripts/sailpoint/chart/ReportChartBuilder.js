/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

Ext.define('SailPoint.chart.ReportChartBuilder', {

    // Static methods
    statics : {

        getColors : function(){
             return ['rgb(213, 70, 121)',
                         'rgb(44, 153, 201)',
                         'rgb(146, 6, 157)',
                         'rgb(49, 149, 0)',
                         'rgb(249, 153, 0)'];
        },

        createChart : function(definition) {

            // This allows us to specify the font on the axis title text
            Ext.define('Ext.chart.theme.BaseChart', {
               extend: 'Ext.chart.theme.Base',

               constructor: function(config) {
                   this.callParent([Ext.apply({
                      axisTitleLeft: {
                           font: '18px Arial, sans-serif'
                      },
                      axisTitleBottom: {
                           font: '18px Arial, sans-serif'
                      }
                   }, config)]);
               }
           });

            var chart = null;

            var titleDiv =null;
            if (definition.title && definition.title != ''){
                titleDiv = {
                    xtype: 'container',
                    margin:0,
                    padding:0,
                    html:"<h2>"+definition.title+"</h2>"
                };
            }

            var data = definition.data;

            if (!data || data.length == 0){
                chart = {
                    xtype: 'container',
                    margin:0,
                    padding:0,
                    html:"<div style='margin-top:15px'>#{msgs.chart_no_data}</div>"
                };
            } else if (definition.type=='pie'){
                chart = SailPoint.chart.ReportChartBuilder.createPieChart(data);
            } else {
                chart = SailPoint.chart.ReportChartBuilder.createLineOrBarChart(definition);
            }

            chart.height = 340;

            if (titleDiv){
                return Ext.create('Ext.container.Container', {
                    layout: {
                        type: 'fit'
                    },
                    flex:1,
                    style:{margin:'20px'},
                    defaults: {
                        labelWidth: 150,
                        flex: 1,
                        style: {
                            padding: '10px'
                        }
                    },
                    items: [titleDiv,chart]
                });
            } else {
                return chart;
            }
        },

        createLineOrBarChart : function(definition) {

            var id = "lineChart";

            var data = definition.data;

            if (!data){
                data = [];
            }

            // Get the list on unique series names
            var seriesList = [];
            for(var i=0;data && i<data.length;i++){
                if (data[i]['series']){
                    var series = data[i]['series'];
                    if (seriesList.indexOf(series) == -1)
                        seriesList.push(series);
                }
            }

            // Since Jasper and ext handle chart data
            // differently we have to convert the data format.
            // This process will merge all the series values for
            // each category into one object
            var mergedDataSet = data;
            if (seriesList.length > 0){
                var categoryData = {};
                mergedDataSet = [];
                for(var i=0;data && i<data.length;i++){
                    if (data[i]['category']){
                        var category = data[i]['category'];
                        var categoryRec = categoryData[category];
                        if (!categoryRec){
                            categoryRec = {'category':category};
                            categoryData[category] = categoryRec;
                            mergedDataSet.push(categoryRec);
                        }
                        categoryRec[data[i]['series']] = data[i]['value'];
                    }
                }
            }

            var fields = ['category'];
            var valueFields = [];
            if (seriesList.length == 0){
                fields.push("value");
                valueFields.push("value");
            } else {
                for(var i=0;i<seriesList.length;i++){
                    fields.push(seriesList[i]);
                    valueFields.push(seriesList[i]);
                }
            }

            var modelId = 'chart-model-' + id;
            Ext.define(modelId, {
                extend: 'Ext.data.Model',
                fields: fields
            });

            var store = Ext.create('Ext.data.Store', {
                model: modelId,
                data: mergedDataSet
            });
            
            //Need to adjust the tickSteps if the maximum value is less than the number of ticks
            var maxV = 0;
            for(var w=0; w<definition.data.length; w++) {
                   var tmp;               
                    tmp = definition.data[w].value;
                    if(tmp > maxV) {
                        maxV=tmp;
                    }
 
            }
            var majorYAxisTicks = 9;
            if(maxV <= majorYAxisTicks) {
                if(maxV>0) {
                    majorYAxisTicks = (maxV-1);
                }
            }


            var leftAxe = {position:'left',type:'Numeric',fields:valueFields,minimum:0,
                majorTickSteps: majorYAxisTicks, decimals: 0,
                label:{font: '9px Arial, sans serif'}};
            if (definition.leftLabel && definition.leftLabel != ''){
                leftAxe.title = definition.leftLabel;
            }

            var bottomAxe = {position:'bottom',type:'Category',xField:'category',fields:['category'], label: {
                   font:'9px Arial, sans serif',
                   renderer:function(value) {
                       return Ext.String.ellipsis(value, 18, false);
                   }

                }};
            if (definition.bottomLabel && definition.bottomLabel != ''){
                bottomAxe.title = definition.bottomLabel;
            }

            definition.axes = [];
            definition.axes.push(leftAxe);
            definition.axes.push(bottomAxe);

            definition.series = [];
            if (definition.type == 'line'){
                for(var i=0;i<valueFields.length;i++){
                    var f = valueFields[i];
                    definition.series.push(
                        {axis:'left',type:'line', xField:'category',yField:f}
                    );
                }
            } else {
                definition.series.push(
                    {axis:'left',type:definition.type, xField:'category',yField:valueFields}
                );
            }

            var chart = {
                xtype: 'chart',
                animate: true,
                id: 'chart-' + id,
                insetPadding: 50,
                flex:1,
                theme: 'BaseChart',
                store: store,
                axes:definition.axes,
                series:definition.series,
                legend: {
                  position: 'right',
                   labelFont:"9px Arial, sans-serif"
                }
            };

            return chart;
        },

        createPieChart : function(data) {

            var id = "pieChart";
            var fields = ['category','value'];

            var modelId = 'chart-model-' + id;
            Ext.define(modelId, {
                extend: 'Ext.data.Model',
                fields: fields
            });

            var store = Ext.create('Ext.data.Store', {
                model: modelId,
                data: data
            });

            var chart = {
                xtype: 'chart',
                id: 'chart-' + id,
                flex:1,
                animate: true,
                store: store,
                shadow: true,
                theme: 'BaseChart',
                legend: {
                  position: 'right',
                  labelFont:"9px Arial, sans-serif"
                },
                insetPadding: 20,
                series: [{
                    type: 'pie',
                    field: 'value',
                    showInLegend: true,
                    highlight: {
                      segment: {
                        margin: 20
                      }
                    },
                    label: {
                        field: 'category',
                        display: 'rotate',
                        contrast: true,
                        font: '9px Arial, sans serif',
                        renderer: function (label){
                            var cmp = Ext.getCmp('chart-' + id);
                            var index = cmp.store.findExact('category', label);
                            var data = cmp.store.getAt(index).get('value');
                            if (data){
                                return Ext.String.ellipsis(label, 14, false) + " (" + data + ")";
                            }
                        }
                    }
                }]
            };

            return chart;
        }
    }// end statics
});