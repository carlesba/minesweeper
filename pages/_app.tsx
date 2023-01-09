import '../styles/globals.css'
import type { AppProps } from 'next/app'

const version = "202301091126"

console.log(version)

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
