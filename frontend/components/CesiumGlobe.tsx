'use client'

import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import type { NewsMarker } from '@/types/news'

interface CesiumGlobeProps {
  markers: NewsMarker[]
  onMarkerAdd: (marker: NewsMarker) => void
  onMarkerSelect: (marker: NewsMarker) => void
  heatmapEnabled: boolean
  clusteringEnabled: boolean
  onCoordinateClick?: (lat: number, lon: number) => void
}

export default function CesiumGlobe({
  markers,
  onMarkerAdd,
  onMarkerSelect,
  heatmapEnabled,
  clusteringEnabled: _clusteringEnabled, // eslint-disable-line @typescript-eslint/no-unused-vars
  onCoordinateClick
}: CesiumGlobeProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const cesiumViewerRef = useRef<Cesium.Viewer | null>(null)
  const onMarkerAddRef = useRef(onMarkerAdd)
  const onMarkerSelectRef = useRef(onMarkerSelect)
  const onCoordinateClickRef = useRef(onCoordinateClick)
  const markerEntitiesRef = useRef<Map<string, Cesium.Entity>>(new Map())
  const heatmapEntitiesRef = useRef<Cesium.Entity[]>([])
  const currentLocationEntityRef = useRef<Cesium.Entity | null>(null)
  const [latLon, setLatLon] = useState<{ lat: number; lon: number } | null>(null)

  // Helper function for severity colors
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return Cesium.Color.GREEN
      case 'medium': return Cesium.Color.YELLOW
      case 'high': return Cesium.Color.ORANGE
      case 'critical': return Cesium.Color.RED
      default: return Cesium.Color.BLUE
    }
  }

  // Keep refs updated with the latest functions
  useEffect(() => {
    onMarkerAddRef.current = onMarkerAdd
  }, [onMarkerAdd])

  useEffect(() => {
    onMarkerSelectRef.current = onMarkerSelect
  }, [onMarkerSelect])

  useEffect(() => {
    onCoordinateClickRef.current = onCoordinateClick
  }, [onCoordinateClick])

  // Debugging: Log when the component mounts and ref is set
  useEffect(() => {
    console.log('CesiumGlobe component mounted')
    console.log('Viewer ref:', viewerRef.current)
  }, [])

  useEffect(() => {
    // Ensure the ref is properly set before initializing
    if (!viewerRef.current) {
      console.log('Viewer ref not yet available, waiting...')
      return
    }

    console.log('Initializing Cesium viewer with ref:', viewerRef.current)

    // Initialize Cesium with proper configuration to avoid local resource loading
    if (process.env.NEXT_PUBLIC_CESIUM_ACCESS_TOKEN) {
      Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ACCESS_TOKEN as string
    }

    // Configure Cesium to use CDN resources
    if (typeof (Cesium.buildModuleUrl as unknown as { setBaseUrl?: (url: string) => void }).setBaseUrl === 'function') {
      (Cesium.buildModuleUrl as unknown as { setBaseUrl: (url: string) => void }).setBaseUrl('https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/')
    }

    // Check if viewer already exists to prevent re-initialization
    if (cesiumViewerRef.current) {
      console.log('Cesium viewer already initialized')
      return
    }

    let viewer: Cesium.Viewer

    try {
      console.log('Creating Cesium Viewer with container:', viewerRef.current)
      viewer = new Cesium.Viewer(viewerRef.current, {
        baseLayerPicker: false,
        geocoder: false,
        homeButton: true,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        animation: false,
        fullscreenButton: false,
        vrButton: false,
        infoBox: false,
        scene3DOnly: true,
        skyBox: false, // Disable skybox to avoid loading issues
        skyAtmosphere: false, // Disable sky atmosphere
        imageryProvider: undefined, // Disable default imagery provider to avoid Ion dependency
        terrainProvider: undefined, // Disable default terrain provider
        creditContainer: document.createElement('div') // Hide credit container
      } as Cesium.Viewer.ConstructorOptions)

      // Hide Cesium credit/attribution
      if (viewer.cesiumWidget && viewer.cesiumWidget.creditContainer) {
        const container = viewer.cesiumWidget.creditContainer as HTMLElement
        if (container) {
          container.style.display = 'none'
        }
      }

      console.log('Cesium viewer created successfully:', viewer)

      // Remove all default imagery layers first
      viewer.imageryLayers.removeAll()

      // Add high-quality satellite imagery
      try {
        const provider = Cesium.ArcGisMapServerImageryProvider.fromBasemapType(
          Cesium.ArcGisBaseMapType.SATELLITE
        )
        provider.then((imageryProvider: Cesium.ImageryProvider) => {
          if (viewer && viewer.imageryLayers) {
            viewer.imageryLayers.addImageryProvider(imageryProvider)
          }
        }).catch(() => {
          // Fallback to OpenStreetMap
          try {
            const fallbackProvider = new Cesium.UrlTemplateImageryProvider({
              url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              credit: '© OpenStreetMap contributors'
            })
            if (viewer && viewer.imageryLayers) {
              viewer.imageryLayers.addImageryProvider(fallbackProvider)
            }
          } catch (e) {
            console.warn('Could not load fallback imagery:', e)
          }
        })
      } catch (err) {
        console.warn('Error loading imagery:', err)
      }

      // Disable atmosphere and lighting for uniform illumination
      viewer.scene.globe.enableLighting = false
      viewer.scene.highDynamicRange = false
      viewer.scene.globe.showGroundAtmosphere = false
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = false
      }

      // Simple and reliable rendering settings
      viewer.scene.globe.depthTestAgainstTerrain = false

      // Configure camera controllers for smooth interaction
      viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
      viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK)

      // Optimize rendering
      viewer.scene.requestRenderMode = true // On-demand rendering for efficiency
      viewer.scene.maximumRenderTimeChange = 1 / 60 // Cap at 60 fps
      viewer.clock.shouldAnimate = false
      viewer.scene.globe.baseColor = Cesium.Color.WHITE
      viewer.scene.debugShowFramesPerSecond = false

      // Set initial camera position
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(-75.0, 40.0, 10000000.0)
      })

      // Hardcoded home location: Mumbai, India
      const HOME_LATITUDE = 19.1503
      const HOME_LONGITUDE = 72.8530
      
      // Add hardcoded pin marker at home location
      const homePosition3D = Cesium.Cartesian3.fromDegrees(HOME_LONGITUDE, HOME_LATITUDE, 0)
      const homePinEntity = viewer.entities.add({
        position: homePosition3D,
        point: {
          pixelSize: 20,
          color: Cesium.Color.CYAN,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 3,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.5),
        },
        billboard: {
          image: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="20" fill="#00FFFF" stroke="#FFFFFF" stroke-width="3"/>
              <circle cx="24" cy="24" r="8" fill="#FFFFFF"/>
            </svg>
          `),
          scale: 1.0,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.3),
        },
        label: {
          text: '📍 Your Location',
          font: 'bold 14pt sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -30),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.3),
        },
      })
      
      currentLocationEntityRef.current = homePinEntity
      console.log(`Home pin added at: ${HOME_LATITUDE}, ${HOME_LONGITUDE}`)

      // Override home button to fly to hardcoded location
      if (viewer.homeButton) {
        const homeButtonHandler = (e: { cancel?: boolean }) => {
          if (e) {
            e.cancel = true // Cancel default home button behavior
          }
          
          console.log(`Home button clicked - rotating to: ${HOME_LATITUDE}, ${HOME_LONGITUDE}`)
          
          // Get current camera altitude and pitch to maintain the same viewing angle
          const currentHeight = viewer.camera.positionCartographic.height
          const currentPitch = viewer.camera.pitch
          
          // Use a reasonable altitude if current is too high or too low
          let targetHeight = currentHeight
          if (currentHeight < 50000) {
            targetHeight = 500000 // Default to a nice globe view if too close
          } else if (currentHeight > 20000000) {
            targetHeight = 5000000 // Cap at reasonable maximum
          }
          
          // Maintain current pitch or use a gentle angle
          const targetPitch = currentPitch > Cesium.Math.toRadians(-0.5) 
            ? Cesium.Math.toRadians(-0.5) // Gentle downward angle
            : currentPitch // Keep current if already good
          
          // Rotate to the home location while maintaining viewing angle
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(HOME_LONGITUDE, HOME_LATITUDE, targetHeight),
            orientation: {
              heading: Cesium.Math.toRadians(0), // North
              pitch: targetPitch, // Maintain or use gentle angle
              roll: 0.0
            },
            duration: 2.0, // 2 second smooth animation
            complete: () => {
              // Ensure pin is centered with the maintained viewing angle
              viewer.camera.lookAt(
                homePosition3D,
                new Cesium.HeadingPitchRange(
                  Cesium.Math.toRadians(0), // Heading: North
                  targetPitch, // Maintain the pitch angle
                  targetHeight // Maintain the altitude
                )
              )
            }
          })
        }
        
        viewer.homeButton.viewModel.command.beforeExecute.addEventListener(homeButtonHandler)
        console.log('Home button override configured successfully')
      } else {
        console.warn('Home button not found on viewer')
      }

      cesiumViewerRef.current = viewer
    } catch (error) {
      console.error('Error initializing Cesium viewer:', error)
      return
    }

    // Mouse move handler for lat/lon readout (throttled)
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    let lastMouseMoveTime = 0
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      const now = Date.now()
      if (now - lastMouseMoveTime < 100) return // Throttle to 10 times per second
      lastMouseMoveTime = now

      const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid)
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
        const longitude = Cesium.Math.toDegrees(cartographic.longitude)
        const latitude = Cesium.Math.toDegrees(cartographic.latitude)
        setLatLon({ lat: latitude, lon: longitude })
      } else {
        setLatLon(null)
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    // Click handler for entity selection and coordinate clicks
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      // First check if a marker was clicked
      try {
        const pickedObject = viewer.scene.pick(click.position)

        if (Cesium.defined(pickedObject) && pickedObject.id) {
          const entity = pickedObject.id as Cesium.Entity & { markerData?: NewsMarker }
          if (entity.markerData) {
            // Entity (marker) was clicked
            const markerData = entity.markerData
            console.log('Marker clicked:', markerData)
            if (markerData && markerData.title && markerData.description) {
              onMarkerSelectRef.current(markerData)
            } else {
              console.warn('Marker data incomplete:', markerData)
            }
            return
          }
        }
      } catch (error) {
        console.warn('Error picking entity:', error)
      }

      // If no marker was clicked, get coordinates and call onCoordinateClick
      if (onCoordinateClickRef.current) {
        try {
          const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid)
          if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
            const longitude = Cesium.Math.toDegrees(cartographic.longitude)
            const latitude = Cesium.Math.toDegrees(cartographic.latitude)
            onCoordinateClickRef.current(latitude, longitude)
          }
        } catch (error) {
          console.warn('Error getting coordinates from click:', error)
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    return () => {
      if (cesiumViewerRef.current) {
        // Clean up current location marker
        if (currentLocationEntityRef.current) {
          cesiumViewerRef.current.entities.remove(currentLocationEntityRef.current)
          currentLocationEntityRef.current = null
        }
        cesiumViewerRef.current.destroy()
        cesiumViewerRef.current = null
      }
      handler.destroy()
    }
  }, [])

  // Update markers when markers prop changes
  useEffect(() => {
    if (!cesiumViewerRef.current) return

    const viewer = cesiumViewerRef.current

    // Safety check - make sure viewer hasn't been destroyed
    if (!viewer.scene) return

    // Remove markers that no longer exist
    markerEntitiesRef.current.forEach((entity, markerId) => {
      if (!markers.find(m => m.id === markerId)) {
        try {
          viewer.entities.remove(entity)
        } catch {
          // Entity might already be removed
        }
        markerEntitiesRef.current.delete(markerId)
      }
    })

    // Add or update markers
    markers.forEach(marker => {
      if (markerEntitiesRef.current.has(marker.id)) {
        // Marker already exists, update its position if needed
        const existingEntity = markerEntitiesRef.current.get(marker.id)!
        try {
          // Convert position to Cartesian3 if needed
          let position: Cesium.Cartesian3
          if (marker.position instanceof Cesium.Cartesian3) {
            position = marker.position
          } else {
            position = Cesium.Cartesian3.fromDegrees(
              marker.position.longitude,
              marker.position.latitude,
              marker.position.height || 0
            )
          }
          existingEntity.position = new Cesium.ConstantPositionProperty(position)
        } catch {
          // Entity might be invalid
        }
      } else {
        // Add new marker
        try {
          // Convert position to Cartesian3 if needed
          let position: Cesium.Cartesian3
          if (marker.position instanceof Cesium.Cartesian3) {
            position = marker.position
          } else {
            position = Cesium.Cartesian3.fromDegrees(
              marker.position.longitude,
              marker.position.latitude,
              marker.position.height || 0
            )
          }

          const newEntity = viewer.entities.add({
            position: position,
            point: {
              pixelSize: 14,
              color: getSeverityColor(marker.severity),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 3,
              heightReference: Cesium.HeightReference.NONE,
              scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.5), // Scale based on distance
            },
            label: {
              text: marker.title,
              font: 'bold 12pt sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -20),
              scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.3), // Hide labels far away
              heightReference: Cesium.HeightReference.NONE,
            },
            properties: {
              severity: marker.severity,
              category: marker.category,
              timestamp: marker.timestamp,
              markerTitle: marker.title,
              markerDescription: marker.description
            }
          })

          // Store complete marker data on entity for later access
          ;(newEntity as Cesium.Entity & { markerData: NewsMarker; isMarker: boolean }).markerData = {
            ...marker,
            id: marker.id,
            title: marker.title,
            description: marker.description,
            category: marker.category,
            severity: marker.severity,
            timestamp: marker.timestamp,
            position: position
          }
          ;(newEntity as Cesium.Entity & { markerData: NewsMarker; isMarker: boolean }).isMarker = true

          markerEntitiesRef.current.set(marker.id, newEntity)
          console.log('Marker added:', marker.id, marker.title, marker.description)
        } catch (error) {
          console.warn('Could not add marker entity:', error)
        }
      }
    })

    // Request a render update
    try {
      viewer.scene.requestRender()
    } catch {
      // Scene might be destroyed
    }
  }, [markers])

  // Update marker selection callback
  useEffect(() => {
    if (!cesiumViewerRef.current) return

    markerEntitiesRef.current.forEach((entity) => {
      const entityWithData = entity as Cesium.Entity & { markerData?: NewsMarker; _onClickCallback?: () => void }
      entityWithData._onClickCallback = () => {
        if (entityWithData.markerData) {
          onMarkerSelectRef.current(entityWithData.markerData)
        }
      }
    })
  }, [onMarkerSelect])

  // Update heatmap
  useEffect(() => {
    if (!cesiumViewerRef.current) return

    const viewer = cesiumViewerRef.current

    // Safety check - make sure viewer hasn't been destroyed
    if (!viewer.scene) return

    // Clear previous heatmap entities
    heatmapEntitiesRef.current.forEach(entity => {
      try {
        viewer.entities.remove(entity)
      } catch {
        // Entity might already be removed
      }
    })
    heatmapEntitiesRef.current = []

    if (heatmapEnabled && markers.length > 0) {
      // Enhanced heatmap implementation
      markers.forEach(marker => {
        try {
          const severity = marker.severity
          const radiusMap = {
            'low': 80000,
            'medium': 120000,
            'high': 150000,
            'critical': 200000
          }
          const radiusBySize = radiusMap[severity] || 100000

          // Convert position to Cartesian3 if needed
          let position: Cesium.Cartesian3
          if (marker.position instanceof Cesium.Cartesian3) {
            position = marker.position
          } else {
            position = Cesium.Cartesian3.fromDegrees(
              marker.position.longitude,
              marker.position.latitude,
              marker.position.height || 0
            )
          }

          // Create pulsing ellipse for heatmap
          const entity = viewer.entities.add({
            position: position,
            ellipse: {
              semiMinorAxis: radiusBySize,
              semiMajorAxis: radiusBySize,
              material: getSeverityColor(marker.severity).withAlpha(0.2),
              outline: true,
              outlineColor: getSeverityColor(marker.severity).withAlpha(0.8),
              outlineWidth: 2,
              heightReference: Cesium.HeightReference.NONE,
            }
          })
          heatmapEntitiesRef.current.push(entity)
        } catch (error) {
          console.warn('Could not add heatmap entity:', error)
        }
      })
    }
  }, [heatmapEnabled, markers])

  // Add cursor styling effect - red dot cursor on hover
  useEffect(() => {
    // Create custom cursor style with red dot
    const styleId = 'cesium-globe-cursor-style'
    let style = document.getElementById(styleId) as HTMLStyleElement
    
    if (!style) {
      style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .cesium-viewer canvas {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='5' fill='%23ef4444' stroke='%23ffffff' stroke-width='2'/%3E%3Ccircle cx='12' cy='12' r='2' fill='%23ffffff'/%3E%3C/svg%3E") 12 12, crosshair !important;
        }
      `
      document.head.appendChild(style)
    }

    return () => {
      const existingStyle = document.getElementById(styleId)
      if (existingStyle && existingStyle.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle)
      }
    }
  }, [])

  return (
    <div className="relative w-full h-full bg-black">
      <div ref={viewerRef} className="w-full h-full" style={{ backgroundColor: '#000', cursor: 'crosshair' }} />
      {latLon && (
        <div className="absolute top-4 left-4 rounded-lg px-4 py-3 text-sm font-mono z-10 text-white border border-white/30 bg-black shadow-lg">
          <div className="font-semibold text-blue-400">📍 Coordinates</div>
          <div className="mt-1 text-white">Lat: <span className="text-green-400">{latLon.lat.toFixed(4)}</span></div>
          <div className="text-white">Lon: <span className="text-green-400">{latLon.lon.toFixed(4)}</span></div>
        </div>
      )}
    </div>
  )
}
