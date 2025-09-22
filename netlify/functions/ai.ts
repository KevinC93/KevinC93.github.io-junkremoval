import type { Handler } from '@netlify/functions'
export const handler: Handler = async (event) => {
if (event.httpMethod === 'OPTIONS') {
return {
statusCode: 204,
headers: { 'access-control-allow-origin': event.headers.origin || '*', 'access-control-allow-methods': 'POST,OPTIONS', 'access-control-allow-headers': 'content-type' }
}
}
if (event.httpMethod !== 'POST') {
return { statusCode: 405, body: 'Method Not Allowed' }
}


const ip = (event.headers['x-forwarded-for'] || '').split(',')[0] || 'anon'
if (!allow(ip)) {
return { statusCode: 429, body: 'Too Many Requests' }
}


try {
const { prompt, count = 5 } = JSON.parse(event.body || '{}')
const safePrompt = String(prompt || '').slice(0, 400)
const n = Math.min(Math.max(parseInt(String(count)) || 5, 1), 10)


const key = process.env.OPENAI_API_KEY
if (key) {
const r = await fetch('https://api.openai.com/v1/chat/completions', {
method: 'POST',
headers: {
'content-type': 'application/json',
'authorization': `Bearer ${key}`
},
body: JSON.stringify({
model: 'gpt-4o-mini',
messages: [
{ role: 'system', content: 'You are an expert direct-response marketer. Return only a JSON array of short strings.' },
{ role: 'user', content: `${safePrompt} Return ${n} options, max 12 words each.` }
],
temperature: 0.8
})
})
const j = await r.json()
// Try to parse JSON array from the assistant message; fallback to line split
const text = j.choices?.[0]?.message?.content || ''
let ideas: string[] = []
try { ideas = JSON.parse(text) } catch { ideas = text.split('\n').map((s: string) => s.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean).slice(0, n) }
return ok({ ideas })
}


// Fallback if no KEY set
const defaults = [
'AI-Optimized Launch: 48‑Hour Conversion Sprint',
'Smart Budget: Double Leads, Same Spend',
'Blue Steel Creative: Scroll‑Stopping Visuals',
'Hyperlocal Targeting: Own Your Postal Codes',
'Test → Learn → Scale: Weekly Iterations'
].slice(0, n)
return ok({ ideas: defaults })
} catch (e) {
return { statusCode: 400, body: 'Bad Request' }
}
}


function ok(data: unknown) {
return {
statusCode: 200,
headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
body: JSON.stringify(data)
}
}
