import type React from 'react'

import { LinkText } from './link-text'
import { QrCode } from './qr-code'

import './code-and-qr.sass'

type CodeAndQrProps = {
  code: string
  /** How to use the code, above it. */
  codeHint: string
  /** What the QR code opens, read by assistive technology. */
  qrLabel: string
  /** The call to scan, under the QR code. */
  scanHint: string
  url: string
}

/**
 * Two ways in, side by side: a short code to type and a QR code to scan, with
 * its link written out in full. Sized by its own width, so the same block
 * fills a TV or a printed sheet.
 */
export const CodeAndQr: React.FC<CodeAndQrProps> = ({
  code,
  codeHint,
  qrLabel,
  scanHint,
  url
}) => (
  <div className='code-and-qr'>
    <div className='code-and-qr-body'>
      <section className='code-and-qr-code'>
        <p>{codeHint}</p>
        <strong translate='no'>{code}</strong>
      </section>
      <section className='code-and-qr-square'>
        <QrCode label={qrLabel} url={url} />
        <p>{scanHint}</p>
        <small>
          <LinkText url={url} />
        </small>
      </section>
    </div>
  </div>
)
