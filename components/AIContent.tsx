import { useState } from 'react'


export default function AIContent() {
const [ideas, setIdeas] = useState<string[]>([])
const [loading, setLoading] = useState(false)
const [topic, setTopic] = useState('local gym in Montreal')


const generate = async () => {
setLoading(true)
try {
const res = await fetch('/.netlify/functions/ai', {
method: 'POST',
headers: { 'content-type': 'application/json' },
body: JSON.stringify({ prompt: `Generate 5 punchy ad campaign ideas for ${topic}. Short, high-converting.`, count: 5 })
})
const data = await res.json()
setIdeas(data.ideas || [])
} catch (e) {
setIdeas(['Quick Launch Offer: 2 weeks for $20', 'Buddy Pass Friday: bring a friend free', 'Morning Rush Class Pack', 'Local Heroes Discount', 'AI-Tuned Workout Plan with free trial'])
} finally {
setLoading(false)
}
}


return (
<div className="card">
<div className="flex flex-col md:flex-row gap-3 md:items-center">
<input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Your niche or product" className="flex-1 rounded-xl bg-black/40 border border-white/15 px-4 py-3" />
<button onClick={generate} className="btn-cta" disabled={loading}>{loading ? 'Thinking…' : 'Generate ideas'}</button>
</div>
<ul className="mt-4 grid gap-2">
{ideas.map((i, idx) => (
<li key={idx} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">{i}</li>
))}
</ul>
{!ideas.length && <p className="text-white/60 text-sm mt-2">Tip: try topics like “dental clinic”, “SaaS lead gen”, or “real estate”.</p>}
</div>
)
}
