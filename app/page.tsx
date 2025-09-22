'use client'
))}
</ol>
</Section>


{/* AI CONTENT BLOCKS */}
<Section title="AI Content Ideas">
<AIContent />
</Section>


{/* IMAGE STRIP */}
<Section title="Work & Culture">
<div className="grid md:grid-cols-3 gap-4">
{[
'https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=1600&auto=format&fit=crop',
'https://images.unsplash.com/photo-1529336953121-4f3f5a5d0c37?q=80&w=1600&auto=format&fit=crop',
'https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?q=80&w=1600&auto=format&fit=crop',
].map((src, i) => (
<img key={i} src={src} alt="blue tech imagery" className="rounded-2xl border border-white/10" />
))}
</div>
</Section>


{/* FAQ */}
<Section title="FAQ">
<ul className="space-y-2">
{[
['Do I need a big budget?', 'No, we work with small to medium budgets and scale as results come in.'],
['How soon will I see results?', 'Many campaigns generate leads in weeks, with stable performance in 2–3 months.'],
['Do I need a website?', 'Not required—we can create a landing page for you.'],
['What if it doesn’t work?', 'If you’re not satisfied after 60 days, you can walk away.'],
].map(([q, a]) => (
<li key={q} className="card">
<strong className="text-brand-blue">{q}</strong>
<p className="text-white/80">{a}</p>
</li>
))}
</ul>
</Section>


{/* ABOUT */}
<Section title="About Us">
<p className="text-white/80">300 Kings is a Montreal-based agency built to make AI advertising simple, powerful, and affordable for local businesses. We combine AI with creative strategy to help you grow.</p>
<p className="mt-2 text-green-400 text-sm break-all">Google AI Ads Certification ID: <strong>0xff7e3120f5b2ea106a4c1cd8f50613c0e58b557a046718d1dffb81a76490c7d8</strong></p>
</Section>


{/* CONTACT */}
<Section id="contact" title="Contact Us">
{/* Netlify Forms works on static pages too */}
<form name="contact" method="POST" data-netlify="true" className="card grid gap-3">
<input type="hidden" name="form-name" value="contact" />
<input required name="name" placeholder="Your name" className="rounded-xl bg-black/40 border border-white/15 px-4 py-3" />
<input required type="email" name="email" placeholder="Email" className="rounded-xl bg-black/40 border border-white/15 px-4 py-3" />
<textarea required name="message" placeholder="Tell us about your goals" className="rounded-xl bg-black/40 border border-white/15 px-4 py-3 min-h-[120px]"></textarea>
<button className="btn-cta w-fit">Send</button>
</form>
</Section>


<footer className="mt-12 border-t border-white/10">
<div className="container py-8 text-center text-white/60 text-sm">© 2025 300 Kings. All rights reserved.</div>
</footer>
</main>
)
}
