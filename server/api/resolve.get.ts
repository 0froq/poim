import { defineEventHandler, getQuery } from 'h3'
import { resolvePostFromUrl } from '../utils/resolve-post'

export default defineEventHandler(async (event) => {
  return resolvePostFromUrl(String(getQuery(event).url ?? ''))
})
