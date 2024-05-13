
import React, { useEffect, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Draw, Modify, Select } from 'ol/interaction';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import Overlay from 'ol/Overlay';
import { Polygon, LineString, Point } from 'ol/geom';
import { click } from 'ol/events/condition';
import './style.css'

const MapComponent = () => {
    const [map, setMap] = useState(null);
    const [drawLayer, setDrawLayer] = useState(null);
    const [drawInteraction, setDrawInteraction] = useState(null);
    const [modifyInteraction, setModifyInteraction] = useState(null);
    const [selectInteraction, setSelectInteraction] = useState(null);
    const [measureTooltip, setMeasureTooltip] = useState(null);
    const [drawType, setDrawType] = useState('Point'); // Default draw type is Point
    const [drawSource] = useState(new VectorSource()); // Vector source to store drawn features

    useEffect(() => {
        const mapInstance = new Map({
            target: 'map',
            layers: [
                new TileLayer({
                    source: new OSM(),
                }),
            ],
            view: new View({
                center: [0, 0],
                zoom: 2,
            }),
        });
        setMap(mapInstance);

        const drawLayerInstance = new VectorLayer({
            source: drawSource,
            style: new Style({
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 0.2)',
                }),
                stroke: new Stroke({
                    color: '#ffcc33',
                    width: 2,
                }),
                image: new CircleStyle({
                    radius: 7,
                    fill: new Fill({
                        color: '#ffcc33',
                    }),
                }),
            }),
        });
        mapInstance.addLayer(drawLayerInstance);
        setDrawLayer(drawLayerInstance);

        const draw = new Draw({
            source: drawSource,
            type: drawType === 'Point' ? 'Point' : 'LineString', // Use LineString for Line
        });
        mapInstance.addInteraction(draw);
        setDrawInteraction(draw);

        const modify = new Modify({ source: drawSource });
        mapInstance.addInteraction(modify);
        setModifyInteraction(modify);

        const select = new Select({
            condition: click,
            layers: [drawLayerInstance],
        });
        mapInstance.addInteraction(select);
        setSelectInteraction(select);

        const measureTooltipElement = document.createElement('div');
        measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
        const measureTooltipInstance = new Overlay({
            element: measureTooltipElement,
            offset: [0, -15],
            positioning: 'bottom-center',
        });
        mapInstance.addOverlay(measureTooltipInstance);
        setMeasureTooltip(measureTooltipInstance);

        draw.on('drawend', (event) => {
            const feature = event.feature;
            const geometry = feature.getGeometry();
            const tooltipCoord = geometry.getLastCoordinate();
            measureTooltipElement.innerHTML = `Coordinates: ${tooltipCoord}`;
            measureTooltipInstance.setPosition(tooltipCoord);
        });

        select.on('select', (event) => {
            const selectedFeatures = event.selected;
            if (selectedFeatures && selectedFeatures.length > 0) {
                const selectedFeature = selectedFeatures[selectedFeatures.length - 1];
                drawSource.removeFeature(selectedFeature);
            }
        });

        return () => {
            if (mapInstance) {
                mapInstance.dispose();
            }
        };
    }, [drawType, drawSource]);

    const switchDrawType = (type) => {
        drawInteraction.setActive(false);
        const newDrawInteraction = new Draw({
            source: drawSource,
            type: type === 'Point' ? 'Point' : (type === 'LineString' ? 'LineString' : 'Polygon'),
        });
        map.addInteraction(newDrawInteraction);
        setDrawInteraction(newDrawInteraction);
        setDrawType(type);
    };

    const deleteLastFeature = () => {
        const features = drawLayer.getSource().getFeatures();
        if (features.length > 0) {
            drawLayer.getSource().removeFeature(features[features.length - 1]);
        }
    };

    return (
        <div id="map" style={{ width: '100%', height: '88vh' }}>
            <div className='btn_div'>
                <button className='btn' onClick={() => switchDrawType('Point')}>Point</button>
                <button className='btn' onClick={() => switchDrawType('LineString')}>Line</button>
                <button className='btn' onClick={() => switchDrawType('Polygon')}>Polygon</button>
                <button className='btn_dlt' onClick={deleteLastFeature}>Delete</button>
            </div>
        </div>
    );
};

export default MapComponent;

