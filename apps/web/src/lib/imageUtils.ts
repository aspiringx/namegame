/**
 * Image utilities for chat photos
 * - Resize and compress images
 * - Convert to base64
 * - Support file selection and camera capture
 */

export interface ProcessedImage {
  base64: string
  width: number
  height: number
  size: number // bytes
}

const MAX_WIDTH = 800
const MAX_HEIGHT = 800
const QUALITY = 0.8 // JPEG quality (0-1)
const MAX_SIZE = 100 * 1024 // 100KB target

/**
 * Process an image file: resize, compress, and convert to base64
 */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'))
      return
    }

    // Validate file size (max 10MB before processing)
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Image file too large (max 10MB)'))
      return
    }

    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        try {
          const processed = resizeAndCompressImage(img)
          resolve(processed)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Resize and compress an image element
 */
function resizeAndCompressImage(img: HTMLImageElement): ProcessedImage {
  // Calculate new dimensions maintaining aspect ratio
  let width = img.width
  let height = img.height
  
  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }
  
  // Create canvas and draw resized image
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  
  // Use better image smoothing
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  ctx.drawImage(img, 0, 0, width, height)
  
  // Convert to base64 with compression
  let quality = QUALITY
  let base64 = canvas.toDataURL('image/jpeg', quality)
  let size = Math.round((base64.length * 3) / 4) // Approximate size in bytes
  
  // If still too large, reduce quality
  while (size > MAX_SIZE && quality > 0.3) {
    quality -= 0.1
    base64 = canvas.toDataURL('image/jpeg', quality)
    size = Math.round((base64.length * 3) / 4)
  }
  
  return {
    base64,
    width,
    height,
    size,
  }
}

/**
 * Open file picker for image selection
 */
export function selectImageFile(): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        resolve(file)
      } else {
        reject(new Error('No file selected'))
      }
    }
    
    input.oncancel = () => {
      reject(new Error('File selection cancelled'))
    }
    
    input.click()
  })
}

/**
 * Open camera for photo capture (mobile devices)
 */
export function capturePhoto(): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' // Use rear camera by default
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        resolve(file)
      } else {
        reject(new Error('No photo captured'))
      }
    }
    
    input.oncancel = () => {
      reject(new Error('Photo capture cancelled'))
    }
    
    input.click()
  })
}

/**
 * Check if device supports camera capture
 */
export function isCameraSupported(): boolean {
  // Check if running on mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
  
  // Check if media devices API is available
  const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  
  return isMobile && hasMediaDevices
}

/**
 * Select or capture image based on user choice
 */
export async function selectOrCaptureImage(useCamera: boolean): Promise<ProcessedImage> {
  const file = useCamera ? await capturePhoto() : await selectImageFile()
  return processImageFile(file)
}
