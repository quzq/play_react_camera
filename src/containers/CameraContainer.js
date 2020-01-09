import React, { Component } from "react";
import * as _ from 'lodash'
import CameraIcon from '@material-ui/icons/PhotoCamera';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import { Button } from 'material-ui';
import * as helper from '../helper/helper'

const CAMERA_FRAME_WIDTH_RATIO = 0.8
const CAMERA_FRAME_HEIGHT_RATIO = 0.8
const ORIENTATION_PORTRAIT = 'ORIENTATION_PORTRAIT'
const ORIENTATION_LANDSCAPE = 'ORIENTATION_LANDSCAPE'


class Camera {
  constructor(){
    this._streamTracks = null
    this._tempCanvas = document.createElement('canvas');
    this._tempCanvas.style.display = 'none';
    this._isOpen = false;
    this._resolution = { width: 0, height: 0 }
    this._videoElement = null
  }

  get resolution() { return this._isOpen ? this._resolution : null }

  close() {
    if (!this._isOpen) throw 'camera is closed' 
    if (this._streamTracks) {
      this._streamTracks.forEach(t => t.stop());
    }
    this._isOpen = false
  }

  pause() {
    if (!this._isOpen) throw 'camera is closed' 
    this._videoElement.pause()
  }

  play() {
    if (!this._isOpen) throw 'camera is closed' 
    this._videoElement.play()
  }

  /*
    open camera device
    args:
      cameraSettings: {
        idealResolution: {
          width: number 
          height: number
        },
        facing: 'rear' | 'front'
      }
      videoElement: <video/> html element object  
      onSuccess: this function callback on success
      onError: this function callback on error
  */
  open(cameraSettings, videoElement, onSuccess, onError) {
    if (this._isOpen) throw 'camera is already opened' 

    const getVideoResolution = (retry =3, retryInterval = 500) => {
      return new Promise((resolve, reject) => {
        const getVideoResolutionWithRetry = (retry, failedReason) => {
          try {
            if (retry < 0 ) reject(failedReason);
            if (videoElement.videoWidth === 0) throw 'videoWidth is zero'
            this._isOpen = true
            resolve({ width: videoElement.videoWidth, height: videoElement.videoHeight});
            
          } catch (e) {
            setTimeout(() => {
              getVideoResolutionWithRetry(retry - 1, e);
            }, retryInterval);
          }
        }
        getVideoResolutionWithRetry(retry, null);
      });
    }

    const settings = {
      audio: false,
      video: {
        width: { ideal: cameraSettings.idealResolution.width }, 
        height: { ideal: cameraSettings.idealResolution.height },
        facingMode: cameraSettings.facing === 'front'? "user" : { exact: "environment" },
      },
    }

    const promise = navigator.mediaDevices.getUserMedia(settings);
    promise.then(async stream => {
      videoElement.srcObject = stream;
      this._videoElement = videoElement
      this._streamTracks = videoElement.srcObject.getTracks()

      const resolution = await getVideoResolution(5)
      const status = {
         resolution,
      }
      if (onSuccess) onSuccess(status)
    })
      .catch(e => {
        if (onError) onError(e)
      });
  }

  getImageDataURL(rect) {
    if (!this._isOpen) throw 'camera is closed'
    if (!rect.x || !rect.y || !rect.width || !rect.height) throw 'illegal rect'
    if (!rect) rect = { x: 0, y: 0, width: this._resolution.width, height: this._resolution.height }

    const canvas = document.createElement('canvas');
    canvas.style.display = 'none';
    canvas.width = rect.width
    canvas.height = rect.height
    const ctx = canvas.getContext("2d");
    ctx.drawImage(this._videoElement, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);

    return canvas.toDataURL('image/jpeg')
  }

}

class CameraContainer extends Component {
  constructor(props) {
    super(props)
    this.refCameraPreview = React.createRef();
    this.camera = new Camera()
    this.state = {
      isCameraView: true,
      isCaptured: false,
      errMessage: '',
      cameraResolution: { width: 0, height: 0 },
      cameraStreaming: false,
      dataURL: null,
    }
  }
  
  async componentDidMount() {
    try {
      const onSuccess = status => {
        this.setState({ ...this.state, cameraResolution: status.resolution, cameraStreaming: true })
      }
      const onError = e => {

      }
      
      const getCameraSettings = () => {
        const isMobile = () => {
          return (navigator.userAgent.indexOf('iPhone') > 0 && navigator.userAgent.indexOf('iPad') == -1)
            || navigator.userAgent.indexOf('iPod') > 0 || navigator.userAgent.indexOf('Android') > 0
        }

        const windowSize = this.getWindowSize()
        const setting = {
          idealResolution: windowSize.orientation === ORIENTATION_PORTRAIT ?
            { width: 2224, height: 3024 } : { width: 4032, height: 3024 },
          facing: isMobile() ? 'rear' : 'front',
        }
        //console.log(windowSize, setting)
        return setting
      }
      this.onResize = () => {
        if (this.state.cameraStreaming) this.camera.close()
        this.camera.open(getCameraSettings(), this.refCameraPreview.current, onSuccess, onError)
      }
      this.onRotate = () => {
        if (this.state.cameraStreaming) this.camera.close()
        this.camera.open(getCameraSettings(), this.refCameraPreview.current, onSuccess, onError)
      }
      this.onRotate()
      window.addEventListener("resize", this.onResize);
      window.addEventListener("orientationchange", this.onRotate);
    } catch (e) {
      console.log(e)
      //alert(e)
    }
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("orientationchange", this.onRotate);
    this.camera.close()

  }

  handleCapture = () => {
    if (this.state.isCaptured) {
      this.camera.play()
    } else {
      this.camera.pause()
    }
    this.setState({ ...this.state, isCaptured: !this.state.isCaptured })
  }

  handleConfirmCapture = () => {
    const captureWidth = parseInt(this.state.cameraResolution.width * CAMERA_FRAME_WIDTH_RATIO)
    const captureHeight = parseInt(this.state.cameraResolution.height * CAMERA_FRAME_HEIGHT_RATIO)
    const captureRect = {
      x: parseInt((this.state.cameraResolution.width - captureWidth) / 2),
      y: parseInt((this.state.cameraResolution.height - captureHeight) / 2),
      width: captureWidth,
      height: captureHeight,
    }

    const dataURL = this.camera.getImageDataURL(captureRect)
    this.setState({ ...this.state, isCaptured: false, dataURL, isCameraView: false, })
  }

  getWindowSize = () => {
    const body = document.getElementsByTagName('body')[0]
    const width = window.innerWidth || document.documentElement.clientWidth || body.clientWidth
    const height = window.innerHeight || document.documentElement.clientHeight || body.clientHeight

    return {
      width, height, orientation: width > height ? ORIENTATION_LANDSCAPE : ORIENTATION_PORTRAIT
    }
  }

  hideCameraView = () => {
    this.setState({ ...this.state, isCameraView: false, isCaptured: false })
  }

  getOrientation = () => {
    return window.orientation === 0 ? ORIENTATION_PORTRAIT : ORIENTATION_LANDSCAPE
  }

  render() {

    const windowSize = this.getWindowSize()
    const videoDisplaySize = helper.stretchSize(windowSize.width, windowSize.height, this.state.cameraResolution.width, this.state.cameraResolution.height)
    const guideWidth = parseInt(videoDisplaySize.width * CAMERA_FRAME_WIDTH_RATIO)
    const guideHeight = parseInt(videoDisplaySize.height * CAMERA_FRAME_HEIGHT_RATIO)
    const guideRect = { 
      x: parseInt((windowSize.width - guideWidth) / 2),
      y: parseInt((windowSize.height - guideHeight) / 2),
      width: guideWidth,
      height: guideHeight,
    }

    return (
      <div>
        <div style={{ width: windowSize.width, height: windowSize.height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'black' }}>
          <video ref={this.refCameraPreview} style={{ ...(videoDisplaySize.base === 'width' ? { width: '100%' } : { height: '100%' }) }} muted autoPlay playsInline></video>
          <svg xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', top: 0, left: 0, width: windowSize.width, height: windowSize.height }}>
            <rect x={guideRect.x} y={guideRect.y} width={guideRect.width} height={guideRect.height} style={{ fill: 'none', stroke: 'red', strokeWidth: 3 }} />
          </svg>
          <p style={{ color: 'red', fontWeight: 'bold', position: 'absolute', top: 0 }}>
            {this.state.cameraStreaming ? '枠内に収まるように調整してください。' : (this.state.isCameraView ? 'カメラを探しています...' : '(closed)')}
          </p>
          <p style={{ color: 'yellow', fontWeight: 'bold', position: 'absolute', top: 30 }}>
            {`window: ${windowSize.width} * ${windowSize.height} video: ${this.state.cameraResolution.width} * ${this.state.cameraResolution.height} `}
          </p>
          <p style={{ color: 'yellow', fontWeight: 'bold', position: 'absolute', top: 60 }} >
            {`orientation: ${this.getOrientation()} `}
          </p>
          <Button
            variant="fab" color="primary" aria-label="shoot"
            style={{ position: 'absolute', right: 180, bottom: 20 }}
            onClick={this.handleCapture}
          >
            <CameraIcon />
          </Button>
          {this.state.isCaptured ?
            <Button
              variant="fab" color="secondary" aria-label="ok"
              style={{ position: 'absolute', right: 100, bottom: 20 }}
              onClick={this.handleConfirmCapture}
            >
              <CheckIcon />
            </Button>
            : null
          }
          <Button
            variant="fab" color="primary" aria-label="cancel"
            style={{ position: 'absolute', right: 20, bottom: 20 }}
            onClick={this.hideCameraView}
          >
            <CloseIcon />
          </Button>
          {this.state.errMessage}
        </div>
        <div>{this.state.dataURL}</div>
      </div>
    );
  }
}

export default CameraContainer