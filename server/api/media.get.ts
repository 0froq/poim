import { defineEventHandler, getQuery } from 'h3'
import { proxyMedia } from '../utils/proxy-media'

export default defineEventHandler(async (event) => {
  return proxyMedia(String(getQuery(event).url ?? ''))
})
