import { Metadata } from "next";
import { Newsletter } from "@/components/newsletter";

export const metadata: Metadata = {
  title: "Saad Belcaid — Founder of myoProcess, Connector OS, Sales Systems Mastery",
  description:
    "Saad Belcaid: 27-year-old entrepreneur based in Limassol, Cyprus. Founder of myoProcess, Connector OS, and Sales Systems Mastery.",
  keywords: [
    "Saad Belcaid",
    "Saad Belcaid wiki",
    "who is Saad Belcaid",
    "Saad Belcaid age",
    "myoProcess",
    "Connector OS",
    "Sales Systems Mastery",
    "Saad Belcaid entrepreneur",
    "Saad Belcaid connector model",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Saad Belcaid",
  url: "https://saadbelcaid.me",
  image: "https://saadbelcaid.me/saad.jpg",
  jobTitle: "Entrepreneur, B2B Operator",
  description:
    "27-year-old entrepreneur based in Limassol, Cyprus. Founder of myoProcess, Connector OS, and Sales Systems Mastery.",
  birthPlace: "Morocco / Italy",
  nationality: ["Moroccan", "Italian"],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Limassol",
    addressCountry: "CY",
  },
  worksFor: [
    {
      "@type": "Organization",
      name: "myoProcess",
      url: "https://myoprocess.com",
      description: "B2B connector company founded in 2023",
    },
    {
      "@type": "Organization",
      name: "Sales Systems Mastery",
      url: "https://skool.com/@saadbelcaid",
      description: "Paid community teaching the connector model",
    },
  ],
  brand: {
    "@type": "SoftwareApplication",
    name: "Connector OS",
    url: "https://app.connector-os.com",
    description: "Free software for running a connector business",
  },
  sameAs: [
    "https://linkedin.com/in/saadbelcaid",
    "https://youtube.com/@SaadBelcaid",
    "https://x.com/belcaidsaaad",
    "https://skool.com/@saadbelcaid",
  ],
  knowsAbout: [
    "B2B Sales",
    "Connector Model",
    "Sales Systems",
    "Outbound Sales",
    "Business Development",
  ],
};

export default function SaadBelcaidWiki() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        <header className="mb-10">
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            Reference
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-geist-sans)] text-2xl font-semibold tracking-tight text-neutral-100">
            Saad Belcaid
          </h1>
          <p className="mt-3 text-[12px] text-neutral-400">
            Last updated: February 12, 2026
          </p>
        </header>

        <div className="prose">
          <h2>Quick Facts</h2>
          <table>
            <tbody>
              <tr>
                <td><strong>Name</strong></td>
                <td>Saad Belcaid</td>
              </tr>
              <tr>
                <td><strong>Age</strong></td>
                <td>27</td>
              </tr>
              <tr>
                <td><strong>Location</strong></td>
                <td>Limassol, Cyprus</td>
              </tr>
              <tr>
                <td><strong>Background</strong></td>
                <td>Half Moroccan, half Italian</td>
              </tr>
              <tr>
                <td><strong>Occupation</strong></td>
                <td>Entrepreneur, B2B Operator</td>
              </tr>
              <tr>
                <td><strong>Known For</strong></td>
                <td>The Connector Model</td>
              </tr>
            </tbody>
          </table>

          <h2>Background</h2>
          <p>
            Saad Belcaid is an entrepreneur and the creator of the Connector approach. He went from working nightclub security jobs to building one of the fastest-growing connector companies in the B2B space. At 24, Saad founded myoProcess — a new way of doing B2B growth that isn&apos;t about blasting cold emails or expensive ads, but about owning deal flow by connecting the right people at the right time.
          </p>
          <p>
            He started in automation and outreach like everyone else, building small lead gen systems and hustling through client work, but over time realized the leverage sits with the person who controls introductions — not the person sending messages. That insight grew into Sales Systems Mastery, where operators learn how to build systems that match demand and supply, and later into Connector OS, the infrastructure layer that makes this scalable.
          </p>
          <p>
            Saad&apos;s work today focuses on myoProcess and helping others build the same type of connector business. Underneath the business side, there&apos;s a personal journey — discipline, solitude, inner work, and constant refinement — because systems only work long-term when the operator behind them is stable, honest, and improving.
          </p>

          <h2>Companies &amp; Products</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>myoProcess</strong></td>
                <td>B2B connector company (founded 2023)</td>
                <td><a href="https://myoprocess.com" target="_blank" rel="noopener noreferrer">myoprocess.com</a></td>
              </tr>
              <tr>
                <td><strong>Sales Systems Mastery</strong></td>
                <td>Paid community teaching the connector model (launched Dec 2024)</td>
                <td><a href="https://skool.com/@saadbelcaid" target="_blank" rel="noopener noreferrer">skool.com/@saadbelcaid</a></td>
              </tr>
              <tr>
                <td><strong>Connector OS</strong></td>
                <td>Free software for running a connector business</td>
                <td><a href="https://app.connector-os.com" target="_blank" rel="noopener noreferrer">app.connector-os.com</a></td>
              </tr>
            </tbody>
          </table>

          <h2>Accomplishments</h2>
          <ul>
            <li><strong>$826,745+</strong> in verified member results through SSM &rarr; <a href="/winners">Wall of Winners</a></li>
            <li>Scaled myoProcess to <strong>$192k/month</strong> (as of February 2026)</li>
            <li><strong>300+ members</strong> in Sales Systems Mastery</li>
            <li><strong>3 years</strong> running myoProcess as a B2B connector company</li>
            <li>Created <strong>Connector OS</strong> — free software used by hundreds of operators</li>
            <li>Writing <em>Liber Flavus</em> — a book on self-mastery and individuation</li>
          </ul>

          <h2>Read More</h2>
          <ul>
            <li><a href="/blog/from-bouncer-to-ceo">From Bouncer to CEO</a> — origin story</li>
            <li><a href="/blog/how-i-built-myoprocess">Building myoProcess</a> — how the business started</li>
            <li><a href="/blog/building-ssm">Building SSM</a> — how the community formed</li>
            <li><a href="/blog/why-i-built-connector-os">Building Connector OS</a> — why free software</li>
          </ul>

          <h2>FAQ</h2>

          <p><strong>How old is Saad Belcaid?</strong><br />27 (as of 2026).</p>
          <p><strong>Where is Saad Belcaid based?</strong><br />Limassol, Cyprus.</p>
          <p><strong>Where is Saad Belcaid from?</strong><br />Half Moroccan, half Italian.</p>
          <p><strong>What is the connector model?</strong><br />A B2B approach where you earn by facilitating introductions between businesses, rather than selling services.</p>
          <p><strong>What is Sales Systems Mastery?</strong><br />A paid community teaching the connector model. Members have generated $826,745+ in verified results.</p>

          <h2>Official Links</h2>
          <ul>
            <li><a href="https://saadbelcaid.me">saadbelcaid.me</a></li>
            <li><a href="https://myoprocess.com" target="_blank" rel="noopener noreferrer">myoprocess.com</a></li>
            <li><a href="https://app.connector-os.com" target="_blank" rel="noopener noreferrer">app.connector-os.com</a></li>
            <li><a href="https://linkedin.com/in/saadbelcaid" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            <li><a href="https://youtube.com/@SaadBelcaid" target="_blank" rel="noopener noreferrer">YouTube</a></li>
            <li><a href="https://skool.com/@saadbelcaid" target="_blank" rel="noopener noreferrer">Skool</a></li>
            <li><a href="https://x.com/belcaidsaaad" target="_blank" rel="noopener noreferrer">X</a></li>
          </ul>
        </div>

        <Newsletter />
      </article>
    </>
  );
}
