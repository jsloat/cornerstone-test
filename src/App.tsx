import  { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import * as cornerstone from '@cornerstonejs/core'
import { createImageIdsAndCacheMetaData } from './dicom/utils';
// @ts-ignore
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import dicomParser from 'dicom-parser';

const windowWidth = 400;
const windowCenter = 40;

const lower = windowCenter - windowWidth / 2.0;
const upper = windowCenter + windowWidth / 2.0;

const ctVoiRange = { lower, upper };
const { preferSizeOverAccuracy, useNorm16Texture } =
  cornerstone.getConfiguration().rendering;

function initCornerstoneDICOMImageLoader() {
  cornerstoneDICOMImageLoader.external.cornerstone = cornerstone;
  cornerstoneDICOMImageLoader.external.dicomParser = dicomParser;
  cornerstoneDICOMImageLoader.configure({
    useWebWorkers: true,
    decodeConfig: {
      convertFloatPixelDataToInt: false,
      use16BitDataType: preferSizeOverAccuracy || useNorm16Texture,
    },
  });

  let maxWebWorkers = 1;

  if (navigator.hardwareConcurrency) {
    maxWebWorkers = Math.min(navigator.hardwareConcurrency, 7);
  }

  var config = {
    maxWebWorkers,
    startWebWorkersOnDemand: false,
    taskConfiguration: {
      decodeTask: {
        initializeCodecsOnStartup: false,
        strict: false,
      },
    },
  };

  cornerstoneDICOMImageLoader.webWorkerManager.initialize(config);
}

const Thing = () => {
  const [isInitialized, setIsInit] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const init = async () => {
      await cornerstone.init();
      initCornerstoneDICOMImageLoader();
      setIsInit(true);
    }
    init();
  })

  const renderingEngine = useMemo(() => {
    if (!isInitialized) return;
    const renderingEngingID = 'asd';
    return new cornerstone.RenderingEngine(renderingEngingID);
  }, [isInitialized])

  useEffect(() => {
    if (!isInitialized || !contentRef.current || !renderingEngine) return;
    const run = async () => {
      const viewportId = 'asd123'
      const imageIds = await createImageIdsAndCacheMetaData({
        StudyInstanceUID:
          '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
        SeriesInstanceUID:
          '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
        wadoRsRoot: 'https://d3t6nz73ql33tx.cloudfront.net/dicomweb',
      });
      renderingEngine.enableElement({
        viewportId,
        element: contentRef.current!,
        type: cornerstone.Enums.ViewportType.STACK
      });
      const viewPort = (renderingEngine.getViewport(viewportId));
      // @ts-ignore 
      viewPort.setStack([imageIds[0]]);
      // @ts-ignore 
      viewPort.setProperties({ voiRange: ctVoiRange })
      viewPort.render();
    };
    run()
  }, [isInitialized, renderingEngine]);

  return (
    <div style={{maxWidth: '750px', margin: '0 auto'}}>
    <h1>My Cool Imaging App (ALPHA)</h1>
    <div style={{height: '500px', width: '500px'}} ref={contentRef} />
    </div>
  )
}

function App() {
  return (<Thing />);
}

export default App;
