import { Result } from '@adrienlcp/result'

import { LOGO_SIZE_PX } from '@scoreboard/protocol/logo'

/** Kept sharp at the wall's size and light to send: WebP where the browser encodes it, PNG otherwise (Safari). */
const LOGO_TYPE = 'image/webp'
const LOGO_QUALITY = 0.86

export type LogoResizeError = 'not_an_image'

const encode = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob(resolve, LOGO_TYPE, LOGO_QUALITY)
  })

/**
 * A picked photo or file brought down to a square logo, whole and centred on
 * a transparent ground: nothing of the crest is cropped.
 */
export const resizeLogo = async (
  file: Blob
): Promise<Result<Blob, LogoResizeError>> => {
  try {
    const image = await createImageBitmap(file)
    const scale = Math.min(
      1,
      LOGO_SIZE_PX / Math.max(image.width, image.height)
    )
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement('canvas')
    const side = Math.max(width, height)

    canvas.width = side
    canvas.height = side
    canvas
      .getContext('2d')
      ?.drawImage(image, (side - width) / 2, (side - height) / 2, width, height)
    image.close()

    const logo = await encode(canvas)

    return logo === null ? Result.failure('not_an_image') : Result.success(logo)
  } catch {
    return Result.failure('not_an_image')
  }
}
