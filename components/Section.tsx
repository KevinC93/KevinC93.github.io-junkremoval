export default function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
return (
<section id={id} className="container py-12">
<h2 className="h2">{title}</h2>
{children}
</section>
)
}
