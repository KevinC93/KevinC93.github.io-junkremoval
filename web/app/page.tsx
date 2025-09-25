export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <section className="max-w-5xl w-full grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold">Fast, Affordable Junk Removal</h1>
          <p className="mt-4 text-lg opacity-80">
            Same-day pickups, transparent pricing, and eco-friendly disposal.
          </p>
          <form
            name="quote"
            method="POST"
            data-netlify="true"
            netlify-honeypot="bot-field"
            className="mt-6 flex flex-col gap-3"
          >
            <input type="hidden" name="form-name" value="quote" />
            <p className="hidden"><label>Don’t fill this: <input name="bot-field" /></label></p>
            <input name="name" placeholder="Name" required className="border p-3 rounded-xl"/>
            <input name="phone" placeholder="Phone" required className="border p-3 rounded-xl"/>
            <textarea name="details" placeholder="What do you need removed?" className="border p-3 rounded-xl"/>
            <button className="rounded-2xl px-5 py-3 font-semibold shadow">Get a Quote</button>
          </form>
        </div>
        <div className="h-[320px] w-full rounded-2xl overflow-hidden bg-black/5 flex items-center justify-center">
          {/* TODO: replace with R3F/three.js scene or hero image */}
          <span className="opacity-60">3D Hero Placeholder</span>
        </div>
      </section>
    </main>
  );
}
