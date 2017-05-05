/* ========================================================================
 * pollution main.js
 * ========================================================================
 *
   ======================================================================== */

var app;

require([
  // ArcGIS
  "esri/Map",
  "esri/Basemap",
  "esri/layers/VectorTileLayer",
  "esri/views/MapView",
  "esri/views/SceneView",
  "esri/widgets/Search",
  "esri/widgets/Popup",
  "esri/widgets/Home",
  "esri/widgets/Legend",
  "esri/widgets/ColorPicker",
  "esri/core/watchUtils",
  "esri/layers/FeatureLayer",
  "esri/layers/MapImageLayer",
  "esri/symbols/PictureMarkerSymbol",
  "esri/tasks/QueryTask",
  "esri/tasks/support/Query",
  "esri/layers/GraphicsLayer",
  "esri/tasks/Geoprocessor",
  "esri/tasks/support/FeatureSet",
  "esri/layers/support/Field",

  "dojo/query",
  "dojo/dom-class",
  "dojo/dom",
  "dojo/on",
  "dojo/dom-construct",
  "dojo/date",
  "dojo/date/locale",
  "dojo/request",
  "dojo/_base/declare",
  "dojo/dom-style",
  "dojo/_base/fx",
  "dojo/keys",

  //cedar chart
  "cedar",

  // Calcite Maps
  "calcite-maps/calcitemaps-v0.3",

  // Boostrap
  "bootstrap/Collapse",
  "bootstrap/Dropdown",
  "bootstrap/Tab",
  "bootstrap/Carousel",
  "bootstrap/Tooltip",
  "bootstrap/Modal",

  // Dojo
  "dojo/domReady!"
], function (Map, Basemap, VectorTileLayer, MapView, SceneView, Search, Popup, Home, Legend, ColorPicker,
  watchUtils, FeatureLayer, MapImageLayer, PictureMarkerSymbol, QueryTask, Query, GraphicsLayer, Geoprocessor, FeatureSet, Field, query, domClass, dom, on, domConstruct, date, locale, request, declare, domStyle, fx, keys, Cedar, CalciteMapsSettings) {

    app = {
      scale: 18056,
      lonlat: [360.0274827400441, -0.021760830968962627],
      mapView: null,
      mapDiv: "mapViewDiv",
      mapFL: null,
      vectorLayer: null,
      sceneView: null,
      sceneDiv: "sceneViewDiv",
      sceneFL: null,
      activeView: null,
      searchWidgetNav: null,
      searchWidgetPanel: null,
      searchWidgetSettings: null,
      basemapSelected: "topo",
      basemapSelectedAlt: "topo",
      legendLayer: null,
      legend: null,
      padding: {
        top: 85,
        right: 0,
        bottom: 0,
        left: 0
      },
      uiPadding: {
        components: ["zoom", "attribution", "home", "compass"],
        padding: {
          top: 15,
          right: 15,
          bottom: 30,
          left: 15
        }
      },
      popupOptions: {
        autoPanEnabled: true,
        messageEnabled: false,
        spinnerEnabled: false,
        dockEnabled: true,
        dockOptions: {
          buttonEnabled: true,
          breakpoint: 544 // default
        }
      },
      loading: null,
    }

    //----------------------------------
    // App
    //----------------------------------
    initializeLoadingOverlay();
    initializeMapViews();
    //initializeStationLayer();
    initializeAppUI();


    //----------------------------------
    // Loading Overlay
    //----------------------------------

    function initializeLoadingOverlay() {
      var Loading = declare(null, {
        overlayNode: null,
        indicatorNode: null,
        fadedout: null,
        constructor: function () {
          // save a reference to the overlay
          this.overlayNode = dom.byId("loadingOverlay");
          this.indicatorNode = dom.byId("loadingIndicator");
          this.fadedout = true;
        },
        // called to hide the loading overlay
        endLoading: function () {
          domStyle.set(this.overlayNode, 'display', 'none');
          fx.fadeOut({
            node: this.indicatorNode,
            onEnd: function (node) {
              domStyle.set(node, 'display', 'none');
            }
          }).play();
          this.fadedout = false;
        }
      });
      app.loading = new Loading();

      setTimeout(function () {
        if (app.loading.fadedout == true) {
          app.loading.endLoading();
        }
      }, 10000);
    }

    //----------------------------------
    // Map and Scene View
    //----------------------------------

    function initializeMapViews() {
      // define basemap
      // TO-DO change it to tiled layer
      var universityBasemap = new MapImageLayer({
        url: "https://gis.xzdbd.com/arcgis/rest/services/dev/university/MapServer"
      });

      app.mapView = new MapView({
        container: app.mapDiv,
        map: new Map({ layers: [universityBasemap] }),
        scale: app.scale,
        center: app.lonlat,
        padding: app.padding,
        ui: app.uiPadding,
        popup: new Popup(app.popupOptions),
        visible: true
      })

      app.activeView = app.mapView;

      app.mapView.then(function () {
        // remove loading
        app.loading.endLoading();
      });
    }

    //----------------------------------
    // Pollution Station GraphicsLayer
    //----------------------------------

    function initializeStationLayer() {
      var graphicsLayer = new GraphicsLayer();
      var layer = "https://gis.xzdbd.com/arcgis/rest/services/prod/PollutionStation/MapServer/0";
      var goodSymbol = new PictureMarkerSymbol({
        url: "/static/images/good.png",
        width: "56px",
        height: "70px",
      });
      var fineSymbol = new PictureMarkerSymbol({
        url: "/static/images/fine.png",
        width: "56px",
        height: "70px",
      });
      var slightSymbol = new PictureMarkerSymbol({
        url: "/static/images/slight.png",
        width: "56px",
        height: "70px",
      });
      var mediumSymbol = new PictureMarkerSymbol({
        url: "/static/images/medium.png",
        width: "56px",
        height: "70px",
      });
      var heavySymbol = new PictureMarkerSymbol({
        url: "/static/images/heavy.png",
        width: "56px",
        height: "70px",
      });
      var severeSymbol = new PictureMarkerSymbol({
        url: "/static/images/severe.png",
        width: "56px",
        height: "70px",
      });
      var template = {
        title: "<font color='#008000'>监测站：{name}",

        content: [{
          type: "fields",
          fieldInfos: [{
            fieldName: "aqi",
            visible: true,
            label: "AQI",
            format: {
              places: 0,
              digitSeparator: true
            },
          }, {
            fieldName: "quality",
            visible: true,
            label: "当前空气质量",
          }, {
            fieldName: "primary_pollutant",
            visible: true,
            label: "主要污染物",
          },
          ]
        }, {
          type: "text",
          text: "数据更新时间：{time:DateFormat(datePattern: 'yyyy-MM-d', timePattern: 'HH:mm')}",
        }],

        actions: [{
          title: "详情",
          id: "detail",
          className: "esri-icon-dashboard",
        }]
      };
      var queryTask = new QueryTask({
        url: layer
      });
      var query = new Query();
      query.returnGeometry = true;
      query.outFields = ["*"];
      query.where = "1=1";

      queryTask.execute(query, { cacheBust: false }).then(function (result) {
        if (result.features.length > 0) {
          result.features.forEach(function (graphic) {
            quality = graphic.getAttribute("quality");
            switch (quality) {
              case "优":
                graphic.symbol = goodSymbol;
                break;
              case "良":
                graphic.symbol = fineSymbol;
                break;
              case "轻度污染":
                graphic.symbol = slightSymbol;
                break;
              case "中度污染":
                graphic.symbol = mediumSymbol;
                break;
              case "重度污染":
                graphic.symbol = heavySymbol;
                break;
              case "严重污染":
                graphic.symbol = severeSymbol;
                break;
              default:
                graphic.symbol = goodSymbol;
                break;
            }
            graphic.popupTemplate = template;
            graphicsLayer.add(graphic);
          });
          app.mapView.map.layers.add(graphicsLayer);
          // remove loading
          app.loading.endLoading();
        }
      });
    }

    //----------------------------------
    // Pollution Details Handler
    //----------------------------------

    function showPollutionDeatils() {
      if (domClass.contains(query(".calcite-div-toggle")[0], "calcite-div-toggle-zero-bottom")) {
        zoomOutResultContent()
      }
    }

    //----------------------------------
    // App UI Handlers
    //----------------------------------

    function initializeAppUI() {
      // App UI
      //setBasemapEvents();
      setSearchWidgets();
      setPopupPanelEvents();
      setPopupEvents();
      setResultContentEvents();
      setQueryEvents();
    }

    //----------------------------------
    // Basemaps
    //----------------------------------

    function setBasemapEvents() {

      // Sync basemaps for map and scene
      query("#selectBasemapPanel").on("change", function (e) {
        app.basemapSelected = e.target.options[e.target.selectedIndex].dataset.vector;
        setBasemaps();
      });

      function setBasemaps() {
        app.mapView.map.basemap = app.basemapSelected;
      }
    }

    //----------------------------------
    // Search Widgets
    //----------------------------------

    function setSearchWidgets() {

      //TODO - Search Nav + Panel (detach/attach)
      app.searchWidgetNav = createSearchWidget("searchNavDiv", true);
      app.searchWidgetPanel = createSearchWidget("searchPanelDiv", true);
      app.searchWidgetSettings = createSearchWidget("settingsSearchDiv", false);

      // Create widget
      function createSearchWidget(parentId, showPopup) {
        var search = new Search({
          viewModel: {
            view: app.activeView,
            popupOpenOnSelect: showPopup,
            highlightEnabled: false,
            maxSuggestions: 4
          },
        }, parentId);
        search.startup();
        return search;
      }
    }

    //----------------------------------
    // Popups and Panels
    //----------------------------------

    function setPopupPanelEvents() {

      // Views - Listen to view size changes to show/hide panels
      app.mapView.watch("size", viewSizeChange);

      function viewSizeChange(screenSize) {
        if (app.screenWidth !== screenSize[0]) {
          app.screenWidth = screenSize[0];
          setPanelVisibility();
        }
      }

      // Popups - Listen to popup changes to show/hide panels
      app.mapView.popup.watch(["visible", "currentDockPosition"], setPanelVisibility);

      // Panels - Show/hide the panel when popup is docked
      function setPanelVisibility() {
        var isMobileScreen = app.activeView.widthBreakpoint === "xsmall" || app.activeView.widthBreakpoint === "small",
          isDockedVisible = app.activeView.popup.visible && app.activeView.popup.currentDockPosition,
          isDockedBottom = app.activeView.popup.currentDockPosition && app.activeView.popup.currentDockPosition.indexOf("bottom") > -1;
        // Mobile (xsmall/small)
        if (isMobileScreen) {
          if (isDockedVisible && isDockedBottom) {
            query(".calcite-panels").addClass("invisible");
          } else {
            query(".calcite-panels").removeClass("invisible");
          }
        } else { // Desktop (medium+)
          if (isDockedVisible) {
            query(".calcite-panels").addClass("invisible");
          } else {
            query(".calcite-panels").removeClass("invisible");
          }
        }
      }

      // Panels - Dock popup when panels show (desktop or mobile)
      query(".calcite-panels .panel").on("show.bs.collapse", function (e) {
        if (app.activeView.popup.currentDockPosition || app.activeView.widthBreakpoint === "xsmall") {
          app.activeView.popup.dockEnabled = false;
        }
      });

      // Panels - Undock popup when panels hide (mobile only)
      query(".calcite-panels .panel").on("hide.bs.collapse", function (e) {
        if (app.activeView.widthBreakpoint === "xsmall") {
          app.activeView.popup.dockEnabled = true;
        }
      });
    }

    //----------------------------------
    // Popup collapse (optional)
    //----------------------------------

    function setPopupEvents() {
      query(".esri-popup__header-title").on("click", function (e) {
        query(".esri-popup__main-container").toggleClass("esri-popup-collapsed");
        app.activeView.popup.reposition();
      }.bind(this));
    }

    //----------------------------------
    // Result Content
    //----------------------------------
    function setResultContentEvents() {
      query(".calcite-div-toggle").on("click", function (e) {
        // open, to close
        if (domClass.contains(e.currentTarget, "calcite-div-toggle-bottom")) {
          zoomInResultContent();
        } else if (domClass.contains(e.currentTarget, "calcite-div-toggle-zero-bottom")) {
          zoomOutResultContent(e);
        }
      });
    }

    function zoomOutResultContent() {
      domClass.replace(query(".calcite-div-toggle")[0], "calcite-div-toggle-bottom", "calcite-div-toggle-zero-bottom");
      domClass.replace(query(".calcite-div-toggle .up-arrow")[0], "down-arrow", "up-arrow");
      domClass.replace(query(".calcite-div-content-info-collapse")[0], "calcite-div-content-info", "calcite-div-content-info-collapse");
      domStyle.set(query(".calcite-div-content-info")[0], 'display', '');
      domClass.add(query(".calcite-legend-box")[0], "calcite-legend-box-up");
    }

    function zoomInResultContent() {
      domClass.replace(query(".calcite-div-toggle")[0], "calcite-div-toggle-zero-bottom", "calcite-div-toggle-bottom");
      domClass.replace(query(".calcite-div-toggle .down-arrow")[0], "up-arrow", "down-arrow");
      domClass.replace(query(".calcite-div-content-info")[0], "calcite-div-content-info-collapse", "calcite-div-content-info");
      domStyle.set(query(".calcite-div-content-info-collapse")[0], 'display', 'none');
      domClass.remove(query(".calcite-legend-box")[0], "calcite-legend-box-up");
    }

    //----------------------------------
    // Legend events
    //----------------------------------
    function setLegendEvents() {
      app.legend.layerInfos[0].layer.then(function () {
        var legendContentNode = domConstruct.create("div", {
          className: "calcite-legend-content"
        }, query(".calcite-legend-container")[0]);

        app.legend.activeLayerInfos.items[0].legendElements.forEach(function (element) {
          if (element.type == "symbol-table") {
            var legendListNode = domConstruct.create("div", {
              className: "calcite-legend-list"
            }, legendContentNode);

            var legendNode = domConstruct.create("div", {
              className: "calcite-legend"
            }, legendListNode);
            var symbolNode = domConstruct.create("img", {
              src: element.infos[0].src,
              style: "width:" + element.infos[0].width + ";" + "height:" + element.infos[0].height
            }, legendNode);

            var labelNode = domConstruct.create("div", {
              className: "calcite-legend-label",
              innerHTML: element.title
            }, legendListNode);
          }
        }, this);
        //var symbolNode = domConstruct.create("img", {
        //    src: app.legend.activeLayerInfos.items[0].legendElements[0].infos[0].src,
        //    style: "width:" + app.legend.activeLayerInfos.items[0].legendElements[0].infos[0].width + ";" + "height:" + app.legend.activeLayerInfos.items[0].legendElements[0].infos[0].height
        //}, legendNode);
      });
    }

    //----------------------------------
    // Query events
    //----------------------------------
    function setQueryEvents() {
      // show feature layer when panel opens
      query(".calcite-panels .panel").on("show.bs.collapse", function (e) {
        // TODO: switch case
        console.log(e.target.id);
        showQueryLayer(0);
      });

      // hide feature layer when panel closes
      query(".calcite-panels .panel").on("hide.bs.collapse", function (e) {
        // TODO: switch case
        console.log(e.target.id);
        hideQueryLayer(0);
      });

      query("#adminBuildingSearchDiv_input").on("keydown", function(event) {
        if (event.keyCode == keys.ENTER) {
          console.log(event.target.value);
        }
      });
    }

    function showQueryLayer(layerId) {
      var layer = new FeatureLayer({
        url: "https://gis.xzdbd.com/arcgis/rest/services/dev/university/MapServer/" + layerId,
        id: layerId
      });
      app.mapView.map.layers.add(layer);
    }

    function hideQueryLayer(layerId) {
      var layer = app.mapView.map.findLayerById(layerId)
      app.mapView.map.layers.remove(layer);
    }

    //----------------------------------
    // Chart
    //----------------------------------
    function updateChartInfo(stationId) {
      var chartData
      if (stationId != null) {
        request.post("./pollution/chart?id=" + stationId, {
          handleAs: "json"
        }).then(function (data) {
          /*var features = {
            "features": [{ "attributes": { "name": "111", "aqi": 32 } },
            { "attributes": { "name": "222", "aqi": 42 } }]
          };*/
          var features = { "features": [] }
          data.forEach(function (data) {
            features.features.push({ "attributes": { "time_point": getUnixTimestamp(getLocalTime(data.time_point)), "aqi": data.aqi, "full_time": formatFullDate(getLocalTime(data.time_point)) } })
          })
          var chart = new Cedar({ "type": "time" });
          var dataset = {
            "data": features,
            "mappings": {
              "time": { "field": "time_point", "label": "time" },
              "value": { "field": "aqi", "label": "aqi" },
              "sort": "full_time ASC",
            }
          };

          chart.dataset = dataset;

          chart.tooltip = {
            "title": "{full_time}",
            "content": "AQI: {aqi}"
          }

          chart.show({
            elementId: "#chart",
          });
        });
      }

      function getLocalTime(time) {
        return new Date(time);
      }

      function formatSimpleDate(date) {
        return locale.format(date, { selector: "time", timePattern: 'H' });
      };

      function formatFullDate(date) {
        return locale.format(date, { datePattern: 'yyyy-MM-d', timePattern: 'HH:mm' });
      };

      function getUnixTimestamp(date) {
        return date.getTime()
      }

    }
  });